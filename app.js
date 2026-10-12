const $ = (id) => document.getElementById(id);
const screen = $('screen');
const ctx = screen.getContext('2d', { alpha: false });
const buffer = document.createElement('canvas');
const bctx = buffer.getContext('2d', { willReadFrequently: true });
const video = $('video');
const palettes = {
  classic: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  pocket: ['#28332b', '#626e60', '#a5ad98', '#dce0c8'],
  amber: ['#442609', '#87501b', '#cf913d', '#f2cb72'],
};
let palette = 'classic', stream = null, paused = false, powered = true;
let frameTime = 0, toastTimer, requesting = false;
const rgb = (hex) => hex.slice(1).match(/../g).map((part) => parseInt(part, 16));

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2400);
}

function updateState() {
  $('screen-state').textContent = !powered ? 'POWER OFF' : paused ? 'PAUSED' : stream ? 'LIVE CAMERA' : 'DEMO MODE';
  $('power-light').style.background = powered ? '#da5545' : '#6c655c';
  $('power-light').style.boxShadow = powered ? '0 0 6px #ef584769' : 'none';
  $('freeze-button').setAttribute('aria-pressed', String(paused));
  $('freeze-button').setAttribute('aria-label', paused ? 'Resume video' : 'Freeze frame');
  $('power-button').setAttribute('aria-pressed', String(powered));
  $('power-button').setAttribute('aria-label', powered ? 'Turn display off' : 'Turn display on');
}

function stopCamera() {
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  video.style.display = 'none';
  $('camera-placeholder').style.display = 'flex';
  $('camera-label').textContent = 'CAMERA OFF';
  $('camera-dot').style.background = '#72796b';
  $('camera-button').innerHTML = 'Enable camera <span>↗</span>';
  $('camera-message').textContent = 'Video is processed only on your device.';
  paused = false;
  updateState();
}

$('camera-button').addEventListener('click', async () => {
  if (stream) { stopCamera(); return; }
  if (requesting) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    $('camera-message').textContent = 'Open this page on localhost or HTTPS to use your camera.';
    return;
  }
  requesting = true;
  $('camera-button').disabled = true;
  $('camera-message').textContent = 'Allow camera access in the browser prompt.';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    video.style.display = 'block';
    $('camera-placeholder').style.display = 'none';
    $('camera-label').textContent = 'LIVE';
    $('camera-dot').style.background = '#c4e78b';
    $('camera-button').innerHTML = 'Disable camera <span>×</span>';
    $('camera-message').textContent = 'Live feed. Your video stays on your device.';
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      stopCamera();
      $('camera-message').textContent = 'Camera disconnected. You can connect it again.';
    });
    paused = false;
    powered = true;
    updateState();
  } catch (error) {
    stopCamera();
    const messages = {
      NotAllowedError: 'Camera access denied. Allow it in your site settings and try again.',
      NotFoundError: 'No camera found. Connect one and try again.',
      NotReadableError: 'Another app is using your camera. Close it and try again.',
    };
    $('camera-message').textContent = messages[error.name] || 'Could not start the camera. Please try again.';
  } finally {
    requesting = false;
    $('camera-button').disabled = false;
  }
});

// Animated pixel landscape makes the display usable before camera permission.
function drawDemo(time, width, height) {
  bctx.save();
  bctx.scale(width / 160, height / 144);
  bctx.fillStyle = '#d0d0d0'; bctx.fillRect(0, 0, 160, 144);
  bctx.fillStyle = '#eeeeee'; bctx.fillRect(118, 17, 16, 16);
  bctx.fillStyle = '#a0a0a0';
  for (let i = 0; i < 3; i++) {
    const x = ((i * 65 + time * .004) % 205) - 35;
    bctx.fillRect(x, 22 + i * 11, 27, 4); bctx.fillRect(x + 7, 18 + i * 11, 14, 4);
  }
  bctx.fillStyle = '#888888';
  bctx.beginPath(); bctx.moveTo(0, 90); bctx.lineTo(0, 73); bctx.lineTo(28, 44); bctx.lineTo(52, 68); bctx.lineTo(82, 36); bctx.lineTo(124, 75); bctx.lineTo(143, 58); bctx.lineTo(160, 73); bctx.lineTo(160, 100); bctx.fill();
  bctx.fillStyle = '#bebebe'; bctx.beginPath(); bctx.moveTo(68, 50); bctx.lineTo(82, 36); bctx.lineTo(96, 50); bctx.lineTo(85, 46); bctx.lineTo(78, 52); bctx.fill();
  bctx.fillStyle = '#505050'; bctx.fillRect(0, 89, 160, 55);
  for (let i = 0; i < 8; i++) {
    let x = i * 25 - 7;
    bctx.fillRect(x + 7, 71 + i % 3 * 3, 4, 28);
    bctx.beginPath(); bctx.moveTo(x, 91); bctx.lineTo(x + 9, 64 + i % 3 * 3); bctx.lineTo(x + 19, 91); bctx.fill();
  }
  bctx.fillStyle = '#a0a0a0'; bctx.fillRect(0, 111, 160, 33);
  bctx.fillStyle = '#d0d0d0';
  for (let i = 0; i < 12; i++) bctx.fillRect(((i * 19 + time * .009) % 185) - 20, 117 + i % 4 * 7, 12 + i % 3 * 5, 1);
  bctx.fillStyle = '#222222'; bctx.fillRect(37, 115, 83, 17);
  bctx.fillStyle = '#eeeeee'; bctx.font = '8px monospace'; bctx.textAlign = 'center'; bctx.fillText('POCKET CAM', 79, 126);
  bctx.restore();
}

