// 예시 자료. 실제 장부가 아니며, 「자료 올리기」로 더존·카드사 엑셀을 넣으면 그 자료로 바뀝니다.
const TODAY = '2026-10-15';
const YEAR = 2026;
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const DEPTS = ['총무국', '기획국', '문화홍보국', '미래인재국'];
const BUDGET = [
  // 국, 예산과목, 2026 연 예산
  ['총무국', '복리후생비(기타)', 6000000], ['총무국', '여비교통비(단기)', 4800000], ['총무국', '소모품비', 3600000], ['총무국', '차량유지비', 4200000],
  ['총무국', '도서인쇄비', 1200000], ['총무국', '통신비', 1800000], ['총무국', '지급수수료(기타)', 6000000],
  ['기획국', '주요행사비', 12000000], ['기획국', '여비교통비(단기)', 3000000], ['기획국', '부서 회의비', 2400000], ['기획국', '도서인쇄비', 900000],
  ['문화홍보국', '지급수수료(용역)', 9000000], ['문화홍보국', '주요행사비', 7000000], ['문화홍보국', '도서인쇄비', 2400000], ['문화홍보국', '부서 회의비', 1200000],
  ['미래인재국', '교육훈련비', 10000000], ['미래인재국', '주요행사비', 9000000], ['미래인재국', '여비교통비(단기)', 2600000], ['미래인재국', '소모품비', 1100000],
];
const VENDORS = {
  '복리후생비(기타)': [['한솥도시락 종로점', '야근 저녁'], ['스타벅스 광화문점', '외부 손님 음료'], ['꽃담화원', '경조 화환'], ['맛나김밥 종로점', '회의 점심']],
  '여비교통비(단기)': [['코레일', 'KTX 출장'], ['카카오T', '외근 택시'], ['대한항공', '제주 출장 항공'], ['부산 호텔K', '출장 숙박']],
  '소모품비': [['오피스디포 종로점', '복사용지·토너'], ['쿠팡(주)', '사무용품'], ['다이소 종로점', '정리용품'], ['한빛문구', '필기구']],
  '차량유지비': [['SK에너지 종로주유소', '법인차 주유'], ['스피드메이트 종로', '엔진오일 교환'], ['종로공영주차장', '주차료'], ['한국도로공사', '통행료']],
  '도서인쇄비': [['교보문고 광화문', '업무 도서'], ['종로인쇄', '명함·인쇄물'], ['예스24', '자료 구입']],
  '통신비': [['SK텔레콤', '업무 휴대폰 요금'], ['우체국 광화문', '등기 우편'], ['CJ대한통운', '택배']],
  '지급수수료(기타)': [['신도리코', '복합기 렌탈'], ['에스원', '보안 서비스'], ['코웨이', '정수기 렌탈'], ['더존비즈온', '회계 프로그램 사용료']],
  '주요행사비': [['한빛컨벤션', '행사장 대관'], ['맛있는도시락', '행사 식사'], ['서울현수막', '현수막'], ['달콤제과', '행사 다과'], ['굿즈공방', '기념품']],
  '부서 회의비': [['한식당 소담', '회의 식사'], ['카페 온기', '회의 다과'], ['스타벅스 시청점', '회의 음료']],
  '지급수수료(용역)': [['네이버(주)', '온라인 광고'], ['메타플랫폼스', 'SNS 광고'], ['디자인공방', '홍보물 디자인'], ['종로인쇄', '리플렛 인쇄']],
  '교육훈련비': [['한국생산성본부', '직무 교육'], ['휴넷', '온라인 교육'], ['청소년수련원', '수련 프로그램'], ['강사료(개인)', '외부 강사']],
};
const CARDS = [
  { no: '3418', name: '총무국 공용', dept: '총무국', holder: '김정래', mno: 'M913418', vcode: '96984' }, { no: '2171', name: '총무국 차량', dept: '총무국', holder: '이예시', mno: 'M912171', vcode: '96985' },
  { no: '6026', name: '야근식대', dept: '총무국', holder: '정예시', mno: 'M916026', vcode: '96986' }, { no: '5591', name: '기획국 공용', dept: '기획국', holder: '박예시', mno: 'M915591', vcode: '96987' },
  { no: '7710', name: '문화홍보국 공용', dept: '문화홍보국', holder: '서예시', mno: 'M917710', vcode: '96988' }, { no: '8823', name: '미래인재국 공용', dept: '미래인재국', holder: '강예시', mno: 'M918823', vcode: '96989' },
];
const PEOPLE = { '총무국': ['김정래', '이예시', '정예시'], '기획국': ['박예시', '최예시', '한예시'], '문화홍보국': ['서예시', '문예시'], '미래인재국': ['강예시', '윤예시'] };
const EVENTS = [
  { id: 'ev1', name: '청년리더 워크숍', dept: '기획국', date: '2026-10-24', budget: 3000000, people: 24, prev: 'pv1', place: '한빛컨벤션',
    plan: [['장소 대관', 900000, '지급수수료(기타)', 900000, 1, 1, '행사장 1일 대관'], ['식사(2끼)', 1200000, '복리후생비', 25000, 24, 2, '24명 × 2끼'], ['다과', 350000, '복리후생비', 350000, 1, 1, '오전·오후 다과'], ['인쇄물', 250000, '소모품비', 250000, 1, 1, '자료집·명찰'], ['기념품', 300000, '기타', 12500, 24, 1, '참가자 기념품']] },
  { id: 'ev2', name: '추계 직원 체육대회', dept: '총무국', date: '2026-10-30', budget: 2500000, people: 45, prev: 'pv2', place: '종로구민 운동장',
    plan: [['운동장 대관', 600000, '지급수수료(기타)', 600000, 1, 1, '운동장 1일 대관'], ['도시락', 1350000, '복리후생비', 30000, 45, 1, '45명 점심'], ['상품', 450000, '기타', 450000, 1, 1, '경기 상품'], ['현수막', 100000, '소모품비', 50000, 2, 1, '현수막 2개']] },
  { id: 'ev3', name: '가을 문화제', dept: '문화홍보국', date: '2026-11-07', budget: 5000000, people: 300, prev: 'pv3', place: '협회 본부 대강당',
    plan: [['무대·음향', 2200000, '지급수수료(기타)', 2200000, 1, 1, '무대·음향 1식'], ['홍보물', 900000, '소모품비', 900000, 1, 1, '포스터·리플렛'], ['다과', 800000, '복리후생비', 2667, 300, 1, '300명 다과'], ['기념품', 1100000, '기타', 3667, 300, 1, '300명 기념품']] },
  { id: 'ev4', name: '하계 청소년 수련회', dept: '미래인재국', date: '2026-07-28', budget: 8000000, people: 120, prev: 'pv4', done: true, place: '청소년수련원',
    plan: [['수련원 대관', 3600000, '지급수수료(기타)', 30000, 120, 1, '120명 1박'], ['식사', 2880000, '복리후생비', 8000, 120, 3, '120명 × 3끼'], ['강사료', 900000, '잡급', 300000, 1, 3, '외부 강사 3회'], ['교재', 620000, '소모품비', 620000, 1, 1, '교재 인쇄']] },
];
const PREV = { pv1: { name: '청년리더 워크숍 2025', total: 2710000, people: 22 }, pv2: { name: '추계 직원 체육대회 2025', total: 2290000, people: 41 },
  pv3: { name: '가을 문화제 2025', total: 4620000, people: 260 }, pv4: { name: '하계 청소년 수련회 2025', total: 7480000, people: 105 } };
