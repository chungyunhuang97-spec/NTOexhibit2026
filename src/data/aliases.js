// 繁中常用名稱 → 當地原名。OSM 的中文名多為簡體或缺漏，先轉成原名再搜尋。
export const ALIASES = {
  // 法蘭克福
  '法蘭克福': 'Frankfurt am Main',
  '法蘭克福展覽中心': 'Messe Frankfurt',
  '法蘭克福展場': 'Messe Frankfurt',
  '法蘭克福中央車站': 'Frankfurt (Main) Hauptbahnhof',
  '法蘭克福機場': 'Flughafen Frankfurt',
  '羅馬廣場': 'Römerberg',
  '羅馬人廣場': 'Römerberg',
  '小市場大廳': 'Kleinmarkthalle',
  '采爾大街': 'Zeil',
  '蔡爾大街': 'Zeil',
  '美茵塔': 'Main Tower',
  '施泰德美術館': 'Städel Museum',
  '歌德故居': 'Goethe-Haus',
  '老歌劇院': 'Alte Oper',
  '鐵橋': 'Eiserner Steg',
  '薩克森豪森': 'Sachsenhausen',
  // 慕尼黑
  '慕尼黑': 'München',
  '慕尼黑中央車站': 'München Hauptbahnhof',
  '瑪利亞廣場': 'Marienplatz',
  '瑪麗亞廣場': 'Marienplatz',
  '新市政廳': 'Neues Rathaus München',
  '穀物市場': 'Viktualienmarkt',
  '維克圖阿連市場': 'Viktualienmarkt',
  '英國花園': 'Englischer Garten',
  '德意志博物館': 'Deutsches Museum',
  '老繪畫陳列館': 'Alte Pinakothek',
  '皇家啤酒屋': 'Hofbräuhaus',
  '慕尼黑王宮': 'Residenz München',
  '寧芬堡': 'Schloss Nymphenburg',
  'BMW 世界': 'BMW Welt',
  'BMW世界': 'BMW Welt',
  '聖母教堂': 'Frauenkirche München',
  '新天鵝堡': 'Schloss Neuschwanstein',
  '天鵝堡': 'Schloss Neuschwanstein',
  '高天鵝堡': 'Schloss Hohenschwangau',
  '瑪麗安橋': 'Marienbrücke',
  '富森': 'Füssen',
  '英格斯塔': 'Ingolstadt Village',
  '英戈爾施塔特': 'Ingolstadt',
  '英格斯塔購物村': 'Ingolstadt Village',
  // 布拉格
  '布拉格': 'Praha',
  '布拉格中央車站': 'Praha hlavní nádraží',
  '布拉格機場': 'Letiště Václava Havla Praha',
  '查理大橋': 'Karlův most',
  '查理士大橋': 'Karlův most',
  '布拉格城堡': 'Pražský hrad',
  '聖維特大教堂': 'Katedrála svatého Víta',
  '舊城廣場': 'Staroměstské náměstí',
  '天文鐘': 'Pražský orloj',
  '黃金巷': 'Zlatá ulička',
  '小城區': 'Malá Strana',
  '瓦茨拉夫廣場': 'Václavské náměstí',
  '國家博物館': 'Národní muzeum',
  '市民會館': 'Obecní dům',
  '高堡': 'Vyšehrad',
  '跳舞的房子': 'Tančící dům',
  '提恩教堂': 'Týnský chrám',
  '巴黎大街': 'Pařížská',
  '列儂牆': 'Lennonova zeď',
  '佩特任山': 'Petřín',
  '猶太區': 'Josefov'
};

/** 把查詢轉成原名；完全符合優先，其次包含 */
export function translateQuery(q) {
  const t = q.trim();
  if (ALIASES[t]) return { query: ALIASES[t], zh: t };
  const key = Object.keys(ALIASES)
    .filter((k) => k.length >= 2 && t.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  if (key) return { query: t.replace(key, ` ${ALIASES[key]} `).trim(), zh: null };
  return { query: t, zh: null };
}

export const hasCJK = (s) => /[㐀-鿿]/.test(s);
