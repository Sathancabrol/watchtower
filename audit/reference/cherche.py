#!/usr/bin/env python3
"""Cherche dans le registre d'outils de la tour (humain comme agent).

Source : `audit/reference/REGISTRE-OUTILS.json`, généré par `generate-reference.py`.
Ce script ne lit que ce fichier : il ne peut donc pas contredire la documentation.

    python3 audit/reference/cherche.py "pdf scanné"          # plein texte, pondéré
    python3 audit/reference/cherche.py --sans-cle --palier A  # gratuit, local, sans GPU
    python3 audit/reference/cherche.py --besoin vps           # partir du besoin, pas du nom
    python3 audit/reference/cherche.py --fiche marker         # une fiche complète, en court
    python3 audit/reference/cherche.py --liste                # tout le registre, 1 ligne par outil

Sortie : `id`, catégorie, prix, palier, licence, état, extrait, ancre de fiche.
Si moins de 3 résultats, deux filets de sécurité : la recherche passe en « un mot suffit » (signalé ≈)
puis, si le mot n'existe nulle part dans les fiches, le **routage par besoin** répond à la place
(« facture », « blackout », « dark vessel »… ne sont écrits dans aucune fiche, mais dans un besoin).
Code de retour : 0 = résultat ou piste, 1 = rien du tout, 2 = erreur (id inconnu, registre absent).
"""
from __future__ import annotations

import argparse
import difflib
import json
import pathlib
import re
import sys
import unicodedata

HERE = pathlib.Path(__file__).resolve().parent
REGISTRE = HERE / "REGISTRE-OUTILS.json"

# champ → poids : un mot dans le nom ou l'id vaut plus qu'une mention dans les notes
PONDS = [("nom", 6), ("id", 6), ("cat", 3), ("role", 3), ("licence", 2),
         ("integree", 2), ("statut", 1), ("notes", 1), ("install", 1), ("verifier", 1), ("urls", 1)]

ALIAS_PRIX = {"gratuit": "materiel", "libre": "materiel", "local": "materiel", "vert": "materiel",
              "compte": "avec-compte", "cle": "avec-compte", "jaune": "avec-compte",
              "payant": "payant", "rouge": "payant", "semi": "freemium",
              "materiel": "option-publique", "hardware": "option-publique", "noir": "option-publique"}
ALIAS_ETAT = {"installe": "present", "ok": "present", "en-place": "present", "moitie": "partiel",
              "a-installer": "absent", "manquant": "absent", "ref": "reference", "reference": "reference"}
PRIX_ICONE = {"materiel": "🟢 gratuit/local", "avec-compte": "🟡 compte gratuit", "freemium": "🟠 semi-payant",
              "payant": "🔴 payant", "option-publique": "⚫ matériel", "": "⚪"}
PALIER = {0: "🅰 CPU", 1: "🅱 GPU 6-8 Go", 2: "🅲 GPU 12-24 Go", None: "🅰🅱🅲 indifférent"}
ETAT = {"present": "✅ en place", "partiel": "◑ partiel", "absent": "🟥 à installer", "reference": "⬜ réf. seule"}


def plier(x: str) -> str:
    """Minuscules, accents retirés, ponctuation → espaces : « scanné » == « scanne »."""
    x = unicodedata.normalize("NFD", str(x or "").lower())
    x = "".join(c for c in x if not unicodedata.combining(c))
    x = re.sub(r"\[[^\]]+\]\([^)]+\)", " ", x)
    return re.sub(r"[^a-z0-9]+", " ", x.replace("`", " ").replace("*", " ")).strip()


def charger() -> dict:
    if not REGISTRE.exists():
        sys.exit("❌ registre absent : lance `python3 audit/reference/generate-reference.py`")
    return json.loads(REGISTRE.read_text(encoding="utf-8"))


def textes(outil: dict) -> dict[str, str]:
    return {c: " ".join(outil[c]) if isinstance(outil.get(c), list) else str(outil.get(c, "")) for c, _ in PONDS}


def scorer(outil: dict, mots: list[str], exige_tous: bool = True) -> tuple[int, bool]:
    """→ (score, couverture) où couverture = tous les mots trouvés (ou au moins un si --ou)."""
    t = {c: plier(v) for c, v in textes(outil).items()}
    score, touches = 0, 0
    for m in mots:
        trouve = False
        for c, p in PONDS:
            n = len(re.findall(r"(?<![a-z0-9])" + re.escape(m), t[c]))
            if n:
                score += p * min(n, 3)
                trouve = True
        touches += 1 if trouve else 0
    ok = touches == len(mots) if exige_tous else touches > 0
    return score, ok


