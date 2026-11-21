import { useEffect, useRef, useState } from 'react';

const PEEK = 168;

/** 三段式底部抽屜：peek / half / full。拖曳把手或標頭區域切換。 */
export default function BottomSheet({ snap, setSnap, header, children, bodyRef }) {
  const [vh, setVh] = useState(() => window.innerHeight);
  const [drag, setDrag] = useState(null); // { startY, startH, h }
  const sheetRef = useRef(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    const h = () => setVh(window.innerHeight);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const tabbar = 60;
  const maxH = vh - tabbar - 64;
  const heights = { peek: PEEK, half: Math.round((vh - tabbar) * 0.52), full: maxH };
  const h = drag ? drag.h : heights[snap];

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('button, a, input, .daychip')) {
      // 允許在日期列上水平捲動與點擊
      return startMaybe(e, true);
    }
    startMaybe(e, false);
  }

  function startMaybe(e, soft) {
    const startY = e.clientY;
    const startX = e.clientX;
    const startH = heights[snap];
    let active = false;
    draggedRef.current = false;
    void soft;
    let cur = startH;
    const move = (ev) => {
      const dy = startY - ev.clientY;
      if (!active) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(ev.clientX - startX)) {
          active = true;
          draggedRef.current = true;
        }
        else return;
      }
      cur = Math.max(PEEK - 40, Math.min(maxH, startH + dy));
      setDrag({ h: cur });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!active) return;
      const entries = Object.entries(heights);
      const moved = cur - startH;
      let target;
      if (Math.abs(moved) > 60) {
        const order = ['peek', 'half', 'full'];
        const idx = order.indexOf(snap);
        target = moved > 0 ? order[Math.min(idx + 1, 2)] : order[Math.max(idx - 1, 0)];
        // 大幅拖曳直接跳到最近的段
        const nearest = entries.sort((a, b) => Math.abs(a[1] - cur) - Math.abs(b[1] - cur))[0][0];
        if (Math.abs(moved) > (heights.full - heights.peek) / 2) target = nearest;
      } else target = snap;
      setDrag(null);
      setSnap(target);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  return (
    <div
      ref={sheetRef}
      className="sheet"
      style={{ height: h, transition: drag ? 'none' : 'height .28s cubic-bezier(.2,.8,.2,1)' }}
      aria-label="當日行程"
    >
      <div onPointerDown={onDown} style={{ touchAction: 'pan-x' }}>
        <div className="sheet-grip" onClick={() => !draggedRef.current && setSnap(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half')} />
        {header}
      </div>
      <div className="sheet-body" ref={bodyRef}>
        {children}
      </div>
    </div>
  );
}

export const sheetHeights = (vh) => ({ peek: PEEK, half: Math.round((vh - 60) * 0.52), full: vh - 60 - 64 });
