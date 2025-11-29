const DATA_URL = 'data_upload.json';

let videos = [];
let filteredVideos = [];
let cards = [];

const totalVideosEl = document.getElementById('totalVideos');
const totalSizeEl = document.getElementById('totalSize');
const pillCountEl = document.getElementById('pillCount');

const videoListEl = document.getElementById('videoList');
const searchInput = document.getElementById('searchInput');
const emptyStateEl = document.getElementById('emptyState');

const mainPlayer = document.getElementById('mainPlayer');
const mainSource = document.getElementById('mainSource');
const placeholder = document.getElementById('playerPlaceholder');

const titleEl = document.getElementById('nowPlayingTitle');
const sizeEl = document.getElementById('nowPlayingSize');
const dateEl = document.getElementById('nowPlayingDate');

function formatDate(str) {
  if (!str) return 'Tanggal tidak diketahui';
  const d = new Date(str);
  if (isNaN(d.getTime())) return 'Tanggal tidak diketahui';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadVideos() {
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('Gagal ambil data_upload.json: ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Format data_upload.json harus array');

    // Sort terbaru di atas
    videos = json
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
    filteredVideos = videos.slice();

    updateStats();
    renderList();
  } catch (err) {
    console.error(err);
    titleEl.textContent = 'Gagal memuat data_upload.json';
  }
}

function updateStats() {
  const total = videos.length;
  const sizeTotal = videos.reduce((s, v) => s + (v.sizeMB || 0), 0).toFixed(2);

  totalVideosEl.textContent = `${total} video`;
  totalSizeEl.textContent = `${sizeTotal} MB`;
  pillCountEl.textContent = String(total);
}

function renderList() {
  videoListEl.innerHTML = '';
  cards = [];

  if (filteredVideos.length === 0) {
    emptyStateEl.style.display = 'block';
    return;
  }
  emptyStateEl.style.display = 'none';

  filteredVideos.forEach((v) => {
    const filename = v.filename || 'Tanpa nama';
    const sizeText =
      typeof v.sizeMB === 'number' ? v.sizeMB.toFixed(2) + ' MB' : 'Unknown';
    const dateText = formatDate(v.uploadedAt);

    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.url = v.url || '';
    card.dataset.filename = filename;
    card.dataset.size = sizeText;
    card.dataset.date = dateText;

    const thumb = document.createElement('div');
    thumb.className = 'video-thumb';

    const info = document.createElement('div');
    info.className = 'video-info';

    const title = document.createElement('div');
    title.className = 'video-title';
    title.textContent = filename;

    const meta = document.createElement('div');
    meta.className = 'video-meta';

    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = sizeText;

    const dateSpan = document.createElement('span');
    dateSpan.textContent = dateText;

    meta.appendChild(sizeSpan);
    meta.appendChild(dateSpan);
    info.appendChild(title);
    info.appendChild(meta);

    card.appendChild(thumb);
    card.appendChild(info);

    card.addEventListener('click', () => {
      setActive(card);
    });

    videoListEl.appendChild(card);
    cards.push(card);
  });
}

function showVideoPlayer() {
  if (placeholder) placeholder.style.display = 'flex';
  mainPlayer.style.display = 'none';
}

function setActive(card) {
  if (!card) return;
  const url = card.dataset.url;
  const filename = card.dataset.filename || 'Tanpa nama';
  const size = card.dataset.size || '';
  const date = card.dataset.date || '';

  if (!url) return;

  // Sembunyikan placeholder, tampilkan player
  if (placeholder) placeholder.style.display = 'none';
  mainPlayer.style.display = 'block';

  mainSource.src = url;
  mainPlayer.load();
  mainPlayer.play().catch(() => {});

  titleEl.textContent = filename;
  sizeEl.textContent = size;
  dateEl.textContent = date;

  cards.forEach((c) => c.classList.remove('active'));
  card.classList.add('active');
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  let visible = 0;

  cards.forEach((card) => {
    const name = (card.dataset.filename || '').toLowerCase();
    if (!q || name.includes(q)) {
      card.style.display = '';
      visible++;
    } else {
      card.style.display = 'none';
    }
  });

  if (visible === 0) {
    emptyStateEl.style.display = 'block';
    // reset player (placeholder lagi)
    mainSource.src = '';
    mainPlayer.pause();
    mainPlayer.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    titleEl.textContent = 'Tidak ada video yang cocok';
    sizeEl.textContent = '';
    dateEl.textContent = '';
  } else {
    emptyStateEl.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', loadVideos);
