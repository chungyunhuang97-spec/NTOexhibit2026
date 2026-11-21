// 預設行程：2027/1/11–1/22 法蘭克福・慕尼黑・布拉格
// 步調鬆散、以逛街為主；戶外景點排 11:00–15:00，室內與購物排早晚。
// 座標為預設參考值，可在 App 內重新搜尋覆蓋。

const DB = 'https://www.bahn.com/en';
const RMV = 'https://www.rmv.de/c/en/tickets';
const MVV = 'https://www.mvv-muenchen.de/en/tickets-and-fares/index.html';
const PID = 'https://pid.cz/en/tickets/';

export const SEED_VERSION = 2;

// 已在使用中的旅程，開啟時會自動套用這些更新（只覆蓋列出的項目，其他修改保留）
export const SEED_UPDATES = {
  2: {
    upsert: ['meta', 'l_fra', 'l_muc', 'l_prg', 'd0120', 'd0121', 'd0122', 'd0123', 'g_out', 'g_muc_arr', 'g_muc_day', 'g_pid',
      'g_prg_air', 'g_return', 's_kampa', 's_louvre', 's_farewell', 'b_return', 'b_return_meal', 'b_l_fra', 'b_l_muc', 'b_l_prg'],
    remove: []
  }
};

export const seedItems = [
  {
    id: 'meta',
    kind: 'meta',
    title: '德國・布拉格 2027',
    subtitle: 'Heimtextil 參展與冬季散步',
    travelers: ['佑辰', '弟弟'],
    start: '2027-01-11',
    end: '2027-01-23',
    seedVersion: 2,
    rates: { EUR: 35, CZK: 1.4 }
  },

  // ---------- 住宿 ----------
  { id: 'l_fra', kind: 'lodging', city: 'FRA', name: 'STAYERY Frankfurt Sachsenhausen', address: '', lat: null, lng: null, checkIn: '2027-01-12', checkOut: '2027-01-14', status: 'booked', ref: '', note: '已訂。紅眼班機早上抵達，先詢問飯店能否提早寄放行李。點上方搜尋「STAYERY Frankfurt」可帶入地址與地圖位置。' },
  { id: 'l_muc', kind: 'lodging', city: 'MUC', name: 'INNSiDE München Parkstadt Schwabing', address: 'Mies-van-der-Rohe-Straße 10, 80807 München, 德國', lat: 48.1786, lng: 11.5879, checkIn: '2027-01-14', checkOut: '2027-01-17', status: 'paid', ref: '2606409219', note: 'The INNSiDE Room，1 房 2 人，已預付 €557.07（含 2,000 積分折抵）。入住 15:00 起、退房 12:00 前。位於市中心北邊的 Schwabing，搭 U6 到瑪利亞廣場約 15 分。' },
  { id: 'l_prg', kind: 'lodging', city: 'PRG', name: '布拉格住宿（未訂）', address: '', lat: null, lng: null, checkIn: '2027-01-17', checkOut: '2027-01-22', status: 'todo', ref: '', note: '共 5 晚。1/22 早上 10:30 的班機，前往機場約 45 分。建議住舊城區（Staré Město）或新城區（Nové Město）靠近共和國廣場，步行可到逛街區與查理大橋。' },

  // ---------- 每日 ----------
  { id: 'd0111', kind: 'day', date: '2027-01-11', city: 'TPE', title: '出發', note: '桃園 T1 報到。華航提醒：1/10 前預訂餐點。', lodgingId: null, tags: [] },
  { id: 'd0112', kind: 'day', date: '2027-01-12', city: 'FRA', title: '抵達・展覽首日', note: '紅眼班機剛落地，下午才進場，晚上早點休息調時差。', lodgingId: 'l_fra', tags: ['展會'] },
  { id: 'd0113', kind: 'day', date: '2027-01-13', city: 'FRA', title: 'Heimtextil・Zeil 逛街', note: '展場很大，先在官方 App 標好要看的展館。', lodgingId: 'l_fra', tags: ['展會'] },
  { id: 'd0114', kind: 'day', date: '2027-01-14', city: 'MUC', title: '舊城散步・前往慕尼黑', note: '展期到 1/15，今天中午後離開法蘭克福。', lodgingId: 'l_muc', tags: ['移動'] },
  { id: 'd0115', kind: 'day', date: '2027-01-15', city: 'MUC', title: '慕尼黑市中心逛街', note: '冬季折扣季，步行街一路逛下去。', lodgingId: 'l_muc', tags: [] },
  {
    id: 'd0116', kind: 'day', date: '2027-01-16', city: 'MUC', title: '一日遊（二選一）',
    note: '當天看天氣與體力決定。下雪或很冷就選方案 B。', lodgingId: 'l_muc', tags: ['備案'],
    plans: { A: '新天鵝堡', B: 'Ingolstadt Village 暢貨中心' }
  },
  { id: 'd0117', kind: 'day', date: '2027-01-17', city: 'PRG', title: '前往布拉格', note: '德國週日商店幾乎全關，剛好用來移動。布拉格週日商店大多照常營業。', lodgingId: 'l_prg', tags: ['移動', '週日'] },
  { id: 'd0118', kind: 'day', date: '2027-01-18', city: 'PRG', title: '城堡區・查理大橋', note: '布拉格部分博物館與美術館週一休館。', lodgingId: 'l_prg', tags: [] },
  { id: 'd0119', kind: 'day', date: '2027-01-19', city: 'PRG', title: '舊城・逛街日', note: '', lodgingId: 'l_prg', tags: [] },
  { id: 'd0120', kind: 'day', date: '2027-01-20', city: 'PRG', title: '自由日・伴手禮', note: '', lodgingId: 'l_prg', tags: [] },
  { id: 'd0121', kind: 'day', date: '2027-01-21', city: 'PRG', title: '最後一天・慢活', note: '最後一晚：伴手禮裝箱、退稅單據與護照放一起，隔天早上 7 點出發去機場。', lodgingId: 'l_prg', tags: [] },
  { id: 'd0122', kind: 'day', date: '2027-01-22', city: 'PRG', title: '回程', note: 'CI 068 10:30 起飛。退稅要在托運行李前先到海關蓋章，建議 07:30 前抵達機場。', lodgingId: null, tags: ['移動'] },
  { id: 'd0123', kind: 'day', date: '2027-01-23', city: 'TPE', title: '抵達台灣', note: '05:25 抵達桃園 T1。', lodgingId: null, tags: [] },

  // ---------- 景點：法蘭克福 ----------
  { id: 's_fair1', kind: 'stop', dayId: 'd0112', order: 0, name: 'Heimtextil 展覽（首日）', nameLocal: 'Messe Frankfurt', address: 'Ludwig-Erhard-Anlage 1, 60327 Frankfurt am Main, 德國', lat: 50.1118, lng: 8.6467, category: 'exhibition', outdoor: false, time: '13:30', duration: 240, note: '展期 1/12–1/15。展覽門票通常含 RMV 大眾運輸，購票時確認。', ticketUrl: 'https://heimtextil.messefrankfurt.com/' },
  { id: 's_dinner1', kind: 'stop', dayId: 'd0112', order: 1, name: '蘋果酒館晚餐', nameLocal: 'Apfelweinwirtschaft Adolf Wagner', address: 'Schweizer Str. 71, 60594 Frankfurt am Main, 德國', lat: 50.1007, lng: 8.6834, category: 'food', outdoor: false, time: '18:30', duration: 90, note: '法蘭克福傳統蘋果酒與綠醬。累的話改飯店附近簡單吃。' },

  { id: 's_fair2', kind: 'stop', dayId: 'd0113', order: 0, name: 'Heimtextil 展覽', nameLocal: 'Messe Frankfurt', address: 'Ludwig-Erhard-Anlage 1, 60327 Frankfurt am Main, 德國', lat: 50.1118, lng: 8.6467, category: 'exhibition', outdoor: false, time: '09:30', duration: 360, note: '' },
  { id: 's_zeil', kind: 'stop', dayId: 'd0113', order: 1, name: 'Zeil 購物大街', nameLocal: 'Zeil', address: 'Zeil, 60313 Frankfurt am Main, 德國', lat: 50.1144, lng: 8.6852, category: 'shopping', outdoor: false, time: '16:00', duration: 120, note: '法蘭克福最主要的購物街，dm、Rossmann 藥妝都在這一帶。' },
  { id: 's_myzeil', kind: 'stop', dayId: 'd0113', order: 2, name: 'MyZeil 購物中心', nameLocal: 'MyZeil', address: 'Zeil 106, 60313 Frankfurt am Main, 德國', lat: 50.1146, lng: 8.6801, category: 'shopping', outdoor: false, time: '18:00', duration: 60, note: '玻璃漩渦造型建築，平日約營業到 20:00。' },

  { id: 's_romer', kind: 'stop', dayId: 'd0114', order: 0, name: '羅馬廣場', nameLocal: 'Römerberg', address: 'Römerberg, 60311 Frankfurt am Main, 德國', lat: 50.1106, lng: 8.6821, category: 'landmark', outdoor: true, time: '11:00', duration: 45, note: '木造山牆老屋，附近的 Eiserner Steg 鐵橋可看美茵河。' },
  { id: 's_kmh', kind: 'stop', dayId: 'd0114', order: 1, name: '小市場大廳（午餐）', nameLocal: 'Kleinmarkthalle', address: 'Hasengasse 5-7, 60311 Frankfurt am Main, 德國', lat: 50.1128, lng: 8.6836, category: 'market', outdoor: false, time: '11:50', duration: 60, note: '室內市場，二樓有葡萄酒小站。週日休息。' },
  { id: 's_hbh', kind: 'stop', dayId: 'd0114', order: 2, name: '皇家啤酒屋（晚餐）', nameLocal: 'Hofbräuhaus München', address: 'Platzl 9, 80331 München, 德國', lat: 48.1376, lng: 11.5799, category: 'food', outdoor: false, time: '19:00', duration: 90, note: '抵達慕尼黑、放好行李後的第一餐。' },

  // ---------- 景點：慕尼黑 ----------
  { id: 's_marien', kind: 'stop', dayId: 'd0115', order: 0, name: '瑪利亞廣場・新市政廳', nameLocal: 'Marienplatz', address: 'Marienplatz, 80331 München, 德國', lat: 48.1374, lng: 11.5755, category: 'landmark', outdoor: true, time: '11:00', duration: 40, note: '新市政廳報時鐘 11:00、12:00 演出。' },
  { id: 's_vikt', kind: 'stop', dayId: 'd0115', order: 1, name: '穀物市場（午餐）', nameLocal: 'Viktualienmarkt', address: 'Viktualienmarkt 3, 80331 München, 德國', lat: 48.1351, lng: 11.5763, category: 'market', outdoor: true, time: '11:45', duration: 75, note: '露天市集，冬天攤位較少，可吃白香腸、喝熱湯。' },
  { id: 's_dallmayr', kind: 'stop', dayId: 'd0115', order: 2, name: 'Dallmayr 老牌熟食店', nameLocal: 'Dallmayr Delikatessenhaus', address: 'Dienerstraße 14-15, 80331 München, 德國', lat: 48.1385, lng: 11.5781, category: 'shopping', outdoor: false, time: '13:30', duration: 45, note: '咖啡豆、巧克力伴手禮。' },
  { id: 's_kaufinger', kind: 'stop', dayId: 'd0115', order: 3, name: 'Kaufingerstraße 步行街', nameLocal: 'Kaufingerstraße / Neuhauser Straße', address: 'Kaufingerstraße, 80331 München, 德國', lat: 48.1389, lng: 11.5713, category: 'shopping', outdoor: false, time: '14:30', duration: 150, note: '一路逛到 Karlsplatz，冬季折扣季。' },
  { id: 's_oberpollinger', kind: 'stop', dayId: 'd0115', order: 4, name: 'Oberpollinger 百貨', nameLocal: 'Oberpollinger', address: 'Neuhauser Str. 18, 80331 München, 德國', lat: 48.1392, lng: 11.5672, category: 'shopping', outdoor: false, time: '17:00', duration: 90, note: '精品與家居樓層。滿 50.01 歐可辦退稅。' },

  // 1/16 方案 A
  { id: 's_hohen', kind: 'stop', dayId: 'd0116', plan: 'A', order: 0, name: '新天鵝堡售票中心', nameLocal: 'Ticket Center Hohenschwangau', address: 'Alpseestraße 12, 87645 Schwangau, 德國', lat: 47.5555, lng: 10.7402, category: 'other', outdoor: false, time: '10:45', duration: 20, note: '線上預訂的票在這裡取。從這裡上山步行約 40 分，或搭接駁巴士 / 馬車。' },
  { id: 's_neusch', kind: 'stop', dayId: 'd0116', plan: 'A', order: 1, name: '新天鵝堡', nameLocal: 'Schloss Neuschwanstein', address: 'Neuschwansteinstraße 20, 87645 Schwangau, 德國', lat: 47.5576, lng: 10.7498, category: 'castle', outdoor: true, time: '11:30', duration: 180, note: '冬季開放時間縮短（約 10:00–16:00）。瑪麗安橋結冰時常封閉。導覽需預約時段。', ticketUrl: 'https://www.hohenschwangau.de/en' },
  { id: 's_fussen', kind: 'stop', dayId: 'd0116', plan: 'A', order: 2, name: '富森老城', nameLocal: 'Füssen Altstadt', address: 'Reichenstraße, 87629 Füssen, 德國', lat: 47.5696, lng: 10.7006, category: 'landmark', outdoor: false, time: '15:00', duration: 60, note: '回程前在火車站附近喝杯咖啡。' },
  // 1/16 方案 B
  { id: 's_ingolstadt', kind: 'stop', dayId: 'd0116', plan: 'B', order: 0, name: 'Ingolstadt Village 暢貨中心', nameLocal: 'Ingolstadt Village', address: 'Otto-Hahn-Straße 1, 85055 Ingolstadt, 德國', lat: 48.7673, lng: 11.4706, category: 'shopping', outdoor: false, time: '10:30', duration: 360, note: '約 110 家品牌暢貨店。服務中心可辦退稅單與領取遊客折扣卡。', ticketUrl: 'https://www.thebicestercollection.com/ingolstadt-village/en' },

  // ---------- 景點：布拉格 ----------
  { id: 's_oldtown_eve', kind: 'stop', dayId: 'd0117', order: 0, name: '舊城廣場夜景', nameLocal: 'Staroměstské náměstí', address: 'Staroměstské náměstí, 110 00 Praha 1, 捷克', lat: 50.0875, lng: 14.4213, category: 'landmark', outdoor: false, time: '17:30', duration: 45, note: '放好行李後散步，提恩教堂夜間打燈。' },
  { id: 's_lokal', kind: 'stop', dayId: 'd0117', order: 1, name: 'Lokál 捷克菜晚餐', nameLocal: 'Lokál Dlouhááá', address: 'Dlouhá 33, 110 00 Praha 1, 捷克', lat: 50.0904, lng: 14.4252, category: 'food', outdoor: false, time: '18:30', duration: 90, note: '新鮮桶裝皮爾森啤酒，建議訂位。' },

  { id: 's_castle', kind: 'stop', dayId: 'd0118', order: 0, name: '布拉格城堡', nameLocal: 'Pražský hrad', address: 'Hradčany, 119 08 Praha 1, 捷克', lat: 50.0911, lng: 14.4016, category: 'castle', outdoor: true, time: '11:00', duration: 150, note: '聖維特大教堂、黃金巷。可搭 22 號電車到 Pražský hrad 站，一路往下走比較輕鬆。', ticketUrl: 'https://www.hrad.cz/en' },
  { id: 's_charles', kind: 'stop', dayId: 'd0118', order: 1, name: '查理大橋', nameLocal: 'Karlův most', address: 'Karlův most, 110 00 Praha 1, 捷克', lat: 50.0865, lng: 14.4114, category: 'landmark', outdoor: true, time: '13:45', duration: 45, note: '' },
  { id: 's_savoy', kind: 'stop', dayId: 'd0118', order: 2, name: 'Café Savoy', nameLocal: 'Café Savoy', address: 'Vítězná 124/5, 150 00 Praha 5, 捷克', lat: 50.0810, lng: 14.4069, category: 'cafe', outdoor: false, time: '15:00', duration: 75, note: '新文藝復興天花板的老咖啡館。' },

  { id: 's_orloj', kind: 'stop', dayId: 'd0119', order: 0, name: '天文鐘', nameLocal: 'Pražský orloj', address: 'Staroměstské náměstí 1, 110 00 Praha 1, 捷克', lat: 50.0870, lng: 14.4207, category: 'landmark', outdoor: true, time: '11:00', duration: 30, note: '整點報時。' },
  { id: 's_parizska', kind: 'stop', dayId: 'd0119', order: 1, name: '巴黎大街', nameLocal: 'Pařížská', address: 'Pařížská, 110 00 Praha 1, 捷克', lat: 50.0900, lng: 14.4189, category: 'shopping', outdoor: false, time: '11:40', duration: 90, note: '精品街，旁邊就是猶太區。' },
  { id: 's_prikope', kind: 'stop', dayId: 'd0119', order: 2, name: 'Na Příkopě 購物街', nameLocal: 'Na Příkopě', address: 'Na Příkopě, 110 00 Praha 1, 捷克', lat: 50.0855, lng: 14.4260, category: 'shopping', outdoor: false, time: '14:00', duration: 120, note: '' },
  { id: 's_palladium', kind: 'stop', dayId: 'd0119', order: 3, name: 'Palladium 購物中心', nameLocal: 'Palladium', address: 'náměstí Republiky 1, 110 00 Praha 1, 捷克', lat: 50.0890, lng: 14.4290, category: 'shopping', outdoor: false, time: '16:00', duration: 120, note: '地下有超市，適合買零食伴手禮。' },

  { id: 's_vysehrad', kind: 'stop', dayId: 'd0120', order: 0, name: '高堡', nameLocal: 'Vyšehrad', address: 'V Pevnosti, 128 00 Praha 2, 捷克', lat: 50.0645, lng: 14.4180, category: 'landmark', outdoor: true, time: '11:00', duration: 120, note: '城牆上可遠眺伏爾塔瓦河，人少安靜。' },
  { id: 's_obecni', kind: 'stop', dayId: 'd0120', order: 1, name: '市民會館咖啡', nameLocal: 'Obecní dům', address: 'náměstí Republiky 5, 111 21 Praha 1, 捷克', lat: 50.0877, lng: 14.4280, category: 'cafe', outdoor: false, time: '15:00', duration: 60, note: '新藝術風格建築。' },
  { id: 's_botanicus', kind: 'stop', dayId: 'd0120', order: 2, name: 'Botanicus 天然保養品', nameLocal: 'Botanicus', address: 'Týn 3, 110 00 Praha 1, 捷克', lat: 50.0882, lng: 14.4246, category: 'shopping', outdoor: false, time: '16:15', duration: 45, note: '位於 Ungelt 庭院內。' },
  { id: 's_manufaktura', kind: 'stop', dayId: 'd0120', order: 3, name: 'Manufaktura', nameLocal: 'Manufaktura', address: 'Melantrichova 17, 110 00 Praha 1, 捷克', lat: 50.0858, lng: 14.4207, category: 'shopping', outdoor: false, time: '17:00', duration: 45, note: '啤酒與溫泉系列保養品。' },
  { id: 's_moser', kind: 'stop', dayId: 'd0120', order: 4, name: 'Moser 波希米亞水晶', nameLocal: 'Moser', address: 'Na Příkopě 12, 110 00 Praha 1, 捷克', lat: 50.0851, lng: 14.4243, category: 'shopping', outdoor: false, time: '17:50', duration: 40, note: '易碎品記得請店家加強包裝。' },

  { id: 's_kampa', kind: 'stop', dayId: 'd0121', order: 0, name: '列儂牆・坎帕島', nameLocal: 'Lennonova zeď / Kampa', address: 'Velkopřevorské náměstí, 118 00 Praha 1, 捷克', lat: 50.0863, lng: 14.4068, category: 'landmark', outdoor: true, time: '11:00', duration: 90, note: '查理大橋下的小島，河岸散步很安靜。' },
  { id: 's_louvre', kind: 'stop', dayId: 'd0121', order: 1, name: 'Café Louvre', nameLocal: 'Grand Café Louvre', address: 'Národní 22, 110 00 Praha 1, 捷克', lat: 50.0819, lng: 14.4189, category: 'cafe', outdoor: false, time: '14:30', duration: 75, note: '1902 年開業的老咖啡館，可以在這裡整理退稅單據。' },
  { id: 's_farewell', kind: 'stop', dayId: 'd0121', order: 2, name: '告別晚餐', nameLocal: 'U Fleků', address: 'Křemencova 11, 110 00 Praha 1, 捷克', lat: 50.0790, lng: 14.4176, category: 'food', outdoor: false, time: '18:30', duration: 90, note: '1499 年開業的啤酒屋，自釀黑啤酒。早點回飯店打包。' },

  // ---------- 交通段 ----------
  {
    id: 'g_out', kind: 'leg', dayId: 'd0111', order: 0, mode: 'flight', from: '台北桃園 T1', to: '法蘭克福 FRA T3', dep: '23:30', arr: '07:30 +1', duration: 900,
    operator: '中華航空', number: 'CI 061', note: '15 小時直飛。1/10 前預訂餐點，並開始預約自動報到。',
    links: [{ label: '華航官網', url: 'https://www.china-airlines.com/' }]
  },
  {
    id: 'g_airport', kind: 'leg', dayId: 'd0112', order: 0, mode: 'sbahn', from: 'FRA 第 3 航廈', to: '法蘭克福中央車站', dep: '08:30', arr: '09:00', duration: 30,
    operator: 'SkyLine + S-Bahn', number: 'S8 / S9', note: 'T3 沒有直達鐵路：先搭 SkyLine 接駁到 T1 區域火車站，再轉 S8/S9 約 12 分到中央車站。出發前確認 T3 接駁方式。單程票約 €6–7。',
    links: [{ label: 'RMV 車票', url: RMV }]
  },
  {
    id: 'g_messe', kind: 'leg', dayId: 'd0112', order: 1, mode: 'sbahn', from: '飯店', to: 'Messe Frankfurt', dep: '13:00', arr: '13:20', duration: 20,
    operator: 'RMV', number: 'U4 / S3–S6 / 電車 16、17', note: 'U4 到 Festhalle/Messe 站，或 S-Bahn 到 Messe 站。展覽門票通常含當日大眾運輸。',
    links: [{ label: 'RMV 車票', url: RMV }]
  },
  {
    id: 'g_ice', kind: 'leg', dayId: 'd0114', order: 0, mode: 'ice', from: '法蘭克福中央車站', to: '慕尼黑中央車站', dep: '14:00', arr: '17:30', duration: 210,
    operator: 'DB 德國鐵路', number: 'ICE（直達）', note: '約 3 小時 15 分到 3 小時 40 分。Sparpreis 早鳥票越早訂越便宜，建議加訂座位。班次時間以 DB Navigator 為準。',
    links: [{ label: 'DB 訂票', url: DB }]
  },
  {
    id: 'g_muc_arr', kind: 'leg', dayId: 'd0114', order: 1, mode: 'sbahn', from: '慕尼黑中央車站', to: 'INNSiDE Parkstadt Schwabing', dep: '17:40', arr: '18:10', duration: 30, operator: 'MVV',
    number: 'S-Bahn → Marienplatz 轉 U6', note: 'S-Bahn 任一線到 Marienplatz，轉 U6 往 Garching 方向到 Alte Heide 站，步行約 8 分。行李多的話搭計程車約 20 分。',
    links: [{ label: 'MVV 車票', url: MVV }]
  },
  {
    id: 'g_muc_day', kind: 'leg', dayId: 'd0115', order: 0, mode: 'sbahn', from: 'INNSiDE（Alte Heide 站）', to: 'Marienplatz', dep: '', arr: '', duration: null,
    operator: 'MVV', number: 'U6 + 團體一日票', note: '從飯店走到 U6 Alte Heide 站，約 12 分到 Marienplatz。2 人同行買 Gruppen-TagesTicket 比單人票划算。',
    links: [{ label: 'MVV 車票', url: MVV }]
  },
  {
    id: 'g_fussen', kind: 'leg', dayId: 'd0116', plan: 'A', order: 0, mode: 'train', from: '慕尼黑中央車站', to: 'Füssen → Hohenschwangau', dep: '08:00', arr: '10:30', duration: 150,
    operator: 'DB 區域火車 + 巴士 73/78', number: 'RE / Bayern-Ticket', note: 'Bayern-Ticket 2 人票（週末整天有效），火車約 2 小時到 Füssen，再轉 73 或 78 號巴士約 10 分。回程末班車出發前確認。',
    links: [{ label: 'DB 訂票', url: DB }]
  },
  {
    id: 'g_ingol', kind: 'leg', dayId: 'd0116', plan: 'B', order: 0, mode: 'train', from: '慕尼黑中央車站', to: 'Ingolstadt Village', dep: '09:00', arr: '10:20', duration: 80,
    operator: 'DB 區域火車 + 當地巴士', number: 'RE / Bayern-Ticket', note: '區域火車到 Ingolstadt Hbf 約 1 小時，轉巴士到暢貨中心。或搭 Shopping Express 直達巴士（需預約）。',
    links: [{ label: 'DB 訂票', url: DB }, { label: 'Shopping Express', url: 'https://www.thebicestercollection.com/ingolstadt-village/en/plan-your-visit/' }]
  },
  {
    id: 'g_prague', kind: 'leg', dayId: 'd0117', order: 0, mode: 'ice', from: '慕尼黑中央車站', to: '布拉格中央車站', dep: '09:45', arr: '15:30', duration: 345,
    operator: 'DB / ČD 直達火車', number: '經 Regensburg、Plzeň', note: '直達約 5 小時 40 分，座位寬、行李好放。備案：FlixBus 約 4.5–5 小時。班次以訂票系統為準。',
    links: [{ label: 'DB 訂票', url: DB }, { label: 'ČD 捷克鐵路', url: 'https://www.cd.cz/en/' }, { label: 'FlixBus', url: 'https://www.flixbus.com/' }]
  },
  {
    id: 'g_pid', kind: 'leg', dayId: 'd0117', order: 1, mode: 'sbahn', from: '布拉格中央車站', to: '飯店', dep: '', arr: '', duration: null,
    operator: 'PID', number: '72 小時票', note: '在 PID Lítačka App 買 72 小時票（1/17–1/20），1/21 起再買 24 小時票或單程票。涵蓋地鐵、電車、公車。',
    links: [{ label: 'PID 車票', url: PID }]
  },
  {
    id: 'g_prg_air', kind: 'leg', dayId: 'd0122', order: 0, mode: 'bus', from: '飯店', to: '布拉格機場 PRG T1', dep: '06:50', arr: '07:35', duration: 45,
    operator: 'PID', number: '地鐵 A + 公車 119 / Airport Express', note: '地鐵 A 線到 Nádraží Veleslavín 轉 119 號公車；或從中央車站搭 Airport Express。',
    links: [{ label: 'PID 車票', url: PID }]
  },
  {
    id: 'g_return', kind: 'leg', dayId: 'd0122', order: 1, mode: 'flight', from: '布拉格 PRG T1', to: '台北桃園 T1', dep: '10:30', arr: '05:25 +1', duration: 775,
    operator: '中華航空', number: 'CI 068', note: '直飛回台。布拉格是最後離開歐盟的機場：德國和捷克的退稅單都在這裡蓋海關章，請在托運行李前先辦。',
    links: [{ label: '華航官網', url: 'https://www.china-airlines.com/' }]
  },

  // ---------- 訂票與準備 ----------
  { id: 'b_meal', kind: 'booking', cat: 'flight', title: 'CI 061 預訂餐點', date: '2027-01-11', due: '2027-01-10', status: 'todo', price: '', currency: 'TWD', ref: '', url: 'https://www.china-airlines.com/', note: '華航 App 提醒' },
  { id: 'b_seat', kind: 'booking', cat: 'flight', title: 'CI 061 選位', date: '2027-01-11', due: '2027-01-10', status: 'todo', price: '', currency: 'TWD', ref: '', url: 'https://www.china-airlines.com/', note: '' },
  { id: 'b_checkin', kind: 'booking', cat: 'flight', title: 'CI 061 預約自動報到', date: '2027-01-11', due: '2027-01-10', status: 'todo', price: '', currency: 'TWD', ref: '', url: 'https://www.china-airlines.com/', note: '' },
  { id: 'b_return', kind: 'booking', cat: 'flight', title: 'CI 068 回程（布拉格 → 台北）', date: '2027-01-22', due: '', status: 'booked', price: '', currency: 'TWD', ref: '', url: 'https://www.china-airlines.com/', note: '1/22 10:30 PRG T1 → 1/23 05:25 TPE T1' },
  { id: 'b_return_meal', kind: 'booking', cat: 'flight', title: 'CI 068 預訂餐點・選位', date: '2027-01-22', due: '2027-01-20', status: 'todo', price: '', currency: 'TWD', ref: '', url: 'https://www.china-airlines.com/', note: '' },
  { id: 'b_heimtextil', kind: 'booking', cat: 'ticket', title: 'Heimtextil 門票（2 人）', date: '2027-01-12', due: '2026-12-31', status: 'todo', price: '', currency: 'EUR', ref: '', url: 'https://heimtextil.messefrankfurt.com/', note: '線上購票比現場便宜，確認是否含 RMV 交通。' },
  { id: 'b_l_fra', kind: 'booking', cat: 'lodging', title: 'STAYERY Frankfurt Sachsenhausen 1/12–1/14', date: '2027-01-12', due: '', status: 'booked', price: '', currency: 'EUR', ref: '', url: '', note: '', lodgingId: 'l_fra' },
  { id: 'b_l_muc', kind: 'booking', cat: 'lodging', title: 'INNSiDE München Parkstadt Schwabing 1/14–1/17', date: '2027-01-14', due: '', status: 'paid', price: 557.07, currency: 'EUR', ref: '2606409219', url: '', note: '已預付（Pre-paid BLACK FRIDAY），另用 2,000 積分。', lodgingId: 'l_muc' },
  { id: 'b_l_prg', kind: 'booking', cat: 'lodging', title: '布拉格住宿 1/17–1/22（5 晚）', date: '2027-01-17', due: '2026-12-15', status: 'todo', price: '', currency: 'CZK', ref: '', url: '', note: '建議舊城區或新城區', lodgingId: 'l_prg' },
  { id: 'b_ice', kind: 'booking', cat: 'transport', title: 'ICE 法蘭克福 → 慕尼黑（1/14）', date: '2027-01-14', due: '2026-12-10', status: 'todo', price: '', currency: 'EUR', ref: '', url: DB, note: 'Sparpreis 越早越便宜，加訂座位。' },
  { id: 'b_neusch', kind: 'booking', cat: 'ticket', title: '新天鵝堡導覽門票（方案 A）', date: '2027-01-16', due: '2026-12-27', status: 'todo', price: '', currency: 'EUR', ref: '', url: 'https://www.hohenschwangau.de/en', note: '冬季名額少，出發前 2–4 週預訂。若最後選方案 B 可取消。', plan: 'A' },
  { id: 'b_bayern', kind: 'booking', cat: 'transport', title: 'Bayern-Ticket 2 人（1/16）', date: '2027-01-16', due: '2027-01-15', status: 'todo', price: '', currency: 'EUR', ref: '', url: DB, note: '方案 A、B 都適用，前一天在 DB Navigator 購買即可。' },
  { id: 'b_shopexp', kind: 'booking', cat: 'transport', title: 'Shopping Express 直達巴士（方案 B，可選）', date: '2027-01-16', due: '2027-01-14', status: 'todo', price: '', currency: 'EUR', ref: '', url: 'https://www.thebicestercollection.com/ingolstadt-village/en/plan-your-visit/', note: '若搭火車就不需要。', plan: 'B' },
  { id: 'b_prague_train', kind: 'booking', cat: 'transport', title: '慕尼黑 → 布拉格 火車（1/17）', date: '2027-01-17', due: '2026-12-17', status: 'todo', price: '', currency: 'EUR', ref: '', url: DB, note: '' },
  { id: 'b_lokal', kind: 'booking', cat: 'ticket', title: 'Lokál 晚餐訂位（1/17）', date: '2027-01-17', due: '2027-01-15', status: 'todo', price: '', currency: 'CZK', ref: '', url: 'https://lokal-dlouha.ambi.cz/', note: '' },
  { id: 'b_etias', kind: 'booking', cat: 'prep', title: '確認 ETIAS 是否已上路', date: '', due: '2026-12-15', status: 'todo', price: '', currency: 'EUR', ref: '', url: 'https://travel-europe.europa.eu/etias_en', note: '歐盟旅行授權預計 2026 年底啟用，台灣護照持有人需申請。歐盟入出境系統（EES）會採集指紋，入境排隊可能較久。' },
  { id: 'b_offline', kind: 'booking', cat: 'prep', title: 'Google Maps 下載離線地圖', date: '', due: '2027-01-10', status: 'todo', price: '', currency: 'EUR', ref: '', url: '', note: '下載法蘭克福、慕尼黑、布拉格三區。' },
  { id: 'b_apps', kind: 'booking', cat: 'prep', title: '安裝 DB Navigator、RMV、MVV、PID Lítačka', date: '', due: '2027-01-10', status: 'todo', price: '', currency: 'EUR', ref: '', url: '', note: 'DB Navigator 查火車即時誤點與月台變更。' },
  { id: 'b_esim', kind: 'booking', cat: 'prep', title: '歐洲上網 eSIM / 漫遊', date: '', due: '2027-01-08', status: 'todo', price: '', currency: 'TWD', ref: '', url: '', note: '確認德國與捷克都涵蓋。' },
  { id: 'b_insurance', kind: 'booking', cat: 'prep', title: '旅遊平安險・不便險', date: '', due: '2027-01-10', status: 'todo', price: '', currency: 'TWD', ref: '', url: '', note: '' },

  // ---------- 購物清單 ----------
  { id: 'p1', kind: 'shop', city: 'FRA', item: 'dm / Rossmann 藥妝', store: 'Zeil 一帶', done: false, note: 'Balea 保養品、魚油、維他命發泡錠' },
  { id: 'p2', kind: 'shop', city: 'MUC', item: '咖啡豆、巧克力', store: 'Dallmayr', done: false, note: '' },
  { id: 'p3', kind: 'shop', city: 'MUC', item: '暢貨中心品牌', store: 'Ingolstadt Village', done: false, note: '方案 B 才會去' },
  { id: 'p4', kind: 'shop', city: 'PRG', item: '溫泉保養品', store: 'Manufaktura', done: false, note: '' },
  { id: 'p5', kind: 'shop', city: 'PRG', item: '波希米亞水晶杯', store: 'Moser', done: false, note: '' }
];
