import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Navigation, MapPinned, Pencil, Sunrise, Sunset, BedDouble, Plus, ExternalLink,
  Thermometer, CloudSnow, ChevronRight
} from 'lucide-react';
import { CATEGORIES, CITIES, MODES, CLIMATE, OUTDOOR_START, OUTDOOR_END } from '../lib/constants';
import { fmtDate, endTime, fmtDuration, outdoorWarning, sundayWarning, moveHint, sunTimes, toMin, fromMin } from '../lib/util';
import { openUrl, directionsUrl } from '../lib/links';
import { forecast } from '../lib/weather';
import { store } from '../lib/store';

export function cityColor(code) {
  return CITIES[code]?.color || 'var(--tpe)';
}

function StopCard({ stop, index, day, color, selected, onSelect, onEdit, navApp, dragHandle }) {
  const cat = CATEGORIES[stop.category] || CATEGORIES.other;
  const end = endTime(stop.time, stop.duration);
  const warnOutdoor = outdoorWarning(stop);
  const warnSunday = sundayWarning(stop, day);
  return (
    <div className={`stop${selected ? ' selected' : ''}`} onClick={() => onSelect(stop.id)} id={`stop-${stop.id}`}>
      <span className="idx" style={{ background: color }}>
        {index + 1}
      </span>
      <div className="grow">
        <div className="time num">
          {stop.time || '未定時間'}
          {end ? ` – ${end}` : ''}
          {stop.duration ? `・${fmtDuration(stop.duration)}` : ''}
        </div>
        <div className="name">{stop.name || stop.nameLocal}</div>
        {stop.nameLocal && stop.nameLocal !== stop.name && <div className="local">{stop.nameLocal}</div>}
        <div className="tags">
          <span className="tag">
            <cat.icon size={12} strokeWidth={1.8} />
            {cat.label}
          </span>
          {stop.outdoor && <span className={`tag${warnOutdoor ? ' warn' : ''}`}>戶外・建議 {OUTDOOR_START}–{OUTDOOR_END}</span>}
          {warnSunday && <span className="tag warn">德國週日商店多休息</span>}
        </div>
        {selected && (
          <div className="detail" onClick={(e) => e.stopPropagation()}>
            {stop.address && <p>{stop.address}</p>}
            {stop.note && <p style={{ whiteSpace: 'pre-wrap' }}>{stop.note}</p>}
            <div className="actions">
              <a className="btn sm primary" href={openUrl(stop, navApp)} target="_blank" rel="noreferrer">
                <MapPinned size={14} />
                {navApp === 'apple' ? '在 Apple 地圖開啟' : '在 Google Maps 開啟'}
              </a>
              <a className="btn sm" href={directionsUrl(stop, navApp)} target="_blank" rel="noreferrer">
                <Navigation size={14} />
                導航
              </a>
              {stop.ticketUrl && (
                <a className="btn sm" href={stop.ticketUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  官網
                </a>
              )}
              <button className="btn sm ghost" onClick={() => onEdit(stop)}>
                <Pencil size={14} />
                編輯
              </button>
            </div>
          </div>
        )}
      </div>
      {dragHandle}
    </div>
  );
}

function SortableStop(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.stop.id });
  const style = { transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 5 : 'auto' };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'dragging-wrap' : ''}>
      <StopCard
        {...props}
        dragHandle={
          <span className="drag-handle" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} aria-label="拖曳排序">
            <GripVertical size={18} />
          </span>
        }
      />
    </div>
  );
}

