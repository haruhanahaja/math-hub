/* 풀이 공간 — 문제 아래에 펜(애플펜슬 · S펜)이나 손가락, 마우스로 풀이 과정을 쓰는 곳.
   · 쓴 것은 그 문제를 푸는 동안만 기억한다(메모리). 저장하지 않고, 다음 문제로 가면 비운다.
   · 손글씨를 답으로 읽지 않는다. 답은 여전히 키패드 · 보기로 넣는다.
   · 문제 화면은 힌트 · 판정 때마다 통째로 다시 그려지므로, 획은 화면이 아니라 여기(SP.strokes)에 두고 그때마다 다시 그린다.
   · 펜을 한 번이라도 쓰면 그 뒤로 손가락은 선을 긋지 않고 화면을 민다(손바닥이 닿아도 선이 생기지 않는다).
   획 { w: 굵기, pts: [x, y, 필압, x, y, 필압, …] } — 좌표는 풀이 공간의 왼쪽 위에서 잰 CSS 픽셀.
   모델(획 · 지우기 · 되돌리기)은 화면 없이 돌고 tests/scratch.test.js 가 검사한다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};
  var MAX_HIST = 60, ERASE_R = 14;
  var SP = { key: null, strokes: [], hist: [], tool: 'pen', pen: false };
  var cv = null, ctx = null, live = null;

  /* ── 모델 ── */
  function remember() { SP.hist.push(SP.strokes.slice()); if (SP.hist.length > MAX_HIST) SP.hist.shift(); }
  /** 점 (x, y) 에서 선분 (ax, ay)–(bx, by) 까지의 거리의 제곱 */
  function dist2(x, y, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy, t = len ? ((x - ax) * dx + (y - ay) * dy) / len : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var px = ax + t * dx - x, py = ay + t * dy - y;
    return px * px + py * py;
  }
  /** 획이 점 (x, y) 에서 r 안쪽을 지나는가 */
  function hit(stroke, x, y, r) {
    var p = stroke.pts, r2 = r * r;
    if (p.length === 3) return dist2(x, y, p[0], p[1], p[0], p[1]) <= r2;
    for (var i = 3; i < p.length; i += 3) if (dist2(x, y, p[i - 3], p[i - 2], p[i], p[i + 1]) <= r2) return true;
    return false;
  }
  var model = {
    state: SP,
    /** 문제가 바뀌었으면 비운다(같은 문제를 다시 그릴 때는 그대로 둔다) */
    reset: function (key) { if (key !== SP.key) { SP.key = key; SP.strokes = []; SP.hist = []; SP.tool = 'pen'; } },
    add: function (stroke) { remember(); SP.strokes.push(stroke); },
    /** 지우개: 그 점에 닿은 획을 통째로 지운다. 한 번의 지우개 움직임은 되돌리기 한 번으로 돌아온다(first 가 참일 때만 기억) */
    eraseAt: function (x, y, first) {
      var keep = SP.strokes.filter(function (s) { return !hit(s, x, y, ERASE_R); });
      if (keep.length === SP.strokes.length) return false;
      if (first) remember();
      SP.strokes = keep;
      return true;
    },
    undo: function () { if (!SP.hist.length) return false; SP.strokes = SP.hist.pop(); return true; },
    clear: function () { if (!SP.strokes.length) return false; remember(); SP.strokes = []; return true; },
    hit: hit
  };

  /* ── 그리기 ── */
  function widthAt(stroke, p) { return stroke.w * (0.5 + p); }
  function segment(stroke, i) {
    var p = stroke.pts;
    ctx.lineWidth = widthAt(stroke, p[i + 2]);
    ctx.beginPath();
    if (i === 0) { ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 0.01, p[1]); }
    else { ctx.moveTo(p[i - 3], p[i - 2]); ctx.lineTo(p[i], p[i + 1]); }
    ctx.stroke();
  }
  function redraw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = getComputedStyle(cv).color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    SP.strokes.forEach(function (s) { for (var i = 0; i < s.pts.length; i += 3) segment(s, i); });
  }
  /** 단추와 안내 글의 모습을 지금 상태에 맞춘다 */
  function sync() {
    var box = cv && cv.closest('.sp');
    if (!box) return;
    box.classList.toggle('has', SP.strokes.length > 0 || !!(live && live.stroke));
    box.classList.toggle('erasing', SP.tool === 'eraser');
    Array.prototype.forEach.call(box.querySelectorAll('[data-act]'), function (b) {
      var a = b.dataset.act;
      if (a === 'sp-pen') b.classList.toggle('on', SP.tool === 'pen');
      if (a === 'sp-eraser') b.classList.toggle('on', SP.tool === 'eraser');
      if (a === 'sp-undo') b.disabled = !SP.hist.length;
      if (a === 'sp-clear') b.disabled = !SP.strokes.length;
    });
  }
  /** 캔버스의 실제 크기를 화면 크기 × 화소 밀도로 맞추고 다시 그린다 */
  function fit() {
    if (!cv || !cv.parentNode) return;
    var area = cv.parentNode, dpr = Math.min(window.devicePixelRatio || 1, 3);
    var w = Math.max(1, area.clientWidth), h = Math.max(1, area.clientHeight);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw(); sync();
  }

  /* ── 입력 ── */
  function at(e) { var r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * 10) / 10, Math.round((e.clientY - r.top) * 10) / 10]; }
  function pressure(e) { return e.pointerType === 'pen' && e.pressure > 0 ? Math.round(e.pressure * 100) / 100 : 0.5; }
  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType === 'pen') SP.pen = true;
    if (live) return;                                          /* 두 번째 손가락 · 손바닥은 무시 */
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 잡을 수 없는 포인터 */ }
    e.preventDefault();
    if (e.pointerType === 'touch' && SP.pen) { live = { id: e.pointerId, scroll: cv.closest('.q'), y: e.clientY }; return; }
    var p = at(e);
    /* 펜 옆 단추(지우개 단추)를 누르고 쓰면 지우개 */
    if (SP.tool === 'eraser' || (e.pointerType === 'pen' && (e.buttons & 32))) {
      live = { id: e.pointerId, erase: true, first: true };
      if (model.eraseAt(p[0], p[1], live.first)) { live.first = false; redraw(); sync(); }
      return;
    }
    live = { id: e.pointerId, stroke: { w: e.pointerType === 'pen' ? 2.4 : 2.6, pts: [p[0], p[1], pressure(e)] } };
    ctx.strokeStyle = getComputedStyle(cv).color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    segment(live.stroke, 0);
    sync();
  }
  function move(e) {
    if (!live || e.pointerId !== live.id) return;
    e.preventDefault();
    if (live.scroll !== undefined) { if (live.scroll) live.scroll.scrollTop -= e.clientY - live.y; live.y = e.clientY; return; }
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!list.length) list = [e];
    var changed = false;
    list.forEach(function (ev) {
      var p = at(ev);
      if (live.erase) { if (model.eraseAt(p[0], p[1], live.first)) { live.first = false; changed = true; } return; }
      var pts = live.stroke.pts, n = pts.length;
      if (p[0] === pts[n - 3] && p[1] === pts[n - 2]) return;
      pts.push(p[0], p[1], pressure(ev));
      segment(live.stroke, n);
    });
    if (changed) { redraw(); sync(); }
  }
  function up(e) {
    if (!live || e.pointerId !== live.id) return;
    if (live.stroke) model.add(live.stroke);
    live = null;
    sync();
  }
  function stop(e) { e.preventDefault(); }

  MH.scratch = {
    model: model,
    /** 풀이 공간의 HTML. 문제 화면이 그릴 자리에 넣고, 그린 뒤 mount 를 부른다 */
    html: function () {
      var ic = function (d) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
      return '<section class="sp" id="sp" aria-label="풀이 공간"><div class="sp-bar">'
        + '<button data-act="sp-pen">' + ic('M4 20l4.500-1L19.500 8l-3.500-3.500L5 15.500zM13.500 7l3.500 3.500') + '펜</button>'
        + '<button data-act="sp-eraser">' + ic('M9 20h11M4.500 14.500l9-9 5.500 5.500-9 9H7z') + '지우개</button><span class="gap"></span>'
        + '<button data-act="sp-undo" aria-label="한 획 되돌리기">' + ic('M8 5L3 10l5 5M3 10h11a5 5 0 0 1 0 10h-3') + '되돌리기</button>'
        + '<button data-act="sp-clear" aria-label="모두 지우기">' + ic('M4 7h16M9 7V4h6v3M6.500 7l1 13h9l1-13') + '모두 지우기</button></div>'
        + '<div class="sp-area"><canvas id="sp-cv"></canvas><p class="sp-ph">여기에 풀이를 써 보세요</p></div></section>';
    },
    /** 새로 그려진 화면의 캔버스에 붙는다. key 가 바뀌었으면(다른 문제) 쓴 것을 비운다 */
    mount: function (root, key) {
      model.reset(key);
      live = null; ctx = null;
      cv = root.querySelector('#sp-cv');
      if (!cv) return;
      cv.addEventListener('pointerdown', down);
      cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
      cv.addEventListener('touchstart', stop, { passive: false });      /* 옛 사파리: 쓰는 동안 화면이 밀리거나 확대되지 않게 */
      cv.addEventListener('touchmove', stop, { passive: false });
      cv.addEventListener('contextmenu', stop);
      cv.addEventListener('selectstart', stop);
      fit();
    },
    /** 화면에서 풀이 공간이 사라졌다(끄기 · 다른 화면) */
    unmount: function () { cv = null; ctx = null; live = null; },
    fit: fit,
    /** 도구 단추: 'sp-pen' | 'sp-eraser' | 'sp-undo' | 'sp-clear' */
    act: function (name) {
      if (name === 'sp-pen') SP.tool = 'pen';
      else if (name === 'sp-eraser') SP.tool = 'eraser';
      else if (name === 'sp-undo') model.undo();
      else if (name === 'sp-clear') model.clear();
      redraw(); sync();
    }
  };
})();
