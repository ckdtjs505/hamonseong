/**
 * tts.js
 * TTS (Text-to-Speech) 기능:
 * - 오늘의 말씀 전체 읽기
 * - 재생 / 일시정지 / 정지
 * - 읽기 속도 조절
 * - 진행률 표시 (프로그레스 바)
 * - 현재 읽는 구절 강조 표시
 *
 * 버그 대응:
 * - Chrome 15초 자동 정지 버그 → keepAlive 타이머
 * - cancel() 이후 onend 오발생 → generation 카운터
 * - 한국어 음성 비동기 로드 → getKoreanVoice()
 */

// ── TTS 상태 ────────────────────────────────────────────────
const ttsState = {
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  verseList: [],          // { key, ref, text, el } 배열
  rate: 1.0,
  generation: 0,          // cancel() 후 onend 오발생 차단용
  keepAliveTimer: null,   // Chrome 15초 버그 대응 타이머
};

// ── TTS 초기화 ──────────────────────────────────────────────

/** TTS 이벤트 리스너를 초기화합니다 (app.js 의 init 에서 호출). */
function setupTTSEvents() {
  const playPauseBtn  = document.getElementById('ttsPlayPauseBtn');
  const stopBtn       = document.getElementById('ttsStopBtn');
  const rateSelect    = document.getElementById('ttsRateSelect');
  const closeBtn      = document.getElementById('ttsCloseBtn');
  const progressTrack = document.getElementById('ttsProgressTrack');

  if (playPauseBtn)  playPauseBtn.addEventListener('click', toggleTTSPlayPause);
  if (stopBtn)       stopBtn.addEventListener('click', () => stopTTS(true));
  if (closeBtn)      closeBtn.addEventListener('click', closeTTSPlayer);

  if (rateSelect) {
    rateSelect.addEventListener('change', (e) => {
      ttsState.rate = parseFloat(e.target.value);
      // 재생 중이면 현재 구절부터 재시작
      if (ttsState.isPlaying) {
        const idx = ttsState.currentIndex;
        cancelSpeech();
        speakFromIndex(idx);
      }
    });
  }

  // 진행 바 클릭 → 해당 위치 구절로 이동
  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      if (ttsState.verseList.length === 0) return;
      const rect   = progressTrack.getBoundingClientRect();
      const ratio  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const target = Math.floor(ratio * ttsState.verseList.length);
      jumpToVerse(target);
    });
  }

  // 음성 목록 미리 로드 (비동기)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices(); // 캐시
    });
  }
}

// ── 한국어 음성 선택 ─────────────────────────────────────────

/**
 * 사용 가능한 한국어 음성을 반환합니다.
 * 없으면 null (브라우저 기본값 사용).
 * @returns {SpeechSynthesisVoice|null}
 */
function getKoreanVoice() {
  const voices = window.speechSynthesis.getVoices();
  // 우선순위: ko-KR 정확 매칭 → ko 포함
  return (
    voices.find(v => v.lang === 'ko-KR') ||
    voices.find(v => v.lang.startsWith('ko')) ||
    null
  );
}

// ── Chrome 15초 버그 대응 ────────────────────────────────────

/** Chrome이 15초 후 멈추는 버그를 방지하는 keepAlive 타이머를 시작합니다. */
function startKeepAlive() {
  stopKeepAlive();
  ttsState.keepAliveTimer = setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000); // 10초마다 pause/resume
}

/** keepAlive 타이머를 정리합니다. */
function stopKeepAlive() {
  if (ttsState.keepAliveTimer) {
    clearInterval(ttsState.keepAliveTimer);
    ttsState.keepAliveTimer = null;
  }
}

// ── cancel 래퍼 (generation 카운터 증가) ─────────────────────

/**
 * speechSynthesis.cancel() + generation 증가.
 * 이후 발화하는 이전 utterance 의 onend 를 무시합니다.
 */
function cancelSpeech() {
  ttsState.generation++;        // 이 값이 바뀌면 구 onend 콜백은 무시됨
  window.speechSynthesis.cancel();
  stopKeepAlive();
}

// ── TTS 시작 ────────────────────────────────────────────────

