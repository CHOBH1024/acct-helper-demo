// 대시보드 D1~D8
const V = {}, ACT = {};
let F = { d6m: 10, card: '', evSel: '' };
const NOWM = 10;
const scopeName = () => S.scope === '전체' ? '협회 전체' : S.scope;

/* D1 오늘 현황 */
V.d1 = () => {
  const r26 = rows(2026), oct = r26.filter(r => r.date.slice(5, 7) === '10'), lastOct = rows(2025).filter(r => r.date.slice(5, 7) === '10' && +r.date.slice(8) <= 15);
  const miss = r26.filter(r => !r.receipt), myOwe = S.my.filter(x => x.stage < 5);
  const next = DEADLINES.filter(d => d[0] >= TODAY && d[2] !== 'g').sort()[0];
  const diff = sum(oct) - sum(lastOct);
  let h = '<div class="g4">' + kp('10월 지출(15일까지)', won(sum(oct)), '작년 같은 기간보다 ' + (diff >= 0 ? won(diff) + '원 많음' : won(-diff) + '원 적음'), 't', null, 'k-oct') +
    kp('영수증 안 낸 건', miss.length, won(sum(miss)) + '원 · 법인카드 대조에서 확인', miss.length ? 'r' : 'ok', '건', 'k-miss') +
    kp('가장 가까운 마감', next ? 'D-' + dday(next[0]) : '-', next ? next[1] + ' (' + next[0].slice(5) + ')' : '', 'w', '') +
    kp('내가 받을 돈', won(sum(myOwe)), myOwe.length + '건 진행 중', 'v') + '</div>';
  const todo = [];
  ADVANCES.filter(a => !a.done && a.due < TODAY && (S.scope === '전체' || a.dept === S.scope)).forEach(a => todo.push(['r', '정산 기한 지남', a.who + ' ' + a.type + ' ' + won(a.amt) + '원 · 기한 ' + a.due.slice(5), 'd7']));
  recurStatus().filter(x => x.st === 'late').forEach(x => todo.push(['r', '정기 지출 확인', x.name + ' ' + won(x.amt) + '원이 ' + x.due.slice(5) + '에 나갔어야 하는데 장부에 없음', 't7']));
  if (miss.length) todo.push(['w', '영수증 회수', '영수증 없는 지출 ' + miss.length + '건, ' + won(sum(miss)) + '원', 'd4']);
  const iss = findIssues().filter(i => i.kind !== '증빙 없음');
  if (iss.length) todo.push(['w', '점검 결과', '중복·한도·주말 사용 등 ' + iss.length + '건', 't5']);
  DEADLINES.filter(d => d[0] >= TODAY && dday(d[0]) <= 7 && d[2] !== 'g').forEach(d => todo.push(['i', 'D-' + dday(d[0]), d[1], 'd8']));
  S.my.filter(x => x.stage === 0).forEach(x => todo.push(['g', '내 청구 제출 전', x.what + ' ' + won(x.amt) + '원', 'me']));
  h += '<div class="g21"><div class="c"><h3>오늘 할 일 <span class="mut">' + todo.length + '건 · 누르면 해당 화면으로</span></h3><div class="list">' +
    (todo.length ? todo.map(t => '<a class="it" href="#' + t[3] + '" style="text-decoration:none;color:inherit"><span class="bd ' + t[0] + '">' + t[1] + '</span><span>' + esc(t[2]) + '</span></a>').join('') : '<div class="empty">오늘 할 일이 없습니다.</div>') + '</div></div>';
  const bs = budgets().map(b => budgetUse(b.dept, b.item)).sort((a, b) => b.rate - a.rate).slice(0, 6);
  h += '<div class="c"><h3>예산 빨리 쓰는 과목 <span class="mut">세로줄은 오늘 진도 ' + Math.round(ELAPSED * 100) + '%</span></h3>' + bs.map(u => '<div style="margin-bottom:9px"><div class="row" style="font-size:12.5px"><b>' + esc(u.item) + '</b><span class="mut">' + u.dept + '</span><span class="grow"></span><span class="n">' + Math.round(u.rate * 100) + '%</span></div>' + bar(u.rate, ELAPSED) + '</div>').join('') + '<a href="#d2" class="btn s">예산 집행 전체 보기</a></div></div>';
  const recent = r26.slice().sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || (a.date < b.date ? 1 : -1)).slice(0, 8);
  h += '<div class="c"><h3>최근 지출 <span class="mut">' + scopeName() + '</span></h3><div class="tw"><table class="tb"><thead><tr><th>날짜</th><th>국</th><th>가맹점</th><th>내용</th><th>결제</th><th>증빙</th><th class="n">금액</th></tr></thead><tbody>' +
    recent.map(r => '<tr class="' + (r.live ? 'new' : '') + '"><td class="nw mut">' + r.date.slice(5) + '</td><td class="nw">' + r.dept + '</td><td>' + esc(r.vendor) + (r.live ? ' <span class="bd ok">방금</span>' : '') + '</td><td>' + esc(r.purpose) + '</td><td class="nw">' + esc(r.pay) + '</td><td>' + (r.receipt ? '<span class="bd t">있음</span>' : '<span class="bd r">없음</span>') + '</td><td class="n"><b>' + won(r.amt) + '</b></td></tr>').join('') + '</tbody></table></div></div>';
  return h;
};

