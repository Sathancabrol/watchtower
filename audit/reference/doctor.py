#!/usr/bin/env python3
"""Watchtower · doctor — ce qui tourne, ce qui manque, ce qui bloque.

Lit le registre généré (audit/reference/REGISTRE-OUTILS.json) et teste chaque point de
vérification. Conçu pour être appelé par un agent (sortie --json) comme par un humain.

    python3 audit/reference/doctor.py            # lisible
    python3 audit/reference/doctor.py --json     # machine
    python3 audit/reference/doctor.py --only 0,1 # seulement les paliers A et B
    python3 audit/reference/doctor.py --id ollama,searxng

Code de sortie : 0 = tout le socle répond · 1 = des briques manquent · 2 = registre absent.
Aucune commande n'est inventée ici : ce sont les champs `verifier` du registre (source unique).
"""
from __future__ import annotations
import argparse, json, os, platform, re, shutil, subprocess, sys, urllib.request, pathlib

HERE = pathlib.Path(__file__).resolve().parent
REGISTRY = HERE / "REGISTRE-OUTILS.json"


def ram_gb() -> float:
    try:
        return round(os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') / 1024**3, 1)
    except Exception:
        return 0.0


def disk_gb(path: str = "/") -> float:
    try:
        return round(shutil.disk_usage(path).free / 1024**3, 1)
    except Exception:
        return 0.0


def vram_mb() -> int:
    if not shutil.which("nvidia-smi"):
        return 0
    try:
        out = subprocess.run(["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"],
                             capture_output=True, text=True, timeout=8).stdout.strip().splitlines()
        return int(float(out[0])) if out else 0
    except Exception:
        return 0


def has(cmd: str) -> bool:
    return bool(shutil.which(cmd))


def tier_for(ram: float, vram: int) -> int:
    if vram >= 12_000:
        return 2
    if vram >= 6_000:
        return 1
    return 0


def check_url(url: str, timeout: float = 2.5):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "watchtower-doctor/1"})
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 (localhost only, from registry)
            return r.status, r.read(400).decode("utf-8", "replace")
    except Exception as exc:  # connexion refusée = non installé, pas une erreur grave
        return None, str(exc)


def run_verify(expr: str, timeout: float = 25.0):
    """Exécute le champ `verifier` du registre (source unique, rien n'est inventé ici)."""
    expr = expr.strip()
    urls = re.findall(r"https?://[^\s'\"|]+", expr)
    if expr.startswith("curl"):
        if not urls:
            return False, "vérif sans URL (à compléter dans le générateur)"
        code, _ = check_url(urls[0])
        return (code == 200), f"HTTP {code}" if code else "aucune réponse"
    if expr.startswith(("python3 -c", "python -c")):
        m = re.search(r"'(.*?)'\s*$", expr, re.S) or re.search(r'"(.*?)"\s*$', expr, re.S)
        code = m.group(1) if m else None
        if not code:
            return False, "vérif Python non analysable"
        try:
            r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=timeout)
            out = (r.stdout or r.stderr).strip().splitlines()
            return r.returncode == 0, (out[-1][:120] if out else "")
        except Exception as exc:
            return False, str(exc)[:120]
    # commande shell simple : on exige que le binaire existe, sinon « absent » (pas de faux vert via pipe)
    first = expr.split("|")[0].strip().split()[0]
    first = first.split("=")[0] if "=" in first and not first.startswith((".", "/")) else first
    if not first.startswith((".", "/", "$")) and not shutil.which(first):
        return False, f"binaire `{first}` introuvable"
    try:
        r = subprocess.run(expr, shell=True, capture_output=True, text=True, timeout=timeout)  # noqa: S602
        out = (r.stdout or r.stderr).strip().splitlines()
        return r.returncode == 0, (out[-1][:120] if out else "")
    except Exception as exc:
        return False, str(exc)[:120]


