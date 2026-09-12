// 佔位場景美術 — 純 Canvas 程式產生，之後由正式美術取代
function makeScene(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('ALPHA', alpha));
  g.addColorStop(1, color.replace('ALPHA', '0'));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function buildScenes(w, h) {
  return [
    { name: '日落港灣', draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#3a2b52'); g.addColorStop(0.45, '#a1466b'); g.addColorStop(0.75, '#e88a4c'); g.addColorStop(1, '#f5c56a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        glow(ctx, w * 0.5, h * 0.55, w * 0.6, 'rgba(255,220,150,ALPHA)', 0.5);
      } },
    { name: '深夜城市', draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#0c1024'); g.addColorStop(1, '#1c2a52');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = 'rgba(255,224,150,' + (Math.random() * 0.5 + 0.2) + ')';
          ctx.fillRect(Math.random() * w, h * 0.55 + Math.random() * h * 0.4, 1.5, 1.5);
        }
      } },
    { name: '森林光影', draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#16321f'); g.addColorStop(1, '#2c4a2a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        glow(ctx, w * 0.7, h * 0.15, w * 0.7, 'rgba(220,255,190,ALPHA)', 0.35);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i < 6; i++) ctx.fillRect(w * (i / 6), 0, 6, h);
      } },
    { name: '復古膠捲', draw(ctx) {
        ctx.fillStyle = '#3a2c1e'; ctx.fillRect(0, 0, w, h);
        const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.8);
        g.addColorStop(0, '#8a6a3f'); g.addColorStop(1, '#241a10');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
          ctx.fillStyle = 'rgba(255,240,210,' + (Math.random() * 0.06) + ')';
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
      } },
    { name: '極光雪夜', draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#0a1620'); g.addColorStop(1, '#12222c');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        glow(ctx, w * 0.3, h * 0.2, w * 0.9, 'rgba(120,255,210,ALPHA)', 0.28);
        glow(ctx, w * 0.75, h * 0.35, w * 0.7, 'rgba(150,140,255,ALPHA)', 0.24);
      } },
    { name: '摩登展場', draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#d8d2c6'); g.addColorStop(1, '#a89e8c');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 0, w, h * 0.5);
      } }
  ].map((s) => ({ name: s.name, canvas: makeScene(w, h, s.draw) }));
}
