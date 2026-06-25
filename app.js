const screens = {
  layout: document.querySelector("#layoutScreen"),
  receipt: document.querySelector("#receiptScreen"),
  booth: document.querySelector("#boothScreen"),
  decorate: document.querySelector("#decorateScreen"),
};

const video = document.querySelector("#camera");
const snapshotCanvas = document.querySelector("#snapshotCanvas");
const stripCanvas = document.querySelector("#stripCanvas");
const captureButton = document.querySelector("#captureButton");
const retakeButton = document.querySelector("#retakeButton");
const downloadButton = document.querySelector("#downloadButton");
const swapCameraButton = document.querySelector("#swapCamera");
const countdown = document.querySelector("#countdown");
const poseChip = document.querySelector("#poseChip");
const filterWash = document.querySelector("#filterWash");
const cameraMessage = document.querySelector("#cameraMessage");
const layoutOptions = document.querySelector("#layoutOptions");
const receipt = document.querySelector("#receipt");
const receiptPull = document.querySelector("#receiptPull");
const receiptTitle = document.querySelector("#receiptTitle");
const receiptCount = document.querySelector("#receiptCount");
const frameOptions = document.querySelector("#frameOptions");
const stickerOptions = document.querySelector("#stickerOptions");
const filterButtons = document.querySelectorAll(".filter-panel button");

const stripContext = stripCanvas.getContext("2d");
const snapshotContext = snapshotCanvas.getContext("2d");

const layouts = {
  duo: { label: "2 pics", count: 2, canvas: [900, 1500] },
  trio: { label: "3 pics", count: 3, canvas: [900, 1800] },
  quad: { label: "4 big", count: 4, canvas: [1500, 1500] },
  stack: { label: "4 stacked", count: 4, canvas: [720, 2160] },
};

const frameThemes = {
  cherie: { frame: "#ffd6e6", text: "#1d1a28", mark: "#fff7b7", accent: "#ff6fb5" },
  cream: { frame: "#fff8fc", text: "#1d1a28", mark: "#ffd6e6", accent: "#ff8fca" },
  lilac: { frame: "#dac8ff", text: "#1d1a28", mark: "#fff7b7", accent: "#ff8fca" },
  butter: { frame: "#fff7b7", text: "#1d1a28", mark: "#ffd6e6", accent: "#9c6bd3" },
  ink: { frame: "#1d1a28", text: "#fff8fc", mark: "#ff8fca", accent: "#fff7b7" },
};

const filters = {
  clean: { canvas: "none", camera: "none", wash: "" },
  cherub: { canvas: "saturate(1.12) contrast(0.94) brightness(1.1)", camera: "saturate(1.12) contrast(0.94) brightness(1.1)", wash: "cherub" },
  idol: { canvas: "saturate(1.28) contrast(1.04) brightness(1.08)", camera: "saturate(1.28) contrast(1.04) brightness(1.08)", wash: "idol" },
  bubble: { canvas: "saturate(1.05) contrast(0.98) brightness(1.08)", camera: "saturate(1.05) contrast(0.98) brightness(1.08)", wash: "bubble" },
  manga: { canvas: "grayscale(0.22) contrast(1.28) brightness(1.04)", camera: "grayscale(0.22) contrast(1.28) brightness(1.04)", wash: "manga" },
  y2k: { canvas: "saturate(1.35) contrast(1.08) hue-rotate(-8deg)", camera: "saturate(1.35) contrast(1.08) hue-rotate(-8deg)", wash: "y2k" },
  blush: { canvas: "saturate(1.2) contrast(0.92) brightness(1.12)", camera: "saturate(1.2) contrast(0.92) brightness(1.12)", wash: "blush" },
  noir: { canvas: "grayscale(1) contrast(1.14) brightness(1.02)", camera: "grayscale(1) contrast(1.14) brightness(1.02)", wash: "noir" },
};

