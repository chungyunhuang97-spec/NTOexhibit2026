import { BedDouble, MapPin, ChevronRight, CircleAlert } from 'lucide-react';
import { CITIES, MODES, BOOKING_CATS } from '../lib/constants';
import { fmtDate, parseDate } from '../lib/util';
import { cityColor } from './DayPanel';

function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return Math.round((parseDate(iso) - t) / 86400000);
}

export default function Overview({ meta, days, stops, legs, lodgings, bookings, onOpenDay, onOpenBookings }) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const countdown = daysUntil(meta?.start);
  const done = bookings.filter((b) => b.status !== 'todo').length;
  const todos = bookings
    .filter((b) => b.status === 'todo')
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
    .slice(0, 5);

  const nights = {};
  sorted.forEach((d) => {
    if (d.lodgingId) nights[d.city] = (nights[d.city] || 0) + 1;
  });

  return (
    <div>
      <div className="section" style={{ paddingTop: 20 }}>
        <div className="label">旅程概要</div>
        <div className="row" style={{ fontSize: 14, gap: 6 }}>
          <span className="num">{fmtDate(meta.start, { withWeekday: false })} – {fmtDate(meta.end, { withWeekday: false })}</span>
          <span className="faint">・{sorted.length} 天・{meta.travelers?.join('、')}</span>
        </div>
        <div className="cities" aria-hidden>
          {['FRA', 'MUC', 'PRG'].map((c) => (
            <div key={c} style={{ flex: nights[c] || 0, background: CITIES[c].color }} />
          ))}
        </div>
        <div className="row xs muted" style={{ gap: 14, marginTop: 8 }}>
          {['FRA', 'MUC', 'PRG'].map((c) => (
            <span key={c} className="row" style={{ gap: 5 }}>
              <i className="city-dot" style={{ background: CITIES[c].color }} />
              {CITIES[c].name} {nights[c] || 0} 晚
            </span>
          ))}
        </div>
      </div>

      <div className="ov-stats">
        <div>
          <b className="num">{countdown != null && countdown > 0 ? countdown : '—'}</b>
          <span>天後出發</span>
        </div>
        <div>
          <b className="num">{stops.length}</b>
          <span>個地點</span>
        </div>
        <div>
          <b className="num">
            {done}/{bookings.length}
          </b>
          <span>訂票與準備完成</span>
        </div>
      </div>

      {todos.length > 0 && (
        <div className="section">
          <div className="row between">
            <div className="label" style={{ margin: 0 }}>待處理</div>
            <button className="btn ghost sm" onClick={onOpenBookings}>
              全部
              <ChevronRight size={14} />
            </button>
          </div>
          {todos.map((b) => {
            const Cat = BOOKING_CATS[b.cat] || BOOKING_CATS.prep;
            const left = daysUntil(b.due);
            return (
              <div className="todo-item" key={b.id}>
                <Cat.icon size={16} strokeWidth={1.6} color="var(--text-3)" />
                <span className="grow ellipsis">{b.title}</span>
                {b.due && (
                  <span className={`xs num ${left != null && left <= 14 ? '' : 'faint'}`} style={left != null && left <= 14 ? { color: 'var(--warn)' } : null}>
                    {left != null && left < 0 ? '已過期' : `${fmtDate(b.due, { withWeekday: false })} 前`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="label" style={{ margin: 0 }}>每日行程</div>
      </div>
      <div className="timeline">
        {sorted.map((d) => {
          const dayStops = stops.filter((s) => s.dayId === d.id);
          const dayLegs = legs.filter((l) => l.dayId === d.id && ['flight', 'ice', 'train', 'bus'].includes(l.mode) && l.plan !== 'B');
          const lodging = lodgings.find((l) => l.id === d.lodgingId);
          const wd = parseDate(d.date).getUTCDay();
          return (
            <button key={d.id} className="tl-day" onClick={() => onOpenDay(d.id)}>
              <div className="tl-date num">
                <b>{fmtDate(d.date, { withWeekday: false })}</b>
                <span style={wd === 0 ? { color: 'var(--prg)' } : null}>週{'日一二三四五六'[wd]}</span>
              </div>
              <span className="city-bar" style={{ background: cityColor(d.city) }} />
              <div className="tl-body">
                <div className="row between">
                  <span className="tl-title ellipsis">{d.title}</span>
                  <span className="xs faint" style={{ flex: 'none' }}>{CITIES[d.city]?.name}</span>
                </div>
                {dayLegs.map((l) => {
                  const M = MODES[l.mode];
                  return (
                    <div className="tl-line" key={l.id}>
                      <M.icon size={13} strokeWidth={1.7} />
                      <span className="ellipsis">
                        {l.number && l.mode === 'flight' ? `${l.number}　` : ''}
                        {l.from} → {l.to}
                        {l.dep ? `・${l.dep}` : ''}
                      </span>
                    </div>
                  );
                })}
                {d.plans ? (
                  <div className="tl-line">
                    <MapPin size={13} strokeWidth={1.7} />
                    <span className="ellipsis">A {d.plans.A} / B {d.plans.B}</span>
                  </div>
                ) : (
                  dayStops.length > 0 && (
                    <div className="tl-line">
                      <MapPin size={13} strokeWidth={1.7} />
                      <span className="ellipsis">
                        {dayStops
                          .sort((a, b) => a.order - b.order)
                          .map((s) => s.name)
                          .join('、')}
                      </span>
                    </div>
                  )
                )}
                {lodging && (
                  <div className="tl-line">
                    <BedDouble size={13} strokeWidth={1.7} />
                    <span className="ellipsis">{lodging.name}</span>
                    {lodging.status === 'todo' && (
                      <span className="tag warn" style={{ height: 18, fontSize: 11 }}>
                        <CircleAlert size={11} />
                        未訂
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
