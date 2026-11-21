import { useState } from 'react';
import { Plus, Check, Receipt } from 'lucide-react';
import { CITIES } from '../lib/constants';
import { money, fmtDate } from '../lib/util';
import { store } from '../lib/store';

const MIN = { EUR: 50.01, CZK: 2001 };

export default function Shopping({ shops, refunds, onEditShop, onAddShop, onEditRefund, onAddRefund }) {
  const [city, setCity] = useState('all');
  const list = shops.filter((s) => city === 'all' || s.city === city);
  const stamped = refunds.filter((r) => r.stamped).length;

  return (
    <div>
      <div className="section" style={{ paddingTop: 20 }}>
        <div className="row between">
          <div className="label" style={{ margin: 0 }}>購物清單</div>
          <button className="btn primary sm" onClick={() => onAddShop(city === 'all' ? 'FRA' : city)}>
            <Plus size={14} />
            新增
          </button>
        </div>
      </div>
      <div className="filter-row">
        {[['all', '全部'], ...['FRA', 'MUC', 'PRG'].map((c) => [c, CITIES[c].name])].map(([k, l]) => (
          <button key={k} className={`chip${city === k ? ' on' : ''}`} onClick={() => setCity(k)}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ padding: '4px 20px 8px' }}>
        {list.length === 0 && <div className="empty">清單是空的</div>}
        {list
          .sort((a, b) => Number(a.done) - Number(b.done))
          .map((s) => (
            <div className={`check${s.done ? ' done' : ''}`} key={s.id}>
              <button className={`box${s.done ? ' on' : ''}`} onClick={() => store.patch(s.id, { done: !s.done })} aria-label={s.done ? '標記為未買' : '標記為已買'}>
                {s.done && <Check size={13} strokeWidth={3} />}
              </button>
              <div className="grow" onClick={() => onEditShop(s)} style={{ cursor: 'pointer' }}>
                <div className="t">{s.item}</div>
                <div className="xs faint row" style={{ gap: 6 }}>
                  <i className="city-dot" style={{ background: CITIES[s.city]?.color, width: 6, height: 6 }} />
                  {CITIES[s.city]?.name}
                  {s.store && `・${s.store}`}
                </div>
                {s.note && <div className="xs muted" style={{ marginTop: 2 }}>{s.note}</div>}
              </div>
            </div>
          ))}
      </div>

      <div className="section">
        <div className="row between">
          <div className="label" style={{ margin: 0 }}>退稅單據</div>
          <button className="btn sm" onClick={onAddRefund}>
            <Plus size={14} />
            登錄單據
          </button>
        </div>
        <div className="xs muted" style={{ margin: '6px 0 4px' }}>
          {refunds.length} 張單據・已蓋章 {stamped} 張
        </div>
        {refunds.map((r) => {
          const under = r.amount !== '' && r.amount != null && MIN[r.currency] && Number(r.amount) < MIN[r.currency];
          return (
            <div className="check" key={r.id} onClick={() => onEditRefund(r)} style={{ cursor: 'pointer' }}>
              <Receipt size={18} strokeWidth={1.6} color="var(--text-3)" style={{ marginTop: 2, flex: 'none' }} />
              <div className="grow">
                <div className="t">{r.store}</div>
                <div className="xs faint num">
                  {[CITIES[r.city]?.name, r.date && fmtDate(r.date, { withWeekday: false }), money(r.amount, r.currency)].filter(Boolean).join('・')}
                </div>
                {under && <div className="xs" style={{ color: 'var(--warn)' }}>未達退稅門檻</div>}
              </div>
              <span className={`status ${r.stamped ? 'paid' : 'todo'}`} style={{ height: 24, lineHeight: '22px' }}>
                {r.stamped ? '已蓋章' : '未蓋章'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="section" style={{ paddingBottom: 32 }}>
        <div className="label">逛街須知</div>
        <div className="tip">
          <b>退稅門檻</b>：德國同一家店單日滿 €50.01、捷克滿 2,001 Kč。結帳時出示護照，請店家開 Tax Free 單據。
        </div>
        <div className="tip">
          <b>在哪裡蓋章</b>：在<b>最後離開歐盟的機場</b>辦理。回程 CI 068 從布拉格直飛，所以德國和捷克的單據都在<b>布拉格機場</b>蓋海關章。托運行李前先辦，商品需未使用、可供查驗。
        </div>
        <div className="tip">
          <b>營業時間</b>：德國商店週一至週六約 10:00–20:00，<b>週日幾乎全關</b>（1/17 是週日，剛好安排移動）。布拉格週日大多照常營業。
        </div>
        <div className="tip">
          <b>冬季折扣</b>：一月是德國 Winterschlussverkauf 折扣季，百貨與步行街常見 30–70% off。
        </div>
        <div className="tip">
          <b>付款</b>：德國小店與市集仍常只收現金；布拉格用克朗，盡量刷卡並選擇以當地貨幣扣款。
        </div>
      </div>
    </div>
  );
}
