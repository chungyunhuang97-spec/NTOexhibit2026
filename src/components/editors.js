import { CATEGORIES, MODES, BOOKING_CATS, CITIES } from '../lib/constants';

const opts = (obj) => Object.entries(obj).map(([k, v]) => [k, v.label || v.name]);
const CURRENCY = [['EUR', '歐元 EUR'], ['CZK', '克朗 CZK'], ['TWD', '台幣 TWD']];
const STATUS_OPTS = [['todo', '未訂 / 待辦'], ['booked', '已訂 / 完成'], ['paid', '已付款']];
const CITY_OPTS = ['FRA', 'MUC', 'PRG', 'TPE'].map((c) => [c, CITIES[c].name]);

export const stopFields = (day) => [
  { name: 'name', label: '中文名稱' },
  { name: 'nameLocal', label: '當地原名（德文 / 捷克文）' },
  { name: 'time', label: '開始時間', type: 'time', half: true },
  { name: 'duration', label: '停留（分鐘）', type: 'number', half: true },
  { name: 'category', label: '類型', type: 'select', options: opts(CATEGORIES), half: true },
  ...(day?.plans
    ? [{ name: 'plan', label: '方案', type: 'select', options: [['', '共同行程'], ['A', `方案 A：${day.plans.A}`], ['B', `方案 B：${day.plans.B}`]], half: true }]
    : []),
  { name: 'outdoor', label: '戶外景點', type: 'toggle', hint: '冬季建議排在 11:00–15:00' },
  { name: 'address', label: '地址' },
  { name: 'note', label: '備註', type: 'textarea' },
  { name: 'ticketUrl', label: '官網 / 訂票連結', type: 'url', placeholder: 'https://' }
];

export const legFields = (day) => [
  { name: 'mode', label: '交通方式', type: 'select', options: opts(MODES), half: true },
  { name: 'number', label: '車次 / 班號', half: true },
  { name: 'from', label: '出發', half: true },
  { name: 'to', label: '抵達', half: true },
  { name: 'dep', label: '出發時間', placeholder: '09:45', half: true },
  { name: 'arr', label: '抵達時間', placeholder: '15:30', half: true },
  { name: 'operator', label: '業者' },
  ...(day?.plans
    ? [{ name: 'plan', label: '方案', type: 'select', options: [['', '共同行程'], ['A', `方案 A：${day.plans.A}`], ['B', `方案 B：${day.plans.B}`]] }]
    : []),
  { name: 'note', label: '說明', type: 'textarea' },
  { name: 'linkUrl', label: '訂票連結', type: 'url', placeholder: 'https://' }
];

export const bookingFields = [
  { name: 'title', label: '項目' },
  { name: 'cat', label: '分類', type: 'select', options: opts(BOOKING_CATS).filter(([k]) => k !== 'refund'), half: true },
  { name: 'status', label: '狀態', type: 'select', options: STATUS_OPTS, half: true },
  { name: 'date', label: '使用日期', type: 'date', half: true },
  { name: 'due', label: '截止日期', type: 'date', half: true },
  { name: 'price', label: '金額', type: 'number', half: true },
  { name: 'currency', label: '幣別', type: 'select', options: CURRENCY, half: true },
  { name: 'ref', label: '訂位代號 / 確認碼' },
  { name: 'url', label: '訂票連結', type: 'url', placeholder: 'https://' },
  { name: 'note', label: '備註', type: 'textarea' }
];

export const lodgingFields = [
  { name: 'name', label: '飯店名稱' },
  { name: 'address', label: '地址', hint: '用上方搜尋選擇飯店，會自動帶入地址並顯示在地圖上' },
  { name: 'checkIn', label: '入住', type: 'date', half: true },
  { name: 'checkOut', label: '退房', type: 'date', half: true },
  { name: 'status', label: '狀態', type: 'select', options: STATUS_OPTS, half: true },
  { name: 'ref', label: '訂房代號', half: true },
  { name: 'note', label: '備註', type: 'textarea' }
];

export const dayFields = [
  { name: 'title', label: '當日主題' },
  { name: 'city', label: '城市', type: 'select', options: CITY_OPTS },
  { name: 'note', label: '當日備註', type: 'textarea' }
];

export const shopFields = [
  { name: 'item', label: '品項' },
  { name: 'store', label: '店家 / 地點', half: true },
  { name: 'city', label: '城市', type: 'select', options: CITY_OPTS.slice(0, 3), half: true },
  { name: 'note', label: '備註（規格、幫誰買）', type: 'textarea' }
];

export const refundFields = [
  { name: 'store', label: '店家' },
  { name: 'city', label: '城市', type: 'select', options: CITY_OPTS.slice(0, 3), half: true },
  { name: 'date', label: '購買日期', type: 'date', half: true },
  { name: 'amount', label: '金額', type: 'number', half: true },
  { name: 'currency', label: '幣別', type: 'select', options: CURRENCY.slice(0, 2), half: true },
  { name: 'stamped', label: '已在機場蓋海關章', type: 'toggle' },
  { name: 'note', label: '備註', type: 'textarea' }
];