function render(time) {
  requestAnimationFrame(render);
  if (time - frameTime < 1000 / 24 || paused || !powered) return;
  frameTime = time;
  const size = Number($('resolution').value);
  const width = Math.floor(160 / size), height = Math.floor(144 / size);
  if (buffer.width !== width || buffer.height !== height) { buffer.width = width; buffer.height = height; }
  if (stream && video.readyState >= 2) {
    const vw = video.videoWidth, vh = video.videoHeight;
    const scale = Math.max(width / vw, height / vh);
    bctx.save(); bctx.translate(width, 0); bctx.scale(-1, 1);
    bctx.drawImage(video, (width - vw * scale) / 2, (height - vh * scale) / 2, vw * scale, vh * scale);
    bctx.restore();
  } else drawDemo(time, width, height);
  const frame = bctx.getImageData(0, 0, width, height);
  const colors = palettes[palette].map(rgb);
  const contrast = Number($('contrast').value);
  for (let i = 0; i < frame.data.length; i += 4) {
    const luminance = (frame.data[i] * .299 + frame.data[i + 1] * .587 + frame.data[i + 2] * .114) / 255;
    const level = Math.min(3, Math.max(0, Math.floor(((luminance - .5) * contrast + .5) * 4)));
    [frame.data[i], frame.data[i + 1], frame.data[i + 2]] = colors[level];
  }
  bctx.putImageData(frame, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, 160, 144);
}

$('contrast').addEventListener('input', () => $('contrast-value').textContent = `${Number($('contrast').value).toFixed(1)}×`);
$('resolution').addEventListener('input', () => $('resolution-value').textContent = `${$('resolution').value}×`);
document.querySelectorAll('.palette').forEach((button) => button.addEventListener('click', () => {
  palette = button.dataset.palette;
  $('palette-label').textContent = palette.toUpperCase();
  document.querySelectorAll('.palette').forEach((item) => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
}));
$('freeze-button').addEventListener('click', () => {
  if (!powered) { toast('Press START to turn on the display first'); return; }
  paused = !paused; updateState(); toast(paused ? 'Frame frozen' : 'Video resumed');
});
$('power-button').addEventListener('click', () => {
  powered = !powered;
  if (!powered) { ctx.fillStyle = '#788367'; ctx.fillRect(0, 0, 160, 144); }
  else paused = false;
  updateState();
});
$('reset-button').addEventListener('click', () => {
  $('contrast').value = 1.2; $('contrast-value').textContent = '1.2×';
  $('resolution').value = 1; $('resolution-value').textContent = '1×';
  document.querySelector('[data-palette="classic"]').click();
  paused = false; powered = true; updateState(); toast('Settings reset');
});
$('snapshot-button').addEventListener('click', () => {
  if (!powered) { toast('Press START to turn on the display first'); return; }
  const snapshot = document.createElement('canvas'); snapshot.width = 640; snapshot.height = 576;
  const sctx = snapshot.getContext('2d'); sctx.imageSmoothingEnabled = false; sctx.drawImage(screen, 0, 0, 640, 576);
  const link = document.createElement('a'); link.download = `pocket-cam-${Date.now()}.png`; link.href = snapshot.toDataURL('image/png'); link.click();
  toast('Snapshot saved as PNG');
});
window.addEventListener('pagehide', stopCamera);
updateState();
requestAnimationFrame(render);