/* D2 예산 집행 */
V.d2 = () => {
  const bs = budgets().map(b => budgetUse(b.dept, b.item));
  const ann = sum(bs, u => u.annual), used = sum(bs, u => u.used), fc = sum(bs, u => u.fc);
  let h = '<div class="g4">' + kp('연 예산', won(ann), scopeName() + ' · 행사비 포함', '') + kp('집행', won(used), '집행률 ' + pct(used, ann) + '% · 진도 ' + Math.round(ELAPSED * 100) + '%', used / ann > ELAPSED + 0.05 ? 'w' : 't') +
    kp('연말 예상', won(fc), fc > ann ? '예산보다 ' + won(fc - ann) + '원 넘을 듯' : '예산 안쪽 ' + won(ann - fc) + '원', fc > ann ? 'r' : 'ok') + kp('주의 과목', bs.filter(u => u.st[0] !== 'ok').length, '초과·빠름·연말 초과 예상', 'w', '개') + '</div>';
  h += '<div class="c"><h3>누적 집행 <span class="mut">진한 선 실제 · 점선 지금 속도로 가면 · 빨간 점선 연 예산</span></h3>' + chartCumul(monthly(2026, r => budgets().some(b => b.dept === r.dept && b.item === r.item)), ann) + '</div>';
  const depts = S.scope === '전체' ? DEPTS : [S.scope];
  depts.forEach(d => {
    const list = bs.filter(u => u.dept === d);
    h += '<div class="c"><h3>' + d + ' <span class="mut">' + won(sum(list, u => u.used)) + ' / ' + won(sum(list, u => u.annual)) + '원</span></h3><div class="tw"><table class="tb"><thead><tr><th>예산과목</th><th class="n">연 예산</th><th class="n">집행</th><th style="width:28%">집행률</th><th class="n">연말 예상</th><th class="n">남은 돈</th><th>상태</th></tr></thead><tbody>' +
      list.map(u => '<tr><td>' + u.item + '</td><td class="n">' + won(u.annual) + '</td><td class="n">' + won(u.used) + '</td><td>' + bar(u.rate, ELAPSED) + '<span class="mut">' + (u.rate * 100).toFixed(1) + '%</span></td><td class="n">' + won(u.fc) + '</td><td class="n">' + won(u.left) + '</td><td><span class="bd ' + u.st[0] + '">' + u.st[1] + '</span></td></tr>').join('') + '</tbody></table></div></div>';
  });
  return h;
};

