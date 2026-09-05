#!/usr/bin/env python3
"""Rapport de couverture et de confiance de la fiche d'identité."""
import json, pathlib, sys
from collections import Counter

SRC = pathlib.Path(__file__).parent / "sathan-cabrol.identity.json"
d = json.loads(SRC.read_text("utf-8"))

rows, counts, trusts = [], Counter(), []

def walk(o, path=""):
    if isinstance(o, dict):
        m = o.get("_meta")
        if isinstance(m, dict) and "src" in m:
            src, t = m["src"], m.get("trust", 0)
            counts[src] += 1
            trusts.append(t)
            rows.append((path or "(racine)", src, t))
        for k, v in o.items():
            if k != "_meta":
                walk(v, f"{path}.{k}" if path else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(v, f"{path}[{i}]")

walk(d)
n = len(rows)
known = counts["declared"] + counts["referential"] + counts["verified"]
avg = sum(trusts) / n if n else 0

print(f"Fiche : {d['entity_id']}  v{d['version']}  ({d['updated']})")
print(f"Champs tracés : {n}\n")
print(f"{'source':<14}{'n':>5}{'%':>8}")
for s in ("verified", "declared", "referential", "inferred", "unknown"):
    print(f"{s:<14}{counts[s]:>5}{100*counts[s]/n:>7.1f}%")
print(f"\nConnu (verified+declared+referential) : {known}/{n} = {100*known/n:.1f}%")
print(f"Inféré  : {counts['inferred']}/{n} = {100*counts['inferred']/n:.1f}%")
print(f"Manquant: {counts['unknown']}/{n} = {100*counts['unknown']/n:.1f}%")
print(f"Trust moyen : {avg:.1f}%")

print("\n-- Champs exposables sans réserve (trust >= 80) --")
print(sum(1 for _, _, t in rows if t >= 80), "champs")
print("\n-- Champs à modaliser (40 <= trust < 80) --")
for p, s, t in sorted((r for r in rows if 40 <= r[2] < 80), key=lambda r: r[2]):
    print(f"  {t:>3}%  [{s}]  {p}")
print("\n-- Champs NON exposables (trust < 40) --")
for p, s, t in sorted((r for r in rows if r[2] < 40), key=lambda r: r[2]):
    print(f"  {t:>3}%  [{s}]  {p}")
