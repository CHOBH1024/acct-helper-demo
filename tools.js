// 도구함 T1~T7, 청구 계산기, 자료 올리기
const fld = (label, input) => '<div class="fld"><b>' + label + '</b>' + input + '</div>';
const inp = (id, v, extra) => '<input id="' + id + '" value="' + esc(v) + '"' + (extra || '') + '>';
const val = id => { const e = $('#' + id); return e ? e.value : ''; };

/* T1 영수증 판독 */
const CF = { hi: ['높음', 'hi'], mid: ['확인 필요', 'mid'], lo: ['낮음', 'lo'] };
V.t1 = () => {
  const s = SAMPLES.find(x => x.id === F.sample);
  let h = '<div class="note t">영수증 사진을 올리면 가맹점·날짜·금액을 읽고 법인카드 사용 내역과 짝지어 「영수증 안 낸 건」을 지웁니다. 판독은 협회 서버 안에서만 하고 외부 AI로 보내지 않습니다. 데모에서는 아래 예시 영수증으로 결과를 보여 드립니다.</div>';
  h += '<div class="pick">' + SAMPLES.map(x => '<button class="' + (x.id === F.sample ? 'on' : '') + '" data-a="pickS" data-id="' + x.id + '"><b>' + x.name + '</b><br><span class="mut">' + x.note + '</span></button>').join('') + '</div>';
  if (!s) return h + '<div class="c"><div class="empty">위에서 예시 영수증을 하나 고르세요.</div></div>';
  h += '<div class="g2"><div class="c"><h3>영수증</h3><div class="rc" style="' + (s.blur ? 'filter:blur(.7px);opacity:.75' : '') + '">' + s.rc.map((l, i) => '<p class="' + (i ? '' : 'h') + '">' + esc(l) + '</p>').join('') + '</div></div><div class="c"><h3>읽은 내용</h3>';
  if (s.blur) h += '<div class="note w" style="margin-bottom:8px">사진이 흐려 글자를 확실히 읽지 못했습니다. 다시 찍으면 더 정확합니다. 노랑·빨강 칸은 직접 확인해 주세요.</div>';
  if (s.items.length > 1) h += '<div class="note t" style="margin-bottom:8px">한 사진에서 영수증 ' + s.items.length + '장을 찾아 따로 나눴습니다.</div>';
  s.items.forEach((it, i) => {
    const match = S.ledger.find(r => it.card[0] && cardOf(r) === it.card[0] && r.date === it.date[0] && r.amt === it.amt[0]);
    const cf = k => '<span class="cf ' + CF[it[k][1]][1] + '">' + CF[it[k][1]][0] + '</span>';
    h += '<div class="out" style="margin-bottom:8px">' + (s.items.length > 1 ? '<b>영수증 ' + (i + 1) + '</b>' : '') +
      '<table class="tb"><tbody><tr><td class="mut">가맹점</td><td>' + (esc(it.vendor[0]) || '<span class="mut">읽지 못함</span>') + (it.vendor[2] ? ' <span class="mut">(「' + esc(it.vendor[2]) + '」를 거래처 목록으로 고침)</span>' : '') + '</td><td>' + cf('vendor') + '</td></tr>' +
      '<tr><td class="mut">날짜</td><td>' + it.date[0] + '</td><td>' + cf('date') + '</td></tr><tr><td class="mut">금액</td><td><b>' + won(it.amt[0]) + '원</b></td><td>' + cf('amt') + '</td></tr><tr><td class="mut">결제</td><td>' + (it.card[0] ? '카드 ****' + it.card[0] : '현금·개인 카드') + '</td><td>' + cf('card') + '</td></tr></tbody></table>';
    if (match) h += '<div class="note ' + (match.receipt ? 't' : 'w') + '" style="margin-top:6px">법인카드 #' + cardOf(match) + ' ' + match.date.slice(5) + ' ' + esc(match.vendor) + ' ' + won(match.amt) + '원(' + match.who + ')과 짝지었습니다. ' + (match.receipt ? '이미 영수증이 붙어 있습니다.' : '<button class="btn s p" data-a="attach" data-id="' + match.id + '">영수증 붙이기</button>') + '</div>';
    else h += '<div class="note t" style="margin-top:6px">법인카드 내역에 없는 지출입니다. 개인 돈으로 냈으면 내 정산에 올리세요. <button class="btn s" data-a="toMy" data-v="' + esc(it.vendor[0] || '가맹점 확인 필요') + '" data-d="' + it.date[0] + '" data-m="' + it.amt[0] + '">내 정산에 추가</button></div>';
    h += '</div>';
  });
  return h + '</div></div>';
};
ACT.pickS = d => { F.sample = d.id; render(); };
ACT.attach = d => { S.rcpt[d.id] = 1; const r = S.ledger.find(x => x.id === d.id); r.receipt = true; save(); render(); toast('영수증을 붙였습니다. 「영수증 안 낸 건」에서 빠졌습니다.'); };
ACT.toMy = d => { S.my.push({ id: 'm' + Date.now(), date: d.d, what: d.v + ' 개인 결제', kind: '개인 정산', amt: +d.m, stage: 0 }); save(); toast('내 정산에 「제출 전」으로 추가했습니다.'); };

