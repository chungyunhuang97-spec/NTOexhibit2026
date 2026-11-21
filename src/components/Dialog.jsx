import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} aria-label={label} />
  );
}

/**
 * 依欄位設定產生表單。
 * fields: [{ name, label, type, options, half, placeholder, hint }]
 */
export function FormDialog({ title, value, fields, onSave, onDelete, onClose, saveLabel = '儲存', extra }) {
  const [v, setV] = useState(value);
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));

  const rows = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.half && fields[i + 1]?.half) {
      rows.push([f, fields[i + 1]]);
      i++;
    } else rows.push([f]);
  }

  const renderField = (f) => {
    if (f.type === 'toggle') {
      return (
        <div className="switch" key={f.name}>
          <span>
            {f.label}
            {f.hint && <div className="xs faint">{f.hint}</div>}
          </span>
          <Toggle on={!!v[f.name]} onChange={(x) => set(f.name, x)} label={f.label} />
        </div>
      );
    }
    let input;
    if (f.type === 'select') {
      input = (
        <select value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value || null)}>
          {f.options.map(([val, lab]) => (
            <option key={val} value={val}>
              {lab}
            </option>
          ))}
        </select>
      );
    } else if (f.type === 'textarea') {
      input = <textarea value={v[f.name] ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
    } else {
      input = (
        <input
          type={f.type || 'text'}
          inputMode={f.type === 'number' ? 'decimal' : undefined}
          value={v[f.name] ?? ''}
          placeholder={f.placeholder}
          onChange={(e) => set(f.name, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        />
      );
    }
    return (
      <label className="field" key={f.name}>
        <span>{f.label}</span>
        {input}
        {f.hint && <div className="xs faint" style={{ marginTop: 4 }}>{f.hint}</div>}
      </label>
    );
  };

  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn ghost danger" onClick={onDelete}>
              刪除
            </button>
          )}
          <span className="grow" />
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn primary" onClick={() => onSave(v)}>
            {saveLabel}
          </button>
        </>
      }
    >
      {extra}
      {rows.map((r, i) =>
        r.length === 2 ? (
          <div className="field-row" key={i}>
            {r.map(renderField)}
          </div>
        ) : (
          renderField(r[0])
        )
      )}
    </Dialog>
  );
}
