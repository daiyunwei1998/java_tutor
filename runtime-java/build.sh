#!/usr/bin/env bash
# Rebuilds public/java/tutor-runtime.jar and public/java/jdk-api.jar (needs JDK 17+ with jimage).
#
# jdk-api.jar: class files of the JDK packages students use (java.lang, java.util, java.io, ...), taken from
# OpenJDK (GPLv2 + Classpath Exception). The in-browser JVM has no jrt:/ module image, so ecj compiles
# against this jar instead (Java 8 language level).
set -euo pipefail
cd "$(dirname "$0")"
OUT=../public/java
rm -rf build && mkdir build
javac -encoding UTF-8 --release 11 -cp $OUT/ecj.jar -d build $(find src -name '*.java')
jar cf $OUT/tutor-runtime.jar -C build .
echo "built $OUT/tutor-runtime.jar"

JH=${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")}
rm -rf build/jdk && mkdir -p build/jdk
"$JH/bin/jimage" extract --dir build/jdk --include 'regex:/java.base/java/(lang|io|util|math|text|nio)/.*' "$JH/lib/modules"
rm -rf build/jdk/java.base/java/nio/channels build/jdk/java.base/java/util/concurrent/atomic
jar cf $OUT/jdk-api.jar -C build/jdk/java.base .
echo "built $OUT/jdk-api.jar"
