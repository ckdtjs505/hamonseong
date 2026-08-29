/**
 * tts.js — 말씀 TTS 플레이어
 *
 * 핵심 설계 원칙:
 *   speak() 는 반드시 동기적 · 유저 제스처 콘텍스트 안에서 호출해야 한다.
 *   → async/await 금지, setTimeout 으로만 비동기 처리
 *
 * 수정된 버그:
 *   1. macOS/iOS : async/await 로 유저 제스처 콘텍스트 소실 → 완전 동기화
 *   2. Android   : onend 콜백에서 speak() 직접 호출 실패 → setTimeout(fn, 50)
 *   3. Chrome    : 15초 자동 중단 → keepAlive (10초 pause/resume)
 *   4. 전환 버그  : cancel() 직후 speak() 묵음 → setTimeout(fn, 200)
 *   5. onend 이중 발화 → generation 카운터
 */

// ── 상태 ──────────────────────────────────────────────────────
const ttsState = {
  verseList:    [],
  currentIndex: 0,
  isPlaying:    false,
  isPaused:     false,
  rate:         1.0,
  generation:   0,
  keepAliveId:  null,
};

// ── 한국어 음성 캐시 ─────────────────────────────────────────
let _cachedKoVoice = null;

function _cacheVoices() {
  const all = window.speechSynthesis.getVoices();
  if (all.length) {
    _cachedKoVoice =
      all.find(v => v.lang === 'ko-KR') ||
      all.find(v => v.lang.startsWith('ko')) ||
      null;
  }
}

// ── 초기화 ───────────────────────────────────────────────────
function setupTTSEvents() {
  const pp    = document.getElementById('ttsPlayPauseBtn');
  const stop  = document.getElementById('ttsStopBtn');
  const close = document.getElementById('ttsCloseBtn');
  const rate  = document.getElementById('ttsRateSelect');
  const track = document.getElementById('ttsProgressTrack');

  if (pp)    pp.addEventListener('click',   ttsTogglePlayPause);
  if (stop)  stop.addEventListener('click', () => ttsStop(true));
  if (close) close.addEventListener('click', ttsClose);

  if (rate) {
    rate.addEventListener('change', (e) => {
      ttsState.rate = parseFloat(e.target.value);
      if (ttsState.isPlaying) {
        const idx = ttsState.currentIndex;
        _ttsCancel();
        _ttsSpeak(idx);
      }
    });
  }

  if (track) {
    track.addEventListener('click', (e) => {
      if (!ttsState.verseList.length) return;
      const r     = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const idx   = Math.floor(ratio * ttsState.verseList.length);
      _ttsCancel();
      _ttsSpeak(idx);
    });
  }

  // 음성 목록 미리 캐시 (비동기 로드 대응)
  if ('speechSynthesis' in window) {
    _cacheVoices();
    window.speechSynthesis.addEventListener('voiceschanged', _cacheVoices);
  }
}

// ── Chrome 15초 버그 방지 ────────────────────────────────────
function _keepAliveStart() {
  _keepAliveStop();
  ttsState.keepAliveId = setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}
function _keepAliveStop() {
  if (ttsState.keepAliveId) {
    clearInterval(ttsState.keepAliveId);
    ttsState.keepAliveId = null;
  }
}

// ── generation 기반 cancel ───────────────────────────────────
function _ttsCancel() {
  ttsState.generation++;
  window.speechSynthesis.cancel();
  _keepAliveStop();
}

// ── 공개 API: 전체 듣기 시작 ─────────────────────────────────
// ★ 이 함수는 반드시 동기적으로 호출돼야 한다 (onClick 직결)
function startFullTTS() {
  if (!('speechSynthesis' in window)) {
    showToast('⚠️ 이 브라우저는 TTS를 지원하지 않습니다.');
    return;
  }

  const items = document.querySelectorAll('#readingContainer .verse-item');
  if (!items.length) {
    showToast('읽을 말씀이 없습니다. 날짜를 선택해 주세요.');
    return;
  }

  // 구절 목록 구성
  ttsState.verseList = [];
  items.forEach(el => {
    const ref  = el.querySelector('.verse-num')?.textContent.trim()  || '';
    const text = el.querySelector('.verse-text')?.textContent.trim() || '';
    if (text) ttsState.verseList.push({ ref, text, el });
  });

  if (!ttsState.verseList.length) {
    showToast('말씀 내용을 불러오지 못했습니다.');
    return;
  }

  // 기존 재생 취소
  _ttsCancel();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;

  _ttsShowPlayer();
  _ttsUpdateProgress(0);
  _ttsUpdateIcon(false);
  showToast('🔊 말씀 읽기를 시작합니다...');

  // ★ macOS/iOS Safari는 사용자 제스처(동기 콜백) 내에서 speak()를 호출해야 함.
  // setTimeout을 사용하면 권한이 유실되어 묵음 처리됨.
  _ttsSpeak(0);
}

