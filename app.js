(function () {
  const elements = {
    audio: document.getElementById('audio'),
    trackList: document.getElementById('trackList'),
    coverImage: document.getElementById('coverImage'),
    trackTitle: document.getElementById('trackTitle'),
    trackArtist: document.getElementById('trackArtist'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn'),
    seekBar: document.getElementById('seekBar'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    volumeBar: document.getElementById('volumeBar'),
    searchInput: document.getElementById('searchInput'),
    themeToggle: document.getElementById('themeToggle'),
  };

  /** @type {{title?: string, artist?: string, src: string, cover?: string}[]} */
  let tracks = [];
  let order = [];
  let currentIndex = 0;
  let isShuffle = false;
  let repeatMode = 'none'; // none | one | all

  function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderList() {
    elements.trackList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    order.forEach((trackIndex) => {
      const track = tracks[trackIndex];
      const li = document.createElement('li');
      li.className = 'track';
      li.dataset.index = String(trackIndex);
      li.innerHTML = `
        <img class="cover" src="${track.cover || 'assets/images/placeholder-cover.svg'}" alt="" onerror="this.src='assets/images/placeholder-cover.svg'">
        <div>
          <p class="title">${track.title || 'Untitled'}</p>
          <p class="artist">${track.artist || ''}</p>
        </div>
        <span class="badge">▶</span>
      `;
      li.addEventListener('click', () => {
        currentIndex = trackIndex;
        loadCurrent();
        play();
      });
      fragment.appendChild(li);
    });
    elements.trackList.appendChild(fragment);
    updateActiveTrack();
  }

  function updateActiveTrack() {
    const items = elements.trackList.querySelectorAll('.track');
    items.forEach((item) => item.classList.remove('active'));
    const active = elements.trackList.querySelector(`.track[data-index="${currentIndex}"]`);
    if (active) active.classList.add('active');
  }

  function loadCurrent() {
    const track = tracks[currentIndex];
    if (!track) return;
    elements.audio.src = track.src;
    elements.coverImage.src = track.cover || 'assets/images/placeholder-cover.svg';
    elements.trackTitle.textContent = track.title || 'Untitled';
    elements.trackArtist.textContent = track.artist || '';
    updateActiveTrack();
  }

  function play() {
    elements.audio.play();
    elements.playPauseBtn.textContent = '⏸';
  }

  function pause() {
    elements.audio.pause();
    elements.playPauseBtn.textContent = '▶️';
  }

  function next() {
    if (isShuffle) {
      const pool = order.filter((i) => i !== currentIndex);
      currentIndex = pool[Math.floor(Math.random() * pool.length)] || currentIndex;
    } else {
      currentIndex = currentIndex + 1;
      if (currentIndex >= tracks.length) currentIndex = 0;
    }
    loadCurrent();
    play();
  }

  function prev() {
    if (elements.audio.currentTime > 3) {
      elements.audio.currentTime = 0;
      return;
    }
    if (isShuffle) {
      const pool = order.filter((i) => i !== currentIndex);
      currentIndex = pool[Math.floor(Math.random() * pool.length)] || currentIndex;
    } else {
      currentIndex = currentIndex - 1;
      if (currentIndex < 0) currentIndex = tracks.length - 1;
    }
    loadCurrent();
    play();
  }

  function setShuffle(value) {
    isShuffle = value;
    elements.shuffleBtn.classList.toggle('primary', isShuffle);
  }

  function setRepeat(mode) {
    repeatMode = mode;
    elements.repeatBtn.dataset.mode = mode;
    elements.repeatBtn.classList.toggle('primary', mode !== 'none');
  }

  // Events
  elements.playPauseBtn.addEventListener('click', () => {
    if (elements.audio.paused) play(); else pause();
  });
  elements.nextBtn.addEventListener('click', next);
  elements.prevBtn.addEventListener('click', prev);
  elements.shuffleBtn.addEventListener('click', () => setShuffle(!isShuffle));
  elements.repeatBtn.addEventListener('click', () => {
    const nextMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
    setRepeat(nextMode);
  });

  elements.audio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = elements.audio;
    elements.currentTime.textContent = formatTime(currentTime);
    elements.duration.textContent = formatTime(duration);
    const progress = duration ? (currentTime / duration) * 100 : 0;
    elements.seekBar.value = String(progress);
  });
  elements.seekBar.addEventListener('input', () => {
    const { duration } = elements.audio;
    if (!duration || !isFinite(duration)) return;
    const target = (parseFloat(elements.seekBar.value) / 100) * duration;
    elements.audio.currentTime = target;
  });
  elements.volumeBar.addEventListener('input', () => {
    elements.audio.volume = parseFloat(elements.volumeBar.value);
  });

  elements.audio.addEventListener('ended', () => {
    if (repeatMode === 'one') {
      elements.audio.currentTime = 0; play(); return;
    }
    if (repeatMode === 'none' && currentIndex === tracks.length - 1 && !isShuffle) {
      pause(); return;
    }
    next();
  });

  elements.searchInput.addEventListener('input', () => {
    const q = elements.searchInput.value.toLowerCase();
    const items = elements.trackList.querySelectorAll('.track');
    items.forEach((item) => {
      const idx = parseInt(item.dataset.index || '0', 10);
      const t = tracks[idx];
      const hay = `${t.title || ''} ${t.artist || ''}`.toLowerCase();
      item.style.display = hay.includes(q) ? '' : 'none';
    });
  });

  // Theme toggle
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light') document.documentElement.classList.add('light');
  elements.themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  // Load playlist
  async function init() {
    try {
      const params = new URLSearchParams(window.location.search);
      const playlistParam = params.get('playlist') || 'playlists/default.json';
      const playlistUrl = new URL(playlistParam, window.location.href).toString();
      const response = await fetch(playlistUrl, { cache: 'no-store' });
      const data = await response.json();
      tracks = Array.isArray(data.tracks) ? data.tracks : [];
      order = tracks.map((_, i) => i);
      renderList();
      loadCurrent();
      setupAutoplay();
    } catch (err) {
      console.error('Failed to load playlist', err);
      const hint = location.protocol === 'file:'
        ? 'Tip: serve locally using “python3 -m http.server 5173” then open http://localhost:5173/'
        : 'Tip: check the file path, filename case, and that the JSON is committed/deployed.';
      elements.trackList.innerHTML = `
        <li class="track">
          Failed to load playlist. ${hint}
        </li>
      `;
    }
  }

  init();

  function setupAutoplay() {
    // Try immediately
    const tryPlay = () => elements.audio.play().then(() => {
      elements.playPauseBtn.textContent = '⏸';
      removeGate();
    }).catch(() => {
      // Autoplay blocked; wait for first interaction
      addGate();
    });
    tryPlay();

    function onFirstInteraction() {
      elements.audio.play().finally(() => {
        elements.playPauseBtn.textContent = elements.audio.paused ? '▶️' : '⏸';
        removeGate();
      });
    }

    function addGate() {
      window.addEventListener('pointerdown', onFirstInteraction, { once: true });
      window.addEventListener('keydown', onFirstInteraction, { once: true });
    }

    function removeGate() {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    }
  }

  // News loader (optional)
  (async function loadNews() {
    const list = document.getElementById('newsList');
    if (!list) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const forceRandom = params.get('news') === 'random';
      if (forceRandom) {
        renderRandomNews(list);
        return;
      }
      const res = await fetch('data/news.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items.slice(0, 6) : [];
      if (items.length === 0) {
        renderRandomNews(list);
        return;
      }
      const frag = document.createDocumentFragment();
      for (const it of items) {
        const li = document.createElement('li');
        li.className = 'news-item';
        li.innerHTML = `
          ${it.image ? `<img class="news-thumb" src="${it.image}" alt="">` : ''}
          <h3 class="news-headline"><a href="${it.link}" target="_blank" rel="noopener noreferrer">${it.title || ''}</a></h3>
          <p class="news-snippet">${it.summary || ''}</p>
        `;
        frag.appendChild(li);
      }
      list.appendChild(frag);
    } catch (e) {
      renderRandomNews(list);
    }
  })();

  function renderRandomNews(list) {
    const topics = ['âm nhạc', 'văn hoá', 'giải trí', 'giáo dục', 'công nghệ', 'thể thao', 'du lịch'];
    const verbs = ['bùng nổ', 'ra mắt', 'thu hút', 'gây chú ý', 'tỏa sáng', 'đột phá', 'trở lại'];
    const places = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Huế', 'Cần Thơ'];
    const sources = [
      { name: 'VnExpress', url: 'https://vnexpress.net/' },
      { name: 'Tuổi Trẻ', url: 'https://tuoitre.vn/' },
      { name: 'Thanh Niên', url: 'https://thanhnien.vn/' },
      { name: 'Zing', url: 'https://zingnews.vn/' }
    ];
    const thumbs = [
      'https://cdn2.tuoitre.vn/zoom/217_136/471584752817336320/2025/9/24/viber-image-2025-08-19-09-59-45-068-17555774215541802083820-17587112377911219473982.jpg',
      'https://cdn2.tuoitre.vn/zoom/217_136/471584752817336320/2025/9/24/dien-taptto-1758716212652772351690-42-0-732-1104-crop-17587162622981926312352.jpeg',
      'https://cdn2.tuoitre.vn/zoom/260_163/471584752817336320/2025/9/24/thuy-tientto-17587088027601264009127-40-388-850-1683-crop-17587088504771954712812.png',
      'https://cdn2.tuoitre.vn/zoom/260_347/471584752817336320/2025/9/24/gia-dinhtto-17587147930811607907421-0-159-811-767-crop-17587148275441140154175.png',
      'https://cdn2.tuoitre.vn/zoom/240_150/471584752817336320/2025/9/24/quang-hantto-1758709962420189330372-228-0-1478-2000-crop-1758709983850730025738.jpeg',
      'https://cdn2.tuoitre.vn/zoom/260_347/471584752817336320/2025/9/24/ternanatto-1758714931036895654111-0-0-2469-1852-crop-1758714961168415567648.png',
    ];
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function sentence() {
      return `Sự kiện ${pick(topics)} ${pick(verbs)} tại ${pick(places)}.`;
    }
    const count = 6;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const source = pick(sources);
      const title = `${pick(verbs).slice(0,1).toUpperCase()}${pick(verbs).slice(1)} ${pick(topics)} tại ${pick(places)}`;
      const li = document.createElement('li');
      li.className = 'news-item';
      li.innerHTML = `
        <img class="news-thumb" src="${thumbs[i]}" alt="">
        <h3 class="news-headline"><a href="${source.url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
        <p class="news-snippet">${sentence()} Nguồn: ${source.name} (ngẫu nhiên).</p>
      `;
      frag.appendChild(li);
    }
    list.innerHTML = '';
    list.appendChild(frag);
  }
})();


