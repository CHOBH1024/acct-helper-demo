// T3 서식 작성
// 기준: 재정팀 공식 결산안(2026-09-25 추석 참배식 v2) 「예산 및 결산 보고서」「예산상세」「결산 상세내역」「지출결의서(법인·개인·세금계산서)」
// 칸 이름·순서·병합·합계 줄 이름(「소계 (#xxxx)」「총  합  계」「합  계」「총 합계액」)을 그대로 따른다.
const ymd = d => d.slice(5, 7) + '-' + d.slice(8, 10) + '-' + d.slice(2, 4); // 엑셀 표시형식 mm-dd-yy
const am = v => v ? won(v) : '-';                                             // 0은 「-」
const SUBACC = { '복리후생비': '복리후생비(기타)', '여비교통비': '여비교통비(단기)', '소모품비': '소모품비', '지급수수료(기타)': '지급수수료(기타)', '기타': '기타', '예비비': '예비비', '잡급': '잡급' };
const cardInfo = r => CARDS.find(c => c.no === cardOf(r)) || { no: cardOf(r), mno: 'M' + cardOf(r), dept: r.dept, vcode: '' };
const KIND = { C: r => r.pay.startsWith('카드'), P: r => r.pay === '개인 정산', T: r => r.pay === '계좌이체' };
const GCOLS = c => '<colgroup><col style="width:6%"><col style="width:15%"><col style="width:9%"><col style="width:' + (c ? 36 : 27) + '%"><col style="width:' + (c ? 14 : 18) + '%"><col style="width:10%"><col style="width:10%"></colgroup>';
function remitBy(rows, key) { const g = {}; rows.forEach(r => (g[key(r)] = g[key(r)] || []).push(r)); return Object.entries(g); }