def filtres(outil: dict, a: argparse.Namespace) -> bool:
    if a.cat:
        v = plier(a.cat)
        num = outil["cat"].split(" · ")[0]
        if not (v == num or v in plier(outil["cat"]) or plier(a.cat) in plier(outil["cat"].split(" · ")[-1])):
            return False
    if a.prix:
        voulu = {ALIAS_PRIX.get(x, x) for x in a.prix}
        if outil["prix"] not in voulu:
            return False
    if a.etat and outil["statut"] not in {ALIAS_ETAT.get(x, x) for x in a.etat}:
        return False
    if a.palier:
        pal = {0, None} if a.palier.upper() == "A" else {0, None, 1} if a.palier.upper() == "B" else {0, None, 1, 2}
        if outil.get("tier") not in pal:
            return False
    if a.sans_cle and outil["prix"] != "materiel":
        return False
    if a.avec_cle and outil["prix"] == "materiel":
        return False
    if a.gpu is True and outil.get("tier") not in (1, 2):
        return False
    if a.gpu is False and outil.get("tier") in (1, 2):
        return False
    if a.licencie and not re.search(a.licencie, outil["licence"], re.I):
        return False
    return True


def ligne(outil: dict) -> str:
    cat = outil["cat"].split(" · ")[0]
    cle = "" if outil["prix"] == "materiel" else " · ⚠️ compte/clé"
    return (f"  {outil['id']:<22} {cat:>3} · {PRIX_ICONE.get(outil['prix'], outil['prix'])}"
            f" · {PALIER.get(outil.get('tier'), '?')}{cle}"
            f" · {outil['licence'][:42]} · {ETAT.get(outil['statut'], outil['statut'])}")


def affiche(outil: dict, avec_extrait: bool = True) -> None:
    print(ligne(outil))
    if avec_extrait:
        extrait = re.sub(r"\s+", " ", outil["role"]).strip()
        if len(extrait) > 150:
            extrait = extrait[:150].rsplit(" ", 1)[0] + "…"
        print(f"  {'':<22} {extrait}")
        o = outil.get("origine")
        ref = f" · issu de l'audit n°{o['ref']}" if o else ""
        print(f"  {'':<22} → REFERENCE.md#{outil['id']}{ref}")


def fiche(outil: dict) -> None:
    print(f"\n### {outil['nom']} — `{outil['id']}`")
    print(f"  catégorie : {outil['cat']}\n  prix        : {PRIX_ICONE.get(outil['prix'])} · {outil['licence']}"
          f"\n  palier      : {PALIER.get(outil.get('tier'))}   état : {ETAT.get(outil['statut'], outil['statut'])}")
    if outil.get("gpu"):
        print(f"  matériel    : {outil['gpu']}")
    print(f"  rôle        : {outil['role']}")
    if outil.get("integree"):
        print(f"  intégration : {outil['integree']}")
    print("  installation :")
    for et in outil.get("install", []):
        print(f"    {et}")
    if outil.get("verifier"):
        print(f"  vérifier     : {outil['verifier']}")
    if outil.get("notes"):
        print(f"  pièges       : {outil['notes']}")
    print("  sources      : " + " · ".join(outil.get("urls", [])))
    o = outil.get("origine")
    if o:
        print(f"  né du lien   : {o['titre']} ({o['url']}) — audit n°{o['ref']}")
    print()


