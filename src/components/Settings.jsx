import { useState } from 'react';
import { Copy, Check, Cloud, HardDrive } from 'lucide-react';
import { Dialog } from './Dialog';
import { store, useStore } from '../lib/store';

export function PinDialog({ onClose }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setErr('');
    try {
      const ok = await store.enterPin(pin.trim());
      if (ok) onClose();
      else setErr('PIN 不正確');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="輸入編輯 PIN"
      onClose={onClose}
      footer={
        <>
          <span className="grow" />
          <button className="btn" onClick={onClose}>
            只看不改
          </button>
          <button className="btn primary" disabled={busy || pin.trim().length < 4} onClick={submit}>
            解鎖編輯
          </button>
        </>
      }
    >
      <p className="small muted" style={{ marginTop: 0 }}>
        這個旅程可以共同編輯。輸入一次 PIN 後，這台裝置之後就不用再輸入。
      </p>
      {err && <div className="notice">{err}</div>}
      <input
        className="input num"
        style={{ fontSize: 20, letterSpacing: '.3em', textAlign: 'center', height: 48 }}
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        aria-label="PIN"
      />
    </Dialog>
  );
}

export default function Settings({ meta, onClose }) {
  const sync = useStore((s) => s.sync);
  const settings = useStore((s) => s.settings);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rates, setRates] = useState(meta?.rates || { EUR: 35, CZK: 1.4 });
  const shareUrl = sync.tripId ? `${location.origin}${location.pathname}?t=${sync.tripId}` : '';

  async function create() {
    setBusy(true);
    setErr('');
    try {
      await store.createShared(pin.trim());
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    const text = `德國行程 2027\n${shareUrl}\n編輯 PIN 請私下告知`;
    try {
      if (navigator.share) await navigator.share({ title: '德國行程 2027', url: shareUrl });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* 使用者取消分享 */
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(Object.values(store.getState().items), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `germany-trip-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const statusText = {
    idle: '已同步',
    saving: '儲存中',
    loading: '讀取中',
    offline: '離線中，恢復連線後自動上傳',
    error: sync.error || '同步失敗'
  }[sync.status];

  return (
    <Dialog title="設定與共享" onClose={onClose}>
      <div className="label">同步</div>
      {sync.mode === 'remote' ? (
        <>
          <div className={`notice${sync.status === 'error' || sync.status === 'offline' ? '' : ' ok'}`}>
            <div className="row">
              <Cloud size={15} />
              雲端共享旅程・{statusText}
            </div>
          </div>
          <p className="small muted">把連結傳給佑辰和弟弟，第一次編輯時輸入 PIN，三人即可同步編輯。</p>
          <div className="row" style={{ marginBottom: 8 }}>
            <input className="input xs" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
            <button className="btn" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? '已複製' : '分享'}
            </button>
          </div>
          {!sync.canEdit && (
            <button className="btn block" onClick={() => store.ensureEditable()}>
              輸入 PIN 以編輯
            </button>
          )}
        </>
      ) : (
        <>
          <div className="notice">
            <div className="row">
              <HardDrive size={15} />
              本機模式：資料只存在這台裝置
            </div>
          </div>
          {sync.configured ? (
            <>
              <p className="small muted">設定一組 4 位以上的 PIN，把目前的行程上傳成共享旅程。之後把連結和 PIN 給佑辰和弟弟就能一起編輯。</p>
              {err && <div className="notice">{err}</div>}
              <div className="row">
                <input
                  className="input num"
                  inputMode="numeric"
                  placeholder="設定編輯 PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <button className="btn primary" disabled={busy || pin.trim().length < 4} onClick={create}>
                  建立共享旅程
                </button>
              </div>
            </>
          ) : (
            <p className="small muted">
              尚未設定 Supabase。部署時加上環境變數 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY，並在 Supabase 執行 supabase/schema.sql，就能啟用三人共享編輯。
            </p>
          )}
        </>
      )}

      <div className="label" style={{ marginTop: 22 }}>導航 App</div>
      <div className="segmented">
        <button className={settings.navApp !== 'apple' ? 'on' : ''} onClick={() => store.setSetting('navApp', 'google')}>
          Google Maps
        </button>
        <button className={settings.navApp === 'apple' ? 'on' : ''} onClick={() => store.setSetting('navApp', 'apple')}>
          Apple 地圖
        </button>
      </div>
      <p className="xs faint">只影響這台裝置。火車班次建議另外用 DB Navigator 查詢。</p>

      <div className="label" style={{ marginTop: 22 }}>匯率（換算台幣用）</div>
      <div className="field-row">
        <label className="field">
          <span>1 歐元 ≈ 台幣</span>
          <input type="number" inputMode="decimal" value={rates.EUR} onChange={(e) => setRates({ ...rates, EUR: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span>1 克朗 ≈ 台幣</span>
          <input type="number" inputMode="decimal" step="0.01" value={rates.CZK} onChange={(e) => setRates({ ...rates, CZK: Number(e.target.value) })} />
        </label>
      </div>
      <button className="btn sm" onClick={() => store.patch('meta', { rates })}>
        儲存匯率
      </button>

      <div className="label" style={{ marginTop: 22 }}>資料</div>
      <div className="row wrap">
        <button className="btn sm" onClick={exportJson}>
          匯出備份（JSON）
        </button>
        {sync.mode === 'local' && (
          <button
            className="btn sm ghost danger"
            onClick={() => window.confirm('確定要清除修改、回到預設行程嗎？') && store.resetLocal()}
          >
            還原預設行程
          </button>
        )}
      </div>
    </Dialog>
  );
}