let selectedLayout = "stack";
let activeFrame = "cherie";
let activeFilter = "clean";
let activeSticker = "creatures-a";
let facingMode = "user";
let stream;
let photos = [];
let isCapturing = false;
let dragStart = null;

const stickerSets = {
  "creatures-a": {
    files: [
      "./assets/stickers/set1/0-note.png",
      "./assets/stickers/set1/1-heart.png",
      "./assets/stickers/set1/2-notcute.png",
      "./assets/stickers/set1/3-bag.png",
    ],
  },
  "creatures-b": {
    files: [6, 7, 8, 2, 4, 0].map((index) => `./assets/stickers/creatures-${index}.png`),
  },
  "pastel-a": {
    files: [0, 1, 2, 3, 4, 5, 6, 7].map((index) => `./assets/stickers/pastel-${index}.png`),
  },
  "pastel-b": {
    files: [8, 9, 10, 11, 12, 13, 14, 15].map((index) => `./assets/stickers/pastel-${index}.png`),
  },
};

const stickerImages = new Map();

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    const active = key === name;
    screen.classList.toggle("is-active", active);
    screen.setAttribute("aria-hidden", String(!active));
  });
}

async function startCamera() {
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode, width: { ideal: 1600 }, height: { ideal: 1200 } },
    });
    video.srcObject = stream;
    cameraMessage.hidden = true;
    captureButton.disabled = false;
  } catch (error) {
    cameraMessage.hidden = false;
    captureButton.disabled = true;
  }
}

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
  stream = null;
}

function updateCameraFilter() {
  const filter = filters[activeFilter];
  document.documentElement.style.setProperty("--camera-filter", filter.camera);
  filterWash.className = `filter-wash ${filter.wash}`.trim();
}