/**
 * 현재 화면에 렌더링된 모든 구절을 수집하여 TTS를 시작합니다.
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
  cancelSpeech();
  ttsState.isPlaying = false;
  ttsState.isPaused  = false;

  // 구절 목록 구성
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
    onTTSEnd();
    return;
  }

  ttsState.currentIndex = index;
  ttsState.isPlaying    = true;
  ttsState.isPaused     = false;

  // 이 발화가 속한 generation을 캡처
  const myGeneration = ttsState.generation;

  const item = ttsState.verseList[index];
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.lang  = 'ko-KR';
  utterance.rate  = ttsState.rate;

  // 한국어 음성 명시 지정 (없으면 브라우저 기본값)
  const koVoice = getKoreanVoice();
  if (koVoice) utterance.voice = koVoice;

  utterance.onstart = () => {
    if (ttsState.generation !== myGeneration) return;
    highlightCurrentVerse(index);
    updateTTSProgress(index);
    updatePlayPauseIcon(true);
  };

  utterance.onend = () => {
    // generation 이 바뀌었으면 cancel() 된 이후이므로 무시
    if (ttsState.generation !== myGeneration) return;
    if (!ttsState.isPaused) {
      speakFromIndex(index + 1);
    }
  };

  utterance.onerror = (e) => {
    if (ttsState.generation !== myGeneration) return;
    // interrupted / canceled 는 cancel() 시 정상 발생 — 무시
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.warn('TTS error:', e.error);
    }
  };

  window.speechSynthesis.speak(utterance);
  startKeepAlive(); // Chrome 15초 버그 대응
}

// ── 컨트롤 ──────────────────────────────────────────────────

/** 재생 / 일시정지 토글 */
function toggleTTSPlayPause() {
  // 플레이어가 닫혀 있거나 verseList가 비어 있으면 처음부터 시작
  if (!ttsState.isPlaying && !ttsState.isPaused) {
    startFullTTS();
    return;
  }

  if (ttsState.isPaused) {
    // 재개
    window.speechSynthesis.resume();
    ttsState.isPaused  = false;
    ttsState.isPlaying = true;
    updatePlayPauseIcon(true);
    startKeepAlive();
  } else {
    // 일시정지
    window.speechSynthesis.pause();
    ttsState.isPaused  = true;
    ttsState.isPlaying = false;
    updatePlayPauseIcon(false);
    stopKeepAlive();
  }
}

/**
 * TTS를 완전히 정지합니다.
 * @param {boolean} [resetUI=true]
 */
function stopTTS(resetUI = true) {
  cancelSpeech();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
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
  cancelSpeech();
  ttsState.isPlaying = false;
  ttsState.isPaused  = false;
  speakFromIndex(index);
}

/** 모든 구절 읽기 완료 시 처리 */
function onTTSEnd() {
  stopKeepAlive();
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
  const btn = document.getElementById('ttsPlayPauseBtn');
  if (!btn) return;
  btn.innerHTML = playing
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  btn.setAttribute('aria-label', playing ? '일시정지' : '재생');
  btn.classList.toggle('playing', playing);
}

/**
 * 프로그레스 바 및 텍스트를 갱신합니다.
 * @param {number} index
 */
function updateTTSProgress(index) {
  const total   = ttsState.verseList.length;
  const fill    = document.getElementById('ttsProgressFill');
  const current = document.getElementById('ttsCurrentRef');
  const counter = document.getElementById('ttsCounter');

  const displayIndex = Math.min(index, total - 1);
  const pct = total > 0 ? Math.min(100, (index / total) * 100) : 0;

  if (fill)    fill.style.width = `${pct}%`;
  if (counter) counter.textContent = `${Math.min(index + 1, total)} / ${total}`;

  if (current) {
    const item = ttsState.verseList[displayIndex];
    current.textContent = item ? `${item.ref}절` : '';
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
    item.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/** 모든 TTS 하이라이트를 제거합니다. */
function clearVerseHighlights() {
  document.querySelectorAll('.verse-item.tts-reading').forEach(el => {
    el.classList.remove('tts-reading');
  });
}