// ── 재생 엔진 (완전 동기) ────────────────────────────────────
function _ttsSpeak(index) {
  if (index >= ttsState.verseList.length) {
    _ttsDone();
    return;
  }
  if (ttsState.isPaused) return;

  ttsState.currentIndex = index;
  ttsState.isPlaying    = true;

  const myGen = ttsState.generation;
  const item  = ttsState.verseList[index];

  // 음성 목록 재캐시 (처음 실행 시 아직 로드 중일 수 있음)
  _cacheVoices();

  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.lang  = 'ko-KR';
  utterance.rate  = ttsState.rate;
  if (_cachedKoVoice) utterance.voice = _cachedKoVoice;

  utterance.onstart = () => {
    if (ttsState.generation !== myGen) return;
    _ttsHighlight(index);
    _ttsUpdateProgress(index);
    _ttsUpdateIcon(true);
  };

  utterance.onend = () => {
    if (ttsState.generation !== myGen) return; // cancel 후 무시
    if (ttsState.isPaused) return;
    // ★ Android: onend 콜백 안에서 speak() 직접 호출 실패
    //   → setTimeout(fn, 50) 으로 이벤트 루프 한 번 비운 뒤 호출
    setTimeout(() => {
      if (ttsState.generation !== myGen) return;
      if (ttsState.isPaused) return;
      _ttsSpeak(index + 1);
    }, 50);
  };

  utterance.onerror = (e) => {
    if (ttsState.generation !== myGen) return; // We explicitly canceled
    if (ttsState.isPaused) return;             // User paused

    if (e.error === 'interrupted' || e.error === 'canceled') {
      // Browser interrupted unexpectedly (e.g., due to clicking a verse on Safari)
      // Call speak again synchronously to resume from the current verse.
      _ttsSpeak(index);
      return;
    }
    console.warn('[TTS] error:', e.error);
  };

  window.speechSynthesis.speak(utterance);
  _keepAliveStart();
}

// ── 재생 / 일시정지 토글 ─────────────────────────────────────
function ttsTogglePlayPause() {
  if (!ttsState.isPlaying && !ttsState.isPaused) {
    startFullTTS();
    return;
  }
  if (ttsState.isPaused) {
    // 안드로이드 기기 버그 대응: resume() 대신 중단된 구절부터 새롭게 _ttsSpeak 호출
    ttsState.isPaused  = false;
    ttsState.isPlaying = true;
    _ttsUpdateIcon(true);
    _keepAliveStart();
    _ttsSpeak(ttsState.currentIndex);
  } else {
    // 안드로이드 기기 버그 대응: pause() 대신 cancel()을 사용하여 완전히 끊음
    _ttsCancel();
    ttsState.isPaused  = true;
    ttsState.isPlaying = false;
    _ttsUpdateIcon(false);
    _keepAliveStop();
  }
}

// ── 정지 ─────────────────────────────────────────────────────
function ttsStop(resetUI) {
  _ttsCancel();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
  _ttsClearHighlight();
  if (resetUI !== false) {
    _ttsUpdateIcon(false);
    _ttsUpdateProgress(0);
  }
}

// ── 완료 ─────────────────────────────────────────────────────
function _ttsDone() {
  _keepAliveStop();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
  _ttsClearHighlight();
  _ttsUpdateIcon(false);
  _ttsUpdateProgress(ttsState.verseList.length);
  showToast('📖 말씀 읽기를 모두 마쳤습니다!');
}

// ── 플레이어 표시/숨기기 ────────────────────────────────────
function _ttsShowPlayer() {
  const p = document.getElementById('ttsPlayer');
  if (p) { p.classList.add('visible'); document.body.classList.add('tts-active'); }
}
function ttsClose() {
  ttsStop(true);
  const p = document.getElementById('ttsPlayer');
  if (p) { p.classList.remove('visible'); document.body.classList.remove('tts-active'); }
}

// ── 아이콘 갱신 ──────────────────────────────────────────────
function _ttsUpdateIcon(playing) {
  const btn = document.getElementById('ttsPlayPauseBtn');
  if (!btn) return;
  btn.innerHTML = playing
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  btn.setAttribute('aria-label', playing ? '일시정지' : '재생');
  btn.classList.toggle('playing', playing);
}

// ── 프로그레스 갱신 ──────────────────────────────────────────
function _ttsUpdateProgress(index) {
  const total = ttsState.verseList.length;
  const fill  = document.getElementById('ttsProgressFill');
  const refEl = document.getElementById('ttsCurrentRef');
  const cntEl = document.getElementById('ttsCounter');

  const pct = total > 0 ? Math.min(100, (index / total) * 100) : 0;
  if (fill)  fill.style.width  = `${pct}%`;
  if (cntEl) cntEl.textContent = total > 0 ? `${Math.min(index + 1, total)} / ${total}` : '0 / 0';

  const cur = ttsState.verseList[Math.min(index, total - 1)];
  if (refEl) refEl.textContent = cur ? `${cur.ref}절` : '말씀 읽기 준비 중...';
}

// ── 하이라이트 ───────────────────────────────────────────────
function _ttsHighlight(index) {
  _ttsClearHighlight();
  const item = ttsState.verseList[index];
  if (item && item.el) {
    item.el.classList.add('tts-reading');
    item.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
function _ttsClearHighlight() {
  document.querySelectorAll('.verse-item.tts-reading')
    .forEach(el => el.classList.remove('tts-reading'));
}

// ── 하위 호환 ────────────────────────────────────────────────
function closeTTSPlayer() { ttsClose(); }
