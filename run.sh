#!/bin/sh
tsc
until node dist/index.js; do
    echo "argh, crash" >&2
    sleep 1
done