export function LegCard({ leg, onEdit, compact }) {
  const M = MODES[leg.mode] || MODES.train;
  return (
    <div className="leg">
      <span className="mode">
        <M.icon size={15} strokeWidth={1.7} />
      </span>
      <div className="grow">
        <div className="row between">
          <div className="route">
            {leg.from} → {leg.to}
          </div>
          {onEdit && (
            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => onEdit(leg)} aria-label="編輯交通">
              <Pencil size={14} />
            </button>
          )}
        </div>
        <div className="sub num">
          {[leg.dep && `${leg.dep}${leg.arr ? ` – ${leg.arr}` : ''}`, leg.number, leg.operator, leg.duration && fmtDuration(leg.duration)]
            .filter(Boolean)
            .join('・')}
        </div>
        {!compact && leg.note && <div className="note">{leg.note}</div>}
        {!compact && leg.links?.length > 0 && (
          <div className="links">
            {leg.links.map((l) => (
              <a key={l.url + l.label} className="btn sm" href={l.url} target="_blank" rel="noreferrer">
                <ExternalLink size={13} />
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useWeather(day) {
  const [w, setW] = useState(null);
  useEffect(() => {
    setW(null);
    const c = CITIES[day.city];
    if (!c || day.city === 'TPE') return;
    let alive = true;
    forecast(day.date, c.center).then((r) => alive && setW(r));
    return () => {
      alive = false;
    };
  }, [day.date, day.city]);
  return w;
}

export default function DayPanel({
  day, stops, legs, lodging, plan, setPlan, selectedId, onSelect, onEditStop, onEditLeg, onEditDay, onEditLodging, onAddLeg, navApp, searchSlot
}) {
  const city = CITIES[day.city];
  const color = cityColor(day.city);
  const sun = city && day.city !== 'TPE' ? sunTimes(day.date, city.center[1], city.center[0], city.tz) : null;
  const weather = useWeather(day);
  const climate = CLIMATE[day.city];

  const visibleStops = useMemo(
    () => stops.filter((s) => !day.plans || !s.plan || s.plan === plan).sort((a, b) => a.order - b.order),
    [stops, plan, day.plans]
  );
  const visibleLegs = legs.filter((l) => !day.plans || !l.plan || l.plan === plan).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const ids = visibleStops.map((s) => s.id);
    const next = arrayMove(visibleStops, ids.indexOf(active.id), ids.indexOf(over.id));
    // 依新順序重新編號；時間沿用原本的時段序列，若與前一站重疊則往後順延（間隔 15 分）
    const slots = visibleStops.map((s) => toMin(s.time)).filter((x) => x != null).sort((a, b) => a - b);
    const keepTimes = slots.length === visibleStops.length;
    let prevEnd = -1;
    store.upsert(
      next.map((s, i) => {
        if (!keepTimes) return { ...s, order: i };
        const start = Math.max(slots[i], prevEnd >= 0 ? prevEnd + 15 : 0);
        prevEnd = start + (Number(s.duration) || 0);
        return { ...s, order: i, time: fromMin(start) };
      })
    );
  }

  return (
    <div>
      <div className="day-head">
        <div className="row between">
          <span className="row xs faint" style={{ letterSpacing: '.08em' }}>
            <i className="city-dot" style={{ background: color }} />
            {city?.name}・{city?.local}
          </span>
          <button className="btn ghost sm" onClick={() => onEditDay(day)}>
            <Pencil size={13} />
            編輯
          </button>
        </div>
        <h2>
          <span className="num">{fmtDate(day.date)}</span>　{day.title}
        </h2>
        <div className="day-meta num">
          {sun && (
            <>
              <span>
                <Sunrise size={14} strokeWidth={1.6} />
                {sun.sunrise}
              </span>
              <span>
                <Sunset size={14} strokeWidth={1.6} />
                {sun.sunset}
              </span>
            </>
          )}
          {weather ? (
            <span>
              {weather.snow ? <CloudSnow size={14} strokeWidth={1.6} /> : <Thermometer size={14} strokeWidth={1.6} />}
              {weather.text} {weather.lo}° / {weather.hi}°・降雨 {weather.rain}%
            </span>
          ) : (
            climate && (
              <span>
                <Thermometer size={14} strokeWidth={1.6} />
                一月均溫 {climate.lo}° / {climate.hi}°
              </span>
            )
          )}
        </div>
        {(day.tags || []).length > 0 && (
          <div className="row wrap" style={{ gap: 4, marginTop: 10 }}>
            {day.tags.map((t) => (
              <span key={t} className="tag solid">
                {t}
              </span>
            ))}
          </div>
        )}
        {day.note && <div className="day-note">{day.note}</div>}
      </div>

      {lodging && (
        <button className="lodging-row" onClick={() => onEditLodging(lodging)}>
          <BedDouble size={16} strokeWidth={1.6} color="var(--text-2)" />
          <span className="grow ellipsis">{lodging.name}</span>
          <span className={`status ${lodging.status}`} style={{ height: 22, lineHeight: '20px' }}>
            {lodging.status === 'todo' ? '未訂' : lodging.status === 'paid' ? '已付款' : '已訂'}
          </span>
          <ChevronRight size={16} color="var(--text-3)" />
        </button>
      )}

      {day.plans && (
        <div style={{ padding: '14px 24px 0' }}>
          <div className="segmented" role="tablist" aria-label="備案">
            {['A', 'B'].map((p) => (
              <button key={p} className={plan === p ? 'on' : ''} onClick={() => setPlan(p)} role="tab" aria-selected={plan === p}>
                方案 {p}・{day.plans[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {searchSlot}

      <div className="list">
        {(visibleLegs.length > 0 || onAddLeg) && (
          <>
            <div className="list-label">
              <span className="label" style={{ margin: 0 }}>交通</span>
              <button className="btn ghost sm" onClick={onAddLeg}>
                <Plus size={14} />
                新增交通
              </button>
            </div>
            {visibleLegs.map((l) => (
              <LegCard key={l.id} leg={l} onEdit={onEditLeg} />
            ))}
          </>
        )}

        <div className="list-label">
          <span className="label" style={{ margin: 0 }}>行程・{visibleStops.length} 個地點</span>
          <span className="xs faint">按住右側把手拖曳排序</span>
        </div>
        {visibleStops.length === 0 && <div className="empty">還沒有地點。用上方搜尋或右下角按鈕新增。</div>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visibleStops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {visibleStops.map((s, i) => {
              const hint = i > 0 ? moveHint(visibleStops[i - 1], s) : null;
              return (
                <div key={s.id}>
                  {hint ? <div className="move-hint">{hint.text}</div> : i > 0 && <div style={{ height: 8 }} />}
                  <SortableStop
                    stop={s}
                    index={i}
                    day={day}
                    color={color}
                    selected={selectedId === s.id}
                    onSelect={onSelect}
                    onEdit={onEditStop}
                    navApp={navApp}
                  />
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