const RECUR = [
  { name: '업무 휴대폰 요금', vendor: 'SK텔레콤', day: 17, amt: 55000, dept: '총무국', item: '통신비', pay: '카드 #3418' },
  { name: '정수기 렌탈', vendor: '코웨이', day: 20, amt: 33000, dept: '총무국', item: '지급수수료(기타)', pay: '자동이체' },
  { name: '복합기 렌탈', vendor: '신도리코', day: 25, amt: 132000, dept: '총무국', item: '지급수수료(기타)', pay: '자동이체' },
  { name: '보안 서비스', vendor: '에스원', day: 28, amt: 88000, dept: '총무국', item: '지급수수료(기타)', pay: '자동이체' },
  { name: '회계 프로그램 사용료', vendor: '더존비즈온', day: 5, amt: 165000, dept: '총무국', item: '지급수수료(기타)', pay: '자동이체' },
  { name: '신문 구독', vendor: '조선일보', day: 3, amt: 20000, dept: '총무국', item: '도서인쇄비', pay: '자동이체' },
];
// 월별 계절 흐름(1~12월)
const SEASON = [0.7, 0.8, 1.0, 1.05, 1.0, 0.95, 1.25, 1.1, 0.95, 1.0, 1.05, 1.15];

const sum0 = a => a.reduce((s, x) => s + x, 0);
function genLedger() {
  const r = rng(20261015), out = [];
  let id = 0;
  const add = o => { o.id = 'L' + (++id); out.push(o); };
  // 과목별 올해 집행 비율(10/15 기준). 일부러 빠른 과목을 몇 개 둠
  const RATIO = { '기획국|부서 회의비': 0.68, '문화홍보국|지급수수료(용역)': 0.78, '총무국|소모품비': 0.84, '총무국|복리후생비(기타)': 0.62, '총무국|지급수수료(기타)': 0.05 };
  const recSum = (dept, item, y) => sum0(RECUR.filter(rc => rc.dept === dept && rc.item === item).map(rc => rc.amt * (y === 2025 ? 12 : (rc.day <= 15 ? 10 : 9) - (rc.name === '회계 프로그램 사용료' ? 1 : 0))));
  const weekdayFix = (y, m, d) => { const w = new Date(y, m - 1, d).getDay(); return w === 6 ? Math.max(1, d - 1) : w === 0 ? Math.max(1, d - 2) : d; };
  [2025, 2026].forEach(y => {
    BUDGET.forEach(([dept, item, annual]) => {
      if (item === '주요행사비') return; // 행사비는 아래에서 행사별로
      const yb = y === 2025 ? annual * 0.94 : annual;
      const bucket = [];
      for (let m = 1; m <= 12; m++) {
        if (y === YEAR && m > 10) break;
        let target = yb / 12 * SEASON[m - 1] * (0.82 + r() * 0.3);
        if (y === YEAR && m === 10) target *= 15 / 31;
        const vs = VENDORS[item];
        const n = 2 + Math.floor(r() * 5);
        for (let k = 0; k < n; k++) {
          const [vendor, purpose] = vs[Math.floor(r() * vs.length)];
          const days = y === YEAR && m === 10 ? 14 : 28;
          const d = weekdayFix(y, m, 1 + Math.floor(r() * days));
          let amt = Math.round(target / n * (0.6 + r() * 0.8) / 100) * 100;
          if (amt < 3000) amt = 3000 + Math.round(r() * 20) * 100;
          const card = CARDS.find(c => c.dept === dept && (item === '차량유지비' ? c.no === '2171' : c.no !== '2171' && c.no !== '6026')) || CARDS[0];
          const payR = r();
          const pay = payR < 0.68 ? '카드 #' + card.no : payR < 0.88 ? '개인 정산' : '계좌이체';
          const who = PEOPLE[dept][Math.floor(r() * PEOPLE[dept].length)];
          const date = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const receipt = !(y === YEAR && m >= 9 && pay.startsWith('카드') && r() < (m === 10 ? 0.2 : 0.05));
          bucket.push({ date, dept, item, vendor, purpose, amt, pay, who, receipt, event: '' });
        }
      }
      const want = yb * (y === 2025 ? 0.97 : (RATIO[dept + '|' + item] || (0.66 + r() * 0.16))) - recSum(dept, item, y);
      const got = sum0(bucket.map(x => x.amt)), k = got ? Math.max(0.05, want / got) : 1;
      bucket.forEach(x => { x.amt = Math.max(1000, Math.round(x.amt * k / 100) * 100); add(x); });
    });
    // 정기 지출
    RECUR.forEach(rc => {
      for (let m = 1; m <= 12; m++) {
        if (y === YEAR && (m > 10 || (m === 10 && rc.day > 15))) break;
        if (y === YEAR && m === 10 && rc.name === '회계 프로그램 사용료') continue;
        add({ date: y + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(rc.day, 28)).padStart(2, '0'), dept: rc.dept, item: rc.item, vendor: rc.vendor, purpose: rc.name, amt: rc.amt, pay: rc.pay, who: '김정래', receipt: true, event: '', recur: rc.name });
      }
    });
  });
  // 야근식대 카드 #6026
  for (let m = 1; m <= 10; m++) for (let k = 0; k < 4; k++) {
    const d = 1 + Math.floor(r() * (m === 10 ? 14 : 27));
    add({ date: '2026-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'), dept: '총무국', item: '복리후생비(기타)', vendor: '한솥도시락 종로점', purpose: '야근 저녁 ' + (2 + (k % 3)) + '명', amt: 10000 * (2 + (k % 3)), pay: '카드 #6026', who: '정예시', receipt: !(m === 10 && k === 3), event: '' });
  }
  // 행사 지출
  EVENTS.forEach(ev => {
    const ratio = ev.done ? 0.97 : ev.id === 'ev1' ? 0.46 : ev.id === 'ev2' ? 0.18 : 0.31;
    const card = CARDS.find(c => c.dept === ev.dept);
    ev.plan.forEach(([what, plan, sub], i) => {
      const spent = Math.round(plan * ratio * (0.8 + r() * 0.4) / 1000) * 1000;
      if (!spent) return;
      const vs = VENDORS['주요행사비'];
      const v = vs[i % vs.length][0];
      const base = ev.done ? '2026-07-' + String(10 + i * 3).padStart(2, '0') : '2026-10-' + String(2 + i * 2).padStart(2, '0');
      add({ date: base, dept: ev.dept, item: '주요행사비', vendor: v, purpose: what, amt: spent, pay: i % 3 === 0 ? '카드 #' + card.no : i % 3 === 1 ? '계좌이체' : '개인 정산', who: PEOPLE[ev.dept][i % PEOPLE[ev.dept].length], receipt: true, event: ev.id, plan: what, sub });
    });
  });
  // 2025 행사비(비교용)
  Object.entries(PREV).forEach(([k, p]) => {
    const ev = EVENTS.find(e => e.prev === k);
    add({ date: '2025-' + ev.date.slice(5), dept: ev.dept, item: '주요행사비', vendor: '(2025 행사 합계)', purpose: p.name, amt: p.total, pay: '계좌이체', who: PEOPLE[ev.dept][0], receipt: true, event: k });
  });
  // 점검에 걸리도록 넣은 사례
  add({ date: '2026-10-08', dept: '총무국', item: '소모품비', vendor: '쿠팡(주)', purpose: '사무실 멀티탭', amt: 41900, pay: '카드 #3418', who: '김정래', receipt: true, event: '' });
  add({ date: '2026-10-08', dept: '총무국', item: '소모품비', vendor: '쿠팡(주)', purpose: '사무실 멀티탭(중복 의심)', amt: 41900, pay: '개인 정산', who: '이예시', receipt: true, event: '' });
  add({ date: '2026-10-11', dept: '기획국', item: '부서 회의비', vendor: '한식당 소담', purpose: '외부 협력 회의 식사', amt: 290000, pay: '카드 #5591', who: '한예시', receipt: true, event: '' });
  add({ date: '2026-10-11', dept: '기획국', item: '부서 회의비', vendor: '한식당 소담', purpose: '외부 협력 회의 식사(2)', amt: 280000, pay: '카드 #5591', who: '한예시', receipt: true, event: '' });
  add({ date: '2026-10-04', dept: '문화홍보국', item: '지급수수료(용역)', vendor: '디자인공방', purpose: '문화제 포스터 디자인', amt: 1500000, pay: '개인 정산', who: '서예시', receipt: false, event: '' });
  add({ date: '2026-10-12', dept: '총무국', item: '복리후생비(기타)', vendor: '한솥도시락 종로점', purpose: '야근 저녁 2명', amt: 26000, pay: '카드 #6026', who: '정예시', receipt: true, event: '' });
  add({ date: '2026-10-13', dept: '총무국', item: '복리후생비(기타)', vendor: '맛나김밥 종로점', purpose: '교구 회의 점심 4명', amt: 32000, pay: '카드 #3418', who: '김정래', receipt: false, event: '' });
  add({ date: '2026-10-10', dept: '미래인재국', item: '교육훈련비', vendor: '스타벅스 시청점', purpose: '토요일 사용', amt: 38500, pay: '카드 #8823', who: '강예시', receipt: true, event: '' });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