function updatePose() {
  const total = layouts[selectedLayout].count;
  poseChip.textContent = `Pose ${Math.min(photos.length + 1, total)} / ${total}`;
  captureButton.textContent = photos.length === 0 ? "Start" : photos.length < total ? "Next" : "Decorate";
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runCountdown() {
  for (const value of [3, 2, 1]) {
    countdown.textContent = value;
    await sleep(620);
  }
  countdown.textContent = "";
}

function capturePhoto() {
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 960;
  const targetRatio = 4 / 3;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceWidth / sourceHeight > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  snapshotCanvas.width = 1200;
  snapshotCanvas.height = 900;
  snapshotContext.save();
  snapshotContext.translate(snapshotCanvas.width, 0);
  snapshotContext.scale(-1, 1);
  snapshotContext.filter = filters[activeFilter].canvas;
  snapshotContext.drawImage(video, sx, sy, sw, sh, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
  snapshotContext.restore();
  photos.push(snapshotCanvas.toDataURL("image/jpeg", 0.94));
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawImageCover(context, image, x, y, width, height) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  context.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function photoRects(layout, width, height) {
  const margin = layout === "quad" ? 110 : 120;
  const footer = layout === "quad" ? 150 : 168;
  const gap = layout === "duo" ? 44 : 30;

  if (layout === "quad") {
    const cell = (width - margin * 2 - gap) / 2;
    return [
      [margin, margin, cell, cell],
      [margin + cell + gap, margin, cell, cell],
      [margin, margin + cell + gap, cell, cell],
      [margin + cell + gap, margin + cell + gap, cell, cell],
    ];
  }

  const count = layouts[layout].count;
  const photoWidth = width - margin * 2;
  const photoHeight = (height - margin * 2 - footer - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => [
    margin,
    margin + index * (photoHeight + gap),
    photoWidth,
    photoHeight,
  ]);
}

function drawStar(context, x, y, size, fill) {
  context.save();
  context.translate(x, y);
  context.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? size : size * 0.42;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  context.closePath();
  context.fillStyle = fill;
  context.strokeStyle = "#1d1a28";
  context.lineWidth = 3;
  context.fill();
  context.stroke();
  context.restore();
}

function drawHeart(context, x, y, size, fill) {
  context.save();
  context.translate(x, y);
  context.scale(size / 36, size / 36);
  context.beginPath();
  context.moveTo(0, 12);
  context.bezierCurveTo(-24, -8, -33, 18, 0, 34);
  context.bezierCurveTo(33, 18, 24, -8, 0, 12);
  context.fillStyle = fill;
  context.strokeStyle = "#1d1a28";
  context.lineWidth = 3;
  context.fill();
  context.stroke();
  context.restore();
}

function drawBubble(context, x, y, text, fill = "#fff8fc", bubbleWidth = 230) {
  context.save();
  context.fillStyle = fill;
  context.strokeStyle = "#1d1a28";
  context.lineWidth = 4;
  drawRoundedRect(context, x, y, bubbleWidth, 78, 28);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(x + 44, y + 76);
  context.lineTo(x + 30, y + 112);
  context.lineTo(x + 82, y + 78);
  context.fill();
  context.stroke();
  context.fillStyle = "#1d1a28";
  context.textAlign = "center";
  context.font = `800 ${bubbleWidth < 150 ? 18 : 24}px Avenir, system-ui, sans-serif`;
  context.fillText(text, x + bubbleWidth / 2, y + 49);
  context.restore();
}

function sideSpots(rects, width, height) {
  const spots = rects.flatMap(([x, y, w, h], index) => {
    const centerY = y + h / 2;
    return [
      { x: Math.max(44, x / 2), y: centerY, side: "left", index },
      { x: Math.min(width - 44, x + w + (width - x - w) / 2), y: centerY, side: "right", index },
    ];
  });

  return spots.filter((spot) => spot.y > 120 && spot.y < height - 155);
}

function loadStickerImage(src) {
  if (!stickerImages.has(src)) {
    const image = new Image();
    image.src = src;
    stickerImages.set(src, image);
  }
  const image = stickerImages.get(src);
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", reject, { once: true });
  });
}

function drawStickerImage(context, image, centerX, centerY, maxSize) {
  const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
}

async function drawStickerPack(context, theme, width, height, rects) {
  const spots = sideSpots(rects, width, height);
  const pick = (index) => spots[index % spots.length] || { x: width - 78, y: 160 };
  const set = stickerSets[activeSticker] || stickerSets["creatures-a"];
  await Promise.all(set.files.map(loadStickerImage));

  const stickerSize = selectedLayout === "quad" ? 190 : 138;
  set.files.forEach((src, index) => {
    const spot = pick(index);
    const jitter = index % 2 === 0 ? -18 : 18;
    drawStickerImage(context, stickerImages.get(src), spot.x, spot.y + jitter, stickerSize);
  });
}

async function drawStrip() {
  const layout = layouts[selectedLayout];
  const theme = frameThemes[activeFrame];
  const [width, height] = layout.canvas;
  stripCanvas.width = width;
  stripCanvas.height = height;

  stripContext.fillStyle = theme.frame;
  stripContext.fillRect(0, 0, width, height);
  stripContext.fillStyle = theme.mark;
  stripContext.fillRect(0, 0, selectedLayout === "quad" ? 24 : 14, height);

  const rects = photoRects(selectedLayout, width, height);
  await Promise.all(
    photos.map((photo, index) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const [x, y, w, h] = rects[index];
        stripContext.save();
        drawRoundedRect(stripContext, x, y, w, h, 22);
        stripContext.clip();
        drawImageCover(stripContext, image, x, y, w, h);
        stripContext.restore();
        resolve();
      };
      image.src = photo;
    })),
  );

  rects.slice(photos.length).forEach(([x, y, w, h]) => {
    stripContext.fillStyle = "rgba(255, 255, 255, 0.22)";
    drawRoundedRect(stripContext, x, y, w, h, 22);
    stripContext.fill();
  });

  await drawStickerPack(stripContext, theme, width, height, rects);

  stripContext.fillStyle = theme.text;
  stripContext.textAlign = "center";
  stripContext.font = `${selectedLayout === "quad" ? 72 : 54}px Snell Roundhand, Apple Chancery, Georgia, serif`;
  stripContext.fillText("Mon Cherie", width / 2, height - (selectedLayout === "quad" ? 76 : 110));
  stripContext.font = "700 20px Monaco, Consolas, monospace";
  stripContext.fillText(new Date().toLocaleDateString(), width / 2, height - (selectedLayout === "quad" ? 42 : 68));
}