// 지출결의서 한 장 (법인 C / 개인 P / 세금계산서 T)
function gyeolDoc(title, rows, kind, acc) {
  let h = '<div class="doc"><div class="t1">' + esc(title) + '</div><div class="sec">1.전체내역<small>단위:원</small></div><table>' + GCOLS(kind === 'C') +
    '<thead><tr><th>순</th><th>계정과목</th><th>지출일자</th><th>적요</th><th>가맹점명</th><th>지출액</th><th>' + (kind === 'T' ? '비고' : '지출자') + '</th></tr></thead><tbody>';
  const line = (r, n) => '<tr><td class="c">' + n + '</td><td class="c">' + esc(acc(r)) + '</td><td class="c">' + ymd(r.date) + '</td><td class="l">' + esc(r.purpose) + '</td><td class="l">' + esc(r.vendor) + '</td><td class="r">' + am(r.amt) + '</td><td class="c">' + esc(kind === 'C' ? '#' + cardOf(r) : kind === 'T' ? '전자계산서' : r.who) + '</td></tr>';
  if (!rows.length) h += '<tr><td colspan="7" class="c">해당 지출이 없어요</td></tr>';
  else if (kind === 'C') {
    remitBy(rows, r => cardOf(r)).forEach(([no, l]) => { h += l.map((r, i) => line(r, i + 1)).join('') + '<tr class="sub"><td class="c" colspan="5">소계 (#' + no + ')</td><td class="r">' + am(sum(l)) + '</td><td></td></tr>'; });
    h += '<tr class="grand"><td class="c" colspan="5">총  합  계</td><td class="r">' + am(sum(rows)) + '</td><td></td></tr>';
  } else h += rows.map((r, i) => line(r, i + 1)).join('') + '<tr class="tot"><td class="c" colspan="5">합  계</td><td class="r">' + am(sum(rows)) + '</td><td></td></tr>';
  h += '</tbody></table>';
  if (kind === 'C') {
    const g = {}; rows.forEach(r => { const k = acc(r) + '|' + cardOf(r) + '|' + (+r.date.slice(5, 7)); g[k] = (g[k] || 0) + r.amt; });
    h += '<div class="sec">2.계정과목·카드별 합산액</div><table><thead><tr><th style="width:6%">순</th><th>계정과목</th><th>카드번호</th><th>비고</th><th>지출액</th></tr></thead><tbody>' +
      Object.entries(g).map(([k, v], i) => { const [a, c, m] = k.split('|'); return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + esc(a) + '</td><td class="c">#' + c + '</td><td class="c">' + m + '월</td><td class="r">' + am(v) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td class="c" colspan="4">합  계</td><td class="r">' + am(sum(rows)) + '</td></tr></tbody></table>';
  } else {
    const g = {}; rows.forEach(r => g[acc(r)] = (g[acc(r)] || 0) + r.amt);
    h += '<div class="sec">2.계정별 합산액</div><table><thead><tr><th style="width:6%">순</th><th>계정과목</th><th>지출액</th><th>비고</th></tr></thead><tbody>' +
      Object.entries(g).map(([k, v], i) => '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + esc(k) + '</td><td class="r">' + am(v) + '</td><td></td></tr>').join('') +
      '<tr class="tot"><td class="c" colspan="2">합  계</td><td class="r">' + am(sum(rows)) + '</td><td></td></tr></tbody></table>';
    const rm = remitBy(rows, r => kind === 'T' ? r.vendor : r.who);
    h += '<div class="sec">3.송금 요청액</div><table><thead><tr><th style="width:6%">순</th><th>은행명</th><th colspan="2">송금계좌</th><th>거래처/예금주</th><th>금액</th></tr></thead><tbody>' +
      rm.map(([w, l], i) => { const [b, n] = fakeAcc(w); return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + b + '</td><td class="c" colspan="2">' + n + '</td><td class="c">' + esc(w) + '</td><td class="r">' + am(sum(l)) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td class="c" colspan="5">합  계</td><td class="r">' + am(sum(rows)) + '</td></tr></tbody></table>';
  }
  return h + '</div>';
}
// 결산 상세내역 한 장 (행사, 지출수단별)
function usageDoc(e, rows, kind) {
  const evid = { C: '신용카드매출전표', P: '영수증', T: '전자계산서' }[kind];
  let h = '<div class="doc"><div class="t1" style="font-size:17pt">결산 상세내역</div><div class="row" style="font-weight:700;font-size:12pt">행사명 : ' + esc(e.name) + '<span class="grow"></span><span style="font-weight:400;font-size:10pt">* 부서명 : ' + e.dept + (kind !== 'T' ? '<br>(VAT포함)' : '') + '</span></div>' +
    '<table style="margin-top:6px"><thead><tr><th style="width:6%">순</th><th>분류</th><th>일자</th><th>적요</th><th>금액</th><th>증빙</th><th>비고</th></tr></thead><tbody>' +
    (rows.length ? rows.map((r, i) => '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + esc(r.sub) + '</td><td class="c">' + ymd(r.date) + '</td><td class="l">' + esc(r.purpose) + '</td><td class="r">' + am(r.amt) + '</td><td class="c">' + evid + '</td><td class="c">' + esc(kind === 'C' ? cardInfo(r).mno : kind === 'P' ? r.who : r.vendor) + '</td></tr>').join('') : '<tr><td colspan="7" class="c">해당 지출이 없어요</td></tr>') +
    '<tr class="tot"><td class="c" colspan="4">합계</td><td class="r">' + am(sum(rows)) + '</td><td></td><td></td></tr></tbody></table>';
  const subs = Array.from(new Set(rows.map(r => r.sub)));
  h += '<div class="sec">■ 계정별 집행액</div><table><thead><tr><th rowspan="2" style="width:6%">순</th><th colspan="2">분    류</th><th rowspan="2">적     요</th><th colspan="2">예산액</th><th rowspan="2">증감액</th></tr><tr><th>대분류</th><th>소분류</th><th>배정액</th><th>집행액</th></tr></thead><tbody>' +
    subs.map((sb, i) => { const pl = e.plan.filter(p => p[2] === sb), bud = sum(pl, p => p[1]), ex = sum(rows.filter(r => r.sub === sb)); return '<tr><td class="c">' + (i + 1) + '</td><td class="c">진행비</td><td class="c">' + esc(sb) + '</td><td class="l">' + esc(pl.map(p => p[0]).join(', ')) + '</td><td class="r">' + am(bud) + '</td><td class="r">' + am(ex) + '</td><td class="r">' + (ex - bud ? won(ex - bud) : '-') + '</td></tr>'; }).join('') +
    (() => { const bud = sum(subs.map(sb => sum(e.plan.filter(p => p[2] === sb), p => p[1])), x => x); return '<tr class="tot"><td class="c" colspan="4">합계</td><td class="r">' + am(bud) + '</td><td class="r">' + am(sum(rows)) + '</td><td class="r">' + won(sum(rows) - bud) + '</td></tr>'; })() + '</tbody></table>';
  if (kind === 'C') {
    const g = remitBy(rows, r => cardInfo(r).mno + '|' + (+r.date.slice(5, 7)));
    h += '<div class="sec">■ 예산운영 결산분류</div><table><thead><tr><th>지출 분류</th><th>집행금액</th></tr></thead><tbody>' + g.map(([k, l]) => { const [m, mon] = k.split('|'); return '<tr><td class="c">법인카드(' + mon + '월 ' + m + ')</td><td class="r">' + am(sum(l)) + '</td></tr>'; }).join('') + '<tr class="tot"><td class="c">총 합계액</td><td class="r">' + am(sum(rows)) + '</td></tr></tbody></table>';
  } else {
    const rm = remitBy(rows, r => kind === 'T' ? r.vendor : r.who);
    h += '<div class="sec">■ 송금요청액</div><table><thead><tr><th style="width:6%">순</th><th>예금주</th><th>은행</th><th>계좌번호</th><th>금액</th></tr></thead><tbody>' + rm.map(([w, l], i) => { const [b, n] = fakeAcc(w); return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + esc(w) + '</td><td class="c">' + b + '</td><td class="c">' + n + '</td><td class="r">' + am(sum(l)) + '</td></tr>'; }).join('') + '<tr class="tot"><td class="c" colspan="4">합계</td><td class="r">' + am(sum(rows)) + '</td></tr></tbody></table>';
  }
  return h + '</div>';
}
function cardTitle(rows) { const cs = Array.from(new Set(rows.map(r => cardOf(r)))); return cs.length ? ' (' + cardInfo({ pay: '#' + cs[0], dept: '' }).mno + cs.slice(1).map(c => ', #' + c).join('') + ')' : ''; }
// 예산 및 결산 보고서
function reportDoc(e) {
  const rs = S.ledger.filter(r => r.event === e.id), sp = sum(rs);
  const C = rs.filter(KIND.C), T = rs.filter(KIND.T), P = rs.filter(KIND.P);
  const dt = new Date(e.date + 'T00:00:00');
  let h = '<div class="doc"><div class="t2">' + e.dept + ' 예결산 보고서</div>' +
    '<table class="kv"><tbody><tr><th rowspan="4" style="width:60px">행  사<br>개  요</th><th>행사명</th><td class="v">' + esc(e.name) + '</td></tr><tr><th>주최기관</th><td class="v">세계평화통일가정연합</td></tr><tr><th>일    시</th><td class="v">' + dt.getFullYear() + '년 ' + (dt.getMonth() + 1) + '월 ' + dt.getDate() + '일</td></tr><tr><th>장    소</th><td class="v">' + esc(e.place || '') + '</td></tr></tbody></table>' +
    '<div class="sec">■ 총 집행액</div><table><thead><tr><th style="width:30%">집행금액</th><th>산 출 근 거</th></tr></thead><tbody><tr><td class="r">' + am(sp) + '</td><td class="l">법인카드 ' + won(sum(C)) + ' + 세금계산서 ' + won(sum(T)) + ' + 개인지출 ' + won(sum(P)) + ' + 선급금 0</td></tr></tbody></table>' +
    '<div class="sec">■ 예산운영 결산내역</div><table><thead><tr><th colspan="2">분    류</th><th rowspan="2">적     요</th><th colspan="2">예산액</th><th rowspan="2">증감액</th></tr><tr><th>대분류</th><th>소분류</th><th>배정액</th><th>집행액</th></tr></thead><tbody>' +
    e.plan.map(p => { const a = sum(rs.filter(r => r.plan === p[0])); return '<tr><td class="c">진행비</td><td class="c">' + esc(p[2]) + '</td><td class="l">' + esc(p[0]) + '</td><td class="r">' + am(p[1]) + '</td><td class="r">' + am(a) + '</td><td class="r">' + (a - p[1] ? won(a - p[1]) : '-') + '</td></tr>'; }).join('') +
    '<tr class="tot"><td class="c" colspan="3">합    계</td><td class="r">' + am(e.budget) + '</td><td class="r">' + am(sp) + '</td><td class="r">' + won(sp - e.budget) + '</td></tr></tbody></table><div class="foot">* 직원 교통비 및 식대는 부서 경상비로 대체</div>' +
    '<div class="sec">■ 예산운영 결산분류</div><table><thead><tr><th>지출 분류</th><th>집행금액</th></tr></thead><tbody>' +
    remitBy(C, r => cardInfo(r).mno + '|' + (+r.date.slice(5, 7))).map(([k, l]) => { const [m, mon] = k.split('|'); return '<tr><td class="c">법인카드(' + m + ') ' + mon + '월</td><td class="r">' + am(sum(l)) + '</td></tr>'; }).join('') +
    '<tr><td class="c">세금계산서</td><td class="r">' + am(sum(T)) + '</td></tr><tr><td class="c">개인지출</td><td class="r">' + am(sum(P)) + '</td></tr><tr class="grand"><td class="c">총 합계액</td><td class="r">' + am(sp) + '</td></tr></tbody></table>';
  const rm = remitBy(T, r => r.vendor).concat(remitBy(P, r => r.who));
  h += '<div class="sec">■ 송금요청액</div><table><thead><tr><th style="width:6%">순</th><th>은행</th><th>계좌번호</th><th>예금주</th><th>금액</th></tr></thead><tbody>' + rm.map(([w, l], i) => { const [b, n] = fakeAcc(w); return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + b + '</td><td class="c">' + n + '</td><td class="c">' + esc(w) + '</td><td class="r">' + am(sum(l)) + '</td></tr>'; }).join('') +
    '<tr class="tot"><td class="c" colspan="4">총 합계액</td><td class="r">' + am(sum(T) + sum(P)) + '</td></tr></tbody></table></div>';
  return h;
}
function planDoc(e) {
  return '<div class="doc"><div class="t1">예산상세</div><div style="font-weight:700;margin-bottom:6px">행사명 : ' + esc(e.name) + '</div><table><thead><tr><th style="width:6%">순</th><th>대분류</th><th>소분류</th><th>단가</th><th>인원</th><th>횟수</th><th>금액</th><th>비고(산출내역)</th></tr></thead><tbody>' +
    e.plan.map((p, i) => '<tr><td class="c">' + (i + 1) + '</td><td class="c">진행비</td><td class="c">' + esc(p[2]) + '</td><td class="r">' + am(p[3]) + '</td><td class="c">' + p[4] + '</td><td class="c">' + p[5] + '</td><td class="r">' + am(p[3] * p[4] * p[5]) + '</td><td class="l">' + esc(p[0] + ' · ' + p[6]) + '</td></tr>').join('') +
    '<tr class="tot"><td class="c" colspan="6">합계</td><td class="r">' + am(sum(e.plan, p => p[3] * p[4] * p[5])) + '</td><td></td></tr></tbody></table></div>';
}
const EVSHEETS = [['rep', '예산 및 결산 보고서'], ['plan', '예산상세'], ['usT', '사용상세내역(세금계산서)'], ['gyT', '지출결의서(세금계산서)'], ['usC', '사용상세내역(법인)'], ['gyC', '지출결의서(법인)'], ['usP', '사용상세내역(개인)'], ['gyP', '지출결의서(개인)']];

V.t3 = () => {
  const f = F.form || 'gyeol', dept = F.fd || (S.scope === '전체' ? '총무국' : S.scope), mm = F.fm || 9, pk = F.pk || 'P';
  const ym = '2026-' + String(mm).padStart(2, '0');
  let h = '<div class="tabs noprint">' + FORMS.map(([k, n]) => '<button class="' + (k === f ? 'on' : '') + '" data-a="form" data-k="' + k + '">' + n + '</button>').join('') + '</div>';
  const tools = '<span class="grow"></span><button class="btn" onclick="window.print()">인쇄</button><button class="btn" data-a="formCsv">엑셀용 CSV</button>';
  const deptSel = '<select class="sel" id="fd">' + DEPTS.map(d => '<option' + (d === dept ? ' selected' : '') + '>' + d + '</option>').join('') + '</select><select class="sel" id="fm">' + Array.from({ length: 10 }, (_, i) => '<option value="' + (i + 1) + '"' + (i + 1 === mm ? ' selected' : '') + '>2026년 ' + (i + 1) + '월</option>').join('') + '</select>';
  const note = '<div class="mut" style="margin-top:6px">재정팀 공식 결산안의 칸 이름·순서·합계 줄을 그대로 따랐어요. 계좌번호와 카드 M번호는 데모용이에요.</div>';
  if (f === 'gyeol') {
    const rs = S.ledger.filter(r => r.dept === dept && r.date.slice(0, 7) === ym && !r.event && KIND[pk](r)).sort((a, b) => pk === 'C' ? (cardOf(a) < cardOf(b) ? -1 : cardOf(a) > cardOf(b) ? 1 : a.date < b.date ? -1 : 1) : a.date < b.date ? -1 : 1);
    const nm = { C: '법인카드 정산', P: '개인정산', T: '전자(세금)계산서' }[pk];
    F.csv = [['순', '계정과목', '지출일자', '적요', '가맹점명', '지출액', pk === 'T' ? '비고' : '지출자']].concat(rs.map((r, i) => [i + 1, r.item, ymd(r.date), r.purpose, r.vendor, r.amt, pk === 'C' ? '#' + cardOf(r) : pk === 'T' ? '전자계산서' : r.who]));
    h += '<div class="c noprint"><div class="row">' + deptSel + '<select class="sel" id="fpk"><option value="P"' + (pk === 'P' ? ' selected' : '') + '>개인정산</option><option value="C"' + (pk === 'C' ? ' selected' : '') + '>법인카드</option><option value="T"' + (pk === 'T' ? ' selected' : '') + '>전자(세금)계산서</option></select>' + tools + '</div>' + note + '</div>' +
      gyeolDoc('지출결의서_(' + dept + ') 2026년 ' + mm + '월 _ ' + nm + (pk === 'C' ? cardTitle(rs) : ''), rs, pk, r => r.item);
  } else if (f === 'song') {
    const rs = S.ledger.filter(r => r.dept === dept && r.pay === '개인 정산' && r.date.slice(0, 7) === ym);
    const rm = remitBy(rs, r => r.who);
    F.csv = [['순', '은행', '계좌번호', '예금주', '금액']].concat(rm.map(([w, l], i) => { const [b, n] = fakeAcc(w); return [i + 1, b, n, w, sum(l)]; }));
    h += '<div class="c noprint"><div class="row">' + deptSel + tools + '</div>' + note + '</div><div class="doc"><div class="t1">송금요청서_(' + dept + ') 2026년 ' + mm + '월 개인정산</div><div class="sign"><span>담당</span><span>국장</span><span>재정</span></div>' +
      '<div class="sec">■ 송금요청액<small>지급 예정일 2026-' + String(Math.min(mm + 1, 12)).padStart(2, '0') + '-25</small></div><table><thead><tr><th style="width:6%">순</th><th>은행</th><th>계좌번호</th><th>예금주</th><th>금액</th></tr></thead><tbody>' +
      (rm.length ? rm.map(([w, l], i) => { const [b, n] = fakeAcc(w); return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + b + '</td><td class="c">' + n + '</td><td class="c">' + esc(w) + '</td><td class="r">' + am(sum(l)) + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="c">이 달 개인정산이 없어요</td></tr>') +
      '<tr class="tot"><td class="c" colspan="4">총 합계액</td><td class="r">' + am(sum(rs)) + '</td></tr></tbody></table></div>';
  } else if (f === 'ev') {
    const e = EVENTS.find(x => x.id === F.evSel) || EVENTS[0], sh = F.evSh || 'rep';
    const rs = S.ledger.filter(r => r.event === e.id).map(r => Object.assign({}, r, { sub: r.sub || (e.plan.find(p => p[0] === r.plan) || [])[2] || '기타' }));
    const by = k => rs.filter(KIND[k]).sort((a, b) => k === 'C' ? (cardOf(a) < cardOf(b) ? -1 : 1) : a.date < b.date ? -1 : 1);
    const nm = { C: '법인카드 정산', P: '개인정산', T: '전자(세금)계산서' };
    let doc;
    if (sh === 'rep') doc = reportDoc(e); else if (sh === 'plan') doc = planDoc(e);
    else if (sh[0] === 'u') doc = usageDoc(e, by(sh[2]), sh[2]);
    else { const k = sh[2], l = by(k); doc = gyeolDoc('지출결의서_(' + e.dept + ') ' + e.name + ' _ ' + nm[k] + (k === 'C' ? cardTitle(l) : ''), l, k, r => SUBACC[r.sub] || r.sub); }
    F.csv = [['분류', '일자', '적요', '가맹점명', '금액', '지출수단', '비고']].concat(rs.map(r => [r.sub, ymd(r.date), r.purpose, r.vendor, r.amt, r.pay, r.pay.startsWith('카드') ? cardInfo(r).mno : r.who]));
    h += '<div class="c noprint"><div class="row"><select class="sel" id="fev">' + EVENTS.map(x => '<option value="' + x.id + '"' + (x.id === e.id ? ' selected' : '') + '>' + x.name + '</option>').join('') + '</select>' + tools + '</div>' +
      '<div class="tabs" style="margin-top:8px">' + EVSHEETS.map(([k, n]) => '<button class="' + (k === sh ? 'on' : '') + '" data-a="evsh" data-k="' + k + '">' + n + '</button>').join('') + '</div>' + note + '</div>' + doc;
  } else {
    const o = F.subd || { who: '김정래', dept: '총무국', date: '2026-10-11', amt: 15000, to: '바로퀵', what: '교구 공문 원본 퀵 발송', why: '퀵 기사가 영수증을 발급하지 않음', att: '퀵 배송 완료 문자' };
    h += '<div class="g2"><div class="c noprint"><h3>내용 입력</h3>' + fld('쓴 사람', inp('sb_who', o.who)) + fld('소속', inp('sb_dept', o.dept)) + fld('지출일', inp('sb_date', o.date, ' type="date"')) + fld('금액', inp('sb_amt', o.amt)) + fld('지급 상대', inp('sb_to', o.to)) + fld('거래 내용', inp('sb_what', o.what)) +
      fld('사유', '<select id="sb_why">' + ['영수증 분실', '퀵 기사가 영수증을 발급하지 않음', '개인 간 거래라 영수증 발급 불가', '현장 사정으로 영수증 못 받음'].map(x => '<option' + (x === o.why ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>') + fld('함께 낼 자료', inp('sb_att', o.att)) + '<div class="row end"><button class="btn" onclick="window.print()">인쇄</button></div></div>' +
      '<div class="doc"><div class="t1">지출증빙 대체 사유서</div><div class="sign"><span>작성자</span><span>확인자</span></div><table class="kv"><tbody><tr><th>소속·성명</th><td>' + esc(o.dept + ' ' + o.who) + '</td><th>작성일</th><td>' + TODAY + '</td></tr><tr><th>지출일</th><td>' + esc(o.date) + '</td><th>금액</th><td>' + won(num(o.amt)) + '원</td></tr><tr><th>거래 내용</th><td colspan="3">' + esc(o.what) + '</td></tr><tr><th>지급 상대</th><td colspan="3">' + esc(o.to) + '</td></tr><tr><th>사유</th><td colspan="3">' + esc(o.why) + '</td></tr><tr><th>함께 낸 자료</th><td colspan="3">' + esc(o.att) + '</td></tr></tbody></table><p>위 지출은 사실이며, 정규 증빙을 받지 못한 사유를 위와 같이 확인합니다.</p></div></div>';
  }
  return h;
};
ACT.evsh = d => { F.evSh = d.k; render(false); };
document.addEventListener('change', e => { if (e.target.id === 'fpk') { F.pk = e.target.value; render(); } });
