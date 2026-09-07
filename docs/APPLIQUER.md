# Watchtower — sauvegarde des modifications

Fork de `bilawalsidhu/gods-eye-view` (commit upstream `65bc522`) avec :
- Écran de démarrage MODE GRATUIT / MODE PAYANT (`src/startGate.js` + branchement `src/main.js`)
- Fix OSM bloqué → tuiles CARTO Voyager (`src/mapStackController.js`)
- Recherche de lieux sans clé → Photon/Nominatim (`src/locations.js`)
- Voix gratuite Web Speech FR/EN (`src/voice/freeVoice.js`)
- Feux gratuits NASA EONET + flag ALLOW_FRAMING (`vite.config.js`)
- `README.md` (section Watchtower)

## Pour reconstruire le repo watchtower

```bash
git clone --depth 1 https://github.com/bilawalsidhu/gods-eye-view watchtower
cd watchtower && rm -rf .git docs/media
cp -r ../watchtower-mods/src ../watchtower-mods/vite.config.js ../watchtower-mods/README.md ../watchtower-mods/index.html .
cp ../watchtower-mods/SOURCES-FR.md docs/
git init && git add -A && git commit -m "Watchtower"
git remote add origin https://github.com/Sathancabrol/watchtower
git push origin main
```
