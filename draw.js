// 그래프·숫자 카드·아이콘·빈 화면
// 그래프는 자리만 만들고, 화면에 놓인 뒤 실제 폭에 맞춰 그린다(글자 크기 고정)
function chartMonthly(a, b, opts) { return '<div class="chart" data-k="m" data-a="' + esc(JSON.stringify(a)) + '" data-b="' + esc(JSON.stringify(b || null)) + '" data-u="' + ((opts && opts.upto) || 12) + '"></div>'; }
function chartCumul(a, annual) { return '<div class="chart" data-k="c" data-a="' + esc(JSON.stringify(a)) + '" data-n="' + annual + '"></div>'; }
const niceMax = v => { const s = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1)))); return Math.ceil(v / s) * s; };
function drawCharts() {
  $$('.chart[data-k]').forEach(el => {
    const W = Math.max(300, el.clientWidth), k = el.dataset.k, a = JSON.parse(el.dataset.a);
    const H = W < 500 ? 200 : 240, L = 50, R = 14, T = 16, B = 24;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + (k === 'm' ? '월별 지출' : '누적 집행') + '">';
    if (k === 'm') {
      const b = JSON.parse(el.dataset.b), up = +el.dataset.u, max = niceMax(Math.max(...a, ...(b || [0])) * 1.05);
      const x = i => L + (W - L - R) / 12 * (i + 0.5), y = v => T + (H - T - B) * (1 - v / max), bw = Math.min(34, (W - L - R) / 12 * 0.5);
      for (let q = 0; q <= 4; q++) { const v = max / 4 * q; s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + man(v) + '</text>'; }
      a.forEach((v, i) => { if (i >= up) return; s += '<rect class="bar26' + (i === up - 1 ? ' part' : '') + '" style="animation-delay:' + (i * 40) + 'ms" x="' + (x(i) - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + Math.max(0, H - B - y(v)) + '" rx="2"/>'; });
      if (b) { s += '<polyline class="l25 draw" pathLength="1" points="' + b.map((v, i) => x(i) + ',' + y(v)).join(' ') + '"/>'; b.forEach((v, i) => { s += '<circle class="p25" cx="' + x(i) + '" cy="' + y(v) + '" r="2.6"/>'; }); }
      for (let i = 0; i < 12; i++) s += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + (i + 1) + '월</text><rect class="hit" x="' + (x(i) - (W - L - R) / 24) + '" y="' + T + '" width="' + (W - L - R) / 12 + '" height="' + (H - T - B) + '" data-tip="' + (i + 1) + '월 · 올해 ' + (i < up ? won(a[i]) + '원' : '-') + (b ? ' · 작년 ' + won(b[i]) + '원' : '') + '"/>';
    } else {
      const ann = +el.dataset.n; let c = 0; const cum = a.map(v => c += v), n = 10, fc = cum[n - 1] / ELAPSED;
      const max = Math.max(ann, fc) * 1.08, x = i => L + (W - L - R) / 11 * i, y = v => T + (H - T - B) * (1 - v / max);
      [0, 0.5].forEach(q => { s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(ann * q) + '" y2="' + y(ann * q) + '"/><text x="' + (L - 8) + '" y="' + (y(ann * q) + 4) + '" text-anchor="end">' + man(ann * q) + '</text>'; });
      s += '<line class="cap" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(ann) + '" y2="' + y(ann) + '"/><text x="' + (L - 8) + '" y="' + (y(ann) + 4) + '" text-anchor="end">' + man(ann) + '</text>';
      s += '<line class="pace" x1="' + x(0) + '" y1="' + y(ann / 12) + '" x2="' + x(11) + '" y2="' + y(ann) + '"/>';
      const pts = cum.slice(0, n).map((v, i) => x(i) + ',' + y(v));
      s += '<polygon class="area" points="' + x(0) + ',' + y(0) + ' ' + pts.join(' ') + ' ' + x(n - 1) + ',' + y(0) + '"/><polyline class="cum draw" pathLength="1" points="' + pts.join(' ') + '"/>';
      s += '<line class="fc" x1="' + x(n - 1) + '" y1="' + y(cum[n - 1]) + '" x2="' + x(11) + '" y2="' + y(fc) + '"/><circle class="' + (fc > ann ? 'dotr' : 'dotb') + '" cx="' + x(11) + '" cy="' + y(fc) + '" r="3.5"/><text x="' + (x(11) - 6) + '" y="' + (y(fc) - 9) + '" text-anchor="end">연말 예상 ' + man(fc) + '</text>';
      s += '<circle class="dotb" cx="' + x(n - 1) + '" cy="' + y(cum[n - 1]) + '" r="3.5"/>';
      for (let i = 0; i < 12; i++) s += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + (i + 1) + '월</text>' + (i < n ? '<rect class="hit" x="' + (x(i) - (W - L - R) / 22) + '" y="' + T + '" width="' + (W - L - R) / 11 + '" height="' + (H - T - B) + '" data-tip="' + (i + 1) + '월까지 누적 ' + won(cum[i]) + '원 (' + pct(cum[i], ann) + '%)"/>' : '');
    }
    el.innerHTML = s + '</svg>';
  });
}
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { const a = $('#app .app'); if (a) a.classList.remove('anim'); drawCharts(); }, 150); });
// 마우스를 올리면 금액
document.addEventListener('mouseover', e => {
  const t = e.target.closest && e.target.closest('[data-tip]'); let tip = $('#tip');
  if (!t) { if (tip) tip.remove(); return; }
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.id = 'tip'; document.body.appendChild(tip); }
  const r = t.getBoundingClientRect(); tip.textContent = t.dataset.tip; tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top + 12) + 'px';
});
function bar(rate, pace) { const c = rate > 1 ? 'r' : rate > (pace || 2) + 0.08 ? 'w' : ''; return '<div class="bar"><i class="' + c + '" style="width:' + Math.min(100, rate * 100).toFixed(1) + '%"></i>' + (pace ? '<em style="left:' + (pace * 100).toFixed(1) + '%"></em>' : '') + '</div>'; }
// 숫자 카드: 금액은 100만원 이상이면 만원, 아래는 원. 숫자는 올라가며 바뀜
function fmtV(v, f) { return f === 'man' ? Math.round(v / 10000).toLocaleString('ko-KR') : f === 'pct' ? (Math.round(v * 10) / 10).toLocaleString('ko-KR') : Math.round(v).toLocaleString('ko-KR'); }
function kp(label, val, sub, c, unit, id) {
  let inner;
  if (typeof val === 'number') {
    let f = 'int', u = unit;
    if (unit == null) { if (Math.abs(val) >= 1000000) { f = 'man'; u = '만원'; } else u = '원'; }
    else if (unit === '%') f = 'pct';
    inner = '<span class="cu" data-v="' + val + '" data-f="' + f + '" data-key="' + esc(id || label) + '">' + fmtV(val, f) + '</span><small>' + u + '</small>';
  } else inner = esc(val) + '<small>' + (unit || '') + '</small>';
  return '<div class="kp ' + (c || '') + '"' + (id ? ' id="' + id + '"' : '') + '><span>' + label + '</span><b>' + inner + '</b><em>' + (sub || '') + '</em></div>';
}
const CU = {};
function countUp() {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('.cu').forEach(el => {
    const to = +el.dataset.v, f = el.dataset.f, key = el.dataset.key, from = CU[key] == null ? 0 : CU[key];
    CU[key] = to;
    if (reduce || from === to) { el.textContent = fmtV(to, f); return; }
    const t0 = performance.now(), d = 700;
    const step = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = fmtV(from + (to - from) * e, f); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
// 빈 화면: 한 줄 안내 + 다음 할 일 버튼
function emptyBox(msg, btn, href) { return '<div class="empty"><span>' + msg + '</span>' + (btn ? '<a class="btn s" href="' + href + '">' + btn + '</a>' : '') + '</div>'; }
// 메뉴 아이콘
const ICON = {
  d1: '<path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/>', d2: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', d3: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  d4: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', d6: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>', d7: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  d8: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 14h2M14 14h2M8 18h2"/>', me: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M16 12.5h2M2 10h20"/>',
  calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/>', t1: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10"/>',
  t3: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', t4: '<path d="M4 4h16v16H4zM4 10h16M10 4v16"/>',
  t5: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>', t6: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', t7: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  up: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>', more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
};
const ico = (k, s) => '<svg viewBox="0 0 24 24" width="' + (s || 17) + '" height="' + (s || 17) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';
const LOGO = '<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><rect x="3" y="3" width="20" height="25" rx="3" fill="var(--brand)"/><path d="M8 10h10M8 15h10M8 20h6" stroke="var(--on-brand)" stroke-width="2" stroke-linecap="round"/><circle cx="23" cy="22" r="5.5" fill="var(--panel)" stroke="var(--brand)" stroke-width="2.4"/><path d="M27 26l3 3" stroke="var(--brand)" stroke-width="2.6" stroke-linecap="round"/></svg>';
