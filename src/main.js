import { removeBackground } from '@imgly/background-removal';
import { buildScenes } from './scenes.js';

let W = 640, H = 480;             // 即時預覽解析度，實際比例會依攝影框當下的顯示比例動態校正
const CAPTURE_SCALE = 2;          // 拍照當下的全解析度輸出倍率
let scenesBuiltFor = null;        // 記錄目前 scenes 是用哪個 W×H 產生的，比例變了要重畫

let state = 'idle'; // idle | live | captured
let stream = null, video = null;
let rafId = null;
let facingMode = 'user';

// 模型品質／執行裝置不對外顯示控制項，背景自動判斷／自動退回。
const modelChoice = pickDefaultQuality();
let deviceChoice = 'gpu'; // 預設 GPU，跑不動時 captureAndProcess() 會自動退回 CPU 重試

let previewCtx;
const hiCanvas = document.createElement('canvas');
const hiCtx = hiCanvas.getContext('2d');

const displayCanvas = document.getElementById('displayCanvas');
let scenes = [];
let activeSceneIndex = 0;

// 拍照當下去背完成的人像（透明背景 PNG），換場景時直接重新合成，不必重跑 AI。
let lastForeground = null; // { img, CW, CH }

// 依瀏覽器回報的網路狀況（Network Information API，iPad Safari 不支援，會直接略過這項判斷）
// 與裝置核心數，粗略判斷「網路或設備比較弱」，類似手機訊號差時自動從 5G 降到 4G。
function pickDefaultQuality() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let weakNetwork = false;
  if (conn) {
    if (conn.saveData) weakNetwork = true;
    if (conn.effectiveType && /2g|3g/.test(conn.effectiveType)) weakNetwork = true;
    if (typeof conn.downlink === 'number' && conn.downlink < 3) weakNetwork = true;
  }
  const cores = navigator.hardwareConcurrency || 4;
  const weakDevice = cores <= 4;
  return (weakNetwork || weakDevice) ? 'isnet_fp16' : 'isnet';
}

function drawVideoCover(ctx, vid, w, h) {
  const vw = vid.videoWidth, vh = vid.videoHeight;
  if (!vw || !vh) return;
  const vAspect = vw / vh, dAspect = w / h;
  let sx, sy, sw, sh;
  if (vAspect > dAspect) { sh = vh; sw = vh * dAspect; sx = (vw - sw) / 2; sy = 0; }
  else { sw = vw; sh = vw / dAspect; sx = 0; sy = (vh - sh) / 2; }
  ctx.save();
  if (facingMode === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, w, h);
  ctx.restore();
}

function previewLoop() {
  if (state !== 'live') return;
  drawVideoCover(previewCtx, video, W, H);
  rafId = requestAnimationFrame(previewLoop);
}

function renderSceneStrip() {
  const strip = document.getElementById('sceneStrip');
  strip.innerHTML = '';
  scenes.forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.className = 'scene-btn' + (idx === activeSceneIndex ? ' active' : '');
    const mini = document.createElement('canvas');
    mini.width = 64; mini.height = 64;
    mini.getContext('2d').drawImage(s.canvas, 0, 0, 64, 64);
    const num = document.createElement('span');
    num.className = 'num'; num.textContent = idx + 1;
    btn.appendChild(mini); btn.appendChild(num);
    btn.title = s.name;
    btn.addEventListener('click', () => selectScene(idx));
    strip.appendChild(btn);
  });
}

function selectScene(idx) {
  activeSceneIndex = idx;
  renderSceneStrip();
  if (state === 'captured' && lastForeground) {
    recompositeWithScene(idx);
  }
}

function recompositeWithScene(idx) {
  const { img, CW, CH } = lastForeground;
  const out = document.createElement('canvas');
  out.width = CW; out.height = CH;
  const octx = out.getContext('2d');
  octx.drawImage(scenes[idx].canvas, 0, 0, CW, CH);
  octx.drawImage(img, 0, 0, CW, CH);
  document.getElementById('resultImg').src = out.toDataURL('image/png');
}