def besoins(reg: dict, requete: str, a: argparse.Namespace) -> list[dict] | None:
    if not reg.get("besoins"):
        return None
    mots = [m for m in plier(requete).split() if m]
    trouves = []
    for b in reg["besoins"]:
        plat = plier(b["besoin"] + " " + b["note"] + " " + " ".join(b["outils"]))
        if not mots or all(m in plat for m in mots):
            trouves.append(b)
    if not trouves:
        return []
    par_id = {o["id"]: o for o in reg["outils"]}
    for b in trouves:
        titre = b["besoin"].replace("**", "")
        print(f"\n▌{titre[0].upper() + titre[1:]}\n  {b['note']}")
        for id_ in b["outils"]:
            if id_ in par_id:
                if a.ids:
                    print(f"  {id_}")
                else:
                    affiche(par_id[id_], avec_extrait=not a.bref)
        if a.ids:
            print(" ".join(b["outils"]))
    return trouves


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Recherche dans le registre d'outils de la tour (voir la docstring pour les recettes).",
        formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("requete", nargs="*", help="mots-clés (AND ; un seul suffit avec --ou)")
    ap.add_argument("--fiche", metavar="ID", help="affiche une fiche complète")
    ap.add_argument("--besoin", metavar="MOT", help="routage par besoin (« vps », « pdf », « 4d »…)")
    ap.add_argument("--liste", action="store_true", help="tout le registre, groupé par catégorie")
    ap.add_argument("--prix", action="append", default=[], help="gratuit|compte|semi|payant|materiel (répétable)")
    ap.add_argument("--palier", metavar="A|B|C", help="capacité machine : A = CPU seul, B = GPU 6-8 Go, C = gros GPU")
    ap.add_argument("--etat", action="append", default=[], help="present|partiel|absent|reference (répétable)")
    ap.add_argument("--cat", metavar="N", help="catégorie (numéro ou mot du libellé)")
    ap.add_argument("--licence", action="append", default=[], metavar="RE", help="filtre la licence (regex)")
    ap.add_argument("--sans-cle", action="store_true", help="seulement ce qui marche sans compte ni clé")
    ap.add_argument("--avec-cle", action="store_true", help="seulement ce qui exige un compte/clé")
    ap.add_argument("--gpu", action=argparse.BooleanOptionalAction, help="--gpu = veut un GPU ; --no-gpu = CPU seul")
    ap.add_argument("--ou", action="store_true", help="UN mot suffit (au lieu de tous)")
    ap.add_argument("--limit", type=int, default=12)
    ap.add_argument("--ids", action="store_true", help="ne sort que les ids (à pipeline)")
    ap.add_argument("--bref", action="store_true", help="une ligne par résultat")
    ap.add_argument("--json", action="store_true", help="résultats en JSON (champs entiers)")
    a = ap.parse_args()

    reg = charger()
    par_id = {o["id"]: o for o in reg["outils"]}

    if a.fiche:
        if a.fiche not in par_id:
            proche = difflib.get_close_matches(plier(a.fiche), list(par_id), n=6, cutoff=0.6)
            print(f"❌ id inconnu : {a.fiche!r}")
            if proche:
                print("   voulais-tu dire : " + ", ".join(proche[:6]))
            return 2
        fiche(par_id[a.fiche])
        return 0

    if a.besoin is not None:
        r = besoins(reg, a.besoin, a)
        return 0 if r else 1

    if a.liste:
        for cat in reg["categories"]:
            rows = [o for o in reg["outils"] if o["cat"] == cat]
            if rows:
                print(f"\n## {cat}")
                for o in rows:
                    print(ligne(o) if not a.ids else "  " + o["id"])
        return 0

    mots = [m for m in plier(" ".join(a.requete)).split() if m] or [""]
    if all(m == "" for m in mots):
        mots = []
    lic = "|".join(a.licence) if a.licence else ""
    a.licencie = lic or None

    hits = []
    for o in reg["outils"]:
        if not filtres(o, a):
            continue
        sc, ok = scorer(o, mots, exige_tous=not a.ou) if mots else (0, True)
        if ok:
            hits.append((sc, o))
    if mots:
        hits.sort(key=lambda x: (-x[0], x[1]["id"]))
    else:
        hits.sort(key=lambda x: x[1]["id"])

    relache = False
    if mots and len(hits) < 3 and not a.ou:
        assoupli = []
        for o in reg["outils"]:
            if not filtres(o, a):
                continue
            sc, _ = scorer(o, mots, exige_tous=False)
            if sc:
                assoupli.append((sc, o))
        if len(assoupli) > len(hits):
            hits, relache = assoupli, True
    if a.json:
        vus = hits[:a.limit] if a.limit else hits
        print(json.dumps(vus, ensure_ascii=False, indent=2))
        return 0 if hits else 1
    pistes = []
    if mots and len(hits) < 3 and reg.get("besoins"):
        for bb in reg["besoins"]:
            plat = plier(bb["besoin"] + " " + bb["note"] + " " + " ".join(bb["outils"]))
            if any(m in plat for m in mots):
                pistes.append(bb)
    if not hits and not pistes:
        print("Aucun résultat. Élargis : `--ou`, retire un filtre, ou `--liste` pour voir tout le registre.")
        return 1
    total = len(hits)
    if a.limit and total > a.limit:
        vus = hits[:a.limit]
    else:
        vus = hits
    if not a.ids:
        tete = f"{total} résultat(s)" + (f" — {len(vus)} affichés (`--limit` pour la suite)" if len(vus) != total else "")
        if mots:
            tete += f" pour « {' '.join(a.requete)} »"
        if relache:
            tete += " · ≈ recherche assouplie (un des mots suffit)"
        print("─" * 78 + f"\n{tete}\n" + "─" * 78)
    for _, o in vus:
        if a.ids:
            print(o["id"])
        elif a.bref:
            print(ligne(o))
        else:
            affiche(o)
    for bb in pistes[:2]:
        titre = bb["besoin"].replace("**", "")
        print(f"\n≈ ce besoin est routé ailleurs dans le registre : {titre[0].upper() + titre[1:]}")
        print("   " + " ".join(bb["outils"]) + "   → `--besoin` pour la note, `--fiche <id>` pour la fiche")
    if not hits:
        print("\n(aucun résultat direct : la piste ci-dessus est la réponse du registre)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