/* T2 청구 계산기 */
const CK = [['야근식대', '야근·휴일 식대'], ['출장여비', '출장 여비'], ['시내교통', '시내 교통·귀가 택시'], ['소모품', '소모품 직접 구매'], ['경조사', '직원 경조사비'], ['차량운행', '법인차량 운행일지'], ['자녀학자금', '자녀 학자금'], ['도서인쇄', '도서·인쇄'], ['우편택배', '우편·택배']];
const GRADE = { 임원: [30000, 30000, { 서울: 120000, 광역시: 100000, 기타: 80000 }], 국장급: [25000, 25000, { 서울: 100000, 광역시: 80000, 기타: 70000 }], 직원: [20000, 25000, { 서울: 80000, 광역시: 70000, 기타: 60000 }] };
const GY = { '본인 결혼': [300000, 5, 1], '자녀 결혼': [200000, 1, 1], '부모 회갑·칠순·팔순': [150000, 1, 0], '배우자 회갑·칠순·팔순': [100000, 1, 0], '본인 성화': [1000000, 0, 1], '부모 성화(배우자 부모 포함)': [300000, 5, 1], '배우자 성화': [300000, 5, 1], '자녀 성화': [300000, 5, 1], '조부모 성화': [200000, 3, 1], '자녀 출산': [100000, 3, 0], '자녀 돌': [100000, 0, 0] };
const holiday = d => [0, 6].includes(new Date(d + 'T00:00:00').getDay()) || ['2026-10-05', '2026-10-09', '2026-12-25'].includes(d);
const FORM = {
  야근식대: () => fld('날짜', inp('c_d', '2026-10-14', ' type="date"')) + fld('끼니', '<select id="c_m"><option>저녁</option><option>야식(22시 이후)</option><option>휴일 식사</option></select>') + fld('퇴근 시각', inp('c_t', '20:40', ' type="time"')) + fld('인원', inp('c_n', '3', ' inputmode="numeric"')) + fld('함께 먹은 사람', inp('c_w', '김정래, 이예시, 정예시')) + fld('실제 금액', inp('c_a', '36000', ' inputmode="numeric"')),
  출장여비: () => fld('직급 구분', '<select id="c_g"><option>직원</option><option>국장급</option><option>임원</option></select>') + fld('출발일', inp('c_d1', '2026-10-20', ' type="date"')) + fld('돌아온 날', inp('c_d2', '2026-10-21', ' type="date"')) + fld('지역', '<select id="c_r"><option>광역시</option><option>서울</option><option>기타</option></select>') + fld('교통 실비', inp('c_tr', '87600', ' inputmode="numeric"')) + fld('자가용 km', inp('c_km', '0', ' inputmode="numeric"')) + fld('숙박', '<label><input type="checkbox" id="c_cd"> 법인카드로 냄(지급에서 뺌)</label>'),
  시내교통: () => [['2026-10-12', '야근 귀가 택시', '23:10', 31200], ['2026-10-13', '외근 택시', '14:20', 34800], ['', '버스·지하철', '', '']].map((x, i) => fld((i + 1) + '번째', '<div class="row"><input class="t_d" type="date" value="' + x[0] + '" style="width:140px"><select class="t_k" style="width:130px">' + ['야근 귀가 택시', '외근 택시', '버스·지하철'].map(k => '<option' + (k === x[1] ? ' selected' : '') + '>' + k + '</option>').join('') + '</select><input class="t_t" type="time" value="' + x[2] + '" style="width:100px"><input class="t_a" value="' + x[3] + '" placeholder="금액" style="width:90px"></div>')).join(''),
  소모품: () => fld('품목', inp('c_w', 'A4 클리어파일 20개')) + fld('단가', inp('c_u', '1200', ' inputmode="numeric"')) + fld('수량', inp('c_q', '20', ' inputmode="numeric"')),
  경조사: () => fld('대상 직원', inp('c_w', '이예시')) + fld('구분', '<select id="c_k">' + Object.keys(GY).map(k => '<option>' + k + '</option>').join('') + '</select>') + fld('행사일', inp('c_d', '2026-10-24', ' type="date"')),
  차량운행: () => fld('지난 도착 km', inp('c_l', '52340', ' inputmode="numeric"')) + fld('이번 출발 km', inp('c_f', '52346', ' inputmode="numeric"')) + fld('이번 도착 km', inp('c_e', '52388', ' inputmode="numeric"')) + fld('목적지', inp('c_w', '종로 > 여의도 거래처')),
  자녀학자금: () => fld('자녀 이름', inp('c_w', '김예시')) + fld('학기 차수', inp('c_s', '3', ' inputmode="numeric"')) + fld('실제 납입액', inp('c_p', '3850000', ' inputmode="numeric"')),
  도서인쇄: () => fld('품목', inp('c_w', '명함 200매')) + fld('금액', inp('c_a', '22000', ' inputmode="numeric"')),
  우편택배: () => fld('내용', inp('c_w', '교구 공문 등기 6건')) + fld('금액', inp('c_a', '16800', ' inputmode="numeric"')),
};
const CALC = {
  야근식대: () => { const d = val('c_d'), m = val('c_m'), t = val('c_t'), n = num(val('c_n')), a = num(val('c_a')), lim = 10000 * n, amt = Math.min(a, lim), b = [], w = [];
    const hol = holiday(d);
    if (!hol && m === '저녁' && t < '19:00') b.push('평일 저녁은 19:00 이후 퇴근일 때만 청구할 수 있습니다.');
    if (!hol && m.startsWith('야식') && t < '22:00') b.push('야식은 22:00 이후 퇴근일 때만 됩니다.');
    if (m === '휴일 식사' && !hol) b.push(d + '은 휴일이 아닙니다.');
    if (a > lim) w.push('한도 ' + won(lim) + '원을 넘은 ' + won(a - lim) + '원은 본인 부담입니다.');
    if (S.my.some(x => x.kind === '야근식대' && x.date === d)) b.push(d.slice(5) + ' 야근식대는 이미 청구했습니다.');
    return { amt, b, w, what: d.slice(5).replace('-', '/') + ' 야근 ' + m.slice(0, 2) + ' ' + n + '명(' + val('c_w') + ')', date: d, lines: [['1인 한도', '10,000원'], ['인원', n + '명'], ['한도', won(lim) + '원'], ['청구 금액', won(amt) + '원']] }; },
  출장여비: () => { const g = GRADE[val('c_g')], d1 = val('c_d1'), d2 = val('c_d2'), days = Math.max(1, Math.round((new Date(d2) - new Date(d1)) / 864e5) + 1), nights = days - 1, card = $('#c_cd').checked;
    const il = g[0] * days, sik = g[1] * days, suk = card ? 0 : g[2][val('c_r')] * nights, tr = num(val('c_tr')), km = num(val('c_km')) * 200, amt = il + sik + suk + tr + km;
    return { amt, b: d2 < d1 ? ['돌아온 날이 출발일보다 앞섭니다.'] : [], w: [], what: val('c_r') + ' 출장(' + d1.slice(5) + '~' + d2.slice(5) + ')', date: d2,
      lines: [['일비', won(g[0]) + ' × ' + days + '일 = ' + won(il)], ['식비', won(g[1]) + ' × ' + days + '일 = ' + won(sik)], ['숙박', card ? '법인카드(0)' : won(g[2][val('c_r')]) + ' × ' + nights + '박 = ' + won(suk)], ['교통', won(tr + km) + (km ? ' (자가용 ' + won(km) + ' 포함)' : '')], ['청구 금액', won(amt) + '원']] }; },
  시내교통: () => { const rs = $$('.t_d').map((x, i) => ({ d: x.value, k: $$('.t_k')[i].value, t: $$('.t_t')[i].value, a: num($$('.t_a')[i].value) })).filter(x => x.d && x.a), w = [], lines = []; let amt = 0;
    rs.forEach(x => { let a = x.a; if (x.k === '야근 귀가 택시') { if (x.t < '22:00') { w.push(x.d.slice(5) + ' 귀가 택시는 22:00 이후만 됩니다(제외).'); a = 0; } else if (a > 40000) { w.push(x.d.slice(5) + ' 귀가 택시 1회 한도 40,000원 적용'); a = 40000; } } if (x.k === '외근 택시' && a > 30000) { w.push(x.d.slice(5) + ' 외근 택시 1회 한도 30,000원 적용'); a = 30000; } amt += a; lines.push([x.d.slice(5) + ' ' + x.k, won(a) + '원']); });
    lines.push(['청구 금액', won(amt) + '원']);
    return { amt, b: rs.length ? [] : ['한 줄 이상 적어 주세요.'], w, what: '시내교통 ' + rs.length + '건', date: rs.length ? rs[rs.length - 1].d : TODAY, lines }; },
  소모품: () => { const u = num(val('c_u')), q = num(val('c_q')), amt = u * q, b = []; if (u >= 1000000) b.push('단가 100만원 이상은 비품(자산)입니다. 비품 구입 절차로 진행하세요.'); if (amt > 100000) b.push('직접 구매는 1건 10만원까지입니다. 총무국에 구매 요청하세요.');
    return { amt, b, w: [], what: val('c_w') + ' 직접 구매', date: TODAY, lines: [['금액', won(u) + ' × ' + q + ' = ' + won(amt) + '원'], ['한도', '1건 100,000원']] }; },
  경조사: () => { const k = val('c_k'), [amt, leave, fl] = GY[k]; return { amt, b: [], w: [], what: val('c_w') + ' ' + k + ' 경조사비', date: val('c_d'), lines: [['규정 금액', won(amt) + '원'], ['경조 휴가', leave + '일'], ['화환', fl ? '총무국이 주문' : '없음'], ['받는 사람', val('c_w')]] }; },
  차량운행: () => { const l = num(val('c_l')), f = num(val('c_f')), e = num(val('c_e')), gap = f - l, b = [], w = []; if (e <= f) b.push('도착 km가 출발 km보다 커야 합니다.'); if (gap > 2) w.push('지난 도착과 이번 출발 사이에 ' + gap + 'km 빈 구간이 있습니다. 운행 기록이 빠졌는지 확인하세요.');
    return { amt: 0, noMoney: 1, b, w, what: val('c_w'), date: TODAY, lines: [['운행 거리', (e - f) + 'km'], ['빈 구간', gap > 2 ? gap + 'km' : '없음(2km 이내)']] }; },
  자녀학자금: () => { const p = num(val('c_p')), s = num(val('c_s')), amt = Math.min(Math.round(p / 2), 2000000), b = []; if (s < 1 || s > 8) b.push('학기 차수는 1~8학기만 됩니다.');
    return { amt, b, w: [], what: val('c_w') + ' ' + s + '학기 등록금', date: TODAY, lines: [['납입액의 1/2', won(Math.round(p / 2)) + '원'], ['학기 최고', '2,000,000원'], ['청구 금액', won(amt) + '원']] }; },
  도서인쇄: () => ({ amt: num(val('c_a')), b: [], w: [], what: val('c_w'), date: TODAY, lines: [['청구 금액', won(num(val('c_a'))) + '원']] }),
  우편택배: () => ({ amt: num(val('c_a')), b: [], w: [], what: val('c_w'), date: TODAY, lines: [['청구 금액', won(num(val('c_a'))) + '원']] }),
};
V.calc = () => {
  const k = F.ck || '야근식대';
  return '<div class="tabs">' + CK.map(([c, n]) => '<button class="' + (c === k ? 'on' : '') + '" data-a="ck" data-k="' + c + '">' + n + '</button>').join('') + '</div>' +
    '<div class="g2"><div class="c"><h3>' + CK.find(x => x[0] === k)[1] + ' <span class="mut">규정값 2026년 시범값</span></h3><div id="cform">' + FORM[k]() + '</div></div><div class="c"><h3>계산 결과</h3><div id="cout"></div></div></div>';
};
ACT.ck = d => { F.ck = d.k; render(); };
function calcUpdate() {
  const k = F.ck || '야근식대'; if (!$('#cout')) return;
  const o = CALC[k](); F.co = o;
  $('#cout').innerHTML = '<div class="out">' + (o.noMoney ? '' : '<div class="mut">청구 금액</div><div class="big">' + won(o.amt) + '원</div>') + '<table class="tb" style="margin-top:6px"><tbody>' + o.lines.map(([a, b]) => '<tr><td class="mut">' + esc(a) + '</td><td class="n"><b>' + esc(b) + '</b></td></tr>').join('') + '</tbody></table></div>' +
    o.w.map(x => '<div class="note w" style="margin-top:6px">' + esc(x) + '</div>').join('') + o.b.map(x => '<div class="note r" style="margin-top:6px">' + esc(x) + '</div>').join('') +
    (o.noMoney ? '<div class="mut" style="margin-top:8px">운행일지는 돈을 받는 청구가 아니라 기록입니다. 월말에 빈 구간을 모아 보여 줍니다.</div>' : '<div class="row end" style="margin-top:10px"><button class="btn p" data-a="addMy"' + (o.b.length ? ' disabled' : '') + '>내 정산에 추가</button></div><div class="mut" style="margin-top:6px">추가하면 「내가 받을 돈」에 제출 전으로 들어갑니다. 계산 결과를 아스키오 청구서에 그대로 옮겨 적으면 됩니다.</div>');
}
document.addEventListener('input', e => { if (e.target.closest('#cform')) calcUpdate(); });
document.addEventListener('change', e => { if (e.target.closest('#cform')) calcUpdate(); });
ACT.addMy = () => { const o = F.co, k = F.ck || '야근식대'; S.my.push({ id: 'm' + Date.now(), date: o.date, what: o.what, kind: k, amt: o.amt, stage: 0 }); save(); calcUpdate(); toast('내 정산에 추가했습니다(' + won(o.amt) + '원).'); };