function setStatus(live) {
  const tag = document.getElementById('statusTag');
  tag.classList.toggle('live', live);
  document.getElementById('statusText').textContent = live ? '預覽中（未去背）' : '待機';
}

function showIdle() {
  state = 'idle';
  document.getElementById('idleView').style.display = 'flex';
  displayCanvas.style.display = 'none';
  document.getElementById('resultImg').style.display = 'none';
  document.getElementById('sceneSection').style.display = 'none';
  document.getElementById('liveActionBar').style.display = 'none';
  document.getElementById('resultActionBar').style.display = 'none';
  document.getElementById('modeTag').style.display = 'none';
  document.getElementById('statTag').style.display = 'none';
  document.getElementById('facingBtn').style.display = 'none';
  setStatus(false);
}

function showLive() {
  state = 'live';
  document.getElementById('idleView').style.display = 'none';
  document.getElementById('resultImg').style.display = 'none';
  displayCanvas.style.display = 'block';
  document.getElementById('sceneSection').style.display = 'flex';
  document.getElementById('liveActionBar').style.display = 'flex';
  document.getElementById('resultActionBar').style.display = 'none';
  document.getElementById('modeTag').style.display = 'block';
  document.getElementById('statTag').style.display = 'block';
  document.getElementById('statTag').textContent = '未拍攝';
  document.getElementById('facingBtn').style.display = 'inline-block';
  setStatus(true);
  rafId = requestAnimationFrame(previewLoop);
}

function showCaptured(dataUrl, ms, usedDevice, fellBack) {
  state = 'captured';
  if (rafId) cancelAnimationFrame(rafId);
  const img = document.getElementById('resultImg');
  img.src = dataUrl;
  img.style.display = 'block';
  displayCanvas.style.display = 'none';
  document.getElementById('sceneSection').style.display = 'flex';
  document.getElementById('liveActionBar').style.display = 'none';
  document.getElementById('resultActionBar').style.display = 'flex';
  document.getElementById('modeTag').style.display = 'none';
  document.getElementById('statTag').style.display = 'none';
  document.getElementById('facingBtn').style.display = 'none';
  const stat = document.getElementById('resultStat');
  stat.classList.toggle('fallback', fellBack);
  stat.textContent = '處理耗時：' + ms.toFixed(0) + ' ms' + (fellBack ? '（GPU 不支援，已自動退回 CPU）' : '');
  setStatus(false);
}

// 讓拍照/合成用的畫布比例，跟攝影框（.stage）當下實際顯示的比例一致，
// 避免 CSS object-fit:cover 在螢幕上裁掉的範圍，跟真正輸出的照片範圍對不上。
function syncCanvasSizeToStage() {
  const rect = document.getElementById('stage').getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const aspect = rect.width / rect.height;
  const baseLong = 960; // 基準長邊解析度
  if (aspect >= 1) { W = baseLong; H = Math.round(baseLong / aspect); }
  else { H = baseLong; W = Math.round(baseLong * aspect); }
}

async function startCamera() {
  const permHint = document.getElementById('permHint');
  syncCanvasSizeToStage();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: W }, height: { ideal: H } },
      audio: false
    });
  } catch (err) {
    permHint.textContent = '無法取得相機權限：' + err.message + '（請確認以 https 開啟，並在系統設定允許相機）';
    permHint.classList.add('err');
    return;
  }
  if (!video) {
    video = document.createElement('video');
    video.playsInline = true; video.muted = true; video.autoplay = true;
  }
  video.srcObject = stream;
  await video.play();
  displayCanvas.width = W; displayCanvas.height = H;
  if (!previewCtx) previewCtx = displayCanvas.getContext('2d');
  if (!scenes.length || scenesBuiltFor !== W + 'x' + H) {
    scenes = buildScenes(W, H);
    scenesBuiltFor = W + 'x' + H;
    renderSceneStrip();
  }
  showLive();
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// 把 @imgly/background-removal 的下載/推論進度（多個階段各自的 current/total）
// 加總成單一百分比，驅動畫面上的進度條。
function makeProgressHandler(fillEl, pctEl) {
  const parts = new Map();
  return (key, current, total) => {
    parts.set(key, { current, total });
    let sumCur = 0, sumTot = 0;
    parts.forEach((p) => { sumCur += p.current; sumTot += p.total; });
    const pct = sumTot > 0 ? Math.min(99, Math.round((sumCur / sumTot) * 100)) : 0;
    fillEl.style.width = pct + '%';
    pctEl.textContent = pct + '%';
  };
}