async function handleCapture() {
  const total = layouts[selectedLayout].count;
  if (isCapturing || photos.length >= total) return;
  isCapturing = true;
  captureButton.disabled = true;
  await runCountdown();
  capturePhoto();
  updatePose();
  isCapturing = false;

  if (photos.length >= total) {
    stopCamera();
    await drawStrip();
    showScreen("decorate");
    return;
  }

  captureButton.disabled = false;
}

function startReceipt() {
  const layout = layouts[selectedLayout];
  receiptTitle.textContent = layout.label;
  receiptCount.textContent = `${layout.count} poses`;
  receipt.classList.remove("is-ripped", "is-dragging");
  receipt.style.removeProperty("--drag-x");
  receipt.style.removeProperty("--drag-y");
  receipt.style.removeProperty("--drag-rotate");
  showScreen("receipt");
}

function startBooth() {
  receipt.classList.add("is-ripped");
  window.setTimeout(() => {
    photos = [];
    updatePose();
    updateCameraFilter();
    showScreen("booth");
    startCamera();
  }, 560);
}

function resetToBooth() {
  photos = [];
  countdown.textContent = "";
  updatePose();
  showScreen("booth");
  startCamera();
}

function beginDrag(event) {
  if (receipt.classList.contains("is-ripped")) return;
  receiptPull.setPointerCapture(event.pointerId);
  dragStart = { x: event.clientX, y: event.clientY };
  receipt.classList.add("is-dragging");
}

function moveDrag(event) {
  if (!dragStart || receipt.classList.contains("is-ripped")) return;
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  const rotate = Math.max(-18, Math.min(18, dx / 8));
  receipt.style.setProperty("--drag-x", `${dx}px`);
  receipt.style.setProperty("--drag-y", `${dy}px`);
  receipt.style.setProperty("--drag-rotate", `${rotate}deg`);

  if (Math.hypot(dx, dy) > 115 && Math.abs(dx) + Math.max(dy, 0) > 135) {
    dragStart = null;
    startBooth();
  }
}

function endDrag() {
  if (receipt.classList.contains("is-ripped")) return;
  dragStart = null;
  receipt.classList.remove("is-dragging");
  receipt.style.setProperty("--drag-x", "0px");
  receipt.style.setProperty("--drag-y", "0px");
  receipt.style.setProperty("--drag-rotate", "0deg");
}

layoutOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-layout]");
  if (!button) return;
  selectedLayout = button.dataset.layout;
  layoutOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("is-selected", item === button));
  startReceipt();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    updateCameraFilter();
  });
});

frameOptions.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-frame]");
  if (!button) return;
  activeFrame = button.dataset.frame;
  frameOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
  await drawStrip();
});

stickerOptions.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-sticker]");
  if (!button) return;
  activeSticker = button.dataset.sticker;
  stickerOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
  await drawStrip();
});

receiptPull.addEventListener("pointerdown", beginDrag);
receiptPull.addEventListener("pointermove", moveDrag);
receiptPull.addEventListener("pointerup", endDrag);
receiptPull.addEventListener("pointercancel", endDrag);
captureButton.addEventListener("click", handleCapture);
retakeButton.addEventListener("click", resetToBooth);
downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `mon-cherie-${selectedLayout}-${Date.now()}.png`;
  link.href = stripCanvas.toDataURL("image/png");
  link.click();
});
swapCameraButton.addEventListener("click", async () => {
  facingMode = facingMode === "user" ? "environment" : "user";
  await startCamera();
});
window.addEventListener("beforeunload", stopCamera);

updateCameraFilter();
updatePose();
