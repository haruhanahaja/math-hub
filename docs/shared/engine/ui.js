/* 영역 앱의 화면 — 단원 목록 · 단원 화면 · 문제 화면 · 바로 통과 시험.
   모든 구간이 이 파일 하나를 쓴다. 화면을 만지는 코드는 여기에만 있다(엔진은 화면 없이 돈다).
   주소: #            구간 홈(단원 목록)
         #unit/A01    단원 화면
         #study/A01   공부하기
         #test/A01    바로 통과 시험 */
(function () {
  'use strict';
  var MH = window.MH, P = MH.progress;
  var root, STAGE, HOME = '../';
  var S = null;                                   /* 문제 화면의 상태(화면에만 있는 것) */
  var AUTO_NEXT = 700, autoTimer = 0;             /* 맞히면 이만큼(밀리초) 초록색으로 보여 준 뒤 다음 문제로 넘어간다 */

  var ICON = {
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    back: 'M19 12H5M11 6l-6 6 6 6',
    close: 'M6 6l12 12M18 6 6 18',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    del: 'M9 5h11v14H9l-6-7zM12 9.500l5 5M17 9.500l-5 5',
    hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900V16h7v-2.100A6 6 0 0 0 12 3z',
    steps: 'M5 6h14M5 12h14M5 18h9',
    auto: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M12 7l5.500 1.500M12 12h9M12 17l5.500-1.500',
    light: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.600 5.600 4.200 4.200M19.800 19.800l-1.400-1.400M5.600 18.400l-1.400 1.400M19.800 4.200l-1.400 1.400M12 7.500a4.500 4.500 0 1 1 0 9 4.500 4.500 0 0 1 0-9z',
    dark: 'M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z'
  };
  var MODE_LABEL = { auto: '시스템', light: '라이트', dark: '다크' };
  var STATUS = { soon: '준비 중', locked: '잠김', open: '열림', passed: '통과' };

  function ic(n) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[n] + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /** 수식을 KaTeX 로 그린다. KaTeX 를 못 불러왔으면 글자 그대로 보여 준다. */
  function tex(src, display) {
    if (window.katex) { try { return window.katex.renderToString(src, { displayMode: !!display, throwOnError: false }); } catch (e) { /* 아래로 */ } }
    return '<code>' + esc(src) + '</code>';
  }
  /** 글 안의 $ … $ 부분만 수식으로 그린다(분수를 책에 쓰는 모양으로 보여 줄 때) */
  function rich(s) { return String(s).split('$').map(function (part, i) { return i % 2 ? tex(part, false) : esc(part); }).join(''); }
  function today() { return MH.dnum(); }
  function rnd() { return Math.floor(Math.random() * 4294967296) >>> 0; }
  function dateOf(dnum) { var d = new Date(dnum * 864e5); return (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일'; }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function unitLabel(u) { return u.id + ' ' + u.title; }
  /** 단원을 통과한 뒤 덧붙일 말: 이 단원 덕분에 새로 열린 단원 → 아직 남은 열린 단원 → 준비 중 */
  function afterPass(id) {
    var opened = MH.MAP.units.filter(function (u) { return u.requires.indexOf(id) >= 0 && P.status(u.id) === 'open'; });
    if (opened.length) return ' 다음 단원 「' + esc(opened[0].title) + '」이 열렸어요.'.replace('」이', '」' + MH.josa(opened[0].title, '이/가').slice(opened[0].title.length));
    var cur = P.currentUnit(STAGE);
    return cur ? ' 이어서 「' + esc(MH.MAP.unit(cur).title) + '」 단원을 공부해요.' : ' 다음 단원은 준비 중이에요.';
  }

  /* ── 구간 홈 ─────────────────────────────────────────── */
  function renderHome() {
    var t = today(), stage = MH.MAP.stage(STAGE), day = P.day(t), goal = P.s.settings.goal, mode = MH.mode();
    var due = P.dueReviews(t).length, cur = P.currentUnit(STAGE), units = MH.MAP.unitsOf(STAGE);
    var passedReady = units.filter(function (u) { return P.passed(u.id); });
    var cta;
    if (cur) {
      var u = MH.MAP.unit(cur);
      cta = '<a class="cta" href="#study/' + cur + '"><span class="txt"><b>' + (due ? '복습 ' + due + '문제부터 시작해요' : day.n ? '이어서 풀기' : '오늘의 학습 시작') + '</b><small>' + esc(unitLabel(u)) + '</small></span>' + ic('arrow') + '</a>';
    } else if (due && passedReady.length) {
      cta = '<a class="cta" href="#study/' + passedReady[passedReady.length - 1].id + '"><span class="txt"><b>복습 ' + due + '문제가 기다려요</b><small>틀렸던 유형을 다시 풀어요</small></span>' + ic('arrow') + '</a>';
    } else {
      cta = '<div class="cta idle"><span class="txt"><b>열린 단원을 모두 통과했어요</b><small>다음 단원을 준비하고 있어요</small></span></div>';
    }
    root.innerHTML = '<div class="page">'
      + '<header class="bar"><a class="icon-btn" href="' + HOME + '" aria-label="Math Hub 홈으로">' + ic('grid') + '</a><h1>' + stage.name + '</h1>'
      + '<button class="theme" data-act="theme" aria-label="테마 바꾸기: 지금 ' + MODE_LABEL[mode] + '">' + ic(mode) + MODE_LABEL[mode] + '</button></header>'
      + '<section class="today"><div class="today-row"><span><b>' + day.n + '</b> / ' + goal + '문제</span><span>연속 ' + P.streak(t) + '일 · 복습 ' + due + '</span></div>'
      + '<div class="track"><i style="width:' + Math.min(100, day.n * 100 / goal) + '%"></i></div></section>'
      + cta
      + '<h2 class="sec">단원</h2><ol class="units">' + units.map(function (u) {
        var st = P.status(u.id), cls = st === 'passed' ? ' done' : st === 'open' ? '' : ' off';
        var chip = '<span class="chip' + (st === 'passed' ? ' ok' : st === 'open' ? ' on' : '') + '">' + STATUS[st] + '</span>';
        var inner = '<span class="no">' + u.id + '</span><span class="txt"><b>' + esc(u.title) + '</b><small>' + esc(u.summary) + '</small></span>' + chip;
        return '<li>' + (st === 'soon' ? '<div class="unit' + cls + '">' + inner + '</div>' : '<a class="unit' + cls + '" href="#unit/' + u.id + '">' + inner + '</a>') + '</li>';
      }).join('') + '</ol></div>';
  }

  /* ── 단원 화면 ───────────────────────────────────────── */
  function renderUnit(id) {
    var u = MH.MAP.unit(id), st = P.status(id), body = '';
    if (st === 'locked') {
      body = '<div class="card"><h3>먼저 통과할 단원</h3><ol class="units" style="margin-top:0">' + u.requires.filter(function (r) { return !P.passed(r); }).map(function (r) {
        var x = MH.MAP.unit(r);
        return '<li><a class="unit" href="#unit/' + r + '"><span class="no">' + r + '</span><span class="txt"><b>' + esc(x.title) + '</b></span>' + ic('arrow') + '</a></li>';
      }).join('') + '</ol></div>';
    } else if (st !== 'soon') {
      var rec = P.unit(id).recent, dots = '';
      for (var i = 0; i < P.WINDOW; i++) { var c = rec.charAt(rec.length - P.WINDOW + i); dots += '<i class="' + (c ? 'd' + c : '') + '"></i>'; }
      var ready = P.allAtLast(id);
      body = '<div class="card"><h3>통과 기준 — 최근 10문제 중 9문제를 힌트 없이 정답</h3><div class="dots" role="img" aria-label="최근 10문제 중 ' + P.cleanCount(id) + '문제 정답">' + dots + '</div>'
        + '<p class="note">' + (st === 'passed' ? dateOf(P.unit(id).passed) + '에 통과했어요.'
          : ready ? '지금 ' + P.cleanCount(id) + '문제예요. 노란색은 힌트를 보고 맞힌 문제예요.'
            : '모든 유형이 마지막 단계에 올라오면 그때부터 세요. 지금은 연습 중이에요.') + '</p></div>'
        + '<div class="card"><h3>유형</h3><ul class="types">' + u.types.map(function (t) {
          var def = MH.types[t], ts = P.type(t), lv = '';
          for (var k = 0; k < def.levels.length; k++) lv += '<i class="' + (k <= ts.level ? 'on' : '') + '"></i>';
          return '<li><span class="txt">' + esc(def.title) + '<small>' + esc(def.levels[ts.level].name) + ' · ' + ts.n + '문제 풀었어요</small></span><span class="lv" aria-label="단계 ' + (ts.level + 1) + ' / ' + def.levels.length + '">' + lv + '</span></li>';
        }).join('') + '</ul></div>'
        + '<div class="actions"><a class="btn" href="#study/' + id + '">' + (st === 'passed' ? '계속 연습하기' : P.unit(id).n ? '이어서 공부하기' : '공부하기') + '</a>'
        + (st === 'open' ? '<a class="btn ghost" href="#test/' + id + '">' + (P.s.test && P.s.test.unit === id ? '시험 이어 하기 (' + (P.s.test.i + 1) + ' / ' + P.s.test.items.length + ')' : '바로 통과 시험') + '</a>'
          + '<p class="note">이미 아는 내용이면 10문제로 바로 통과할 수 있어요. 힌트와 풀이 없이 9문제를 맞히면 돼요.</p>' : '') + '</div>';
    }
    root.innerHTML = '<div class="page"><header class="bar"><a class="icon-btn" href="#" aria-label="단원 목록으로">' + ic('back') + '</a><h1>' + MH.MAP.stage(STAGE).name + '</h1></header>'
      + '<section class="u-head"><span class="chip' + (st === 'passed' ? ' ok' : st === 'open' ? ' on' : '') + '">' + u.id + ' · ' + STATUS[st] + '</span><h2>' + esc(u.title) + '</h2><p>' + esc(u.summary) + '</p></section>' + body + '</div>';
  }

  /* ── 그림 ─────────────────────────────────────────────
     문제의 prompt 가 figure 를 주면 식 · 글 아래에 그린다.
     { type: 'bar', parts: 한 띠를 나눈 칸 수, filled: 색칠한 칸 수 }  — 칸이 parts 보다 많으면 띠를 여러 개 그린다(띠 하나가 1)
     { type: 'line', max: 오른쪽 끝의 자연수, parts: 1 을 나눈 칸 수, mark: 0 에서 몇 번째 눈금인가 } */
  MH.figure = function (f) {
    var h = '', i, j;
    if (f.type === 'bar') {
      var bars = Math.max(1, Math.ceil(f.filled / f.parts));
      for (i = 0; i < bars; i++) {
        h += '<div class="bar-fig" style="grid-template-columns:repeat(' + f.parts + ',1fr)">';
        for (j = 0; j < f.parts; j++) h += '<i' + (i * f.parts + j < f.filled ? ' class="on"' : '') + '></i>';
        h += '</div>';
      }
      return '<div class="figure" role="img" aria-label="똑같이 ' + f.parts + '칸으로 나눈 띠 ' + bars + '개에서 ' + f.filled + '칸을 색칠한 그림">' + h + '</div>';
    }
    if (f.type === 'line') {
      var W = 320, L = 18, R = W - 18, n = f.max * f.parts, x = function (k) { return Math.round((L + (R - L) * k / n) * 10) / 10; };
      h = '<line x1="' + (L - 8) + '" y1="34" x2="' + (R + 8) + '" y2="34" class="ax"/>';
      for (i = 0; i <= n; i++) {
        var big = i % f.parts === 0;
        h += '<line x1="' + x(i) + '" y1="' + (big ? 24 : 28) + '" x2="' + x(i) + '" y2="' + (big ? 44 : 40) + '" class="ax"/>';
        if (big) h += '<text x="' + x(i) + '" y="62" text-anchor="middle">' + i / f.parts + '</text>';
      }
      h += '<path d="M' + x(f.mark) + ' 22 l-6 -10 h12 z" class="mk"/><text x="' + x(f.mark) + '" y="9" text-anchor="middle" class="mk">□</text>';
      return '<div class="figure"><svg class="line-fig" viewBox="0 0 ' + W + ' 68" role="img" aria-label="0부터 ' + f.max + '까지의 수직선. 1을 똑같이 ' + f.parts + '칸으로 나누었고, 0에서 ' + f.mark + '번째 눈금에 □ 표시가 있다">' + h + '</svg></div>';
    }
    return '';
  };

  /* ── 문제 화면 ─────────────────────────────────────────
     S.phase: 'answer' 첫 답을 기다림 · 'retry' 틀려서 한 번 더 · 'done' 끝(다음 문제로)
     기록은 첫 답(또는 풀이 보기)에서 한 번만 한다. */
  function openStudy(id) {
    var st = P.status(id);
    if (st === 'soon' || st === 'locked') return go('#unit/' + id);
    var cur = P.s.current, def = cur && MH.types[cur.type];
    if (!(cur && !cur.rec && cur.unit === id && def && def.version === cur.version && cur.level < def.levels.length)) cur = newTask(id);
    setProblem(cur, false);
  }
  function newTask(id) {
    var task = P.nextTask(today(), id, rnd);
    task.version = MH.types[task.type].version; task.hints = 0; task.rec = false;
    P.s.current = task; P.save();
    return task;
  }
  /* 답 칸: 보통은 하나, 답 형식에 fields 가 있으면(몫 · 나머지) 여러 칸. 판정에는 칸들을 ',' 로 이어서 넘긴다. */
  function labelsOf(def) { var kind = MH.kinds[def.answer.kind]; return kind.fieldsOf ? kind.fieldsOf(def.answer) : kind.fields || ['내 답']; }
  function blank() { return S.labels.map(function () { return ''; }); }
  function startAt() { return S.kind.start ? S.kind.start(S.def.answer) : 0; }
  function rawInput() { return S.fields.join(','); }
  function syncBoxes() {
    S.fields.forEach(function (f, i) {
      var box = document.getElementById('ans' + i);
      if (box) { box.textContent = f; box.classList.toggle('live', i === S.at); }
    });
    /* 칸이 여러 개면 지금 쓰는 칸이 화면 밖에 있을 수 있다(그림이 큰 문제의 분모 칸) */
    var live = document.getElementById('ans' + S.at);
    if (S.fields.length > 1 && live && live.scrollIntoView) live.scrollIntoView({ block: 'nearest' });
  }
  function setProblem(task, isTest) {
    var problem = MH.makeProblem(task.type, task.level, task.seed);
    var kind = MH.kinds[MH.types[task.type].answer.kind];
    S = { test: isTest, task: task, problem: problem, def: MH.types[task.type], kind: kind, labels: labelsOf(MH.types[task.type]), fields: [], at: 0, phase: 'answer', hints: task.hints || 0,
      msgs: [], showSteps: false, ask: false, boxClass: '', final: null, testResult: null };
    S.fields = blank(); S.at = startAt();
    drawSolve(true);
  }

  function msg(cls, head, body) { return '<div class="msg ' + cls + '">' + (head ? '<b>' + head + '</b>' : '') + (body || '') + '</div>'; }
  function stepsHtml() {
    var steps = S.def.steps(S.problem.v, S.problem.ctx);
    return '<div class="msg"><b>풀이</b><ol class="steps">' + steps.map(function (s) {
      return '<li>' + esc(s.say) + (s.tex ? '<div class="tex">' + tex(s.tex, false) + '</div>' : '') + '</li>';
    }).join('') + '</ol></div>';
  }
  /** 단원 통과 · 하루 목표 달성 알림 */
  function extras(out) {
    var h = '';
    if (out.passedNow) {
      var u = MH.MAP.unit(S.task.unit);
      h += msg('star', esc(unitLabel(u)) + ' 통과', '<p>최근 10문제 중 9문제를 힌트 없이 맞혔어요.' + afterPass(u.id) + '</p>');
    }
    if (out.goalNow) h += msg('star', '오늘 목표 ' + P.s.settings.goal + '문제를 채웠어요', '<p>여기서 멈춰도 좋아요. 더 풀어도 괜찮아요.</p>');
    return h;
  }
  /** 맞혔으면 잠깐 보여 주고 다음 문제로. 읽어야 할 알림(단원 통과 · 목표 달성 · 약분 안내)이 있으면 넘기지 않는다. */
  function autoNext() {
    clearTimeout(autoTimer);
    var mine = S;
    autoTimer = setTimeout(function () { if (S === mine && S.phase === 'done') next(); }, AUTO_NEXT);
  }
  function answerTex() { return S.kind.tex(S.problem.answer, S.def.answer); }
  function suffix() { return S.def.answer.suffix ? S.def.answer.suffix(S.problem.v, S.problem.ctx) : ''; }

  function submit() {
    if (S.phase === 'done') return next();
    /* 여러 칸일 때: 지금 칸은 채웠고 빈칸이 남았으면 '확인'은 그 빈칸으로 옮겨 가는 뜻 */
    var to = S.kind.next ? S.kind.next(S.fields, S.at) : -1;
    if (to >= 0) { S.at = to; return syncBoxes(); }
    var j = MH.judge(S.problem, rawInput()), t = today();
    if (j.verdict === 'invalid') {
      /* 읽을 수 없는 답은 흔들기만 한다. 값은 맞는데 꼴이 다른 답(note)은 까닭을 알려 주고 다시 쓰게 한다. 어느 쪽도 기록하지 않는다. */
      if (j.note) { S.redo = j.note; S.fields = blank(); S.at = startAt(); return drawSolve(true); }
      S.boxClass = 'shake'; drawSolve(false); S.boxClass = ''; return;
    }
    S.redo = null;
    var right = j.verdict !== 'wrong', mine = '<p class="mine">내 답: ' + (S.kind.sayTex ? tex(S.kind.sayTex(j.value), false) : esc(S.kind.say(j.value))) + esc(suffix()) + '</p>';
    var explain = j.mistake ? '<p>' + esc(j.mistake.explain) + '</p>' : '<p>처음부터 차근차근 다시 계산해 보세요.</p>';

    if (S.test) {
      S.testResult = P.answerTest(right, j.mistake ? j.mistake.id : null, t); P.save();
      S.phase = 'done'; S.final = S.fields.slice(); S.boxClass = right ? 'good' : 'bad';
      S.msgs = [right ? msg('good', '맞았어요') : msg('bad', '틀렸어요', mine + explain + '<p>정답은 ' + tex(answerTex()) + esc(suffix()) + ' 이에요.</p>')];
      drawSolve(true);
      if (right) autoNext();
      return;
    }
    if (S.phase === 'answer') {
      var out = P.record(S.task, { correct: right, hinted: S.hints > 0, mistake: j.mistake ? j.mistake.id : null }, t);
      S.task.rec = true; P.save();
      if (right) {
        var body = (j.note ? '<p>' + rich(j.note) + '</p>' : '')
          + (S.hints > 0 && S.task.mode === 'study' ? '<p>힌트를 보고 맞힌 문제는 통과 기준에는 세지 않아요.</p>' : '')
          + (S.task.mode === 'review' ? '<p>' + reviewNote() + '</p>' : '');
        S.phase = 'done'; S.final = S.fields.slice(); S.boxClass = 'good';
        S.msgs = [msg('good', '맞았어요', body), extras(out)];
        drawSolve(true);
        if (!out.passedNow && !out.goalNow && !j.note) autoNext();
        return;
      } else {
        S.phase = 'retry'; S.fields = blank(); S.at = startAt(); S.ask = false;
        S.msgs = [msg('bad', '다시 볼까요?', mine + explain + '<p>한 번 더 풀어 볼 수 있어요. 이 유형은 내일 복습에 다시 나와요.</p>'), extras(out)];
      }
      return drawSolve(true);
    }
    /* 두 번째 답 */
    S.phase = 'done'; S.final = S.fields.slice(); S.boxClass = right ? 'good' : 'bad';
    if (right) S.msgs = [msg('good', '이번엔 맞았어요', '<p>방금 고친 부분을 기억해 두세요.</p>')];
    else { S.msgs = [msg('bad', '정답은 ' + tex(answerTex()) + esc(suffix()) + ' 이에요', mine + explain)]; S.showSteps = true; }
    drawSolve(true);
    if (right) autoNext();
  }
  function reviewNote() {
    var r = P.s.reviews.filter(function (x) { return x.type === S.task.type; })[0];
    return r ? '복습 문제를 맞혔어요. 이 유형은 ' + (r.due - today()) + '일 뒤에 한 번 더 나와요.' : '이 유형의 복습(1일 · 3일 · 7일)을 모두 마쳤어요.';
  }
  function showHint() {
    var hints = S.def.hints(S.problem.v, S.problem.ctx);
    if (S.phase === 'done' || S.hints >= hints.length) return;
    S.hints++;
    if (S.phase === 'answer') { S.task.hints = S.hints; P.save(); }
    drawSolve(true);
  }
  /** 풀이 보기. 답을 내기 전이면 오답으로 기록된다는 것을 한 번 묻는다. */
  function showSolution(confirmed) {
    clearTimeout(autoTimer);
    if (S.phase === 'answer' && !confirmed) { S.ask = true; return drawSolve(false); }
    S.ask = false;
    if (S.phase === 'answer') {
      var out = P.record(S.task, { correct: false, seen: true, mistake: null }, today());
      S.task.rec = true; P.save();
      S.msgs = [msg('', '정답은 ' + tex(answerTex()) + esc(suffix()) + ' 이에요', '<p>풀이를 먼저 본 문제는 오답으로 기록돼요. 이 유형은 내일 복습에 다시 나와요.</p>'), extras(out)];
    } else if (S.phase === 'retry') {
      S.msgs.push(msg('', '정답은 ' + tex(answerTex()) + esc(suffix()) + ' 이에요'));
    }
    S.phase = 'done'; S.showSteps = true;
    if (S.final === null) S.final = blank();
    S.redo = null;
    drawSolve(true);
  }
  function next() {
    clearTimeout(autoTimer);
    if (S.test) {
      if (S.testResult) return renderTestResult(S.testResult);
      return openTest(S.task.unit);
    }
    P.s.current = null;
    setProblem(newTask(S.task.unit), false);
  }
  function press(k) {
    if (S.phase === 'done') return;
    var f = S.fields[S.at];
    if (S.kind.layout === 'choice') {                      /* 보기 고르기: 누른 보기로 바꾼다 */
      if (k === 'back') S.fields[0] = ''; else if (MH.optionsOf(S.problem).indexOf(k) >= 0) S.fields[0] = k;
      return syncBoxes();
    }
    if (k === 'back') { if (f === '' && S.at > 0) S.at--; else S.fields[S.at] = f.slice(0, -1); }
    else if (f.length < 7) S.fields[S.at] = (f === '0' ? '' : f) + k;
    syncBoxes();
  }

  function drawSolve(scroll) {
    var t = today(), task = S.task, u = MH.MAP.unit(task.unit), def = S.def, pr = def.prompt(S.problem.v, S.problem.ctx);
    var head, count, pct, tag;
    if (S.test) {
      var T = P.s.test, i = T ? T.i + (S.phase === 'done' ? 0 : 1) : P.TEST_SIZE;
      head = '바로 통과 시험'; count = i + ' / ' + P.TEST_SIZE; pct = (S.phase === 'done' ? i : i - 1) * 100 / P.TEST_SIZE;
      tag = '<span class="chip on">시험</span>' + esc(unitLabel(u));
    } else {
      var day = P.day(t), goal = P.s.settings.goal;
      head = unitLabel(u); count = '오늘 ' + day.n + ' / ' + goal; pct = Math.min(100, day.n * 100 / goal);
      var tu = MH.MAP.unit(def.unit);
      tag = (task.mode === 'review' ? '<span class="chip on">복습</span>' + esc(unitLabel(tu)) + ' · ' : task.mode === 'mix' ? '<span class="chip on">지난 단원</span>' + esc(unitLabel(tu)) + ' · ' : '')
        + esc(def.title) + (def.levels.length > 1 ? ' · 단계 ' + (task.level + 1) + ' / ' + def.levels.length : '');
    }
    var hints = def.hints(S.problem.v, S.problem.ctx), fb = '';
    for (var h = 0; h < S.hints; h++) fb += '<div class="msg hint"><b>힌트 ' + (h + 1) + '</b><p>' + esc(hints[h]) + '</p></div>';
    if (S.redo && !done) fb += msg('hint', '다시 써 볼까요?', '<p>' + esc(S.redo) + '</p>');
    fb += S.msgs.join('');
    if (S.showSteps) fb += stepsHtml();

    var done = S.phase === 'done', pad;
    if (done) {
      var last = S.test && S.testResult;
      pad = (!S.test && !S.showSteps ? '<div class="tools"><button data-act="solution">' + ic('steps') + '풀이 보기</button></div>' : '')
        + '<button class="btn" data-act="next">' + (last ? '결과 보기' : '다음 문제') + '</button>'
        + (!S.test ? '<a class="sub-link" href="#unit/' + task.unit + '">오늘은 여기까지</a>' : '');
    } else {
      var tools = S.test ? '' : S.ask
        ? '<div class="tools ask"><span>풀이를 보면 이 문제는 오답으로 기록돼요.</span><button class="yes" data-act="solution-yes">풀이 보기</button><button data-act="solution-no">취소</button></div>'
        : '<div class="tools"><button data-act="hint"' + (S.hints >= hints.length ? ' disabled' : '') + '>' + ic('hint') + (S.hints ? '힌트 더 보기 (' + S.hints + ' / ' + hints.length + ')' : '힌트') + '</button>'
          + '<button data-act="solution">' + ic('steps') + '풀이 보기</button></div>';
      var keys = '';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (k) { keys += '<button data-key="' + k + '">' + k + '</button>'; });
      keys += '<button class="k-back" data-key="back" aria-label="지우기">' + ic('del') + '</button><button data-key="0">0</button><button class="k-ok" data-act="submit">확인</button>';
      if (S.kind.layout === 'choice') {
        keys = MH.optionsOf(S.problem).map(function (o) { return '<button data-key="' + esc(o) + '" aria-label="' + esc(o) + '">' + tex(S.kind.tex(o), false) + '</button>'; }).join('')
          + '<button class="k-ok" data-act="submit">확인</button>';
      }
      pad = tools + '<div class="keys' + (S.kind.layout === 'choice' ? ' choice' : '') + '">' + keys + '</div>';
    }
    var sfx = suffix(), multi = S.fields.length > 1, frac = S.kind.layout === 'fraction';
    var boxes = S.fields.map(function (f, i) {
      var label = S.labels[i];
      var box = '<span class="ans-box ' + (done ? S.boxClass : (i === S.at ? 'live ' : '') + S.boxClass) + '" id="ans' + i + '"' + (multi && !done ? ' data-act="field" data-i="' + i + '"' : '') + ' aria-label="' + label + '">' + esc(done ? S.final[i] : f) + '</span>';
      return multi && !frac ? '<span class="field"><small>' + label + '</small>' + box + '</span>' : box;
    });
    /* 분수: (자연수 칸) + 분자 칸 / 가로줄 / 분모 칸 */
    if (frac) { var k = boxes.length; boxes = (k === 3 ? boxes[0] : '') + '<span class="frac-in">' + boxes[k - 2] + '<i></i>' + boxes[k - 1] + '</span>'; }
    else boxes = boxes.join('');
    root.innerHTML = '<div class="solve">'
      + '<header class="bar"><a class="icon-btn" href="#unit/' + task.unit + '" aria-label="나가기">' + ic('close') + '</a><span class="mid">' + esc(head) + '</span><span class="count">' + count + '</span></header>'
      + '<div class="track"><i style="width:' + pct + '%"></i></div>'
      + '<main class="q" id="q"><div class="q-tag">' + tag + '</div>'
      + (pr.tex ? '<div class="q-tex">' + tex(pr.tex, false) + '</div>' : '')
      + (pr.text ? '<p class="q-text">' + rich(pr.text) + '</p>' : '')
      + (pr.figure ? MH.figure(pr.figure) : '')
      + '<div class="answer' + (frac ? ' frac' : multi ? ' multi' : '') + '">' + boxes + (sfx ? '<span class="suffix">' + esc(sfx) + '</span>' : '') + '</div>'
      + '<div class="fb" id="fb" aria-live="polite">' + fb + '</div></main>'
      + '<footer class="pad">' + pad + '</footer></div>';
    if (scroll) {
      var q = document.getElementById('q'), f = document.getElementById('fb');
      /* 풀이는 풀이의 첫 줄부터, 판정 결과는 답 칸과 함께, 힌트는 가려져 있을 때만 보이게 민다 */
      if (S.showSteps) q.scrollTop = Math.max(0, f.lastElementChild.offsetTop - q.offsetTop - 12);
      else if (S.msgs.length) {
        q.scrollTop = 0;
        var m = f.querySelector('.msg.good, .msg.bad, .msg.star');
        /* 다시 풀 때는 문제가 보여야 한다: 설명은 첫머리(약 84px)만 보이게 하고 문제를 되도록 남긴다 */
        if (m && S.phase === 'retry') q.scrollTop = Math.max(0, m.offsetTop - q.offsetTop - (q.clientHeight - 84));
        else if (m && m.scrollIntoView) m.scrollIntoView({ block: 'nearest' });
      }
      else if ((S.hints || S.redo) && f.lastElementChild.scrollIntoView) f.lastElementChild.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ── 바로 통과 시험 ──────────────────────────────────── */
  function openTest(id) {
    if (P.status(id) !== 'open') return go('#unit/' + id);
    var T = P.s.test;
    if (!T || T.unit !== id || T.items.some(function (x) { return !MH.types[x.type]; })) { T = P.startTest(id, rnd); P.save(); }
    var item = T.items[T.i];
    setProblem({ mode: 'test', unit: id, type: item.type, level: item.level, seed: item.seed }, true);
  }
  function renderTestResult(r) {
    S = null;
    var u = MH.MAP.unit(r.unit);
    var wrong = r.wrongTypes.map(function (t) { return '「' + esc(MH.types[t].title) + '」'; }).join(', ');
    root.innerHTML = '<div class="page"><header class="bar"><a class="icon-btn" href="#unit/' + r.unit + '" aria-label="단원으로">' + ic('back') + '</a><h1>바로 통과 시험</h1></header>'
      + '<div class="card result"><b>' + r.score + ' / ' + r.total + '</b><h2>' + (r.passed ? esc(unitLabel(u)) + ' 통과' : '아직 통과하지 못했어요') + '</h2>'
      + '<p>' + (r.passed ? afterPass(r.unit).trim()
        : '9문제 이상 맞혀야 통과해요. ' + (wrong ? wrong + ' 유형부터 차근차근 연습해요.' : '')) + (r.wrongTypes.length && r.passed ? ' 틀린 유형은 내일 복습에 나와요.' : '') + '</p></div>'
      + '<div class="actions">' + (r.passed ? '<a class="btn" href="#">단원 목록으로</a>' : '<a class="btn" href="#study/' + r.unit + '">공부하기</a><a class="btn ghost" href="#">단원 목록으로</a>') + '</div></div>';
  }

  /* ── 주소와 입력 ─────────────────────────────────────── */
  function route() {
    MH.apply();
    var m = /^#(unit|study|test)\/([A-Za-z0-9]+)$/.exec(location.hash), u = m && MH.MAP.unit(m[2]);
    S = null; clearTimeout(autoTimer);
    window.scrollTo(0, 0);
    if (!u || u.stage !== STAGE) return renderHome();
    if (m[1] === 'unit') return renderUnit(u.id);
    if (m[1] === 'study') return openStudy(u.id);
    return openTest(u.id);
  }
  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-key],[data-act]') : null;
    if (!el || el.disabled) return;
    if (el.dataset.key) return press(el.dataset.key);
    var act = el.dataset.act;
    if (act === 'theme') { MH.setMode(MH.MODES[(MH.MODES.indexOf(MH.mode()) + 1) % MH.MODES.length]); return route(); }
    if (!S) return;
    if (act === 'field') { if (S.phase !== 'done') { S.at = Number(el.dataset.i); syncBoxes(); } }
    else if (act === 'submit') submit();
    else if (act === 'next') next();
    else if (act === 'hint') showHint();
    else if (act === 'solution') showSolution(false);
    else if (act === 'solution-yes') showSolution(true);
    else if (act === 'solution-no') { S.ask = false; drawSolve(false); }
  }
  function onKey(e) {
    if (!S || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key) || (S.kind.layout === 'choice' && e.key.length === 1)) press(e.key);
    else if (e.key === 'Backspace') press('back');
    else if (e.key === 'Tab' && S.fields.length > 1 && S.phase !== 'done') { e.preventDefault(); S.at = (S.at + 1) % S.fields.length; syncBoxes(); }
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
  }

  /** 만들어진 모든 단원의 파일을 차례로 불러온다(아래 구간 문제를 섞어 내려면 다른 구간의 유형도 필요하다). */
  function loadUnits(done) {
    var files = MH.MAP.units.filter(function (u) { return u.ready; }).map(function (u) { return HOME + MH.MAP.file(u.id); });
    (function step(i) {
      if (i >= files.length) return done();
      var s = document.createElement('script');
      s.src = files[i]; s.onload = s.onerror = function () { step(i + 1); };
      document.head.appendChild(s);
    })(0);
  }

  MH.app = {
    /** opts: { stage: 'A', root: 화면을 그릴 요소, home: 사이트 맨 위 폴더까지의 경로 } */
    start: function (opts) {
      STAGE = opts.stage; root = opts.root; HOME = opts.home || '../';
      P.load();
      loadUnits(function () {
        root.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey);
        window.addEventListener('hashchange', route);
        MH.onSystemChange(function () { if (!S) route(); else MH.apply(); });
        route();
      });
    }
  };
})();
