import { removeBackground } from '@imgly/background-removal';
import { buildScenes } from './scenes.js';

const W = 640, H = 480;          // 即時預覽解析度（橫式 4:3，對應展場 iPad 橫向掛載）
const CAPTURE_SCALE = 2;          // 拍照當下的全解析度輸出倍率

let state = 'idle'; // idle | live | captured
let stream = null, video = null;
let rafId = null;
let facingMode = 'user';
let modelChoice = pickDefaultQuality();
let deviceChoice = 'gpu'; // 預設 GPU，跑不動時 captureAndProcess() 會自動退回 CPU 重試

let previewCtx;
const hiCanvas = document.createElement('canvas');
const hiCtx = hiCanvas.getContext('2d');

const displayCanvas = document.getElementById('displayCanvas');
let scenes = [];
let activeSceneIndex = 0;

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
    mini.width = 50; mini.height = 50;
    mini.getContext('2d').drawImage(s.canvas, 0, 0, 50, 50);
    const num = document.createElement('span');
    num.className = 'num'; num.textContent = idx + 1;
    btn.appendChild(mini); btn.appendChild(num);
    btn.title = s.name;
    btn.addEventListener('click', () => { activeSceneIndex = idx; renderSceneStrip(); });
    strip.appendChild(btn);
  });
}

function setSeg(containerId, value, onChange) {
  const el = document.getElementById(containerId);
  [...el.querySelectorAll('button')].forEach((b) => {
    b.classList.toggle('active', b.dataset.val === value);
    b.onclick = () => {
      [...el.querySelectorAll('button')].forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      onChange(b.dataset.val);
    };
  });
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
  document.getElementById('controlSection').style.display = 'none';
  document.getElementById('liveActionBar').style.display = 'none';
  document.getElementById('resultActionBar').style.display = 'none';
  document.getElementById('modeTag').style.display = 'none';
  document.getElementById('statTag').style.display = 'none';
  setStatus(false);
}

function showLive() {
  state = 'live';
  document.getElementById('idleView').style.display = 'none';
  document.getElementById('resultImg').style.display = 'none';
  displayCanvas.style.display = 'block';
  document.getElementById('sceneSection').style.display = 'flex';
  document.getElementById('controlSection').style.display = 'flex';
  document.getElementById('liveActionBar').style.display = 'flex';
  document.getElementById('resultActionBar').style.display = 'none';
  document.getElementById('modeTag').style.display = 'block';
  document.getElementById('statTag').style.display = 'block';
  document.getElementById('statTag').textContent = '未拍攝';
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
  document.getElementById('liveActionBar').style.display = 'none';
  document.getElementById('resultActionBar').style.display = 'flex';
  document.getElementById('modeTag').style.display = 'none';
  document.getElementById('statTag').style.display = 'none';
  const stat = document.getElementById('resultStat');
  stat.classList.toggle('fallback', fellBack);
  stat.textContent = '處理耗時：' + ms.toFixed(0) + ' ms ・ 模型：' + modelChoice +
    ' ・ 裝置：' + usedDevice + (fellBack ? '（GPU 不支援，已自動退回 CPU）' : '');
  setStatus(false);
}

async function startCamera() {
  const permHint = document.getElementById('permHint');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } },
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
  if (!previewCtx) {
    displayCanvas.width = W; displayCanvas.height = H;
    previewCtx = displayCanvas.getContext('2d');
  }
  if (!scenes.length) { scenes = buildScenes(W, H); renderSceneStrip(); }
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
document.getElementById('retakeBtn').addEventListener('click', showLive);
document.getElementById('backToIdleBtn').addEventListener('click', () => { stopCamera(); showIdle(); });
document.getElementById('facingBtn').addEventListener('click', () => {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  stopCamera();
  startCamera();
});

setSeg('modelSeg', modelChoice, (v) => { modelChoice = v; });
setSeg('deviceSeg', deviceChoice, (v) => { deviceChoice = v; });

showIdle();
