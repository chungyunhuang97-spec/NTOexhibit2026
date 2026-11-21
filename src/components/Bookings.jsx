import { useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { BOOKING_CATS, STATUS } from '../lib/constants';
import { fmtDate, money } from '../lib/util';
import { store } from '../lib/store';

const NEXT = { todo: 'booked', booked: 'paid', paid: 'todo' };

export default function Bookings({ bookings, rates, onEdit, onAdd }) {
  const [filter, setFilter] = useState('pending');
  const filters = [
    ['pending', '待處理'],
    ['all', '全部'],
    ...Object.entries(BOOKING_CATS)
      .filter(([k]) => k !== 'refund')
      .map(([k, v]) => [k, v.label])
  ];
  const list = bookings
    .filter((b) => (filter === 'all' ? true : filter === 'pending' ? b.status === 'todo' : b.cat === filter))
    .sort((a, b) => {
      if (a.status === 'todo' && b.status !== 'todo') return -1;
      if (b.status === 'todo' && a.status !== 'todo') return 1;
      return (a.due || a.date || '9999').localeCompare(b.due || b.date || '9999');
    });

  const done = bookings.filter((b) => b.status !== 'todo').length;
  const totals = bookings.reduce((acc, b) => {
    if (b.price === '' || b.price == null) return acc;
    acc[b.currency] = (acc[b.currency] || 0) + Number(b.price);
    return acc;
  }, {});
  const twd = Object.entries(totals).reduce((s, [c, v]) => s + (c === 'TWD' ? v : v * (rates?.[c] || 0)), 0);

  return (
    <div>
      <div className="section" style={{ paddingTop: 20 }}>
        <div className="row between">
          <div>
            <div className="label" style={{ margin: 0 }}>訂票與準備</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
              {done} <span className="faint" style={{ fontSize: 15 }}>/ {bookings.length} 完成</span>
            </div>
          </div>
          <button className="btn primary sm" onClick={onAdd}>
            <Plus size={14} />
            新增
          </button>
        </div>
        <div className="progress">
          <div style={{ width: `${bookings.length ? (done / bookings.length) * 100 : 0}%` }} />
        </div>
        {Object.keys(totals).length > 0 && (
          <div className="xs muted num" style={{ marginTop: 10 }}>
            已登錄金額：{Object.entries(totals).map(([c, v]) => money(v, c)).join('　')}
            {twd > 0 && `　約 NT$${Math.round(twd).toLocaleString('zh-TW')}`}
          </div>
        )}
      </div>
      <div className="filter-row">
        {filters.map(([k, l]) => (
          <button key={k} className={`chip${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ padding: '4px 20px 24px' }}>
        {list.length === 0 && <div className="empty">這個分類目前沒有項目</div>}
        {list.map((b) => {
          const Cat = BOOKING_CATS[b.cat] || BOOKING_CATS.prep;
          const isTask = b.cat === 'prep';
          const label = isTask ? STATUS[b.status].taskLabel : STATUS[b.status].label;
          return (
            <div className="bk" key={b.id}>
              <span className="ic">
                <Cat.icon size={15} strokeWidth={1.7} />
              </span>
              <div className="grow" onClick={() => onEdit(b)} style={{ cursor: 'pointer' }}>
                <div className="t">{b.title}</div>
                <div className="m num">
                  {b.date && <span>使用 {fmtDate(b.date)}</span>}
                  {b.due && b.status === 'todo' && <span style={{ color: 'var(--warn)' }}>{fmtDate(b.due, { withWeekday: false })} 前完成</span>}
                  {b.price !== '' && b.price != null && <span>{money(b.price, b.currency)}</span>}
                  {b.ref && <span>代號 {b.ref}</span>}
                </div>
                {b.note && <div className="xs muted" style={{ marginTop: 4 }}>{b.note}</div>}
                {b.url && (
                  <a className="btn sm" style={{ marginTop: 8 }} href={b.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={13} />
                    前往訂購
                  </a>
                )}
              </div>
              <button
                className={`status ${b.status}`}
                onClick={() => store.patch(b.id, { status: isTask && b.status === 'booked' ? 'todo' : NEXT[b.status] })}
                aria-label={`狀態：${label}，點擊切換`}
              >
                {label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
