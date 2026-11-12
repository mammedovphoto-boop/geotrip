#!/bin/bash
u=$1; f=$2; [ -s "$f" ] && exit 0; mkdir -p "$(dirname $f)"; curl -s -m 30 --retry 3 -o "$f" "$u" || rm -f "$f"
