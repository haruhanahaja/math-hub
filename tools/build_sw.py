"""docs/sw.js 의 저장 목록(SHELL)과 버전(CACHE)을 docs/ 안의 파일에 맞춰 채운다.
버전은 파일 내용으로 계산하므로, 바뀐 것이 없으면 sw.js 도 그대로다.
docs/ 안의 파일을 고쳤으면 커밋 전에 실행한다:  python3 tools/build_sw.py"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
SKIP = {"sw.js", ".nojekyll", ".DS_Store"}


def main() -> None:
    files = sorted(p for p in DOCS.rglob("*") if p.is_file() and p.name not in SKIP)
    digest = hashlib.sha256()
    urls = []
    for p in files:
        rel = p.relative_to(DOCS).as_posix()
        digest.update(rel.encode() + b"\0" + p.read_bytes())
        urls.append("./" if rel == "index.html" else rel[:-len("index.html")] if rel.endswith("/index.html") else rel)
    sw = DOCS / "sw.js"
    src = sw.read_text(encoding="utf-8")
    out, n1 = re.subn(r"^const CACHE = PREFIX \+ '[^']*';", f"const CACHE = PREFIX + '{digest.hexdigest()[:10]}';", src, flags=re.M)
    out, n2 = re.subn(r"^const SHELL = \[.*\];", "const SHELL = [" + ", ".join(f"'{u}'" for u in sorted(urls)) + "];", out, flags=re.M)
    if n1 != 1 or n2 != 1:
        raise SystemExit("sw.js 에서 CACHE / SHELL 줄을 찾지 못했습니다")
    if out != src:
        sw.write_text(out, encoding="utf-8")
    print(f"sw.js: 파일 {len(urls)}개, 버전 {digest.hexdigest()[:10]}" + ("" if out != src else " (변화 없음)"))


if __name__ == "__main__":
    main()