/* D3 행사 예결산 */
V.d3 = () => {
  const evs = EVENTS.filter(e => S.scope === '전체' || e.dept === S.scope);
  let h = '<div class="g4">' + kp('진행·예정 행사', evs.filter(e => !e.done).length, '완료 ' + evs.filter(e => e.done).length + '개', 't', '개') + kp('행사 예산', won(sum(evs, e => e.budget)), '', '') + kp('행사 지출', won(sum(evs, e => evSpent(e.id))), pct(sum(evs, e => evSpent(e.id)), sum(evs, e => e.budget)) + '% 집행', 'i') +
    kp('작년보다 1인당', (() => { const a = sum(evs, e => evSpent(e.id)), p = sum(evs, e => e.people); const b = sum(evs, e => PREV[e.prev].total), q = sum(evs, e => PREV[e.prev].people); return won(Math.round(a / p - b / q)); })(), '진행 중 행사는 아직 덜 씀', 'v') + '</div>';
  evs.forEach(e => {
    const sp = evSpent(e.id), pv = PREV[e.prev], rs = S.ledger.filter(r => r.event === e.id);
    const dd = dday(e.date);
    h += '<div class="c"><h3>' + esc(e.name) + ' <span class="bd ' + (e.done ? 'ok' : dd <= 14 ? 'w' : 'i') + '">' + (e.done ? '완료' : 'D-' + dd) + '</span><span class="mut">' + e.dept + ' · ' + e.date + ' · ' + e.people + '명</span></h3><div class="g2"><div>' +
      '<div class="row" style="margin-bottom:6px"><b style="font-size:20px">' + won(sp) + '</b><span class="mut">/ 예산 ' + won(e.budget) + '원 (' + pct(sp, e.budget) + '%)</span></div>' + bar(sp / e.budget, 0) +
      '<div class="tw" style="margin-top:10px"><table class="tb"><thead><tr><th>예산 항목</th><th class="n">예산</th><th class="n">지출</th><th class="n">남음</th></tr></thead><tbody>' +
      e.plan.map(([w, p]) => { const a = sum(rs.filter(r => r.plan === w)); return '<tr><td>' + w + '</td><td class="n">' + won(p) + '</td><td class="n">' + won(a) + '</td><td class="n" style="color:' + (a > p ? 'var(--bad)' : 'inherit') + '">' + won(p - a) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div><div class="out"><div class="mut">1인당 비용</div><div class="row"><b style="font-size:20px">' + won(Math.round(sp / e.people)) + '원</b><span class="mut">지금까지</span></div><div class="mut" style="margin-top:4px">작년 ' + esc(pv.name) + ': ' + won(pv.total) + '원 · ' + pv.people + '명 · 1인당 ' + won(Math.round(pv.total / pv.people)) + '원</div>' +
      '<div class="mut">예산 기준 1인당 ' + won(Math.round(e.budget / e.people)) + '원 (작년 대비 ' + (Math.round((e.budget / e.people) / (pv.total / pv.people) * 100) - 100) + '%)</div></div>' +
      '<div class="row" style="margin-top:10px"><a class="btn s" href="#t3" data-a="formEv" data-id="' + e.id + '">예결산안 만들기</a><a class="btn s" href="#t6" data-a="findEv" data-q="' + esc(e.name.split(' ')[0]) + '">작년 지출 내역</a></div></div></div></div>';
  });
  return h;
};
ACT.formEv = d => { F.form = 'ev'; F.evSel = d.id; location.hash = '#t3'; };
ACT.findEv = d => { F.q = d.q; F.qy = 'all'; location.hash = '#t6'; };

/* D4 법인카드 */
V.d4 = () => {
  const cards = CARDS.filter(c => S.scope === '전체' || c.dept === S.scope);
  const octR = c => rows(2026).filter(r => cardOf(r) === c.no && r.date.slice(5, 7) === '10');
  const allMiss = rows(2026).filter(r => r.pay.startsWith('카드') && !r.receipt);
  const tot = sum(cards, c => sum(octR(c)));
  const octAll = cards.flatMap(octR);
  let h = '<div class="g4">' + kp('10월 카드 사용', won(tot), octAll.length + '건 · ' + cards.length + '장', 't') + kp('영수증 회수율', pct(octAll.filter(r => r.receipt).length, octAll.length), '10월 사용분 기준', pct(octAll.filter(r => r.receipt).length, octAll.length) < 85 ? 'w' : 'ok', '%') +
    kp('영수증 안 낸 건', allMiss.length, won(sum(allMiss)) + '원', allMiss.length ? 'r' : 'ok', '건') + kp('결제일', 'D-' + dday('2026-10-30'), '10/30 법인카드 결제', 'i', '') + '</div>';
  h += '<div class="c"><h3>카드별 <span class="mut">10월 1~15일</span></h3><div class="tw"><table class="tb"><thead><tr><th>카드</th><th>쓰는 사람</th><th class="n">사용액</th><th class="n">건수</th><th style="width:22%">영수증 회수</th><th class="n">못 받은 영수증</th><th></th></tr></thead><tbody>' +
    cards.map(c => { const rs = octR(c), m = rs.filter(r => !r.receipt), rate = rs.length ? (rs.length - m.length) / rs.length : 1; return '<tr><td><b>#' + c.no + '</b> <span class="mut">' + c.name + '</span></td><td>' + c.holder + '</td><td class="n">' + won(sum(rs)) + '</td><td class="n">' + rs.length + '</td><td>' + bar(rate, 0) + '<span class="mut">' + Math.round(rate * 100) + '%</span></td><td class="n">' + (m.length ? '<span class="bd r">' + m.length + '건 ' + won(sum(m)) + '원</span>' : '<span class="bd ok">없음</span>') + '</td><td>' + (m.length ? '<button class="btn s" data-a="ask" data-no="' + c.no + '">회수 요청 문구</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  h += '<div class="c"><h3>영수증 안 낸 지출 <span class="mut">' + allMiss.length + '건 · 오래된 순</span></h3><div class="tw"><table class="tb"><thead><tr><th>날짜</th><th>카드</th><th>쓴 사람</th><th>가맹점</th><th>내용</th><th class="n">금액</th><th class="n">지난 날</th></tr></thead><tbody>' +
    allMiss.sort((a, b) => a.date < b.date ? -1 : 1).map(r => '<tr><td class="nw mut">' + r.date.slice(5) + '</td><td>#' + cardOf(r) + '</td><td>' + r.who + '</td><td>' + esc(r.vendor) + '</td><td>' + esc(r.purpose) + '</td><td class="n">' + won(r.amt) + '</td><td class="n">' + (-dday(r.date) > 14 ? '<span class="bd r">' + -dday(r.date) + '일</span>' : -dday(r.date) + '일') + '</td></tr>').join('') + '</tbody></table></div></div>';
  return h;
};
ACT.ask = d => {
  const c = CARDS.find(x => x.no === d.no), m = rows(2026).filter(r => cardOf(r) === c.no && !r.receipt);
  const txt = c.holder + '님, 법인카드 #' + c.no + '(' + c.name + ') 사용분 중 영수증이 아직 안 들어온 건이 ' + m.length + '건 있습니다.\n' + m.map(r => '- ' + r.date.slice(5).replace('-', '/') + ' ' + r.vendor + ' ' + won(r.amt) + '원').join('\n') + '\n10/16(금)까지 영수증 사진이나 스캔본을 올려 주세요. 영수증이 없으면 대체 사유서를 함께 내 주시면 됩니다. 총무국 김정래 드림';
  modal('<h2>회수 요청 문구</h2><p class="mut">메신저나 메일에 붙여 넣으세요.</p><textarea id="askTxt" rows="9" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:8px">' + esc(txt) + '</textarea><div class="row end" style="margin-top:10px"><button class="btn" data-a="close">닫기</button><button class="btn p" data-a="copy" data-t="askTxt">복사</button></div>');
};
ACT.copy = d => { const t = $('#' + d.t); t.select(); try { navigator.clipboard.writeText(t.value).then(() => toast('복사했습니다.'), () => { document.execCommand('copy'); toast('복사했습니다.'); }); } catch (e) { document.execCommand('copy'); toast('복사했습니다.'); } };

/* D5 내가 받을 돈 */
const STAGES = ['작성', '결재', '총무 확인', '재정 확인', '지급 예정', '받음'];
V.me = () => {
  const my = S.my, owe = my.filter(x => x.stage < 5), sch = my.filter(x => x.stage === 4), got = my.filter(x => x.stage === 5 && (x.paid || '').slice(0, 7) === '2026-10');
  let h = '<div class="g4">' + kp('아직 받지 않은 돈', won(sum(owe)), owe.length + '건', 't') + kp('지급 예정', won(sum(sch)), sch.length ? '10/25 정기 지급' : '없음', 'v') + kp('이번 달 받은 돈', won(sum(got)), got.length + '건', 'ok') + kp('제출 전', won(sum(my.filter(x => !x.stage))), '아스키오에 올려야 받습니다', 'w') + '</div>';
  h += '<div class="note t">진행 단계는 아스키오 결재 상태를 읽어 와 자동으로 바뀝니다. 데모에서는 「다음 단계(시연)」로 흉내 냅니다.</div>';
  h += '<div class="c"><h3>내 청구·정산 <span class="mut">김정래 · 총무국</span><span class="grow"></span><a class="btn s p" href="#calc">청구 계산기</a></h3><div class="tw"><table class="tb"><thead><tr><th>날짜</th><th>내용</th><th>종류</th><th style="width:34%">진행</th><th>받는 날</th><th class="n">금액</th><th></th></tr></thead><tbody>' +
    my.slice().sort((a, b) => a.stage - b.stage || (a.date < b.date ? 1 : -1)).map(x => '<tr><td class="nw mut">' + x.date.slice(5) + '</td><td>' + esc(x.what) + '</td><td class="nw">' + x.kind + '</td><td><div class="stage">' + STAGES.map((s, i) => '<span class="' + (i < x.stage || x.stage === 5 ? 'd' : i === x.stage ? 'c' : '') + '" title="' + s + '"></span>').join('') + '</div><div class="stl"><span>' + STAGES[x.stage] + (x.stage < 5 ? ' 단계' : '') + '</span><span>' + (x.stage + 1) + '/6</span></div></td>' +
      '<td class="nw">' + (x.stage === 5 ? '<span class="bd ok">' + (x.paid || '').slice(5) + ' 받음</span>' : x.stage === 4 ? '<span class="bd v">10/25</span>' : x.stage === 0 ? '<span class="bd g">제출 전</span>' : '<span class="mut">확인 끝나면 25일</span>') + '</td><td class="n"><b>' + won(x.amt) + '</b></td><td>' + (x.stage < 5 ? '<button class="btn s" data-a="adv" data-id="' + x.id + '">다음 단계(시연)</button>' : '') + '</td></tr>').join('') + '</tbody></table></div></div>';
  return h;
};
ACT.adv = d => { const x = S.my.find(m => m.id === d.id); x.stage++; if (x.stage === 5) x.paid = TODAY; save(); render(); toast(x.what + ': ' + STAGES[x.stage] + (x.stage === 5 ? '. 입금됐습니다.' : ' 단계로 넘어갔습니다.')); };

/* D6 지출 추이 */
V.d6 = () => {
  const a = monthly(2026), b = monthly(2025), m = F.d6m;
  const ytdA = sum(a.slice(0, NOWM)), ytdB = sum(b.slice(0, 9)) + b[9] * 15 / 31;
  let h = '<div class="g4">' + kp('올해 누적', won(ytdA), '1월~10/15', 't') + kp('작년 같은 기간', won(Math.round(ytdB)), '', '') + kp('증감', (ytdA >= ytdB ? '+' : '') + pct(ytdA - ytdB, ytdB), (ytdA >= ytdB ? won(ytdA - ytdB) + '원 늘어남' : won(ytdB - ytdA) + '원 줄어듦'), ytdA > ytdB * 1.05 ? 'w' : 'ok', '%') + kp('월평균(1~9월)', won(Math.round(sum(a.slice(0, 9)) / 9)), '', 'i') + '</div>';
  h += '<div class="c"><h3>월별 지출 <span class="mut">' + scopeName() + '</span><span class="grow"></span><span class="leg"><span><i style="background:#0e6b5f"></i>2026 (10월은 15일까지)</span><span><i style="background:#e0a020"></i>2025</span></span></h3>' + chartMonthly(a, b, { upto: NOWM }) + '</div>';
  const items = Array.from(new Set(rows().map(r => r.item)));
  const by = (y, mm) => { const o = {}; S.ledger.forEach(r => { if (inScope(r) && r.date.slice(0, 4) === String(y) && +r.date.slice(5, 7) === mm) o[r.item] = (o[r.item] || 0) + r.amt; }); return o; };
  const A = by(2026, m), B = by(2025, m);
  h += '<div class="c"><h3>과목별 비교 <span class="mut">' + m + '월 · 2026 vs 2025</span><span class="grow"></span><select class="sel" id="d6m">' + Array.from({ length: NOWM }, (_, i) => '<option value="' + (i + 1) + '"' + (i + 1 === m ? ' selected' : '') + '>' + (i + 1) + '월</option>').join('') + '</select></h3><div class="tw"><table class="tb"><thead><tr><th>예산과목</th><th class="n">2026</th><th class="n">2025</th><th class="n">증감</th><th style="width:30%"></th></tr></thead><tbody>' +
    items.map(it => [it, A[it] || 0, B[it] || 0]).sort((x, y) => y[1] - x[1]).map(([it, x, y]) => { const mx = Math.max(...Object.values(A), ...Object.values(B), 1); return '<tr><td>' + it + '</td><td class="n">' + won(x) + '</td><td class="n mut">' + won(y) + '</td><td class="n" style="color:' + (x > y * 1.2 && y ? 'var(--bad)' : 'inherit') + '">' + (y ? (x >= y ? '+' : '') + pct(x - y, y) + '%' : '-') + '</td><td><div class="bar" style="height:7px"><i style="width:' + (x / mx * 100) + '%"></i></div><div class="bar" style="height:5px;margin-top:2px"><i style="width:' + (y / mx * 100) + '%;background:#e0a020"></i></div></td></tr>'; }).join('') + '</tbody></table></div>' + (m === NOWM ? '<div class="mut" style="margin-top:6px">10월은 15일까지라 작년보다 적게 보입니다.</div>' : '') + '</div>';
  return h;
};
document.addEventListener('change', e => { if (e.target.id === 'd6m') { F.d6m = +e.target.value; render(); } });

/* D7 가지급·선급 */
V.d7 = () => {
  const list = ADVANCES.filter(a => S.scope === '전체' || a.dept === S.scope), open = list.filter(a => !a.done);
  let h = '<div class="g4">' + kp('정산 안 된 가지급', won(sum(open.filter(a => a.type === '가지급'))), open.filter(a => a.type === '가지급').length + '건', 'w') + kp('정산 안 된 선급', won(sum(open.filter(a => a.type === '선급'))), open.filter(a => a.type === '선급').length + '건', 'v') +
    kp('기한 지남', open.filter(a => a.due < TODAY).length, won(sum(open.filter(a => a.due < TODAY))) + '원', open.some(a => a.due < TODAY) ? 'r' : 'ok', '건') + kp('7일 안에 기한', open.filter(a => a.due >= TODAY && dday(a.due) <= 7).length, '', 'i', '건') + '</div>';
  h += '<div class="c"><h3>가지급·선급 대장</h3><div class="tw"><table class="tb"><thead><tr><th>구분</th><th>받은 사람·업체</th><th>국</th><th>내준 날</th><th>내용</th><th class="n">금액</th><th class="n">쓴 돈</th><th class="n">남은 돈</th><th>정산 기한</th></tr></thead><tbody>' +
    list.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (a.due < b.due ? -1 : 1)).map(a => '<tr><td><span class="bd ' + (a.type === '가지급' ? 'w' : 'v') + '">' + a.type + '</span></td><td>' + a.who + '</td><td>' + a.dept + '</td><td class="nw mut">' + a.date.slice(5) + '</td><td>' + esc(a.what) + '</td><td class="n">' + won(a.amt) + '</td><td class="n">' + won(a.used) + '</td><td class="n">' + won(a.amt - a.used) + '</td><td class="nw">' +
      (a.done ? '<span class="bd ok">정산 끝</span>' : a.due < TODAY ? '<span class="bd r">' + -dday(a.due) + '일 지남</span>' : '<span class="bd ' + (dday(a.due) <= 7 ? 'w' : 'g') + '">D-' + dday(a.due) + '</span>') + '</td></tr>').join('') + '</tbody></table></div></div>';
  return h;
};

/* D8 마감 달력 */
function calItems() {
  const out = DEADLINES.map(([d, t, c]) => ({ d, t, c }));
  EVENTS.forEach(e => out.push({ d: e.date, t: e.name, c: 'v' }));
  RECUR.forEach(r => out.push({ d: '2026-10-' + String(Math.min(r.day, 28)).padStart(2, '0'), t: r.name, c: 'g' }));
  ADVANCES.filter(a => !a.done).forEach(a => out.push({ d: a.due, t: a.who + ' ' + a.type + ' 정산', c: 'w' }));
  return out;
}
V.d8 = () => {
  const it = calItems();
  let h = '<div class="g21"><div class="c"><h3>2026년 10월</h3><div class="cal">' + '일월화수목금토'.split('').map(d => '<div class="h">' + d + '</div>').join('');
  for (let i = 0; i < 4; i++) h += '<div class="d e"></div>';
  for (let d = 1; d <= 31; d++) {
    const ds = '2026-10-' + String(d).padStart(2, '0');
    h += '<div class="d' + (ds === TODAY ? ' today' : ds < TODAY ? ' past' : '') + '"><b>' + d + '</b>' + it.filter(x => x.d === ds).map(x => '<i class="bd ' + x.c + '" title="' + esc(x.t) + '">' + esc(x.t) + '</i>').join('') + '</div>';
  }
  h += '</div><div class="leg" style="margin-top:8px"><span><i style="background:var(--bad)"></i>결산·대사</span><span><i style="background:#e0a020"></i>제출·정산 기한</span><span><i style="background:var(--info)"></i>카드</span><span><i style="background:var(--ok)"></i>지급</span><span><i style="background:var(--vio)"></i>행사</span><span><i style="background:#cfd8d6"></i>정기 지출·휴일</span></div></div>';
  const up = it.filter(x => x.d >= TODAY && x.c !== 'g').sort((a, b) => a.d < b.d ? -1 : 1).slice(0, 12);
  h += '<div class="c"><h3>다가오는 일정</h3><div class="list">' + up.map(x => '<div class="it"><span class="dd bd ' + x.c + '">D-' + dday(x.d) + '</span><span>' + esc(x.t) + '</span><span class="grow"></span><span class="mut">' + x.d.slice(5) + '</span></div>').join('') + '</div><div class="mut" style="margin-top:8px">마감 3일 전과 당일에 담당자에게 알림을 보냅니다(실제 버전).</div></div></div>';
  return h;
};