async function runRemoveBackground(blob, device, onProgress) {
  return removeBackground(blob, {
    model: modelChoice,
    device,
    output: { type: 'foreground', format: 'image/png' },
    progress: onProgress,
    debug: false
  });
}

async function captureAndProcess() {
  const veil = document.getElementById('processingVeil');
  const veilText = document.getElementById('veilText');
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');
  veil.style.display = 'flex';
  veilText.textContent = 'AI 去背處理中…';
  progressFill.style.width = '0%';
  progressPct.textContent = '0%';
  const t0 = performance.now();
  const onProgress = makeProgressHandler(progressFill, progressPct);

  const CW = W * CAPTURE_SCALE, CH = H * CAPTURE_SCALE;
  hiCanvas.width = CW; hiCanvas.height = CH;
  drawVideoCover(hiCtx, video, CW, CH);
  const blob = await canvasToBlob(hiCanvas);

  let usedDevice = deviceChoice;
  let fellBack = false;
  let resultBlob;
  try {
    resultBlob = await runRemoveBackground(blob, deviceChoice, onProgress);
  } catch (err) {
    if (deviceChoice === 'gpu') {
      usedDevice = 'cpu';
      fellBack = true;
      veilText.textContent = 'GPU 加速不可用，改用 CPU 重試…';
      progressFill.style.width = '0%';
      progressPct.textContent = '0%';
      try {
        resultBlob = await runRemoveBackground(blob, 'cpu', onProgress);
      } catch (err2) {
        veil.style.display = 'none';
        alert('去背失敗：' + err2.message + '\n（請確認網路可以連線，第一次使用需要下載 AI 模型）');
        return;
      }
    } else {
      veil.style.display = 'none';
      alert('去背失敗：' + err.message + '\n（請確認網路可以連線，第一次使用需要下載 AI 模型）');
      return;
    }
  }

  const fgImg = new Image();
  const fgUrl = URL.createObjectURL(resultBlob);
  await new Promise((resolve, reject) => { fgImg.onload = resolve; fgImg.onerror = reject; fgImg.src = fgUrl; });
  lastForeground = { img: fgImg, CW, CH };

  const out = document.createElement('canvas');
  out.width = CW; out.height = CH;
  const octx = out.getContext('2d');
  octx.drawImage(scenes[activeSceneIndex].canvas, 0, 0, CW, CH);
  octx.drawImage(fgImg, 0, 0, CW, CH);
  URL.revokeObjectURL(fgUrl);

  const t1 = performance.now();
  progressFill.style.width = '100%';
  progressPct.textContent = '100%';
  veil.style.display = 'none';
  showCaptured(out.toDataURL('image/png'), t1 - t0, usedDevice, fellBack);
}

document.getElementById('startBtn').addEventListener('click', startCamera);
document.getElementById('shutterBtn').addEventListener('click', () => { captureAndProcess(); });
document.getElementById('retakeBtn').addEventListener('click', () => { lastForeground = null; showLive(); });
document.getElementById('exportPngBtn').addEventListener('click', downloadResultPng);
document.getElementById('backToIdleBtn').addEventListener('click', () => { lastForeground = null; stopCamera(); showIdle(); });

function downloadResultPng() {
  const dataUrl = document.getElementById('resultImg').src;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'ntu-ai-demo-' + Date.now() + '.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
document.getElementById('facingBtn').addEventListener('click', () => {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  stopCamera();
  startCamera();
});

showIdle();
