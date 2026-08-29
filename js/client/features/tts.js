/**
 * tts.js
 * TTS (Text-to-Speech) 기능
 * - 말씀 전체 순차 읽기
 * - 재생 / 일시정지 / 정지
 * - 속도 조절, 프로그레스 바, 현재 구절 강조
 *
 * 핵심 버그 수정:
 * 1. Chrome: cancel() 직후 speak()가 묵음 → 100ms setTimeout 딜레이
 * 2. Chrome: 15초 후 자동 멈춤 → keepAlive 타이머 (10초마다 pause/resume)
 * 3. cancel() 시 onend 이중 발화 → generation 카운터로 차단
 * 4. 음성 목록 비동기 로드 → waitForVoices() Promise
 */

// ── 상태 ──────────────────────────────────────────────────────
const ttsState = {
  verseList:      [],    // { ref, text, el }
  currentIndex:   0,
  isPlaying:      false,
  isPaused:       false,
  rate:           1.0,
  generation:     0,     // cancel() 후 구 onend 차단
  keepAliveId:    null,  // Chrome 15초 버그 방지 타이머
};

// ── 초기화 ───────────────────────────────────────────────────
function setupTTSEvents() {
  const pp    = document.getElementById('ttsPlayPauseBtn');
  const stop  = document.getElementById('ttsStopBtn');
  const close = document.getElementById('ttsCloseBtn');
  const rate  = document.getElementById('ttsRateSelect');
  const track = document.getElementById('ttsProgressTrack');

  if (pp)    pp.addEventListener('click', ttsTogglePlayPause);
  if (stop)  stop.addEventListener('click', () => ttsStop(true));
  if (close) close.addEventListener('click', ttsClose);
  if (rate)  rate.addEventListener('change', (e) => {
    ttsState.rate = parseFloat(e.target.value);
    if (ttsState.isPlaying) {
      const idx = ttsState.currentIndex;
      ttsCancel();
      ttsSpeak(idx);
    }
  });
  if (track) track.addEventListener('click', (e) => {
    if (!ttsState.verseList.length) return;
    const r = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const idx = Math.floor(ratio * ttsState.verseList.length);
    ttsCancel();
    ttsSpeak(idx);
  });

  // 음성 목록 미리 캐시
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }
}

// ── 음성 목록 로드 대기 ───────────────────────────────────────
function waitForVoices(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const timer = setTimeout(() => resolve([]), timeoutMs);
    window.speechSynthesis.addEventListener('voiceschanged', function handler() {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    });
  });
}

// ── 한국어 음성 선택 ─────────────────────────────────────────
function getKoVoice(voices) {
  return voices.find(v => v.lang === 'ko-KR')
      || voices.find(v => v.lang.startsWith('ko'))
      || null;
}

// ── Chrome 15초 버그 방지 ────────────────────────────────────
function keepAliveStart() {
  keepAliveStop();
  ttsState.keepAliveId = setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}
function keepAliveStop() {
  if (ttsState.keepAliveId) {
    clearInterval(ttsState.keepAliveId);
    ttsState.keepAliveId = null;
  }
}

// ── generation 기반 cancel ───────────────────────────────────
function ttsCancel() {
  ttsState.generation++;
  window.speechSynthesis.cancel();
  keepAliveStop();
}

// ── 공개 API: 전체 듣기 시작 ─────────────────────────────────
async function startFullTTS() {
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
    const numEl  = el.querySelector('.verse-num');
    const txtEl  = el.querySelector('.verse-text');
    const ref    = numEl  ? numEl.textContent.trim()  : '';
    const text   = txtEl  ? txtEl.textContent.trim()  : '';
    if (text) ttsState.verseList.push({ ref, text, el });
  });

  if (!ttsState.verseList.length) {
    showToast('말씀 내용을 불러오지 못했습니다.');
    return;
  }

  // 기존 재생 취소
  ttsCancel();
  ttsState.isPlaying = false;
  ttsState.isPaused  = false;

  ttsShowPlayer();
  ttsUpdateProgress(0);
  ttsUpdateIcon(false);
  showToast('🔊 말씀 읽기를 시작합니다...');

  // ★ 핵심: cancel() 완료 대기 후 speak
  await new Promise(r => setTimeout(r, 150));
  ttsSpeak(0);
}

