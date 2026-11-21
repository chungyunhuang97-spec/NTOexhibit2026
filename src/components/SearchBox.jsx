import { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowLeft, Loader2 } from 'lucide-react';
import { suggest, searchFull } from '../lib/search';
import { CATEGORIES } from '../lib/constants';

/**
 * Google Maps 風格的地點搜尋。
 * onPick(result) 選擇結果；fullscreen 為手機全螢幕模式。
 */
export default function SearchBox({ onPick, bias, fullscreen = false, onClose, placeholder = '搜尋地點，例如 新天鵝堡、Zeil' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [source, setSource] = useState('photon');
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (fullscreen) inputRef.current?.focus();
  }, [fullscreen]);

  // 即時聯想：停止輸入 350ms 後查詢
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const r = await suggest(term, { bias, signal: ctrl.signal });
        setResults(r);
        setSource('photon');
        setActive(0);
        setOpen(true);
      } catch (e) {
        if (e.name !== 'AbortError') setError('搜尋暫時無法使用，請按 Enter 再試一次');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // 點外面關閉
  useEffect(() => {
    if (fullscreen) return;
    const h = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [fullscreen]);

  async function runFull() {
    const term = q.trim();
    if (term.length < 2) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const r = await searchFull(term, { signal: ctrl.signal });
      setResults(r);
      setSource('nominatim');
      setActive(0);
      setOpen(true);
    } catch (e) {
      if (e.name !== 'AbortError') setError('搜尋失敗，請檢查網路後再試');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  function pick(r) {
    onPick(r);
    setQ('');
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && results[active] && source === 'nominatim') pick(results[active]);
      else runFull();
    } else if (e.key === 'Escape') {
      setOpen(false);
      onClose?.();
    }
  }

  const showList = (open || fullscreen) && q.trim().length >= 2;

  const content = (
    <div className="search" ref={wrapRef}>
      <div className="search-box">
        {fullscreen ? (
          <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onClose} aria-label="返回">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Search size={18} color="var(--text-3)" />
        )}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          enterKeyHint="search"
          autoComplete="off"
          aria-label="搜尋地點"
        />
        {loading && <Loader2 size={16} className="spin" color="var(--text-3)" />}
        {q && !loading && (
          <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setQ('')} aria-label="清除">
            <X size={16} />
          </button>
        )}
      </div>
      {showList && (
        <div className="search-results" role="listbox">
          {error && <div className="empty">{error}</div>}
          {!error && !loading && results.length === 0 && (
            <div className="empty">
              找不到結果。試試德文或捷克文原名，或按 Enter 進階搜尋。
            </div>
          )}
          {results.map((r, i) => {
            const Icon = CATEGORIES[r.category]?.icon || CATEGORIES.other.icon;
            return (
              <button
                key={r.key}
                className={`result${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                role="option"
                aria-selected={i === active}
              >
                <span className="ic">
                  <Icon size={17} strokeWidth={1.6} />
                </span>
                <span className="grow">
                  <div className="t">
                    {r.nameZh ? `${r.nameZh}・` : ''}
                    {r.nameLocal}
                  </div>
                  <div className="a">{r.address}</div>
                  <div className="k">{r.typeLabel}</div>
                </span>
              </button>
            );
          })}
          <div className="search-foot">
            <span>{source === 'photon' ? '即時建議' : '進階搜尋結果'}・範圍：德國、捷克</span>
            {source === 'photon' && (
              <button className="btn ghost sm" onClick={runFull}>
                進階搜尋
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (fullscreen) return <div className="search-screen">{content}</div>;
  return content;
}
