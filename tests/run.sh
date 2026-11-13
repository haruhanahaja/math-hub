#!/bin/sh
# 모든 테스트를 실행한다. Node 가 없어도 되도록 macOS 내장 JavaScript 엔진(jsc)을 쓴다.
# 사용: sh tests/run.sh
set -e
cd "$(dirname "$0")/.."
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
[ -x "$JSC" ] || JSC=$(command -v jsc || command -v node)
exec "$JSC" tests/run.js
