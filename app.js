// 화면 전환, 실시간 흐름 시연, 버튼 연결
const MENU = [
  ['현황판', [['d1', '오늘 현황', 'D1'], ['d2', '예산 집행', 'D2'], ['d3', '행사 예결산', 'D3'], ['d4', '법인카드', 'D4'], ['d6', '지출 추이', 'D6'], ['d7', '가지급·선급', 'D7'], ['d8', '마감 달력', 'D8']]],
  ['내 정산', [['me', '내가 받을 돈', 'D5'], ['calc', '청구 계산기', 'T2']]],
  ['도구함', [['t1', '영수증 판독', 'T1'], ['t3', '서식 작성', 'T3'], ['t4', '전표 초안', 'T4'], ['t5', '중복·이상 점검', 'T5'], ['t6', '과거 지출 찾기', 'T6'], ['t7', '정기 지출', 'T7']]],
  ['자료', [['up', '자료 올리기', '']]],
];
const ALL = Object.fromEntries(MENU.flatMap(g => g[1]).map(x => [x[0], x]));
const SUB = {
  d1: '처리할 일과 이번 달 흐름을 한눈에 봅니다.', d2: '예산 대비 집행과 연말 예상을 봅니다. 세로줄은 오늘까지의 진도입니다.', d3: '행사마다 예산 대비 지출, 1인당 비용, 작년과의 차이를 봅니다.',
  d4: '카드별 사용액과 영수증을 안 낸 건을 봅니다.', d6: '월별 지출을 작년과 견줘 봅니다.', d7: '내준 돈 중 아직 정산하지 않은 것을 봅니다.', d8: '카드 마감, 25일 지급, 결산과 행사 일정을 모았습니다.',
  me: '내가 낸 청구와 개인 정산이 어디까지 왔는지 봅니다.', calc: '총무국 청구 9종을 규정대로 계산합니다. 결과를 아스키오 청구서에 옮겨 적으면 됩니다.',
  t1: '영수증을 읽어 법인카드 내역과 짝짓습니다.', t3: '지출결의서·송금요청서·행사 예결산안·대체 사유서를 장부 자료로 채웁니다.', t4: '장부 자료로 분개 초안을 만들어 굿바이G20·더존 입력 파일로 받습니다.',
  t5: '중복, 나눠 결제, 증빙 없음, 주말 사용, 한도·예산 초과를 찾습니다.', t6: '작년 같은 행사나 같은 가맹점에 얼마를 썼는지 찾습니다.', t7: '매달 나가는 지출이 제때 나갔는지 확인합니다.',
  up: '더존·카드사 엑셀을 올리면 현황판이 그 자료로 바뀝니다.',
};
let PAGE = 'd1';
function render() {
  PAGE = ALL[location.hash.slice(1)] ? location.hash.slice(1) : 'd1';
  const iss = findIssues().filter(i => i.lv === 'r').length, miss = rows(2026).filter(r => !r.receipt).length;
  const badge = { t5: iss, d4: miss };
  let side = '<aside class="side" id="side"><div class="brand"><span class="mk">회</span><div><b>회계 업무 도우미</b><small>총무국 · 아스키오 옆에서 보는 현황판</small></div></div>';
  MENU.forEach(([g, items]) => { side += '<div class="grp">' + g + '</div>' + items.map(([k, l, c]) => '<a class="mi ' + (k === PAGE ? 'on' : '') + '" href="#' + k + '"><span class="cd">' + c + '</span>' + l + (badge[k] ? '<em>' + badge[k] + '</em>' : '') + '</a>').join(''); });
  side += '<div class="grp">이 데모</div><div style="font-size:11.5px;color:var(--sub);padding:0 8px;line-height:1.6">이름·금액은 모두 예시입니다. 바꾼 내용은 이 브라우저에만 남습니다.<br><button class="btn s" id="resetBtn" style="margin-top:6px">처음 상태로</button></div></aside>';
  const top = '<div class="top"><button class="btn s" id="menuBtn">☰</button><span class="crumb">' + ALL[PAGE][1] + '</span><span class="src"><span class="dot' + (S.live ? ' live' : '') + '"></span>' + esc(S.src) + ' · ' + S.updated + ' 갱신</span><span class="sp"></span>' +
    '<select class="sel" id="scope" aria-label="범위">' + ['전체'].concat(DEPTS).map(d => '<option' + (d === S.scope ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>' +
    '<button class="btn ' + (S.live ? 'on' : '') + '" id="liveBtn" title="카드 사용이 들어오는 모습을 흉내 냅니다">' + (S.live ? '실시간 흐름 켜짐' : '실시간 흐름 켜기') + '</button></div>';
  let body;
  try { body = V[PAGE](); } catch (e) { console.error(e); body = '<div class="note r">화면을 그리다 문제가 생겼습니다: ' + esc(e.message) + '</div>'; }
  $('#app').innerHTML = '<div class="app">' + side + '<div class="main">' + top + '<div class="body"><div class="head"><div><h1>' + ALL[PAGE][1] + '</h1><p>' + SUB[PAGE] + '</p></div></div>' + body + '</div></div></div>';
  document.title = ALL[PAGE][1] + ' · 회계 업무 도우미';
  if (PAGE === 'calc') calcUpdate();
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && ACT[el.dataset.a]) { if (el.tagName === 'A') e.preventDefault(); ACT[el.dataset.a](Object.assign({}, el.dataset), el); return; }
  const id = e.target.id;
  if (id === 'menuBtn') $('#side').classList.toggle('open');
  if (id === 'liveBtn') toggleLive();
  if (id === 'resetBtn') modal('<h2>처음 상태로 되돌릴까요?</h2><p>올린 자료, 붙인 영수증, 추가한 청구가 지워지고 예시 자료로 돌아갑니다.</p><div class="row end"><button class="btn" data-a="close">취소</button><button class="btn p" id="resetOk">되돌리기</button></div>');
  if (id === 'resetOk') { stopLive(); resetAll(); closeModal(); F = { d6m: 10, card: '', evSel: '' }; render(); toast('처음 상태로 돌렸습니다.'); }
});
ACT.close = () => closeModal();
document.addEventListener('change', e => { if (e.target.id === 'scope') { S.scope = e.target.value; save(); render(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('hashchange', () => { closeModal(); render(); window.scrollTo(0, 0); });

/* 실시간 흐름 시연 */
let liveT = null, liveI = 0;
function toggleLive() { if (S.live) { stopLive(); render(); toast('실시간 흐름을 껐습니다.'); } else { S.live = true; render(); toast('실시간 흐름을 켰습니다. 몇 초마다 카드 사용이 들어옵니다.'); liveT = setInterval(liveTick, 5000); setTimeout(liveTick, 1200); } }
function stopLive() { S.live = false; if (liveT) clearInterval(liveT); liveT = null; }
function liveTick() {
  if (!S.live) return;
  const [dept, item, vendor, purpose, amt, card, who, ev] = LIVE_POOL[liveI++ % LIVE_POOL.length];
  const r = { id: 'X' + Date.now(), date: TODAY, dept, item, vendor, purpose, amt, pay: '카드 #' + card, who, receipt: liveI % 3 !== 0, event: ev || '', live: true };
  if (ev) r.plan = ev === 'ev1' ? '다과' : '기념품';
  S.ledger.forEach(x => { delete x.live; });
  S.extra = (S.extra || []).concat([Object.assign({}, r, { live: false })]);
  S.ledger.push(r); S.updated = stamp(); save();
  const y = window.scrollY; render(); window.scrollTo(0, y);
  ['k-oct', 'k-miss'].forEach(id => { const k = $('#' + id); if (k) k.classList.add('flash'); });
  toast('새 카드 사용: ' + dept + ' ' + vendor + ' ' + won(amt) + '원' + (r.receipt ? '' : ' (영수증 아직 없음)'));
}

load();
render();
