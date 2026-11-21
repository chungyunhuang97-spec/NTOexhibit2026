import {
  Landmark, TrainFront, Castle, UtensilsCrossed, Church, Building2, ShoppingBag,
  Trees, Coffee, Mountain, MapPin, Hotel, Plane, Bus, TramFront, Footprints,
  TrainTrack, Eye, Store, Ticket, ClipboardCheck, BedDouble, Receipt
} from 'lucide-react';

export const CITIES = {
  TPE: { code: 'TPE', name: '台北', local: 'Taipei', color: '#8A8F94', tz: 'Asia/Taipei', center: [121.23, 25.08] },
  FRA: { code: 'FRA', name: '法蘭克福', local: 'Frankfurt am Main', color: '#5B6B7A', tz: 'Europe/Berlin', center: [8.6821, 50.1109], country: 'DE' },
  MUC: { code: 'MUC', name: '慕尼黑', local: 'München', color: '#A8926C', tz: 'Europe/Berlin', center: [11.5755, 48.1374], country: 'DE' },
  PRG: { code: 'PRG', name: '布拉格', local: 'Praha', color: '#B0694F', tz: 'Europe/Prague', center: [14.4213, 50.0875], country: 'CZ' }
};

export const CATEGORIES = {
  museum: { label: '博物館', icon: Landmark, outdoor: false },
  exhibition: { label: '展覽', icon: Building2, outdoor: false },
  shopping: { label: '購物', icon: ShoppingBag, outdoor: false },
  market: { label: '市集', icon: Store, outdoor: false },
  food: { label: '餐廳', icon: UtensilsCrossed, outdoor: false },
  cafe: { label: '咖啡', icon: Coffee, outdoor: false },
  castle: { label: '城堡', icon: Castle, outdoor: true },
  church: { label: '教堂', icon: Church, outdoor: false },
  landmark: { label: '地標', icon: MapPin, outdoor: true },
  viewpoint: { label: '觀景', icon: Eye, outdoor: false },
  park: { label: '公園', icon: Trees, outdoor: true },
  nature: { label: '自然', icon: Mountain, outdoor: true },
  station: { label: '車站', icon: TrainFront, outdoor: false },
  airport: { label: '機場', icon: Plane, outdoor: false },
  hotel: { label: '住宿', icon: Hotel, outdoor: false },
  other: { label: '其他', icon: MapPin, outdoor: false }
};

export const MODES = {
  flight: { label: '航班', icon: Plane },
  ice: { label: '火車', icon: TrainTrack },
  train: { label: '區域火車', icon: TrainFront },
  sbahn: { label: '市區鐵路', icon: TramFront },
  bus: { label: '巴士', icon: Bus },
  walk: { label: '步行', icon: Footprints }
};

export const BOOKING_CATS = {
  flight: { label: '航班', icon: Plane },
  transport: { label: '交通', icon: TrainTrack },
  lodging: { label: '住宿', icon: BedDouble },
  ticket: { label: '門票', icon: Ticket },
  prep: { label: '出發準備', icon: ClipboardCheck },
  refund: { label: '退稅', icon: Receipt }
};

export const STATUS = {
  todo: { label: '未訂', taskLabel: '待辦' },
  booked: { label: '已訂', taskLabel: '完成' },
  paid: { label: '已付款', taskLabel: '完成' }
};

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 冬季戶外建議時段
export const OUTDOOR_START = '11:00';
export const OUTDOOR_END = '15:00';

// 一月氣候平均（無即時預報時顯示）
export const CLIMATE = {
  FRA: { lo: -1, hi: 4 },
  MUC: { lo: -4, hi: 2 },
  PRG: { lo: -4, hi: 1 }
};

// 德國＋捷克範圍（minLon, minLat, maxLon, maxLat）
export const SEARCH_BBOX = [5.8, 47.2, 18.9, 55.1];