// ── 순차 재생 엔진 ───────────────────────────────────────────
async function ttsSpeak(index) {
  if (index >= ttsState.verseList.length) {
    ttsDone();
    return;
  }

  ttsState.currentIndex = index;
  ttsState.isPlaying    = true;
  ttsState.isPaused     = false;

  const myGen = ttsState.generation;
  const item  = ttsState.verseList[index];

  // 음성 준비
  const voices    = await waitForVoices(1500);
  const koVoice   = getKoVoice(voices);
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.lang  = 'ko-KR';
  utterance.rate  = ttsState.rate;
  if (koVoice) utterance.voice = koVoice;

  // generation 바뀌었으면 (cancel 됐으면) 중단
  if (ttsState.generation !== myGen) return;

  utterance.onstart = () => {
    if (ttsState.generation !== myGen) return;
    ttsHighlight(index);
    ttsUpdateProgress(index);
    ttsUpdateIcon(true);
  };

  utterance.onend = () => {
    if (ttsState.generation !== myGen) return; // cancel 후 발화 무시
    if (ttsState.isPaused) return;
    ttsSpeak(index + 1);
  };

  utterance.onerror = (e) => {
    if (ttsState.generation !== myGen) return;
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    console.warn('[TTS] error:', e.error);
    showToast('⚠️ TTS 오류: ' + e.error);
  };

  window.speechSynthesis.speak(utterance);
  keepAliveStart();
}

// ── 재생 / 일시정지 토글 ─────────────────────────────────────
function ttsTogglePlayPause() {
  if (!ttsState.isPlaying && !ttsState.isPaused) {
    startFullTTS();
    return;
  }
  if (ttsState.isPaused) {
    window.speechSynthesis.resume();
    ttsState.isPaused  = false;
    ttsState.isPlaying = true;
    ttsUpdateIcon(true);
    keepAliveStart();
  } else {
    window.speechSynthesis.pause();
    ttsState.isPaused  = true;
    ttsState.isPlaying = false;
    ttsUpdateIcon(false);
    keepAliveStop();
  }
}

// ── 정지 ─────────────────────────────────────────────────────
function ttsStop(resetUI = true) {
  ttsCancel();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
  ttsClearHighlight();
  if (resetUI) {
    ttsUpdateIcon(false);
    ttsUpdateProgress(0);
  }
}

// ── 완료 ─────────────────────────────────────────────────────
function ttsDone() {
  keepAliveStop();
  ttsState.isPlaying    = false;
  ttsState.isPaused     = false;
  ttsState.currentIndex = 0;
  ttsClearHighlight();
  ttsUpdateIcon(false);
  ttsUpdateProgress(ttsState.verseList.length);
  showToast('📖 말씀 읽기를 모두 마쳤습니다!');
}

// ── 플레이어 UI ───────────────────────────────────────────────
function ttsShowPlayer() {
  const p = document.getElementById('ttsPlayer');
  if (p) {
    p.classList.add('visible');
    document.body.classList.add('tts-active');
  }
}

function ttsClose() {
  ttsStop(true);
  const p = document.getElementById('ttsPlayer');
  if (p) {
    p.classList.remove('visible');
    document.body.classList.remove('tts-active');
  }
}

// ── 아이콘 갱신 ──────────────────────────────────────────────
function ttsUpdateIcon(playing) {
  const btn = document.getElementById('ttsPlayPauseBtn');
  if (!btn) return;
  btn.innerHTML = playing
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  btn.setAttribute('aria-label', playing ? '일시정지' : '재생');
  btn.classList.toggle('playing', playing);
}

// ── 프로그레스 갱신 ──────────────────────────────────────────
function ttsUpdateProgress(index) {
  const total = ttsState.verseList.length;
  const fill    = document.getElementById('ttsProgressFill');
  const refEl   = document.getElementById('ttsCurrentRef');
  const cntEl   = document.getElementById('ttsCounter');

  const pct = total > 0 ? Math.min(100, (index / total) * 100) : 0;
  if (fill)  fill.style.width  = `${pct}%`;
  if (cntEl) cntEl.textContent = total > 0 ? `${Math.min(index + 1, total)} / ${total}` : '0 / 0';

  const cur = ttsState.verseList[Math.min(index, total - 1)];
  if (refEl) refEl.textContent = cur ? `${cur.ref}절` : '말씀 읽기 준비 중...';
}

// ── 하이라이트 ───────────────────────────────────────────────
function ttsHighlight(index) {
  ttsClearHighlight();
  const item = ttsState.verseList[index];
  if (item && item.el) {
    item.el.classList.add('tts-reading');
    item.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
function ttsClearHighlight() {
  document.querySelectorAll('.verse-item.tts-reading').forEach(el => {
    el.classList.remove('tts-reading');
  });
}

// ── 하위 호환 (app.js에서 closeTTSPlayer 호출) ────────────────
function closeTTSPlayer() { ttsClose(); }
function stopTTS(ui)       { ttsStop(ui); }