const MYCLAIMS = [
  { id: 'm1', date: '2026-09-30', what: '부산교구 회계 점검 출장(9/29~30)', kind: '출장여비', amt: 279600, stage: 5, paid: '2026-10-10' },
  { id: 'm2', date: '2026-10-06', what: '10/6 야근 저녁 3명', kind: '야근식대', amt: 30000, stage: 4, pay: '2026-10-25' },
  { id: 'm3', date: '2026-10-08', what: '10/8 야근 뒤 귀가 택시', kind: '시내교통', amt: 23400, stage: 2 },
  { id: 'm4', date: '2026-10-10', what: '세무 실무서 1권', kind: '도서인쇄', amt: 38000, stage: 3 },
  { id: 'm5', date: '2026-10-11', what: '교구 공문 원본 퀵 발송', kind: '우편택배', amt: 15000, stage: 1 },
  { id: 'm6', date: '2026-10-14', what: '청년리더 워크숍 사전 답사 교통비', kind: '시내교통', amt: 12800, stage: 0 },
];
const ADVANCES = [
  { who: '박예시', dept: '기획국', type: '가지급', date: '2026-10-01', amt: 1000000, used: 0, what: '청년리더 워크숍 현장 경비', due: '2026-10-31' },
  { who: '김정래', dept: '총무국', type: '가지급', date: '2026-09-15', amt: 300000, used: 262000, what: '교구 순회 점검 현장 경비', due: '2026-09-30' },
  { who: '한빛컨벤션', dept: '기획국', type: '선급', date: '2026-09-20', amt: 500000, used: 0, what: '워크숍 대관 계약금', due: '2026-10-24' },
  { who: '서예시', dept: '문화홍보국', type: '가지급', date: '2026-10-06', amt: 2000000, used: 640000, what: '가을 문화제 준비', due: '2026-11-14' },
  { who: '청소년수련원', dept: '미래인재국', type: '선급', date: '2026-06-10', amt: 1800000, used: 1800000, what: '수련원 계약금', due: '2026-07-31', done: true },
  { who: '강예시', dept: '미래인재국', type: '가지급', date: '2026-08-25', amt: 400000, used: 0, what: '진로 캠프 사전 준비', due: '2026-09-15' },
];
const DEADLINES = [
  ['2026-10-05', '9월 법인카드 내역 마감', 'i'], ['2026-10-10', '9월 결산 마감', 'r'], ['2026-10-16', '개인 정산 제출 마감', 'w'], ['2026-10-20', '행사 결산 제출', 'w'],
  ['2026-10-25', '정기 지급(25일)', 'ok'], ['2026-10-30', '법인카드 결제일', 'i'], ['2026-10-31', '10월 월말 대사', 'r'], ['2026-10-09', '한글날', 'g'], ['2026-10-05', '대체공휴일', 'g'],
  ['2026-11-05', '10월 법인카드 내역 마감', 'i'], ['2026-11-10', '10월 결산 마감', 'r'],
];
// 영수증 판독 예시
const SAMPLES = [
  { id: 's1', name: '김밥집 카드 영수증', note: '선명', rc: ['맛나김밥 종로점', '서울 종로구 종로 12', '2026-10-13 12:41', '김밥 x4   16,000', '라면 x2   10,000', '음료 x4    6,000', '합계      32,000', '카드 ****-3418 일시불'],
    items: [{ vendor: ['맛나김밥 종로점', 'hi'], date: ['2026-10-13', 'hi'], amt: [32000, 'hi'], card: ['3418', 'hi'] }] },
  { id: 's2', name: '문구점 현금 영수증', note: '가맹점 일부 흐림', rc: ['ㅎ빛문구', '현금영수증(소득공제)', '2026.10.12', '견출지 외 5종', '공급가    20,910', '부가세     2,090', '합계      23,000'],
    items: [{ vendor: ['한빛문구', 'mid', 'ㅎ빛문구'], date: ['2026-10-12', 'hi'], amt: [23000, 'hi'], card: ['', 'hi'] }] },
  { id: 's3', name: '흐리게 찍힌 영수증', note: '흐림', blur: true, rc: ['???마트', '2026-1?-11', '..........', '합 계  9,8?0'],
    items: [{ vendor: ['', 'lo'], date: ['2026-10-11', 'lo'], amt: [9800, 'lo'], card: ['', 'mid'] }] },
  { id: 's4', name: '한 사진에 영수증 2장', note: '여러 장', rc: ['[1] 다이소 종로점  2026-10-13', '    케이블타이 외   5,000', '-------- 잘린 선 --------', '[2] 세븐일레븐 광화문 2026-10-13', '    생수 2         2,400'],
    items: [{ vendor: ['다이소 종로점', 'hi'], date: ['2026-10-13', 'hi'], amt: [5000, 'hi'], card: ['', 'hi'] }, { vendor: ['세븐일레븐 광화문', 'hi'], date: ['2026-10-13', 'hi'], amt: [2400, 'mid'], card: ['', 'hi'] }] },
];
// 실시간 흐름 시연에 쓰는 카드 사용
const LIVE_POOL = [
  ['총무국', '소모품비', '오피스디포 종로점', '토너 2개', 96000, '3418', '김정래'], ['기획국', '주요행사비', '달콤제과', '워크숍 다과 추가', 120000, '5591', '박예시', 'ev1'],
  ['총무국', '차량유지비', 'SK에너지 종로주유소', '법인차 주유', 70000, '2171', '이예시'], ['문화홍보국', '지급수수료(용역)', '메타플랫폼스', '문화제 SNS 광고', 300000, '7710', '서예시'],
  ['미래인재국', '교육훈련비', '휴넷', '직무 온라인 교육', 154000, '8823', '강예시'], ['총무국', '복리후생비(기타)', '한솥도시락 종로점', '야근 저녁 3명', 30000, '6026', '정예시'],
  ['기획국', '부서 회의비', '카페 온기', '기획 회의 다과', 46000, '5591', '최예시'], ['문화홍보국', '주요행사비', '굿즈공방', '문화제 기념품 1차', 550000, '7710', '문예시', 'ev3'],
];
