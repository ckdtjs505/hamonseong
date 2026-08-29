/**
 * tts.js
 * TTS (Text-to-Speech) 기능:
 * - 오늘의 말씀 전체 읽기
 * - 재생 / 일시정지 / 정지
 * - 읽기 속도 조절 (0.5x ~ 2x)
 * - 진행률 표시 (프로그레스 바)
 * - 현재 읽는 구절 강조 표시
 */

// ── TTS 상태 ────────────────────────────────────────────────
const ttsState = {
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  verseList: [],       // { key, ref, text } 배열
  utterance: null,
  rate: 1.0,
  lang: 'ko-KR',
};

// ── TTS 초기화 ──────────────────────────────────────────────

/** TTS 이벤트 리스너를 초기화합니다 (app.js 의 init 에서 호출). */
function setupTTSEvents() {
  const playPauseBtn = document.getElementById('ttsPlayPauseBtn');
  const stopBtn      = document.getElementById('ttsStopBtn');
  const rateSelect   = document.getElementById('ttsRateSelect');
  const closeBtn     = document.getElementById('ttsCloseBtn');

  if (playPauseBtn) playPauseBtn.addEventListener('click', toggleTTSPlayPause);
  if (stopBtn)      stopBtn.addEventListener('click', stopTTS);
  if (rateSelect)   rateSelect.addEventListener('change', (e) => {
    ttsState.rate = parseFloat(e.target.value);
    // 재생 중이면 재시작 (현재 구절부터)
    if (ttsState.isPlaying) {
      window.speechSynthesis.cancel();
      ttsState.isPlaying = false;
      ttsState.isPaused  = false;
      speakFromIndex(ttsState.currentIndex);
    }
  });
  if (closeBtn) closeBtn.addEventListener('click', closeTTSPlayer);

  // 진행 바 클릭으로 특정 구절로 이동
  const progressTrack = document.getElementById('ttsProgressTrack');
  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      if (ttsState.verseList.length === 0) return;
      const rect   = progressTrack.getBoundingClientRect();
      const ratio  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const target = Math.floor(ratio * ttsState.verseList.length);
      jumpToVerse(target);
    });
  }
}

// ── TTS 시작 ────────────────────────────────────────────────

/**
 * 현재 화면에 렌더링된 모든 구절을 수집하여 TTS를 시작합니다.
 * plan-summary 의 '전체 듣기' 버튼 또는 외부에서 호출합니다.
 */
function startFullTTS() {
  if (!('speechSynthesis' in window)) {
    showToast('이 브라우저는 TTS를 지원하지 않습니다.');
    return;
  }

  // 현재 렌더링된 구절 수집
  const verseItems = document.querySelectorAll('#readingContainer .verse-item');
  if (verseItems.length === 0) {
    showToast('읽을 말씀이 없습니다.');
    return;
  }

  // 기존 재생 정지
  stopTTS(false);

  ttsState.verseList = [];
  verseItems.forEach((item) => {
    const numEl  = item.querySelector('.verse-num');
    const textEl = item.querySelector('.verse-text');
    const key    = item.getAttribute('data-verse-key') || '';
    const ref    = numEl  ? numEl.textContent.trim()  : '';
    const text   = textEl ? textEl.textContent.trim() : '';
    if (text) {
      ttsState.verseList.push({ key, ref, text, el: item });
    }
  });

  if (ttsState.verseList.length === 0) {
    showToast('읽을 말씀 내용이 없습니다.');
    return;
  }

  ttsState.currentIndex = 0;
  showTTSPlayer();
  speakFromIndex(0);
}

// ── 재생 엔진 ───────────────────────────────────────────────

/**
 * 지정한 인덱스부터 순서대로 구절을 읽습니다.
 * @param {number} index
 */
function speakFromIndex(index) {
  if (index >= ttsState.verseList.length) {
    // 전부 읽음 → 종료
    onTTSEnd();
    return;
  }

  ttsState.currentIndex = index;
  ttsState.isPlaying    = true;
  ttsState.isPaused     = false;

  const item = ttsState.verseList[index];
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.lang  = ttsState.lang;
  utterance.rate  = ttsState.rate;

  utterance.onstart = () => {
    highlightCurrentVerse(index);
    updateTTSProgress(index);
    updatePlayPauseIcon(true);
  };

  utterance.onend = () => {
    if (!ttsState.isPaused) {
      speakFromIndex(index + 1);
    }
  };

  utterance.onerror = (e) => {
    // interrupted 는 cancel() 시 정상 — 무시
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.warn('TTS error:', e.error);
    }
  };

  ttsState.utterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// ── 컨트롤 ──────────────────────────────────────────────────