/* T3 서식 작성 */
const FORMS = [['gyeol', '지출결의서'], ['song', '송금요청서'], ['ev', '행사 예결산안'], ['sub', '대체 사유서']];
const CODES = { '복리후생비(기타)': '81101', '여비교통비(단기)': '81201', '소모품비': '83001', '차량유지비': '82201', '도서인쇄비': '82601', '통신비': '81401', '지급수수료': '83101', '주요행사비': '45102', '회의비': '81301', '광고선전비': '83301', '교육훈련비': '82701' };
const G20 = { 총무국: '1041', 기획국: '6010', 문화홍보국: '1047', 미래인재국: '5010' };
function fakeAcc(name) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 99991; const banks = ['국민은행', '신한은행', '우리은행', '농협', '하나은행']; return [banks[h % 5], String(100 + h % 900) + '-***-***' + String(h % 1000).padStart(3, '0')]; }
V.t3 = () => {
  const f = F.form || 'gyeol', dept = F.fd || (S.scope === '전체' ? '총무국' : S.scope), mm = F.fm || 9;
  let h = '<div class="tabs noprint">' + FORMS.map(([k, n]) => '<button class="' + (k === f ? 'on' : '') + '" data-a="form" data-k="' + k + '">' + n + '</button>').join('') + '</div>';
  const pick = '<div class="row noprint"><select class="sel" id="fd">' + DEPTS.map(d => '<option' + (d === dept ? ' selected' : '') + '>' + d + '</option>').join('') + '</select><select class="sel" id="fm">' + Array.from({ length: 10 }, (_, i) => '<option value="' + (i + 1) + '"' + (i + 1 === mm ? ' selected' : '') + '>2026년 ' + (i + 1) + '월</option>').join('') + '</select><span class="grow"></span><button class="btn" onclick="window.print()">인쇄</button><button class="btn" data-a="formCsv">엑셀용 CSV</button></div>';
  if (f === 'gyeol') {
    const rs = S.ledger.filter(r => r.dept === dept && r.date.slice(0, 7) === '2026-' + String(mm).padStart(2, '0'));
    const byI = {}; rs.forEach(r => byI[r.item] = (byI[r.item] || 0) + r.amt);
    F.csv = [['일자', '예산과목', '계정코드', '거래처', '내용', '결제', '증빙', '금액']].concat(rs.map(r => [r.date, r.item, CODES[r.item] || '', r.vendor, r.purpose, r.pay, r.receipt ? '영수증' : '없음', r.amt]));
    h += '<div class="c">' + pick + '</div><div class="doc"><div class="t">지 출 결 의 서</div><div class="row" style="margin-bottom:8px"><span>결의부서: ' + dept + ' (' + G20[dept] + ')</span><span class="grow"></span><span>2026년 ' + mm + '월분 · 작성 ' + TODAY + '</span></div><div class="sg" style="margin-bottom:8px"><span>담당</span><span>국장</span><span>재정</span><span>사무총장</span></div>' +
      '<table><thead><tr><th>예산과목</th><th>계정코드</th><th style="text-align:right">금액</th></tr></thead><tbody>' + Object.entries(byI).map(([k, v]) => '<tr><td>' + k + '</td><td>' + (CODES[k] || '') + '</td><td style="text-align:right">' + won(v) + '</td></tr>').join('') + '<tr><th>합계</th><th></th><th style="text-align:right">' + won(sum(rs)) + '</th></tr></tbody></table><div style="height:10px"></div>' +
      '<table><thead><tr><th>일자</th><th>거래처</th><th>내용</th><th>결제</th><th>증빙</th><th style="text-align:right">금액</th></tr></thead><tbody>' + rs.map(r => '<tr><td>' + r.date.slice(5) + '</td><td>' + esc(r.vendor) + '</td><td>' + esc(r.purpose) + '</td><td>' + esc(r.pay) + '</td><td>' + (r.receipt ? '영수증' : '<b style="color:#b93a12">없음</b>') + '</td><td style="text-align:right">' + won(r.amt) + '</td></tr>').join('') + '</tbody></table></div>';
  } else if (f === 'song') {
    const rs = S.ledger.filter(r => r.dept === dept && r.pay === '개인 정산' && r.date.slice(0, 7) === '2026-' + String(mm).padStart(2, '0'));
    const g = {}; rs.forEach(r => (g[r.who] = g[r.who] || []).push(r));
    F.csv = [['받는 사람', '은행', '계좌번호', '금액', '내용']].concat(Object.entries(g).map(([w, l]) => { const [b, n] = fakeAcc(w); return [w, b, n, sum(l), l.map(r => r.purpose).join(' / ')]; }));
    h += '<div class="c">' + pick + '<div class="mut" style="margin-top:6px">개인 돈으로 낸 지출을 사람별로 합쳐 한 줄로 만듭니다. 계좌번호는 데모용으로 가린 가짜 번호입니다.</div></div><div class="doc"><div class="t">송 금 요 청 서</div><div class="row" style="margin-bottom:8px"><span>' + dept + ' · 2026년 ' + mm + '월 개인 정산분</span><span class="grow"></span><span>지급 예정일 2026-' + String(Math.min(mm + 1, 12)).padStart(2, '0') + '-25</span></div>' +
      '<table><thead><tr><th>번호</th><th>받는 사람</th><th>은행</th><th>계좌번호</th><th>내용</th><th style="text-align:right">금액</th></tr></thead><tbody>' + (Object.keys(g).length ? Object.entries(g).map(([w, l], i) => { const [b, n] = fakeAcc(w); return '<tr><td>' + (i + 1) + '</td><td>' + w + '</td><td>' + b + '</td><td>' + n + '</td><td>' + esc(l.map(r => r.vendor + ' ' + won(r.amt)).join(', ')) + '</td><td style="text-align:right">' + won(sum(l)) + '</td></tr>'; }).join('') : '<tr><td colspan="6" style="text-align:center">이 달 개인 정산이 없습니다</td></tr>') +
      '<tr><th colspan="5">합계 (' + Object.keys(g).length + '명 · ' + rs.length + '건)</th><th style="text-align:right">' + won(sum(rs)) + '</th></tr></tbody></table><div class="sg" style="margin-top:10px"><span>담당</span><span>재정</span><span>국장</span></div></div>';
  } else if (f === 'ev') {
    const e = EVENTS.find(x => x.id === F.evSel) || EVENTS[0], rs = S.ledger.filter(r => r.event === e.id), sp = sum(rs);
    F.csv = [['항목', '예산', '집행', '차액']].concat(e.plan.map(([w, p]) => { const a = sum(rs.filter(r => r.plan === w)); return [w, p, a, p - a]; }));
    h += '<div class="c"><div class="row noprint"><select class="sel" id="fev">' + EVENTS.map(x => '<option value="' + x.id + '"' + (x.id === e.id ? ' selected' : '') + '>' + x.name + '</option>').join('') + '</select><span class="grow"></span><button class="btn" onclick="window.print()">인쇄</button><button class="btn" data-a="formCsv">엑셀용 CSV</button></div></div>' +
      '<div class="doc"><div class="t">행 사 예 결 산 안</div><table><tbody><tr><th style="width:110px">행사명</th><td>' + e.name + '</td><th style="width:80px">주관</th><td>' + e.dept + '</td></tr><tr><th>일시</th><td>' + e.date + '</td><th>인원</th><td>' + e.people + '명</td></tr></tbody></table><div style="height:10px"></div>' +
      '<table><thead><tr><th>항목</th><th style="text-align:right">예산</th><th style="text-align:right">집행</th><th style="text-align:right">차액</th><th>비고</th></tr></thead><tbody>' + e.plan.map(([w, p]) => { const a = sum(rs.filter(r => r.plan === w)); return '<tr><td>' + w + '</td><td style="text-align:right">' + won(p) + '</td><td style="text-align:right">' + won(a) + '</td><td style="text-align:right">' + won(p - a) + '</td><td>' + esc(rs.filter(r => r.plan === w).map(r => r.vendor).join(', ')) + '</td></tr>'; }).join('') +
      '<tr><th>합계</th><th style="text-align:right">' + won(e.budget) + '</th><th style="text-align:right">' + won(sp) + '</th><th style="text-align:right">' + won(e.budget - sp) + '</th><th>1인당 ' + won(Math.round(sp / e.people)) + '원</th></tr></tbody></table>' + (e.done ? '' : '<p style="margin:8px 0 0">※ 행사 전이라 집행은 지금까지 쓴 금액입니다.</p>') + '<div class="sg" style="margin-top:10px"><span>담당</span><span>국장</span><span>재정</span></div></div>';
  } else {
    const o = F.subd || { who: '김정래', dept: '총무국', date: '2026-10-11', amt: 15000, to: '바로퀵', what: '교구 공문 원본 퀵 발송', why: '퀵 기사가 영수증을 발급하지 않음', att: '퀵 배송 완료 문자' };
    h += '<div class="g2"><div class="c noprint"><h3>내용 입력</h3>' + fld('쓴 사람', inp('sb_who', o.who)) + fld('소속', inp('sb_dept', o.dept)) + fld('지출일', inp('sb_date', o.date, ' type="date"')) + fld('금액', inp('sb_amt', o.amt)) + fld('지급 상대', inp('sb_to', o.to)) + fld('거래 내용', inp('sb_what', o.what)) +
      fld('사유', '<select id="sb_why">' + ['영수증 분실', '퀵 기사가 영수증을 발급하지 않음', '개인 간 거래라 영수증 발급 불가', '현장 사정으로 영수증 못 받음'].map(x => '<option' + (x === o.why ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>') + fld('함께 낼 자료', inp('sb_att', o.att)) + '<div class="row end"><button class="btn" onclick="window.print()">인쇄</button></div></div>' +
      '<div class="doc"><div class="t">지출증빙 대체 사유서</div><table><tbody><tr><th style="width:100px">소속·성명</th><td>' + esc(o.dept + ' ' + o.who) + '</td><th style="width:70px">작성일</th><td>' + TODAY + '</td></tr><tr><th>지출일</th><td>' + esc(o.date) + '</td><th>금액</th><td>' + won(num(o.amt)) + '원</td></tr><tr><th>거래 내용</th><td colspan="3">' + esc(o.what) + '</td></tr><tr><th>지급 상대</th><td colspan="3">' + esc(o.to) + '</td></tr><tr><th>사유</th><td colspan="3">' + esc(o.why) + '</td></tr><tr><th>함께 낸 자료</th><td colspan="3">' + esc(o.att) + '</td></tr></tbody></table><p>위 지출은 사실이며, 정규 증빙을 받지 못한 사유를 위와 같이 확인합니다.</p><div class="sg"><span>작성자</span><span>확인자</span></div></div></div>';
  }
  return h;
};
ACT.form = d => { F.form = d.k; render(); };
ACT.formCsv = () => download((FORMS.find(x => x[0] === (F.form || 'gyeol'))[1]) + '_' + TODAY + '.csv', toCSV(F.csv || []));
document.addEventListener('change', e => { const id = e.target.id; if (id === 'fd') { F.fd = e.target.value; render(); } if (id === 'fm') { F.fm = +e.target.value; render(); } if (id === 'fev') { F.evSel = e.target.value; render(); } });
document.addEventListener('input', e => { if (e.target.id && e.target.id.startsWith('sb_')) { F.subd = { who: val('sb_who'), dept: val('sb_dept'), date: val('sb_date'), amt: val('sb_amt'), to: val('sb_to'), what: val('sb_what'), why: val('sb_why'), att: val('sb_att') }; const keep = e.target.id; render(); const el = $('#' + keep); if (el) { el.focus(); if (el.setSelectionRange && el.type === 'text') el.setSelectionRange(99, 99); } } });
document.addEventListener('change', e => { if (e.target.id === 'sb_why' || e.target.id === 'sb_date') e.target.dispatchEvent(new Event('input', { bubbles: true })); });

/* T4 전표 초안 */
function vouchers(dept, mm) {
  const rs = S.ledger.filter(r => r.dept === dept && r.date.slice(0, 7) === '2026-' + String(mm).padStart(2, '0'));
  const sup = rs.filter(r => r.item === '소모품비'), rest = rs.filter(r => r.item !== '소모품비');
  const one = (list, title) => {
    const lines = [];
    list.forEach(r => {
      const tail = r.pay === '개인 정산' ? '(개인정산)' : '';
      lines.push(['차', CODES[r.item] || '?', r.item, r.vendor, r.purpose + tail, r.amt]);
      if (r.pay.startsWith('카드')) lines.push(['대', '26201', '미지급금(법인카드)', '법인카드 #' + cardOf(r), r.purpose, r.amt]);
      else if (r.pay === '개인 정산') lines.push(['대', '26202', '미지급금(개인)', '10024 ' + r.who, r.purpose + tail, r.amt]);
      else lines.push(['대', '10301', '보통예금', r.vendor, r.purpose, r.amt]);
    });
    const dr = sum(lines.filter(l => l[0] === '차'), l => l[5]), cr = sum(lines.filter(l => l[0] === '대'), l => l[5]);
    return { date: list[list.length - 1].date, title: title || list[0].purpose, lines, ok: dr === cr, amt: dr };
  };
  const out = rest.map(r => one([r]));
  if (sup.length) out.push(one(sup, mm + '월 소모품비 합산 ' + sup.length + '건'));
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}
V.t4 = () => {
  const dept = F.jd || (S.scope === '전체' ? '총무국' : S.scope), mm = F.jm || 9, vs = vouchers(dept, mm);
  let h = '<div class="note t">장부 자료로 분개 초안을 만듭니다. 확정은 더존·굿바이G20에서 하고, 여기서는 입력할 파일만 준비합니다. 카드는 대변 26201, 개인 정산은 26202(거래처 10024), 계좌이체는 10301, 소모품비는 한 달을 전표 1장으로 합칩니다.</div>';
  h += '<div class="c"><div class="row"><select class="sel" id="jd">' + DEPTS.map(d => '<option' + (d === dept ? ' selected' : '') + '>' + d + '</option>').join('') + '</select><select class="sel" id="jm">' + Array.from({ length: 10 }, (_, i) => '<option value="' + (i + 1) + '"' + (i + 1 === mm ? ' selected' : '') + '>' + (i + 1) + '월</option>').join('') + '</select><span class="mut">전표 ' + vs.length + '장 · ' + won(sum(vs, v => v.amt)) + '원 · 결의부서 ' + G20[dept] + '</span><span class="grow"></span>' +
    (vs.every(v => v.ok) ? '<span class="bd ok">차대 모두 일치</span>' : '<span class="bd r">차대 불일치 있음</span>') + '<button class="btn p" data-a="jcsv">G20 입력 파일 받기</button></div></div>';
  h += '<div class="c"><div class="tw"><table class="tb"><thead><tr><th>#</th><th>일자</th><th>구분</th><th>계정</th><th>거래처</th><th>적요</th><th class="n">금액</th></tr></thead><tbody>' +
    vs.map((v, i) => v.lines.map((l, j) => '<tr' + (j === 0 ? ' style="border-top:2px solid #dfe7e5"' : '') + '><td class="mut">' + (j ? '' : i + 1) + '</td><td class="nw mut">' + (j ? '' : v.date.slice(5)) + '</td><td>' + l[0] + '</td><td class="nw">' + l[1] + ' ' + esc(l[2]) + '</td><td>' + esc(l[3]) + '</td><td>' + esc(l[4]) + '</td><td class="n">' + won(l[5]) + '</td></tr>').join('')).join('') + '</tbody></table></div></div>';
  return h;
};
document.addEventListener('change', e => { if (e.target.id === 'jd') { F.jd = e.target.value; render(); } if (e.target.id === 'jm') { F.jm = +e.target.value; render(); } });
ACT.jcsv = () => { const dept = F.jd || (S.scope === '전체' ? '총무국' : S.scope), mm = F.jm || 9; const rowsOut = [['전표번호', '일자', '결의부서', '구분', '계정코드', '계정', '거래처', '적요', '금액']]; vouchers(dept, mm).forEach((v, i) => v.lines.forEach(l => rowsOut.push([i + 1, v.date, G20[dept], l[0], l[1], l[2], l[3], l[4], l[5]]))); download('G20_전표초안_' + dept + '_2026-' + String(mm).padStart(2, '0') + '.csv', toCSV(rowsOut)); };

/* T5 점검 */
V.t5 = () => {
  const all = findIssues(), kinds = Array.from(new Set(all.map(i => i.kind))), k = F.ik && kinds.includes(F.ik) ? F.ik : '';
  const list = k ? all.filter(i => i.kind === k) : all;
  let h = '<div class="g4">' + kp('점검 결과', all.length, scopeName() + ' · 2026년', all.length ? 'w' : 'ok', '건') + kp('바로 확인할 것', all.filter(i => i.lv === 'r').length, '중복·예산 초과·큰 금액 증빙 없음', 'r', '건') + kp('확인 권장', all.filter(i => i.lv === 'w').length, '', 'w', '건') + kp('점검 항목', 7, '중복·나눠 결제·큰 금액·증빙·주말·야근식대·예산', 'i', '가지') + '</div>';
  h += '<div class="tabs"><button class="' + (k ? '' : 'on') + '" data-a="ik" data-k="">전체 ' + all.length + '</button>' + kinds.map(x => '<button class="' + (x === k ? 'on' : '') + '" data-a="ik" data-k="' + x + '">' + x + ' ' + all.filter(i => i.kind === x).length + '</button>').join('') + '</div>';
  h += '<div class="c"><div class="list">' + (list.length ? list.map(i => '<div class="it"><span class="bd ' + i.lv + '">' + i.kind + '</span><span>' + esc(i.text) + '</span></div>').join('') : '<div class="empty">걸린 것이 없습니다.</div>') + '</div></div>';
  return h;
};
ACT.ik = d => { F.ik = d.k; render(); };

/* T6 과거 지출 찾기 */
V.t6 = () => {
  const q = (F.q || '').trim(), yy = F.qy || 'all';
  const hit = q ? S.ledger.filter(r => inScope(r) && (yy === 'all' || r.date.startsWith(yy)) && (r.vendor + ' ' + r.purpose + ' ' + r.item + ' ' + r.who).includes(q)) : [];
  let h = '<div class="c"><div class="row"><input id="q" class="sel" style="flex:1;min-width:200px;padding:8px 12px" placeholder="가맹점·내용·과목·사람으로 찾기. 예: 도시락, 워크숍, 현수막" value="' + esc(q) + '"><select class="sel" id="qy"><option value="all"' + (yy === 'all' ? ' selected' : '') + '>2025~2026</option><option value="2026"' + (yy === '2026' ? ' selected' : '') + '>2026</option><option value="2025"' + (yy === '2025' ? ' selected' : '') + '>2025</option></select><button class="btn p" data-a="find">찾기</button></div>' +
    '<div class="row" style="margin-top:8px"><span class="mut">자주 찾는 것</span>' + ['도시락', '워크숍', '현수막', '택시', 'KTX', '복합기', '체육대회'].map(x => '<button class="btn s" data-a="findq" data-q="' + x + '">' + x + '</button>').join('') + '</div></div>';
  if (!q) return h;
  const a26 = hit.filter(r => r.date.startsWith('2026')), a25 = hit.filter(r => r.date.startsWith('2025'));
  h += '<div class="g4">' + kp('찾은 지출', hit.length, '「' + esc(q) + '」', 't', '건') + kp('2026 합계', won(sum(a26)), a26.length + '건', 'i') + kp('2025 합계', won(sum(a25)), a25.length + '건', '') + kp('1건 평균', won(hit.length ? Math.round(sum(hit) / hit.length) : 0), '견적 비교 기준', 'v') + '</div>';
  h += '<div class="c"><div class="tw"><table class="tb"><thead><tr><th>날짜</th><th>국</th><th>가맹점</th><th>내용</th><th>과목</th><th>쓴 사람</th><th class="n">금액</th></tr></thead><tbody>' + hit.slice().sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 200).map(r => '<tr><td class="nw"><span class="bd ' + (r.date.startsWith('2025') ? 'g' : 't') + '">' + r.date.slice(0, 4) + '</span> <span class="mut">' + r.date.slice(5) + '</span></td><td>' + r.dept + '</td><td>' + esc(r.vendor) + '</td><td>' + esc(r.purpose) + '</td><td>' + r.item + '</td><td>' + esc(r.who) + '</td><td class="n">' + won(r.amt) + '</td></tr>').join('') + '</tbody></table></div>' + (hit.length > 200 ? '<div class="mut">앞의 200건만 보입니다.</div>' : '') + '</div>';
  return h;
};
ACT.find = () => { F.q = val('q'); F.qy = val('qy'); render(); };
ACT.findq = d => { F.q = d.q; render(); };
document.addEventListener('keydown', e => { if (e.target.id === 'q' && e.key === 'Enter') ACT.find(); });

/* T7 정기 지출 */
function recurStatus() {
  return RECUR.map(rc => {
    const due = '2026-10-' + String(Math.min(rc.day, 28)).padStart(2, '0');
    const paid = S.ledger.find(r => r.date.startsWith('2026-10') && (r.recur === rc.name || (r.vendor === rc.vendor && r.amt === rc.amt)));
    const months = Array.from({ length: 10 }, (_, i) => S.ledger.filter(r => r.date.startsWith('2026-' + String(i + 1).padStart(2, '0')) && (r.recur === rc.name || (r.vendor === rc.vendor && r.amt === rc.amt))).length > 0);
    return Object.assign({}, rc, { due, paid, months, st: paid ? 'paid' : due < TODAY ? 'late' : 'soon' });
  });
}
V.t7 = () => {
  const rs = recurStatus();
  let h = '<div class="g4">' + kp('정기 지출', rs.length, '매달 ' + won(sum(rs)) + '원', 't', '건') + kp('10월 나감', rs.filter(r => r.st === 'paid').length, won(sum(rs.filter(r => r.st === 'paid'))) + '원', 'ok', '건') + kp('나갈 예정', rs.filter(r => r.st === 'soon').length, '', 'i', '건') + kp('확인 필요', rs.filter(r => r.st === 'late').length, '날짜가 지났는데 장부에 없음', rs.some(r => r.st === 'late') ? 'r' : 'ok', '건') + '</div>';
  h += '<div class="c"><h3>정기 지출 <span class="mut">1~10월 나간 기록</span></h3><div class="tw"><table class="tb"><thead><tr><th>이름</th><th>거래처</th><th>결제</th><th class="n">금액</th><th>매달</th><th>1~10월</th><th>10월</th></tr></thead><tbody>' +
    rs.map(r => '<tr><td><b>' + r.name + '</b></td><td>' + r.vendor + '</td><td class="nw">' + r.pay + '</td><td class="n">' + won(r.amt) + '</td><td class="nw">' + r.day + '일</td><td class="nw">' + r.months.map((m, i) => '<span title="' + (i + 1) + '월" style="display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:2px;background:' + (m ? 'var(--ok)' : i === 9 ? '#e7edec' : 'var(--bad)') + '"></span>').join('') + '</td><td>' +
      (r.st === 'paid' ? '<span class="bd ok">' + r.paid.date.slice(5) + ' 나감</span>' : r.st === 'late' ? '<span class="bd r">' + r.due.slice(5) + ' 예정이었음</span>' : '<span class="bd i">D-' + dday(r.due) + '</span>') + '</td></tr>').join('') + '</tbody></table></div><div class="mut" style="margin-top:6px">자동이체가 빠지거나 금액이 바뀌면 바로 알 수 있습니다. 실제 버전에서는 이틀 전에 담당자에게 알림을 보냅니다.</div></div>';
  return h;
};

/* 자료 올리기 */
V.up = () => {
  const p = F.pre;
  let h = '<div class="g2"><div class="c"><h3>자료 올리기</h3><p class="mut" style="margin-top:0">더존에서 내려받은 계정별 원장이나 카드사 이용내역 엑셀(.xlsx, .csv)을 올리면 모든 현황판이 그 자료로 바로 바뀝니다. 파일은 이 브라우저 안에서만 읽고 어디로도 보내지 않습니다.</p>' +
    '<label class="drop" id="drop" style="display:block"><b>파일을 여기에 끌어 놓거나 눌러서 고르세요</b><br><span class="mut">첫 시트에서 「일자·금액」이 있는 줄을 제목 줄로 찾습니다</span><input type="file" id="upf" accept=".xlsx,.xls,.csv" class="hide"></label>' +
    '<div class="row" style="margin-top:10px"><span class="mut">양식이 없으면</span><button class="btn s" data-a="tpl" data-k="ledger">장부 양식 받기</button><button class="btn s" data-a="tpl" data-k="card">카드 내역 양식 받기</button></div></div>' +
    '<div class="c"><h3>지금 보고 있는 자료</h3><table class="tb"><tbody><tr><td class="mut">출처</td><td><b>' + esc(S.src) + '</b>' + (S.srcFile ? '<br><span class="mut">' + esc(S.srcFile) + '</span>' : '') + '</td></tr><tr><td class="mut">건수</td><td>' + won(S.ledger.length) + '건 (2025~2026)</td></tr><tr><td class="mut">마지막 갱신</td><td>' + S.updated + '</td></tr></tbody></table>' +
    '<div class="row" style="margin-top:10px"><button class="btn" data-a="backSeed"' + (S.uploaded || S.extra.length ? '' : ' disabled') + '>예시 자료로 되돌리기</button></div>' +
    '<div class="mut" style="margin-top:10px">「실시간」은 두 가지로 됩니다. 지금처럼 엑셀을 올릴 때마다 즉시 바뀌는 방식과, 아스키오 데이터베이스를 읽기 전용으로 연결해 저장되는 순간 바뀌는 방식입니다. 데모는 앞의 방식이며, 위쪽 「실시간 흐름」을 켜면 카드 사용이 들어오는 모습을 흉내 냅니다.</div></div></div>';
  if (p) {
    h += '<div class="c"><h3>미리 보기 <span class="mut">' + esc(p.name) + ' · ' + p.rows.length + '건 읽음</span></h3><div class="row" style="margin-bottom:8px">' + Object.entries(p.map.m).map(([k, i]) => '<span class="bd t">' + ({ date: '날짜', amt: '금액', vendor: '거래처', purpose: '내용', dept: '부서', item: '과목', card: '카드', who: '사용자', receipt: '증빙', pay: '결제', event: '행사' })[k] + ' = ' + esc(p.map.head[i]) + '</span>').join('') + '</div>' +
      '<div class="tw"><table class="tb"><thead><tr><th>날짜</th><th>부서</th><th>과목</th><th>거래처</th><th>내용</th><th>결제</th><th class="n">금액</th></tr></thead><tbody>' + p.rows.slice(0, 8).map(r => '<tr><td class="nw">' + r.date + '</td><td>' + esc(r.dept) + '</td><td>' + esc(r.item) + '</td><td>' + esc(r.vendor) + '</td><td>' + esc(r.purpose) + '</td><td>' + esc(r.pay) + '</td><td class="n">' + won(r.amt) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="row end" style="margin-top:10px"><select class="sel" id="updept">' + DEPTS.map(d => '<option>' + d + '</option>').join('') + '</select><span class="mut">부서 칸이 없으면 이 부서로</span><button class="btn" data-a="upCancel">취소</button><button class="btn" data-a="upApply" data-m="add">지금 자료에 더하기</button><button class="btn p" data-a="upApply" data-m="replace">이 자료로 바꾸기</button></div></div>';
  }
  return h;
};
async function handleFile(file) {
  try {
    const table = await readTable(file);
    const map = mapHeader(table);
    if (!map) { toast('「일자」와 「금액」 칸을 찾지 못했습니다. 제목 줄 이름을 확인해 주세요.'); return; }
    F.pre = { name: file.name, table, map, rows: toRows(table, map, '총무국') };
    if (!F.pre.rows.length) { toast('읽을 수 있는 줄이 없습니다.'); F.pre = null; return; }
    render();
  } catch (e) { toast(e.message || '파일을 읽지 못했습니다.'); }
}
document.addEventListener('change', e => { if (e.target.id === 'upf' && e.target.files[0]) handleFile(e.target.files[0]); if (e.target.id === 'updept' && F.pre) { F.pre.rows = toRows(F.pre.table, F.pre.map, e.target.value); } });
document.addEventListener('dragover', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.add('on'); } });
document.addEventListener('dragleave', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) d.classList.remove('on'); });
document.addEventListener('drop', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.remove('on'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); } });
ACT.upCancel = () => { F.pre = null; render(); };
ACT.upApply = d => {
  const p = F.pre; if (!p) return;
  const sel = $('#updept'); p.rows = toRows(p.table, p.map, sel ? sel.value : '총무국');
  if (d.m === 'replace') { S.uploaded = p.rows; S.extra = []; S.rcpt = {}; } else { S.extra = (S.extra || []).concat(p.rows.map((r, i) => Object.assign(r, { id: 'X' + Date.now() + i }))); }
  S.src = d.m === 'replace' ? '올린 자료' : '예시 + 올린 자료'; S.srcFile = p.name; S.updated = stamp(); F.pre = null;
  save(); S.ledger = (S.uploaded || genLedger()).concat(S.extra || []); render(); toast(p.rows.length + '건을 반영했습니다. 현황판이 모두 새 자료로 바뀌었습니다.');
};
ACT.backSeed = () => { S.uploaded = null; S.extra = []; S.src = '예시 자료'; S.srcFile = ''; S.updated = stamp(); save(); load(); render(); toast('예시 자료로 되돌렸습니다.'); };
ACT.tpl = d => {
  if (d.k === 'ledger') download('장부_올리기_양식.csv', toCSV([['일자', '부서', '계정과목', '거래처', '적요', '금액', '결제', '사용자', '증빙'], ['2026-10-14', '총무국', '소모품비', '오피스디포 종로점', '복사용지 5박스', 125000, '카드 #3418', '김정래', 'O'], ['2026-10-14', '기획국', '회의비', '카페 온기', '기획 회의 다과', 38000, '개인 정산', '최예시', 'O'], ['2026-10-15', '문화홍보국', '광고선전비', '네이버(주)', '문화제 검색 광고', 500000, '계좌이체', '서예시', 'X']]));
  else download('카드내역_올리기_양식.csv', toCSV([['카드번호', '승인일', '가맹점', '승인금액', '이용자'], ['9410-****-****-3418', '2026.10.14', '오피스디포 종로점', '125,000', '김정래'], ['9410-****-****-5591', '2026.10.15', '달콤제과', '84,000', '박예시']]));
};
