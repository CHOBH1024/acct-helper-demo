// 상태·계산·그림·자료 읽기 공통 도구
const KEY = 'acct-helper-v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = n => Math.round(Number(n) || 0).toLocaleString('ko-KR');
const man = n => { const v = Math.round((Number(n) || 0) / 10000); return v.toLocaleString('ko-KR') + '만'; };
const num = v => Number(String(v == null ? '' : v).replace(/[^\d.-]/g, '')) || 0;
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : 0;
const ELAPSED = (9 + 15 / 31) / 12;
function addDay(d, n) { const t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); }
function dday(d) { return Math.round((new Date(d + 'T00:00:00') - new Date(TODAY + 'T00:00:00')) / 864e5); }
function stamp() { const d = new Date(); return TODAY.slice(5).replace('-', '/') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

/* ---------- 상태 ---------- */
let S;
function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
  S = { scope: '전체', live: false, src: '예시 자료', srcFile: '', updated: stamp(), uploaded: null, extra: [], my: MYCLAIMS.map(x => Object.assign({}, x)), docs: [], rcpt: {} };
  if (saved && saved.v === 1) Object.assign(S, saved, { live: false });
  S.rcpt = S.rcpt || {};
  S.ledger = (S.uploaded || genLedger()).concat(S.extra || []);
  S.ledger.forEach(r => { if (S.rcpt[r.id]) r.receipt = true; });
}
function save() {
  try { const { ledger, live, ...rest } = S; localStorage.setItem(KEY, JSON.stringify(Object.assign({ v: 1 }, rest))); } catch (e) { }
}
function resetAll() { try { localStorage.removeItem(KEY); } catch (e) { } load(); }