/** 재생 / 일시정지 토글 */
function toggleTTSPlayPause() {
  if (!ttsState.isPlaying && !ttsState.isPaused) {
    // 첫 시작
    startFullTTS();
    return;
  }

  if (ttsState.isPaused) {
    // 재개
    window.speechSynthesis.resume();
    ttsState.isPaused  = false;
    ttsState.isPlaying = true;
    updatePlayPauseIcon(true);
  } else {
    // 일시정지
    window.speechSynthesis.pause();
    ttsState.isPaused  = true;
    ttsState.isPlaying = false;
    updatePlayPauseIcon(false);
  }
}

/**
 * TTS를 완전히 정지합니다.
 * @param {boolean} [resetUI=true] - UI를 초기화할지 여부
 */
function stopTTS(resetUI = true) {
  window.speechSynthesis.cancel();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
  ttsState.utterance    = null;
  clearVerseHighlights();

  if (resetUI) {
    updatePlayPauseIcon(false);
    updateTTSProgress(0);
  }
}

/**
 * 특정 구절로 점프합니다.
 * @param {number} index
 */
function jumpToVerse(index) {
  window.speechSynthesis.cancel();
  ttsState.isPlaying = false;
  ttsState.isPaused  = false;
  speakFromIndex(index);
}

/** 모든 구절 읽기 완료 시 처리 */
function onTTSEnd() {
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
  clearVerseHighlights();
  updatePlayPauseIcon(false);
  updateTTSProgress(ttsState.verseList.length); // 100%
  showToast('📖 말씀 읽기를 모두 마쳤습니다.');
}

// ── UI 업데이트 ─────────────────────────────────────────────

/** TTS 플레이어 패널을 표시합니다. */
function showTTSPlayer() {
  const player = document.getElementById('ttsPlayer');
  if (player) {
    player.classList.add('visible');
    document.body.classList.add('tts-active');
  }
}

/** TTS 플레이어 패널을 숨기고 정지합니다. */
function closeTTSPlayer() {
  stopTTS(true);
  const player = document.getElementById('ttsPlayer');
  if (player) {
    player.classList.remove('visible');
    document.body.classList.remove('tts-active');
  }
}

/**
 * 재생/일시정지 버튼 아이콘을 갱신합니다.
 * @param {boolean} playing
 */
function updatePlayPauseIcon(playing) {
  const btn  = document.getElementById('ttsPlayPauseBtn');
  if (!btn) return;
  btn.innerHTML = playing
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  btn.setAttribute('aria-label', playing ? '일시정지' : '재생');
  btn.classList.toggle('playing', playing);
}

/**
 * 프로그레스 바 및 텍스트를 갱신합니다.
 * @param {number} index - 현재 읽는 구절 인덱스
 */
function updateTTSProgress(index) {
  const total   = ttsState.verseList.length;
  const fill    = document.getElementById('ttsProgressFill');
  const current = document.getElementById('ttsCurrentRef');
  const counter = document.getElementById('ttsCounter');

  const pct = total > 0 ? Math.min(100, (index / total) * 100) : 0;
  if (fill)    fill.style.width = `${pct}%`;
  if (counter) counter.textContent = `${Math.min(index + 1, total)} / ${total}`;

  if (current) {
    const item = ttsState.verseList[Math.min(index, total - 1)];
    current.textContent = item ? `구절 ${item.ref}절` : '';
  }
}

/**
 * 현재 읽는 구절에 하이라이트를 적용합니다.
 * @param {number} index
 */
function highlightCurrentVerse(index) {
  clearVerseHighlights();
  const item = ttsState.verseList[index];
  if (item && item.el) {
    item.el.classList.add('tts-reading');
    // 부드럽게 화면 안으로 스크롤
    item.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/** 모든 TTS 하이라이트를 제거합니다. */
function clearVerseHighlights() {
  document.querySelectorAll('.verse-item.tts-reading').forEach(el => {
    el.classList.remove('tts-reading');
  });
}
