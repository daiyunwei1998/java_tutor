#!/usr/bin/env bash
# Rebuilds public/java/tutor-runtime.jar (needs a JDK 11+). Only needed if you change runtime-java/src.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf build && mkdir build
javac -encoding UTF-8 --release 11 -cp ../public/java/ecj.jar -d build $(find src -name '*.java')
jar cf ../public/java/tutor-runtime.jar -C build .
echo "built ../public/java/tutor-runtime.jar"
