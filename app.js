// 화면 전환, 실시간 흐름 시연, 버튼 연결
const MENU = [
  ['현황판', [['d1', '오늘 현황', 'D1'], ['d2', '예산 집행', 'D2'], ['d3', '행사 예결산', 'D3'], ['d4', '법인카드', 'D4'], ['d6', '지출 추이', 'D6'], ['d7', '가지급·선급', 'D7'], ['d8', '마감 달력', 'D8']]],
  ['내 정산', [['me', '내가 받을 돈', 'D5'], ['calc', '청구 계산기', 'T2']]],
  ['도구함', [['t1', '영수증 판독', 'T1'], ['t3', '서식 작성', 'T3'], ['t4', '전표 초안', 'T4'], ['t5', '중복·이상 점검', 'T5'], ['t6', '과거 지출 찾기', 'T6'], ['t7', '정기 지출', 'T7']]],
  ['자료', [['up', '자료 올리기', '']]],
];
const ALL = Object.fromEntries(MENU.flatMap(g => g[1]).map(x => [x[0], x]));
const SUB = {
  d1: '처리할 일과 이번 달 흐름을 한눈에 봐요.', d2: '예산 대비 집행과 연말 예상을 봐요. 세로줄은 오늘까지의 진도예요.', d3: '행사마다 예산 대비 지출, 1인당 비용, 작년과의 차이를 봐요.',
  d4: '카드별 사용액과 영수증을 안 낸 건을 봐요.', d6: '월별 지출을 작년과 견줘 봐요.', d7: '내준 돈 중 아직 정산하지 않은 것을 봐요.', d8: '카드 마감, 25일 지급, 결산과 행사 일정을 모았어요.',
  me: '내가 낸 청구와 개인 정산이 어디까지 왔는지 봐요.', calc: '총무국 청구 9종을 규정대로 계산해요. 결과를 아스키오 청구서에 옮겨 적으면 돼요.',
  t1: '영수증을 읽어 법인카드 내역과 짝지어요.', t3: '지출결의서·송금요청서·행사 예결산안·대체 사유서를 장부 자료로 채워요.', t4: '장부 자료로 분개 초안을 만들어 굿바이G20·더존 입력 파일로 받아요.',
  t5: '중복, 나눠 결제, 증빙 없음, 주말 사용, 한도·예산 초과를 찾아요.', t6: '작년 같은 행사나 같은 가맹점에 얼마를 썼는지 찾아요.', t7: '매달 나가는 지출이 제때 나갔는지 확인해요.',
  up: '더존·카드사 엑셀을 올리면 현황판이 그 자료로 바뀌어요.',
};
let PAGE = 'd1', ANIM = true, lastTs = Date.now();
const TABBAR = [['d1', '오늘'], ['d2', '예산'], ['me', '받을 돈'], ['t1', '영수증'], ['more', '더보기']];
function themeNow() { const t = document.documentElement.getAttribute('data-theme'); return t || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
function agoText() { if (!S.live) return esc(S.src) + ' · ' + S.updated + ' 갱신'; const s = Math.max(0, Math.round((Date.now() - lastTs) / 1000)); return '실시간 · ' + (s < 2 ? '방금' : s + '초 전') + ' 갱신'; }
function render(anim) {
  ANIM = anim !== false;
  PAGE = ALL[location.hash.slice(1)] ? location.hash.slice(1) : 'd1';
  const iss = findIssues().filter(i => i.lv === 'r').length, miss = rows(2026).filter(r => !r.receipt).length;
  const badge = { t5: iss, d4: miss };
  let side = '<aside class="side" id="side"><div class="brand">' + LOGO + '<div><b>회계 업무 도우미</b><small>총무국 · 아스키오 옆 현황판</small></div></div>';
  MENU.forEach(([g, items]) => { side += '<div class="grp">' + g + '</div>' + items.map(([k, l]) => '<a class="mi ' + (k === PAGE ? 'on' : '') + '" href="#' + k + '">' + ico(k) + '<span>' + l + '</span>' + (badge[k] ? '<em>' + badge[k] + '</em>' : '') + '</a>').join(''); });
  side += '<div class="grp">이 데모</div><div class="foot">이름·금액은 모두 예시예요. 바꾼 내용은 이 브라우저에만 남아요.<br><button class="btn s" id="resetBtn" style="margin-top:6px">처음 상태로</button></div></aside>';
  const th = themeNow();
  const top = '<div class="top"><button class="btn ic" id="menuBtn" aria-label="메뉴">' + ico('more') + '</button><span class="crumb">' + ALL[PAGE][1] + '</span><span class="src"><span class="dot' + (S.live ? ' live' : '') + '"></span><span id="ago">' + agoText() + '</span></span><span class="sp"></span>' +
    '<select class="sel" id="scope" aria-label="범위">' + ['전체'].concat(DEPTS).map(d => '<option' + (d === S.scope ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>' +
    '<button class="btn ' + (S.live ? 'on' : '') + '" id="liveBtn" title="카드 사용이 들어오는 모습을 흉내 내요">' + (S.live ? '실시간 켜짐' : '실시간 켜기') + '</button>' +
    '<button class="btn ic" id="themeBtn" aria-label="화면 밝기 바꾸기" title="' + (th === 'dark' ? '밝게' : '어둡게') + '">' + ico(th === 'dark' ? 'sun' : 'moon') + '</button></div>';
  const tabbar = '<nav class="tabbar" aria-label="빠른 메뉴">' + TABBAR.map(([k, l]) => k === 'more' ? '<button class="tb-item" id="moreBtn">' + ico('more', 20) + '<span>' + l + '</span></button>' : '<a class="tb-item' + (k === PAGE ? ' on' : '') + '" href="#' + k + '">' + ico(k, 20) + '<span>' + l + '</span></a>').join('') + '</nav>';
  let body;
  try { body = V[PAGE](); } catch (e) { console.error(e); body = '<div class="note r">화면을 그리다 문제가 생겼어요: ' + esc(e.message) + '</div>'; }
  $('#app').innerHTML = '<div class="app' + (ANIM ? ' anim' : '') + '">' + side + '<div class="main">' + top + '<div class="body"><div class="head"><div><h1>' + ALL[PAGE][1] + '</h1><p>' + SUB[PAGE] + '</p></div></div>' + body + '</div></div></div>' + tabbar;
  document.title = ALL[PAGE][1] + ' · 회계 업무 도우미';
  if (PAGE === 'calc') calcUpdate();
  drawCharts(); countUp();
}
setInterval(() => { const a = $('#ago'); if (a && S.live) a.textContent = agoText(); }, 1000);
try { const t = localStorage.getItem('acct-helper-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) { }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && ACT[el.dataset.a]) { if (el.tagName === 'A') e.preventDefault(); ACT[el.dataset.a](Object.assign({}, el.dataset), el); return; }
  const id = e.target.id;
  const bt = e.target.closest('button'), bid = bt ? bt.id : '';
  if (bid === 'menuBtn' || bid === 'moreBtn') $('#side').classList.toggle('open');
  if (bid === 'themeBtn') { const n = themeNow() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('acct-helper-theme', n); } catch (er) { } render(false); }
  if (!e.target.closest('#side') && bid !== 'menuBtn' && bid !== 'moreBtn') { const sd = $('#side'); if (sd) sd.classList.remove('open'); }
  if (bid === 'liveBtn') toggleLive();
  if (id === 'resetBtn') modal('<h2>처음 상태로 되돌릴까요?</h2><p>올린 자료, 붙인 영수증, 추가한 청구가 지워지고 예시 자료로 돌아가요.</p><div class="row end"><button class="btn" data-a="close">취소</button><button class="btn p" id="resetOk">되돌리기</button></div>');
  if (id === 'resetOk') { stopLive(); resetAll(); closeModal(); F = { d6m: 10, card: '', evSel: '' }; render(); toast('처음 상태로 돌렸어요.'); }
});
ACT.close = () => closeModal();
document.addEventListener('change', e => { if (e.target.id === 'scope') { S.scope = e.target.value; save(); render(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('hashchange', () => { closeModal(); render(); window.scrollTo(0, 0); });

/* 실시간 흐름 시연 */
let liveT = null, liveI = 0;
function toggleLive() { if (S.live) { stopLive(); render(false); toast('실시간 흐름을 껐어요.'); } else { S.live = true; lastTs = Date.now(); render(false); toast('실시간 흐름을 켰어요. 몇 초마다 카드 사용이 들어와요.'); liveT = setInterval(liveTick, 5000); setTimeout(liveTick, 1200); } }
function stopLive() { S.live = false; if (liveT) clearInterval(liveT); liveT = null; }
function liveTick() {
  if (!S.live) return;
  const [dept, item, vendor, purpose, amt, card, who, ev] = LIVE_POOL[liveI++ % LIVE_POOL.length];
  const r = { id: 'X' + Date.now(), date: TODAY, dept, item, vendor, purpose, amt, pay: '카드 #' + card, who, receipt: liveI % 3 !== 0, event: ev || '', live: true };
  if (ev) r.plan = ev === 'ev1' ? '다과' : '기념품';
  S.ledger.forEach(x => { delete x.live; });
  S.extra = (S.extra || []).concat([Object.assign({}, r, { live: false })]);
  S.ledger.push(r); S.updated = stamp(); lastTs = Date.now(); save();
  const y = window.scrollY; render(false); window.scrollTo(0, y);
  ['k-oct', 'k-miss'].forEach(id => { const k = $('#' + id); if (k) k.classList.add('flash'); });
  toast('새 카드 사용: ' + dept + ' ' + vendor + ' ' + won(amt) + '원' + (r.receipt ? '' : ' (영수증 아직 없음)'));
}

load();
render();