/* ---------- 모으기 ---------- */
const inScope = r => S.scope === '전체' || r.dept === S.scope;
const Y = y => r => r.date.slice(0, 4) === String(y);
function rows(y) { return S.ledger.filter(r => inScope(r) && (!y || r.date.slice(0, 4) === String(y))); }
const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x.amt), 0);
function budgets() { return BUDGET.filter(b => S.scope === '전체' || b[0] === S.scope).map(([dept, item, annual]) => ({ dept, item, annual })); }
function budgetUse(dept, item) {
  const b = BUDGET.find(x => x[0] === dept && x[1] === item);
  const used = sum(S.ledger.filter(r => r.dept === dept && r.item === item && r.date.slice(0, 4) === String(YEAR)));
  const annual = b ? b[2] : 0;
  const fc = Math.round(used / ELAPSED);
  return { dept, item, annual, used, rate: annual ? used / annual : 0, fc, left: annual - used,
    st: !annual ? ['g', '예산 없음'] : used > annual ? ['r', '초과'] : fc > annual * 1.05 ? ['w', '연말 초과 예상'] : used / annual > ELAPSED + 0.08 ? ['w', '빠름'] : ['ok', '보통'] };
}
function monthly(y, pred) { const a = Array(12).fill(0); S.ledger.forEach(r => { if (r.date.slice(0, 4) === String(y) && inScope(r) && (!pred || pred(r))) a[+r.date.slice(5, 7) - 1] += r.amt; }); return a; }
function evSpent(id) { return sum(S.ledger.filter(r => r.event === id)); }
function cardOf(r) { const m = /#(\d{4})/.exec(r.pay || ''); return m ? m[1] : ''; }

/* ---------- 점검 (T5) ---------- */
function findIssues() {
  const out = [], R = S.ledger.filter(r => r.date.slice(0, 4) === String(YEAR) && inScope(r));
  const key = r => r.date + '|' + r.amt + '|' + String(r.vendor).replace(/\(주\)|㈜|\s/g, '').slice(0, 4);
  const seen = {};
  R.forEach(r => { const k = key(r); (seen[k] = seen[k] || []).push(r); });
  Object.values(seen).filter(g => g.length > 1).forEach(g => out.push({ lv: 'r', kind: '중복 의심', text: g[0].date.slice(5) + ' ' + g[0].vendor + ' ' + won(g[0].amt) + '원이 ' + g.length + '건 (' + g.map(x => x.who + '·' + x.pay).join(', ') + ')', rows: g }));
  // 같은 날 같은 가맹점 나눠 결제 (합치면 30만원 이상)
  const sp = {};
  R.filter(r => r.pay.startsWith('카드')).forEach(r => { const k = r.date + '|' + r.vendor + '|' + cardOf(r); (sp[k] = sp[k] || []).push(r); });
  Object.values(sp).filter(g => g.length > 1 && sum(g) >= 300000 && g.every(x => x.amt < 300000) && new Set(g.map(x => x.amt)).size > 1).forEach(g => out.push({ lv: 'w', kind: '나눠 결제', text: g[0].date.slice(5) + ' ' + g[0].vendor + ' 카드 #' + cardOf(g[0]) + '로 ' + g.length + '번, 합계 ' + won(sum(g)) + '원. 한도 피하기인지 확인', rows: g }));
  R.filter(r => r.amt >= 1000000 && r.amt % 100000 === 0 && r.pay === '개인 정산').forEach(r => out.push({ lv: 'w', kind: '큰 금액 개인 정산', text: r.date.slice(5) + ' ' + r.vendor + ' ' + won(r.amt) + '원을 개인 돈으로 냄. 세금계산서·견적서 확인', rows: [r] }));
  R.filter(r => !r.receipt).forEach(r => out.push({ lv: r.amt >= 100000 ? 'r' : 'w', kind: '증빙 없음', text: r.date.slice(5) + ' ' + r.vendor + ' ' + won(r.amt) + '원 (' + r.who + ', ' + r.pay + ')', rows: [r] }));
  R.filter(r => r.pay.startsWith('카드') && cardOf(r) !== '6026' && [0, 6].includes(new Date(r.date + 'T00:00:00').getDay()) && !r.event).forEach(r => out.push({ lv: 'w', kind: '주말 카드 사용', text: r.date.slice(5) + ' ' + r.vendor + ' ' + won(r.amt) + '원 (' + r.who + '). 업무 목적 확인', rows: [r] }));
  R.filter(r => r.item === '복리후생비(기타)' && /야근/.test(r.purpose)).forEach(r => { const n = num((/(\d+)명/.exec(r.purpose) || [])[1]); if (n && r.amt > n * 10000) out.push({ lv: 'w', kind: '야근식대 한도', text: r.date.slice(5) + ' ' + r.purpose + ' ' + won(r.amt) + '원. 1인 1만원 한도보다 ' + won(r.amt - n * 10000) + '원 많음', rows: [r] }); });
  BUDGET.filter(b => S.scope === '전체' || b[0] === S.scope).forEach(([d, it]) => { const u = budgetUse(d, it); if (u.used > u.annual) out.push({ lv: 'r', kind: '예산 초과', text: d + ' ' + it + ' 예산 ' + won(u.annual) + '원보다 ' + won(u.used - u.annual) + '원 더 씀', rows: [] }); });
  return out;
}

/* ---------- 그림 ---------- */
// 월별 막대(올해) + 선(작년)
function chartMonthly(a, b, opts) {
  opts = opts || {};
  const W = 1100, H = opts.h || 260, L = 56, R = 12, T = 14, B = 26;
  const max = Math.max(1, ...a, ...b) * 1.08;
  const step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step;
  const x = i => L + (W - L - R) / 12 * (i + 0.5), y = v => T + (H - T - B) * (1 - v / nice), bw = (W - L - R) / 12 * 0.56;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="월별 지출">';
  for (let k = 0; k <= 4; k++) { const v = nice / 4 * k; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e6ecea"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + man(v) + '</text>'; }
  a.forEach((v, i) => { if (opts.upto && i >= opts.upto) return; s += '<rect x="' + (x(i) - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + (H - B - y(v)) + '" rx="3" fill="' + (i === (opts.upto || 12) - 1 ? '#5fa79b' : '#0e6b5f') + '"><title>' + (i + 1) + '월 ' + won(v) + '원</title></rect>'; });
  if (b) { s += '<polyline fill="none" stroke="#e0a020" stroke-width="2.2" points="' + b.map((v, i) => x(i) + ',' + y(v)).join(' ') + '"/>'; b.forEach((v, i) => { s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="#fff" stroke="#e0a020" stroke-width="2"><title>작년 ' + (i + 1) + '월 ' + won(v) + '원</title></circle>'; }); }
  for (let i = 0; i < 12; i++) s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + (i + 1) + '월</text>';
  return '<div class="chart">' + s + '</svg></div>';
}
// 누적 집행 곡선(예산 대비)
function chartCumul(a, annual) {
  const W = 1100, H = 240, L = 56, R = 12, T = 12, B = 26;
  let c = 0; const cum = a.map(v => c += v);
  const nice = Math.max(annual, cum[9] || 0) * 1.08;
  const x = i => L + (W - L - R) / 11 * i, y = v => T + (H - T - B) * (1 - v / nice);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="누적 집행">';
  [0, 0.5, 1].forEach(k => { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(annual * k) + '" y2="' + y(annual * k) + '" stroke="' + (k === 1 ? '#b93a12' : '#e6ecea') + '"' + (k === 1 ? ' stroke-dasharray="5 4"' : '') + '/><text x="' + (L - 6) + '" y="' + (y(annual * k) + 4) + '" text-anchor="end">' + man(annual * k) + '</text>'; });
  s += '<line x1="' + x(0) + '" y1="' + y(annual / 12) + '" x2="' + x(11) + '" y2="' + y(annual) + '" stroke="#9fb3ae" stroke-dasharray="3 4"/>';
  const n = 10, pts = cum.slice(0, n).map((v, i) => x(i) + ',' + y(v));
  s += '<polygon fill="#0e6b5f22" points="' + x(0) + ',' + y(0) + ' ' + pts.join(' ') + ' ' + x(n - 1) + ',' + y(0) + '"/><polyline fill="none" stroke="#0e6b5f" stroke-width="2.4" points="' + pts.join(' ') + '"/>';
  const fc = cum[n - 1] / ELAPSED;
  s += '<line x1="' + x(n - 1) + '" y1="' + y(cum[n - 1]) + '" x2="' + x(11) + '" y2="' + y(fc) + '" stroke="#0e6b5f" stroke-width="2" stroke-dasharray="6 4"/><circle cx="' + x(11) + '" cy="' + y(fc) + '" r="4" fill="' + (fc > annual ? '#b93a12' : '#0e6b5f') + '"/><text x="' + (x(11) - 6) + '" y="' + (y(fc) - 8) + '" text-anchor="end">연말 예상 ' + man(fc) + '</text>';
  s += '<circle cx="' + x(n - 1) + '" cy="' + y(cum[n - 1]) + '" r="4.5" fill="#0e6b5f"/>';
  for (let i = 0; i < 12; i++) s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + (i + 1) + '월</text>';
  return '<div class="chart">' + s + '</svg></div>';
}
function bar(rate, pace) { const c = rate > 1 ? 'r' : rate > (pace || 2) + 0.08 ? 'w' : ''; return '<div class="bar"><i class="' + c + '" style="width:' + Math.min(100, rate * 100).toFixed(1) + '%"></i>' + (pace ? '<em style="left:' + (pace * 100).toFixed(1) + '%"></em>' : '') + '</div>'; }
function kp(label, val, sub, c, unit, id) { return '<div class="kp ' + (c || '') + '"' + (id ? ' id="' + id + '"' : '') + '><span>' + label + '</span><b>' + val + '<small>' + (unit == null ? '원' : unit) + '</small></b><em>' + (sub || '') + '</em></div>'; }

/* ---------- 팝업·알림·파일 ---------- */
function modal(html, wide) {
  closeModal();
  const d = document.createElement('div'); d.className = 'dim'; d.id = 'dim';
  d.innerHTML = '<div class="modal" role="dialog" aria-modal="true"' + (wide ? ' style="width:min(' + wide + 'px,100%)"' : '') + '>' + html + '</div>';
  d.addEventListener('mousedown', e => { if (e.target === d) closeModal(); });
  document.body.appendChild(d);
}
function closeModal() { const d = $('#dim'); if (d) d.remove(); }
function toast(msg) { $$('.toast').forEach(x => x.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
const FRAMED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
function download(name, text, type) {
  if (FRAMED) {
    modal('<h2>' + esc(name) + '</h2><p class="mut">이 화면에서는 파일 저장이 막혀 있어 내용을 보여 드립니다. 복사해서 붙여 넣으세요.</p><textarea readonly rows="14" style="width:100%;font:12px Consolas,monospace">' + esc(text) + '</textarea><div class="row end" style="margin-top:10px"><button class="btn p" data-a="close">닫기</button></div>', 760);
    return;
  }
  const b = new Blob(['﻿' + text], { type: type || 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const csvCell = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n');

/* ---------- 엑셀·CSV 읽기 (자료 올리기) ---------- */
function parseCSV(t) {
  const out = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); out.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out.filter(r => r.some(x => String(x).trim()));
}
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = () => no(new Error('엑셀 읽기 도구를 불러오지 못했습니다. CSV로 저장해서 올려 주세요.')); document.head.appendChild(s); });
}
async function readTable(file) {
  const name = file.name.toLowerCase();
  if (/\.(xlsx|xls)$/.test(name)) {
    await loadXLSX();
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
  }
  const buf = await file.arrayBuffer();
  let t = new TextDecoder('utf-8').decode(buf);
  if (/�/.test(t)) { try { t = new TextDecoder('euc-kr').decode(buf); } catch (e) { } }
  return parseCSV(t.replace(/^﻿/, ''));
}
const COLS = {
  date: ['일자', '날짜', '거래일', '승인일', '이용일', '전표일자', '작성일'], amt: ['금액', '차변', '출금', '이용금액', '승인금액', '합계', '지출액', '차변금액'],
  vendor: ['거래처', '가맹점', '상호', '이용가맹점', '가맹점명', '거래처명'], purpose: ['적요', '내용', '목적', '비고', '사용내역'], dept: ['부서', '결의부서', '국', '부서명'],
  item: ['계정과목', '예산과목', '계정', '과목', '계정명'], card: ['카드번호', '카드'], who: ['사용자', '담당', '이름', '성명', '이용자'], receipt: ['증빙', '영수증'], pay: ['결제', '결제수단', '구분'], event: ['행사']
};
function mapHeader(table) {
  for (let h = 0; h < Math.min(12, table.length); h++) {
    const hd = table[h].map(x => String(x).replace(/\s/g, ''));
    const m = {};
    Object.entries(COLS).forEach(([k, names]) => { const i = hd.findIndex(c => names.some(n => c === n || c.includes(n))); if (i >= 0 && !Object.values(m).includes(i)) m[k] = i; });
    if (m.date != null && m.amt != null) return { h, m, head: table[h] };
  }
  return null;
}
function normDate(v) {
  if (typeof v === 'number' && v > 30000 && v < 60000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return d.toISOString().slice(0, 10); }
  const s = String(v).trim(); let m = /(\d{4})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})/.exec(s);
  if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(s); if (m) return m[1] + '-' + m[2] + '-' + m[3];
  return '';
}
function toRows(table, map, defDept) {
  const { h, m } = map, out = [];
  table.slice(h + 1).forEach((r, i) => {
    const date = normDate(r[m.date]), amt = Math.abs(num(r[m.amt]));
    if (!date || !amt) return;
    const card = m.card != null ? String(r[m.card]).replace(/\D/g, '').slice(-4) : '';
    const g = k => m[k] != null ? String(r[m[k]]).trim() : '';
    const rc = g('receipt');
    out.push({ id: 'U' + i, date, amt, vendor: g('vendor') || '(거래처 없음)', purpose: g('purpose'), dept: g('dept') || defDept, item: g('item') || '미분류', who: g('who') || '-',
      pay: card ? '카드 #' + card : (g('pay') || '계좌이체'), receipt: rc ? !/^(x|n|없음|미제출|아니오|0)$/i.test(rc) : true, event: g('event') });
  });
  return out;
}
