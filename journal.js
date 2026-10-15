// T4 전표 초안: 총무국 G20 분개 규칙(전표코드.json 적요형식, 실제 전표 443줄에서 확정)
// - 항상 건별 1:1 차·대 쌍. 대변을 합치지 않는다.
// - 법인카드: 차) 비용 / 대) 26201. 차변·대변 거래처 모두 카드 거래처코드. 적요 맨 앞에 카드 M번호(#태그는 쓰지 않음).
// - 개인정산: 차·대 거래처 모두 부서 거래처(총무국 10024), 사람 이름은 적요에.
// - 자동이체(정기 지출): 차) 비용 / 대) 10301 보통예금.
// - 업체 이체(청구정산): 차) 비용 / 차) 13500 0원 / 대) 결재일 25일까지 10301 보통예금(90000), 이후 26202 업체.
// - 행사결산: 차) 45102 주요행사비, 적요 「[행사결산]행사명: 소분류(내용)」 뒤에 카드면 「 : M번호(카드부서)」, 개인이면 「 (개인결재: 이름)」.
// - 차변 예산구분 집행(+예산과목코드), 대변 일반.
const DEPT_TR = { 총무국: ['10024', '총무국'], 기획국: ['10021', '기획국'], 문화홍보국: ['10022', '문화홍보국'], 미래인재국: ['10023', '미래인재국'] };
// 예산과목 코드: G20 account_budget.json (계정코드 > 예산과목). 부서 회의비는 G20에 짝이 없어 비워 둠
const BGT = { '81101': '22311', '81201': '22411', '83001': '22261', '82201': '22231', '82601': '22241', '81401': '22221', '83101': '22273', '83102': '22272', '82501': '22281', '45102': '21122' };
function memo(r, mm, ev) {
  const c = cardInfo(r), card = r.pay.startsWith('카드'), dept = r.dept;
  if (ev) {
    const sub = (ev.plan.find(p => p[0] === r.plan) || [])[2] || '기타';
    const body = '[행사결산]' + ev.name + ': ' + sub + '(' + r.purpose + ')';
    return card ? body + ' : ' + c.mno + '(' + c.dept + ')' : r.pay === '개인 정산' ? body + ' (개인결재: ' + r.who + ')' : body;
  }
  if (card && c.no === '2171') return c.mno + ' ' + dept + ' ' + mm + '월 법인차량 운영 법인카드 정산: ' + r.purpose;
  if (card && (c.no === '6026' || /야근/.test(r.purpose))) { const n = num((/(\d+)명/.exec(r.purpose) || [])[1]) || 1; return c.mno + ' ' + mm + '월 ' + dept + ' 야근식대(' + r.who + (n > 1 ? ' 외 ' + (n - 1) + '명' : '') + ')'; }
  if (r.item === '소모품비') return card ? c.mno + ' ' + mm + '월 ' + dept + ' 소모품비: ' + r.purpose : mm + '월 ' + dept + ' 소모품비: ' + r.purpose + ' (' + r.who + ')';
  if (card) return c.mno + ' ' + mm + '월 ' + dept + ' ' + r.purpose;
  if (r.pay === '개인 정산') return dept + ' ' + mm + '월 개인지출(' + r.who + ') 정산: ' + r.purpose;
  return mm + '월 ' + dept + ' ' + r.purpose;
}
function pairLines(r, mm, ev) {
  const m = memo(r, mm, ev), acct = ev ? '주요행사비' : r.item, code = CODES[acct] || '?', c = cardInfo(r), tr = DEPT_TR[r.dept] || DEPT_TR['총무국'];
  const L = [];
  if (r.pay.startsWith('카드')) {
    const ctr = [c.vcode, '법인카드(#' + c.no + ')'];
    L.push({ fg: '차', code, name: acct, tr: ctr, amt: r.amt, memo: m, bgt: '집행 ' + (BGT[code] || '') });
    L.push({ fg: '대', code: '26201', name: '미지급금(법인카드)', tr: ctr, amt: r.amt, memo: m, bgt: '일반' });
  } else if (r.pay === '개인 정산') {
    L.push({ fg: '차', code, name: acct, tr, amt: r.amt, memo: m, bgt: '집행 ' + (BGT[code] || '') });
    L.push({ fg: '대', code: '26202', name: '미지급금', tr, amt: r.amt, memo: m, bgt: '일반' });
  } else if (r.pay === '자동이체') {
    L.push({ fg: '차', code, name: acct, tr: ['', r.vendor], amt: r.amt, memo: m, bgt: '집행 ' + (BGT[code] || '') });
    L.push({ fg: '대', code: '10301', name: '보통예금', tr: ['90000', '보통예금'], amt: r.amt, memo: m, bgt: '일반' });
  } else {
    const early = +r.date.slice(8) <= 25;
    L.push({ fg: '차', code, name: acct, tr: ['', r.vendor], amt: r.amt, memo: m, bgt: '집행 ' + (BGT[code] || '') });
    L.push({ fg: '차', code: '13500', name: '선급금', tr: ['', r.vendor], amt: 0, memo: m, bgt: '일반' });
    L.push(early ? { fg: '대', code: '10301', name: '보통예금', tr: ['90000', '보통예금'], amt: r.amt, memo: m, bgt: '일반' } : { fg: '대', code: '26202', name: '미지급금', tr: ['', r.vendor], amt: r.amt, memo: m, bgt: '일반' });
  }
  return L;
}
function vouchers(dept, mm) {
  const ym = '2026-' + String(mm).padStart(2, '0');
  const rs = S.ledger.filter(r => r.dept === dept && r.date.slice(0, 7) === ym).sort((a, b) => a.date < b.date ? -1 : 1);
  const groups = {};
  rs.forEach(r => {
    const ev = r.event ? EVENTS.find(e => e.id === r.event) : null;
    let key, title;
    if (ev) { key = 'E|' + ev.id + '|' + (r.pay.startsWith('카드') ? '카드' : r.pay); title = '[행사결산]' + ev.name + ' ' + (r.pay.startsWith('카드') ? '법인카드' : r.pay === '개인 정산' ? '개인정산' : '계산서'); }
    else if (r.pay.startsWith('카드')) { const c = cardInfo(r), sup = r.item === '소모품비'; key = 'C|' + c.no + (sup ? '|소모품' : ''); title = c.mno + ' ' + mm + '월 ' + dept + (c.no === '2171' ? ' 법인차량 운영 법인카드 정산' : c.no === '6026' ? ' 야근식대' : sup ? ' 소모품비' : ' 법인카드 정산'); }
    else if (r.pay === '개인 정산') { key = 'P|' + r.who; title = dept + ' ' + mm + '월 개인지출(' + r.who + ') 정산'; }
    else if (r.pay === '자동이체') { key = 'A|' + r.id; title = mm + '월 ' + dept + ' ' + r.purpose + '(' + r.vendor + ' 자동이체)'; }
    else { key = 'T|' + r.id; title = mm + '월 ' + dept + ' ' + r.purpose + '(' + r.vendor + ')'; }
    const g = groups[key] = groups[key] || { title, date: r.date, lines: [] };
    g.date = r.date > g.date ? r.date : g.date;
    g.lines.push(...pairLines(r, mm, ev));
  });
  return Object.values(groups).map(v => { const dr = sum(v.lines.filter(l => l.fg === '차'), l => l.amt), cr = sum(v.lines.filter(l => l.fg === '대'), l => l.amt); return Object.assign(v, { amt: dr, ok: dr === cr && v.lines.filter(l => l.fg === '차' && l.amt).length === v.lines.filter(l => l.fg === '대').length }); }).sort((a, b) => a.date < b.date ? -1 : 1);
}
V.t4 = () => {
  const dept = F.jd || (S.scope === '전체' ? '총무국' : S.scope), mm = F.jm || 9, vs = vouchers(dept, mm);
  let h = '<div class="note">총무국 굿바이G20 분개 규칙대로 만든 초안이에요. 법인카드 적요는 카드 M번호로 시작하고 차·대변 거래처는 카드 거래처코드예요. 개인정산은 부서 거래처(총무국 10024)에 이름을 적요에 넣고, 업체 이체는 13500 0원 줄을 더해 3줄이에요. 확정은 G20에서 해요.</div>';
  h += '<div class="c"><div class="row"><select class="sel" id="jd">' + DEPTS.map(d => '<option' + (d === dept ? ' selected' : '') + '>' + d + '</option>').join('') + '</select><select class="sel" id="jm">' + Array.from({ length: 10 }, (_, i) => '<option value="' + (i + 1) + '"' + (i + 1 === mm ? ' selected' : '') + '>' + (i + 1) + '월</option>').join('') + '</select><span class="mut">전표 ' + vs.length + '장 · ' + won(sum(vs, v => v.amt)) + '원 · 결의부서 ' + G20[dept] + '</span><span class="grow"></span>' +
    (vs.every(v => v.ok) ? '<span class="bd">차·대 모두 일치</span>' : '<span class="bd r">차·대 불일치 있음</span>') + '<button class="btn p" data-a="jcsv">G20 입력 파일 받기</button></div></div>';
  h += vs.map((v, i) => '<div class="c"><h3>#' + (i + 1) + ' ' + esc(v.title) + ' <span class="mut">' + v.date + ' · ' + (v.lines.length) + '줄 · ' + won(v.amt) + '원</span>' + (v.ok ? '' : ' <span class="bd r">차·대 불일치</span>') + '</h3><div class="tw"><table class="tb"><thead><tr><th>구분</th><th>계정</th><th>거래처</th><th>적요</th><th>예산</th><th class="n">금액</th></tr></thead><tbody>' +
    v.lines.map(l => '<tr><td>' + l.fg + '</td><td class="nw">' + l.code + ' ' + esc(l.name) + '</td><td class="nw">' + esc((l.tr[0] ? l.tr[0] + ' ' : '') + l.tr[1]) + '</td><td>' + esc(l.memo) + '</td><td class="nw mut">' + l.bgt + '</td><td class="n">' + won(l.amt) + '</td></tr>').join('') + '</tbody></table></div></div>').join('') || '<div class="c">' + emptyBox('이 달 지출이 없어요.', '다른 달 보기', '#t4') + '</div>';
  return h;
};
ACT.jcsv = () => {
  const dept = F.jd || (S.scope === '전체' ? '총무국' : S.scope), mm = F.jm || 9;
  const out = [['전표번호', '일자', '결의부서', '구분', '계정코드', '계정명', '거래처코드', '거래처명', '금액', '적요', '예산구분']];
  vouchers(dept, mm).forEach((v, i) => v.lines.forEach(l => out.push([i + 1, v.date, G20[dept], l.fg === '차' ? '3' : '4', l.code, l.name, l.tr[0], l.tr[1], l.amt, l.memo, l.bgt])));
  download('G20_전표초안_' + dept + '_2026-' + String(mm).padStart(2, '0') + '.csv', toCSV(out));
};
document.addEventListener('change', e => { if (e.target.id === 'jd') { F.jd = e.target.value; render(); } if (e.target.id === 'jm') { F.jm = +e.target.value; render(); } });
