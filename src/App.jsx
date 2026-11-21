import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings as SettingsIcon, LayoutList, Map as MapIcon, Ticket, ShoppingBag, Plus, ChevronDown } from 'lucide-react';
import { store, useStore, selectByKind } from './lib/store';
import { CITIES, CATEGORIES, WEEKDAYS } from './lib/constants';
import { uid, parseDate, nowIn, toMin, fromMin } from './lib/util';
import MapView from './components/MapView';
import DayPanel, { cityColor } from './components/DayPanel';
import SearchBox from './components/SearchBox';
import Overview from './components/Overview';
import Bookings from './components/Bookings';
import Shopping from './components/Shopping';
import BottomSheet, { sheetHeights } from './components/BottomSheet';
import Settings, { PinDialog } from './components/Settings';
import { FormDialog } from './components/Dialog';
import {
  stopFields, legFields, bookingFields, lodgingFields, dayFields, shopFields, refundFields
} from './components/editors';

const TABS = [
  ['overview', '總覽', LayoutList],
  ['day', '行程', MapIcon],
  ['bookings', '訂票', Ticket],
  ['shopping', '購物', ShoppingBag]
];

function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}

function useLS(key, init) {
  const [v, setV] = useState(() => {
    try {
      const x = localStorage.getItem(key);
      return x == null ? init : JSON.parse(x);
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [key, v]);
  return [v, setV];
}

function Clocks() {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="clocks num">
      <span>
        台灣<b>{nowIn('Asia/Taipei')}</b>
      </span>
      <span>
        德國・捷克<b>{nowIn('Europe/Berlin')}</b>
      </span>
    </div>
  );
}

function DayStrip({ days, dayId, onPick }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('.daychip.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [dayId]);
  return (
    <div className="daystrip" ref={ref}>
      {days.map((d) => {
        const dt = parseDate(d.date);
        return (
          <button key={d.id} className={`daychip${d.id === dayId ? ' active' : ''}`} onClick={() => onPick(d.id)} aria-label={d.date}>
            <span className="d num">{dt.getUTCMonth() + 1}/{dt.getUTCDate()}</span>
            <span className="w">{WEEKDAYS[dt.getUTCDay()]}</span>
            <span className="c" style={{ background: cityColor(d.city) }} />
          </button>
        );
      })}
    </div>
  );
}

function pickDefaultDay(days) {
  const today = new Date().toISOString().slice(0, 10);
  return (days.find((d) => d.date === today) || days.find((d) => d.date > today) || days[0])?.id;
}

export default function App() {
  const items = useStore((s) => s.items);
  const sync = useStore((s) => s.sync);
  const navApp = useStore((s) => s.settings.navApp);
  const mobile = useMedia('(max-width: 768px)');

  const meta = items.meta || { title: '德國行程', start: '2027-01-11', end: '2027-01-22' };
  const days = useMemo(() => selectByKind(items, 'day').sort((a, b) => a.date.localeCompare(b.date)), [items]);
  const stops = useMemo(() => selectByKind(items, 'stop'), [items]);
  const legs = useMemo(() => selectByKind(items, 'leg'), [items]);
  const lodgings = useMemo(() => selectByKind(items, 'lodging'), [items]);
  const bookings = useMemo(() => selectByKind(items, 'booking'), [items]);
  const shops = useMemo(() => selectByKind(items, 'shop'), [items]);
  const refunds = useMemo(() => selectByKind(items, 'refund'), [items]);

  const [tab, setTab] = useLS('ui:tab', 'overview');
  const [dayId, setDayId] = useLS('ui:day', null);
  const [plans, setPlans] = useLS('ui:plans', {});
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [snap, setSnap] = useState('half');
  const [searchOpen, setSearchOpen] = useState(false);
  const [editor, setEditor] = useState(null); // { type, value, isNew }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const sheetBodyRef = useRef(null);

  useEffect(() => {
    store.onNeedPin(() => setPinOpen(true));
  }, []);

  useEffect(() => {
    if (days.length && !days.some((d) => d.id === dayId)) setDayId(pickDefaultDay(days));
  }, [days, dayId, setDayId]);

  const day = days.find((d) => d.id === dayId) || days[0];
  const plan = day?.plans ? plans[day.id] || 'A' : null;
  const dayStops = useMemo(() => (day ? stops.filter((s) => s.dayId === day.id) : []), [stops, day]);
  const dayLegs = useMemo(() => (day ? legs.filter((l) => l.dayId === day.id) : []), [legs, day]);
  const lodging = day?.lodgingId ? items[day.lodgingId] : null;
  const searchBias = (day && day.city !== 'TPE' ? CITIES[day.city] : CITIES.FRA).center;

  // 地圖資料
  const mapMode = tab === 'day' ? 'day' : 'overview';
  const points = useMemo(() => {
    if (mapMode === 'overview') {
      return stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, color: cityColor(items[s.dayId]?.city), title: s.name }));
    }
    const visible = dayStops.filter((s) => !day?.plans || !s.plan || s.plan === plan).sort((a, b) => a.order - b.order);
    return visible.map((s, i) => ({ id: s.id, lat: s.lat, lng: s.lng, label: i + 1, color: cityColor(day.city), title: s.name }));
  }, [mapMode, stops, dayStops, day, plan, items]);

  const mapPadding = useMemo(() => {
    if (!mobile || tab !== 'day') return { top: 60, bottom: 40 };
    const h = sheetHeights(window.innerHeight)[snap === 'full' ? 'half' : snap];
    return { top: 70, bottom: h + 20 };
  }, [mobile, tab, snap]);

  function openDay(id) {
    setDayId(id);
    setTab('day');
    setSelectedId(null);
    if (mobile) setSnap('half');
  }

  function selectStop(id, { fromMap = false } = {}) {
    const s = items[id];
    if (!s) return;
    if (mapMode === 'overview' && fromMap) {
      openDay(s.dayId);
    }
    setSelectedId((cur) => (cur === id && !fromMap ? null : id));
    setFocus({ lat: s.lat, lng: s.lng, key: Date.now() });
    if (mobile && fromMap) {
      setSnap('half');
      setTimeout(() => document.getElementById(`stop-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
    }
  }

  // 搜尋選擇 → 新增景點、飛過去
  function addFromSearch(r) {
    if (!day) return;
    if (!store.ensureEditable()) return;
    const visible = dayStops.filter((s) => !day.plans || !s.plan || s.plan === plan);
    const last = visible
      .filter((s) => s.time)
      .sort((a, b) => toMin(a.time) - toMin(b.time))
      .pop();
    const cat = CATEGORIES[r.category] || CATEGORIES.other;
    let time = last ? fromMin(toMin(last.time) + (Number(last.duration) || 60) + 20) : cat.outdoor ? '11:00' : '10:00';
    if (toMin(time) > toMin('22:00')) time = '';
    const stop = {
      id: uid('s'),
      kind: 'stop',
      dayId: day.id,
      order: visible.length ? Math.max(...visible.map((s) => s.order)) + 1 : 0,
      name: r.nameZh || r.nameLocal,
      nameLocal: r.nameLocal,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      osmId: r.osmId,
      category: r.category,
      outdoor: cat.outdoor,
      time,
      duration: cat.outdoor ? 60 : 90,
      note: '',
      ...(day.plans ? { plan } : {})
    };
    if (!store.upsert(stop)) return;
    setSearchOpen(false);
    setSelectedId(stop.id);
    setFocus({ lat: r.lat, lng: r.lng, key: Date.now() });
    if (mobile) setSnap('half');
    setTimeout(() => document.getElementById(`stop-${stop.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
  }

  // ---------- 編輯器 ----------
  function openEditor(type, value, isNew = false) {
    if (!store.ensureEditable()) return;
    setEditor({ type, value, isNew });
  }

  function saveEditor(v) {
    const { type } = editor;
    let item = { ...v };
    if (type === 'leg') {
      const links = [...(item.links || [])];
      if (item.linkUrl) links.push({ label: '訂票連結', url: item.linkUrl });
      delete item.linkUrl;
      item.links = links;
    }
    if ((type === 'stop' || type === 'leg') && !item.plan) delete item.plan;
    if (type === 'stop') item.duration = item.duration === '' ? null : item.duration;
    if (store.upsert(item)) setEditor(null);
  }

  function deleteEditor() {
    const { value } = editor;
    if (!window.confirm('確定刪除？')) return;
    if (store.remove(value.id)) {
      if (selectedId === value.id) setSelectedId(null);
      setEditor(null);
    }
  }

  const editorConfig = editor && {
    stop: { title: editor.isNew ? '新增地點' : '編輯地點', fields: stopFields(day) },
    leg: { title: editor.isNew ? '新增交通' : '編輯交通', fields: legFields(day) },
    booking: { title: editor.isNew ? '新增項目' : '編輯項目', fields: bookingFields },
    lodging: { title: '住宿', fields: lodgingFields },
    day: { title: '編輯當日', fields: dayFields },
    shop: { title: editor.isNew ? '新增購物' : '編輯購物', fields: shopFields },
    refund: { title: editor.isNew ? '登錄退稅單據' : '退稅單據', fields: refundFields }
  }[editor.type];

  // ---------- 內容 ----------
  const dayPanel = day && (
    <DayPanel
      day={day}
      stops={dayStops}
      legs={dayLegs}
      lodging={lodging}
      plan={plan}
      setPlan={(p) => setPlans({ ...plans, [day.id]: p })}
      selectedId={selectedId}
      onSelect={(id) => selectStop(id)}
      onEditStop={(s) => openEditor('stop', { ...s, plan: s.plan || '' })}
      onEditLeg={(l) => openEditor('leg', { ...l, plan: l.plan || '', linkUrl: '' })}
      onEditDay={(d) => openEditor('day', d)}
      onEditLodging={(l) => openEditor('lodging', l)}
      onAddLeg={() =>
        openEditor(
          'leg',
          { id: uid('g'), kind: 'leg', dayId: day.id, order: dayLegs.length, mode: 'sbahn', from: '', to: '', dep: '', arr: '', operator: '', number: '', note: '', links: [], linkUrl: '', plan: day.plans ? plan : '' },
          true
        )
      }
      navApp={navApp}
      searchSlot={!mobile && <SearchBox onPick={addFromSearch} bias={searchBias} />}
    />
  );

  let page = null;
  if (tab === 'overview') {
    page = (
      <Overview
        meta={meta}
        days={days}
        stops={stops}
        legs={legs}
        lodgings={lodgings}
        bookings={bookings}
        onOpenDay={openDay}
        onOpenBookings={() => setTab('bookings')}
      />
    );
  } else if (tab === 'bookings') {
    page = (
      <Bookings
        bookings={bookings}
        rates={meta.rates}
        onEdit={(b) => openEditor('booking', b)}
        onAdd={() =>
          openEditor('booking', { id: uid('b'), kind: 'booking', cat: 'transport', title: '', date: '', due: '', status: 'todo', price: '', currency: 'EUR', ref: '', url: '', note: '' }, true)
        }
      />
    );
  } else if (tab === 'shopping') {
    page = (
      <Shopping
        shops={shops}
        refunds={refunds}
        onEditShop={(s) => openEditor('shop', s)}
        onAddShop={(city) => openEditor('shop', { id: uid('p'), kind: 'shop', city, item: '', store: '', done: false, note: '' }, true)}
        onEditRefund={(r) => openEditor('refund', r)}
        onAddRefund={() =>
          openEditor('refund', { id: uid('r'), kind: 'refund', store: '', city: day?.city && day.city !== 'TPE' ? day.city : 'FRA', date: '', amount: '', currency: 'EUR', stamped: false, note: '' }, true)
        }
      />
    );
  }

  const syncDot = <span className={`sync-dot ${sync.mode === 'local' ? '' : sync.status}`} title={sync.mode === 'local' ? '本機模式' : sync.status} />;

  const header = (
    <div className="header">
      <div className="grow">
        <h1>{meta.title}</h1>
        <div className="sub">{meta.subtitle}</div>
        <Clocks />
      </div>
      <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="設定與共享">
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <SettingsIcon size={19} strokeWidth={1.6} />
          <span style={{ position: 'absolute', right: -3, top: -3 }}>{syncDot}</span>
        </span>
      </button>
    </div>
  );

  return (
    <div className="app">
      {/* 側欄（電腦）／頁面（手機） */}
      <aside className={`side${mobile && tab === 'day' ? ' hidden-mobile' : ''}`}>
        {header}
        {!mobile && (
          <nav className="tabs">
            {TABS.map(([k, label]) => (
              <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        {!mobile && tab === 'day' && <DayStrip days={days} dayId={day?.id} onPick={openDay} />}
        <div className="side-scroll">{tab === 'day' ? !mobile && dayPanel : page}</div>
      </aside>

      {/* 地圖 */}
      <main className="map-wrap" style={mobile && tab !== 'day' ? { visibility: 'hidden' } : null}>
        <MapView
          points={points}
          mode={mapMode}
          hotel={lodging && lodging.lat != null ? lodging : null}
          selectedId={selectedId}
          onSelect={(id) => selectStop(id, { fromMap: true })}
          focus={focus}
          padding={mapPadding}
        />
      </main>

      {/* 手機：行程頁 */}
      {mobile && tab === 'day' && day && (
        <>
          <div className="mobile-top">
            <button className="pill" onClick={() => setSnap(snap === 'peek' ? 'half' : 'peek')}>
              <i className="city-dot" style={{ background: cityColor(day.city) }} />
              <span className="num">{parseDate(day.date).getUTCMonth() + 1}/{parseDate(day.date).getUTCDate()}</span>
              {CITIES[day.city]?.name}
              <ChevronDown size={14} />
            </button>
            <button className="pill" style={{ width: 40, padding: 0, justifyContent: 'center' }} onClick={() => setSettingsOpen(true)} aria-label="設定">
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <SettingsIcon size={17} strokeWidth={1.6} />
                <span style={{ position: 'absolute', right: -3, top: -3 }}>{syncDot}</span>
              </span>
            </button>
          </div>
          <BottomSheet snap={snap} setSnap={setSnap} bodyRef={sheetBodyRef} header={<DayStrip days={days} dayId={day.id} onPick={openDay} />}>
            {dayPanel}
          </BottomSheet>
          <button
            className="fab"
            style={{ bottom: `calc(${(snap === 'full' ? 24 : sheetHeights(window.innerHeight)[snap] + 16)}px + var(--tabbar-h) + var(--safe-b))` }}
            onClick={() => store.ensureEditable() && setSearchOpen(true)}
            aria-label="新增地點"
          >
            <Plus size={28} strokeWidth={1.8} />
          </button>
        </>
      )}

      {/* 手機底部分頁 */}
      {mobile && (
        <nav className="tabbar">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => (k === 'day' ? openDay(day?.id) : setTab(k))}>
              <Icon size={21} strokeWidth={tab === k ? 1.9 : 1.5} />
              {label}
            </button>
          ))}
        </nav>
      )}

      {searchOpen && day && (
        <SearchBox fullscreen onClose={() => setSearchOpen(false)} onPick={addFromSearch} bias={searchBias} placeholder={`新增到 ${parseDate(day.date).getUTCMonth() + 1}/${parseDate(day.date).getUTCDate()} ${CITIES[day.city]?.name}`} />
      )}

      {editor && (
        <FormDialog
          key={editor.value.id}
          title={editorConfig.title}
          value={editor.value}
          fields={editorConfig.fields}
          onSave={saveEditor}
          onDelete={!editor.isNew && !['day', 'lodging'].includes(editor.type) ? deleteEditor : null}
          onClose={() => setEditor(null)}
          extra={
            editor.type === 'lodging' && (
              <div style={{ margin: '-12px -20px 10px' }}>
                <SearchBox
                  placeholder="搜尋飯店名稱，自動帶入地址與地圖位置"
                  bias={CITIES[editor.value.city]?.center}
                  onPick={(r) => {
                    if (store.patch(editor.value.id, { name: r.nameLocal, address: r.address, lat: r.lat, lng: r.lng })) setEditor(null);
                  }}
                />
              </div>
            )
          }
        />
      )}
      {settingsOpen && <Settings meta={meta} onClose={() => setSettingsOpen(false)} />}
      {pinOpen && <PinDialog onClose={() => setPinOpen(false)} />}
    </div>
  );
}

