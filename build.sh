#!/bin/sh
# Ricompone index.html dai sorgenti in src/
cd "$(dirname "$0")" && cat src/head.html src/robot.js src/creature.js src/app.js > index.html && echo "index.html aggiornato"
