# Icone agenti

Generatore di icone per agenti AI: dallo stesso nome esce sempre la stessa icona (hash del nome → tratti). Due stili, **Robot** e **Creatura**, e un pacchetto favicon completo per ogni dispositivo, come RealFaviconGenerator.

## File

- `index.html`: lo strumento completo (anteprime su browser, Google, iPhone, Android; download zip; snippet HTML). Si apre direttamente nel browser.
- `robot.html`: la prima versione, solo robot, con la galleria di esempio.
- `src/robot.js`: `agentAvatar(name, { shape, variant })` → `{ svg, traits }`
- `src/creature.js`: `creatureAvatar(name, { shape, variant })` → `{ svg, traits }`
- `src/app.js`: la pagina (PNG, ICO, manifest, zip).
- `src/head.html`: HTML e CSS della pagina.

`shape` può essere `square` (angoli arrotondati), `circle` o `full` (quadrato pieno, per iOS e Android).
Le due funzioni non hanno dipendenze e restituiscono l'SVG come stringa: si possono copiare in qualsiasi progetto.

## Modificare

Modifica i file in `src/`, poi esegui `./build.sh` per rigenerare `index.html`.

## Pacchetto generato

`favicon.ico` (16/32/48), `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png` (180), `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `site.webmanifest`.

Pubblicato anche come artifact: https://claude.ai/artifact/1NRY4VFJ6wwBT8ZKtxfwDE