def main() -> int:
    ap = argparse.ArgumentParser(description="Watchtower doctor")
    ap.add_argument("--json", action="store_true", dest="as_json")
    ap.add_argument("--only", default="", help="filtrer par paliers, ex. 0,1")
    ap.add_argument("--id", default="", help="filtrer par ids, ex. ollama,searxng")
    ap.add_argument("--no-shell", action="store_true", help="ne tester que les endpoints HTTP")
    args = ap.parse_args()

    if not REGISTRY.exists():
        print(f"✘ registre absent : {REGISTRY}\n  →  python3 audit/reference/generate-reference.py", file=sys.stderr)
        return 2

    reg = json.loads(REGISTRY.read_text(encoding="utf-8"))
    tools = reg["outils"]
    tiers = {int(x) for x in args.only.split(",") if x.strip().isdigit()} if args.only else None
    ids = {x.strip() for x in args.id.split(",") if x.strip()} if args.id else None

    ram, vram, disk = ram_gb(), vram_mb(), disk_gb(os.getcwd() if os.name != "nt" else os.environ.get("SYSTEMDRIVE", "C:"))
    tier = tier_for(ram, vram)
    results, socle_ok = [], True
    for t in tools:
        if ids and t["id"] not in ids:
            continue
        if tiers is not None and (t.get("tier") is None or t["tier"] not in tiers):
            continue
        verifier = (t.get("verifier") or "").strip()
        if not verifier or verifier == "—":
            state, detail = "manuel", "pas de vérif automatique (installer à la main, voir REFERENCE.md)"
        elif args.no_shell and not verifier.startswith("curl"):
            state, detail = "ignoré", "check shell désactivé"
        else:
            ok, detail = run_verify(verifier)
            state = "ok" if ok else "absent"
        entry = {"id": t["id"], "nom": t["nom"], "prix": t["prix"], "tier": t.get("tier"),
                 "statut": t["statut"], "etat": state, "detail": detail, "verifier": verifier,
                 "urls": t["urls"][:1]}
        results.append(entry)
        if t["id"] in {"ollama", "searxng", "crawl4ai", "instructor", "lancedb"} and state != "ok":
            socle_ok = False

    summary = {"materiel": {"ram_gb": ram, "vram_mb": vram, "disque_libre_gb": disk, "palier": "ABC"[tier],
                            "os": f"{platform.system()} {platform.release()}", "docker": has("docker"),
                            "node": (shutil.which("node") and "ok") or "absent",
                            "python": (shutil.which("python3") and "ok") or "absent"},
               "totaux": {k: sum(1 for r in results if r["etat"] == k) for k in ("ok", "absent", "manuel", "ignoré")},
               "socle": "ok" if socle_ok else "incomplet",
               "outils": results}

    if args.as_json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0 if socle_ok else 1

    icons = {"ok": "🟢", "absent": "🔴", "manuel": "⚪", "ignoré": "·"}
    paliers = {0: "A (CPU, 8-16 Go)", 1: "B (GPU 6-8 Go)", 2: "C (GPU 12-24 Go)"}
    print(f"Watchtower · doctor — {platform.system()} · RAM {ram} Go · VRAM {vram} Mo · disque libre {disk} Go "
          f"→ palier {paliers[tier]}")
    if disk < 40:
        print("  ⚠️ moins de 40 Go libres : les modèles (3-40 Go) et le corpus 3D ne rentreront pas.")
    if tier == 0:
        print("  ℹ️ palier A : viser les outils 🅰 ; les 🅱/🅲 nécessitent un GPU (ou Colab gratuit).")
    print(f"\n🔎 {summary['totaux']['ok']} en place · {summary['totaux']['absent']} à installer · "
          f"{summary['totaux']['manuel']} à faire à la main — socle : {summary['socle']}\n")
    for r in results:
        line = f"  {icons[r['etat']]} {r['nom']:<38} {r['etat']:<7} {r['detail'][:78]}"
        print(line)
        if r["etat"] == "absent":
            print(f"     ↳ install : voir audit/REFERENCE.md § `{r['id']}` (étapes A→B→C)")
    print("\nProchain geste :", "lancer `bash audit/stack/install-stack.sh` (ou .ps1 sous Windows)"
          if summary["socle"] != "ok" else "tout le socle répond — passer à la phase suivante du plan.")
    return 0 if socle_ok else 1


if __name__ == "__main__":
    sys.exit(main())
