#!/bin/sh
tsc
./compile.sh
until node dist/index.js; do
    echo "argh, crash" >&2
    sleep 1
done
