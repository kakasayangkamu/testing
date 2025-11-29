const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data_upload.json');

let videos = [];

// ---- Helper: load data_upload.json ----
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const json = JSON.parse(raw);

    if (Array.isArray(json)) {
      videos = json.slice().sort(function (a, b) {
        return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
      });
      console.log('[INFO] Loaded ' + videos.length + ' videos from data_upload.json');
    } else {
      console.error('[ERROR] data_upload.json harus berupa array');
      videos = [];
    }
  } catch (err) {
    console.error('[ERROR] Gagal baca data_upload.json:', err.message);
    videos = [];
  }
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load awal
loadData();

// Auto reload kalau file berubah
fs.watchFile(DATA_PATH, { interval: 2000 }, function () {
  console.log('[INFO] data_upload.json berubah, reload...');
  loadData();
});

const app = express();

app.get('/', function (req, res) {
  const totalVideos = videos.length;
  const totalSize = videos
    .reduce(function (sum, v) {
      return sum + (v.sizeMB || 0);
    }, 0)
    .toFixed(2);

  // ❗ Sekarang player awal KOSONG ─ user harus klik dulu
  const initialSrc = '';
  const initialTitle = 'Pilih video untuk diputar';
  const initialSize = '';
  const initialDate = '';

  // Render list video
  var listHtml = '';
  videos.forEach(function (v, idx) {
    var filename = v.filename || 'Tanpa nama';
    var sizeText =
      typeof v.sizeMB === 'number' ? v.sizeMB.toFixed(2) + ' MB' : 'Unknown';
    var dateText = v.uploadedAt
      ? new Date(v.uploadedAt).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Tanggal tidak diketahui';

    // ❗ Tidak ada "active" default
    listHtml +=
      '<div class="video-card" data-url="' +
      escapeHtml(v.url || '') +
      '" data-filename="' +
      escapeHtml(filename) +
      '" data-size="' +
      escapeHtml(sizeText) +
      '" data-date="' +
      escapeHtml(dateText) +
      '">' +
      '<div class="video-thumb"></div>' +
      '<div class="video-info">' +
      '<div class="video-title">' +
      escapeHtml(filename) +
      '</div>' +
      '<div class="video-meta">' +
      '<span>' +
      escapeHtml(sizeText) +
      '</span>' +
      '<span>' +
      escapeHtml(dateText) +
      '</span>' +
      '</div>' +
      '</div>' +
      '</div>';
  });

  // HTML full, inline CSS + JS (UI lebih responsif)
  var html =
    '<!DOCTYPE html>' +
    '<html lang="id">' +
    '<head>' +
    '<meta charset="UTF-8" />' +
    '<title>Notnon Video</title>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<style>' +
    '*,*::before,*::after{box-sizing:border-box}' +
    ':root{' +
    '--bg:#020617;' +
    '--bg-soft:#020818;' +
    '--card:#02091a;' +
    '--accent:#22c55e;' +
    '--accent-soft:rgba(34,197,94,.15);' +
    '--text:#e5e7eb;' +
    '--text-soft:#9ca3af;' +
    '--border:#1f2937;' +
    '}' +
    'body{' +
    'margin:0;' +
    'font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
    'background:radial-gradient(circle at top,#020617 0,#020617 40%,#000 100%);' +
    'color:var(--text);' +
    '}' +
    '.header{' +
    'display:flex;align-items:center;justify-content:space-between;' +
    'padding:10px 16px;border-bottom:1px solid var(--border);' +
    'background:rgba(2,6,23,.96);backdrop-filter:blur(12px);' +
    'position:sticky;top:0;z-index:10;font-size:13px;' +
    '}' +
    '.logo{font-weight:700;font-size:18px;letter-spacing:.04em;display:flex;align-items:center;gap:4px}' +
    '.logo span{color:var(--accent)}' +
    '.badge-dot{width:7px;height:7px;border-radius:999px;background:var(--accent);box-shadow:0 0 0 4px rgba(34,197,94,.2)}' +
    '.stats{display:flex;gap:8px;color:var(--text-soft);flex-wrap:wrap;justify-content:flex-end}' +
    '.stats span{padding:3px 9px;border-radius:999px;border:1px solid var(--border);background:rgba(15,23,42,.9)}' +
    '.layout{' +
    'display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.5fr);' +
    'gap:16px;padding:12px 14px 16px;max-width:1200px;margin:0 auto;' +
    '}' +
    '@media(max-width:900px){.layout{grid-template-columns:1fr;grid-auto-rows:auto}}' +
    '@media(max-width:640px){.header{flex-direction:column;align-items:flex-start;gap:6px}}' +
    '.player-section{min-width:0}' +
    '.player-card{' +
    'background:linear-gradient(145deg,#020617 0,var(--card) 40%,#020617 100%);' +
    'border-radius:16px;padding:12px 12px 14px;' +
    'border:1px solid rgba(148,163,184,.16);' +
    'box-shadow:0 18px 40px rgba(15,23,42,.8);' +
    '}' +
    '#nowPlayingTitle{margin:0 0 8px;font-size:15px;display:flex;align-items:center;gap:6px}' +
    '#nowPlayingTitle::before{' +
    'content:"";width:8px;height:8px;border-radius:999px;' +
    'background:rgba(148,163,184,.7);' +
    '}' +
    '#mainPlayer{width:100%;border-radius:12px;background:#000;max-height:70vh}' +
    '.player-placeholder{' +
    'width:100%;border-radius:12px;background:radial-gradient(circle at top,#1f2937 0,#020617 55%);' +
    'display:flex;align-items:center;justify-content:center;flex-direction:column;' +
    'gap:6px;padding:30px 10px;color:var(--text-soft);font-size:13px;border:1px dashed rgba(148,163,184,.3);' +
    '}' +
    '.player-placeholder-icon{' +
    'width:40px;height:40px;border-radius:14px;border:1px solid rgba(148,163,184,.35);' +
    'display:flex;align-items:center;justify-content:center;margin-bottom:2px;' +
    '}' +
    '.player-placeholder-icon::before{' +
    'content:"";border-style:solid;border-width:8px 0 8px 13px;' +
    'border-color:transparent transparent transparent #e5e7eb;margin-left:2px;' +
    '}' +
    '.player-meta{' +
    'display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;' +
    'font-size:11px;color:var(--text-soft);' +
    '}' +
    '.player-meta span{' +
    'padding:4px 8px;border-radius:999px;background:rgba(15,23,42,.85);' +
    '}' +
    '.list-section{' +
    'background:rgba(2,6,23,.9);border-radius:16px;padding:10px 10px 12px;' +
    'border:1px solid rgba(15,23,42,.95);display:flex;flex-direction:column;' +
    'max-height:calc(100vh - 90px);' +
    '}' +
    '@media(max-width:900px){.list-section{max-height:none}}' +
    '.list-header{' +
    'display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;flex-wrap:wrap;' +
    '}' +
    '.list-header h3{margin:0;font-size:13px;display:flex;align-items:center;gap:6px}' +
    '.pill-count{' +
    'font-size:11px;padding:2px 7px;border-radius:999px;' +
    'background:rgba(15,23,42,.9);border:1px solid rgba(31,41,55,.9);color:var(--text-soft);' +
    '}' +
    '#searchInput{' +
    'flex:1;min-width:140px;padding:7px 10px;border-radius:999px;border:1px solid var(--border);' +
    'background:rgba(15,23,42,.98);color:var(--text);font-size:12px;' +
    '}' +
    '#searchInput::placeholder{color:var(--text-soft)}' +
    '#searchInput:focus{' +
    'outline:none;border-color:var(--accent);box-shadow:0 0 0 1px rgba(34,197,94,.3);' +
    '}' +
    '.video-list{' +
    'overflow-y:auto;padding-right:3px;display:flex;flex-direction:column;gap:7px;' +
    'font-size:12px;margin-top:4px;' +
    '}' +
    '.video-card{' +
    'display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:11px;' +
    'border:1px solid rgba(15,23,42,.95);background:rgba(15,23,42,.92);cursor:pointer;' +
    'transition:background .12s ease,transform .06s ease,border-color .12s ease,box-shadow .12s ease;' +
    '}' +
    '.video-card:hover{' +
    'background:rgba(15,23,42,1);transform:translateY(-1px);' +
    'box-shadow:0 10px 22px rgba(15,23,42,.7);' +
    '}' +
    '.video-card.active{' +
    'border-color:var(--accent);background:var(--accent-soft);' +
    'box-shadow:0 0 0 1px rgba(34,197,94,.4);' +
    '}' +
    '.video-thumb{' +
    'width:64px;height:40px;border-radius:9px;' +
    'background:radial-gradient(circle at center,#1f2937 0,#020617 60%);' +
    'display:flex;align-items:center;justify-content:center;' +
    'flex-shrink:0;position:relative;overflow:hidden;' +
    '}' +
    '.video-thumb::before{' +
    'content:"";border-style:solid;border-width:7px 0 7px 12px;' +
    'border-color:transparent transparent transparent #e5e7eb;margin-left:2px;' +
    '}' +
    '.video-thumb::after{' +
    'content:"";position:absolute;inset:0;border-radius:9px;' +
    'box-shadow:0 0 0 1px rgba(148,163,184,.4) inset;' +
    '}' +
    '.video-info{min-width:0;flex:1}' +
    '.video-title{' +
    'font-size:12px;margin-bottom:2px;white-space:nowrap;overflow:hidden;' +
    'text-overflow:ellipsis;' +
    '}' +
    '.video-meta{' +
    'font-size:11px;color:var(--text-soft);display:flex;gap:6px;flex-wrap:wrap;' +
    '}' +
    '.empty-state{' +
    'margin-top:10px;padding:8px 9px;border-radius:9px;' +
    'border:1px dashed var(--border);font-size:11px;color:var(--text-soft);' +
    'background:rgba(15,23,42,.7);' +
    '}' +
    '.video-list::-webkit-scrollbar{width:5px}' +
    '.video-list::-webkit-scrollbar-track{background:transparent}' +
    '.video-list::-webkit-scrollbar-thumb{background:#1f2937;border-radius:999px}' +
    '.footer{' +
    'padding:8px 14px 12px;border-top:1px solid var(--border);' +
    'font-size:11px;color:var(--text-soft);text-align:center;' +
    '}' +
    '@media(max-width:480px){' +
    '.player-card{padding:10px 9px 12px}' +
    '#mainPlayer{max-height:none}' +
    '}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<header class="header">' +
    '<div class="logo"><span class="badge-dot"></span><span>Notnon</span><span>Video</span></div>' +
    '<div class="stats">' +
    '<span id="totalVideos">' +
    escapeHtml(totalVideos + ' video') +
    '</span>' +
    '<span id="totalSize">' +
    escapeHtml(totalSize + ' MB') +
    '</span>' +
    '</div>' +
    '</header>' +
    '<main class="layout">' +
    '<section class="player-section">' +
    '<div class="player-card">' +
    '<h2 id="nowPlayingTitle">' +
    escapeHtml(initialTitle) +
    '</h2>' +
    '<div id="playerContainer">' +
    '<div class="player-placeholder" id="playerPlaceholder">' +
    '<div class="player-placeholder-icon"></div>' +
    '<div>Pilih salah satu video di sebelah kanan / bawah untuk mulai menonton.</div>' +
    '</div>' +
    '<video id="mainPlayer" controls preload="metadata" style="display:none;">' +
    '<source id="mainSource" src="' +
    escapeHtml(initialSrc) +
    '" type="video/mp4" />' +
    'Browser kamu tidak mendukung video HTML5.' +
    '</video>' +
    '</div>' +
    '<div class="player-meta">' +
    '<span id="nowPlayingSize">' +
    escapeHtml(initialSize) +
    '</span>' +
    '<span id="nowPlayingDate">' +
    escapeHtml(initialDate) +
    '</span>' +
    '</div>' +
    '</div>' +
    '</section>' +
    '<section class="list-section">' +
    '<div class="list-header">' +
    '<h3>Daftar Video <span class="pill-count">' +
    escapeHtml(String(totalVideos)) +
    '</span></h3>' +
    '<input type="search" id="searchInput" placeholder="Cari nama file..." />' +
    '</div>' +
    '<div id="videoList" class="video-list">' +
    listHtml +
    '</div>' +
    '<div id="emptyState" class="empty-state" style="display:none;">' +
    'Tidak ada video yang cocok dengan pencarian.' +
    '</div>' +
    '</section>' +
    '</main>' +
    '<footer class="footer">' +
    '<span>Notnon Video • sumber: data_upload.json</span>' +
    '</footer>' +
    '<script>' +
    '(function(){' +
    'var mainPlayer=document.getElementById("mainPlayer");' +
    'var mainSource=document.getElementById("mainSource");' +
    'var titleEl=document.getElementById("nowPlayingTitle");' +
    'var sizeEl=document.getElementById("nowPlayingSize");' +
    'var dateEl=document.getElementById("nowPlayingDate");' +
    'var listEl=document.getElementById("videoList");' +
    'var searchInput=document.getElementById("searchInput");' +
    'var emptyState=document.getElementById("emptyState");' +
    'var placeholder=document.getElementById("playerPlaceholder");' +
    'var allCards=Array.prototype.slice.call(listEl.querySelectorAll(".video-card"));' +
    '' +
    'function showVideoPlayer(){' +
    'if(placeholder){placeholder.style.display="none";}' +
    'mainPlayer.style.display="block";' +
    '}' +
    '' +
    'function setActive(card){' +
    'if(!card)return;' +
    'var url=card.getAttribute("data-url");' +
    'var filename=card.getAttribute("data-filename")||"Tanpa nama";' +
    'var size=card.getAttribute("data-size")||"";' +
    'var date=card.getAttribute("data-date")||"";' +
    'if(!url)return;' +
    'showVideoPlayer();' +
    'mainSource.src=url;' +
    'mainPlayer.load();' +
    'mainPlayer.play().catch(function(){});' +
    'titleEl.textContent=filename;' +
    'sizeEl.textContent=size;' +
    'dateEl.textContent=date;' +
    'allCards.forEach(function(c){c.classList.remove("active");});' +
    'card.classList.add("active");' +
    '}' +
    '' +
    'listEl.addEventListener("click",function(e){' +
    'var card=e.target.closest(".video-card");' +
    'if(!card)return;' +
    'setActive(card);' +
    '});' +
    '' +
    'searchInput.addEventListener("input",function(){' +
    'var q=searchInput.value.toLowerCase().trim();' +
    'var visibleCount=0;' +
    'allCards.forEach(function(card){' +
    'var name=(card.getAttribute("data-filename")||"").toLowerCase();' +
    'if(!q||name.indexOf(q)!==-1){' +
    'card.style.display="";visibleCount++;' +
    '}else{' +
    'card.style.display="none";' +
    '}' +
    '});' +
    'emptyState.style.display=visibleCount===0?"block":"none";' +
    'if(visibleCount===0){' +
    'mainSource.src="";' +
    'mainPlayer.pause();' +
    'mainPlayer.style.display="none";' +
    'if(placeholder){placeholder.style.display="flex";}' +
    'titleEl.textContent="Tidak ada video yang cocok";' +
    'sizeEl.textContent="";' +
    'dateEl.textContent="";' +
    '}' +
    '});' +
    '})();' +
    '</script>' +
    '</body></html>';

  res.send(html);
});

app.listen(PORT, function () {
  console.log('Notnon Video running on http://localhost:' + PORT);
});
