/**
 * app.js
 * 앱 진입점: 초기화 & API 데이터 페칭
 *
 * 의존 파일 로드 순서 (index.html에서 관리):
 *   1. constants.js  - 성경 66권 데이터
 *   2. state.js      - 전역 상태 & DOM 요소
 *   3. utils.js      - 공통 헬퍼 함수
 *   4. renderer.js   - UI 렌더링
 *   5. auth.js       - 인증 (로그인/회원가입/세션)
 *   6. hamonseong.js - 함온성 완료 기능
 *   7. prayer.js     - 기도 기록
 *   8. community.js  - 커뮤니티 대시보드
 *   9. app.js        - 진입점 (이 파일)
 */

// ── 초기화 ───────────────────────────────────────────────────

/** 앱을 초기화합니다. DOM 준비 이후 실행됩니다. */
function initApp() {
  // 테마 복원
  const savedTheme = localStorage.getItem('bible_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (elements.themeSelect) elements.themeSelect.value = savedTheme;

  // 버전 복원
  if (elements.versionSelect) elements.versionSelect.value = currentVersion;

  // 폰트 크기 복원
  document.documentElement.style.setProperty('--bible-font-size', `${currentFontSize}rem`);

  // ── 이벤트 리스너 등록 ──

  if (elements.themeSelect) {
    elements.themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('bible_theme', theme);
    });
  }

  if (elements.versionSelect) {
    elements.versionSelect.addEventListener('change', (e) => {
      currentVersion = e.target.value;
      localStorage.setItem('bible_version', currentVersion);
      updateDateView(); // Reload the verses with the new version
    });
  }

  if (elements.fontDecreaseBtn) {
    elements.fontDecreaseBtn.addEventListener('click', () => {
      if (currentFontSize > 0.85) {
        currentFontSize -= 0.1;
        document.documentElement.style.setProperty('--bible-font-size', `${currentFontSize}rem`);
        localStorage.setItem('bible_font_size', currentFontSize);
      }
    });
  }

  if (elements.fontIncreaseBtn) {
    elements.fontIncreaseBtn.addEventListener('click', () => {
      if (currentFontSize < 2.0) {
        currentFontSize += 0.1;
        document.documentElement.style.setProperty('--bible-font-size', `${currentFontSize}rem`);
        localStorage.setItem('bible_font_size', currentFontSize);
      }
    });
  }

  if (elements.prevDateBtn) {
    elements.prevDateBtn.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      updateDateView();
    });
  }

  if (elements.nextDateBtn) {
    elements.nextDateBtn.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      updateDateView();
    });
  }

  if (elements.todayBtn) {
    elements.todayBtn.addEventListener('click', () => {
      currentDate = new Date();
      updateDateView();
    });
  }

  if (elements.dateInput) {
    elements.dateInput.addEventListener('change', (e) => {
      if (e.target.value) {
        const parts = e.target.value.split('-');
        currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
        updateDateView();
      }
    });
  }

  // 각 모듈 이벤트 설정 & 세션 확인
  setupAuthEvents();
  setupHamonseongEvents();
  setupTTSEvents();
  checkSession();

  // 초기 날짜 뷰 렌더링
  updateDateView();
}

// ── 날짜 뷰 업데이트 ─────────────────────────────────────────

/** 현재 날짜 기준으로 헤더 및 성경 읽기 내용을 갱신합니다. */
function updateDateView() {
  const dateStr = getFormattedDate(currentDate);
  if (elements.dateInput) elements.dateInput.value = dateStr;
  if (elements.dateDisplayText) elements.dateDisplayText.textContent = getKoreanDateText(currentDate);

  loadBibleReading(dateStr);
}

// ── API 데이터 페칭 ──────────────────────────────────────────

/**
 * 주어진 날짜의 성경 읽기 계획과 말씀 본문을 불러와 렌더링합니다.
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
async function loadBibleReading(dateStr) {
  selectedVersesMap.clear();
  updateSelectedVersesBar();
  hideCompletionBanner();
  // 날짜 변경 시 재생 중인 TTS 자동 정지
  if (typeof closeTTSPlayer === 'function') closeTTSPlayer();
  renderLoadingState();

  try {
    // Step 1: 오늘의 읽기 계획 조회
    // 서버(get_plan.php)에 해당 날짜의 계획을 요청합니다.
    const planRes = await fetch(`${API_BASE_URL}api/bible/get_plan.php?date=${dateStr}`, { credentials: 'include' });
    if (!planRes.ok) {
      throw new Error(`읽기 표를 불러오는데 실패했습니다. (상태 코드: ${planRes.status})`);
    }
    const planResult = await planRes.json();

    // 등록된 계획이 없으면 빈 상태 UI를 렌더링하고 종료합니다.
    if (planResult.status !== 'success' || !planResult.data || planResult.data.length === 0) {
      renderEmptyPlanState(dateStr);
      return;
    }

    const plans = planResult.data;

    // Step 2: 각 계획 항목의 말씀 구절 데이터 병렬 조회
    // 여러 개의 성경 본문을 동시에 불러오기 위해 Promise 배열을 생성합니다.
    const wordPromises = plans.map(plan => {
      // API 요청 파라미터 정규화 (다양한 필드명 호환)
      const rawBook = plan.book || plan.book_id || 1;
      const bookId = getBookNumericId(rawBook);
      const start = plan.start || plan.start_chapter || plan.chapter_start || 1;
      const end = plan.end || plan.end_chapter || plan.chapter_end || start;

      // get_word.php API로 특정 권, 시작 장, 끝 장의 말씀 데이터를 요청
      return fetch(`${API_BASE_URL}api/bible/get_word.php?book=${bookId}&start=${start}&end=${end}&version=${currentVersion}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('말씀 본문을 불러오지 못했습니다.');
          return res.json();
        })
        .then(resData => ({
          planInfo: { book: bookId, start, end },
          verses: resData.status === 'success' ? resData.data : []
        }));
    });

    // 모든 말씀 데이터를 비동기로 불러올 때까지 대기
    const results = await Promise.all(wordPromises);
    
    // 가져온 계획과 말씀 데이터를 화면에 렌더링 (renderer.js 활용)
    renderReadingPlan(plans, results);

    // Step 3: 해당 날짜에 저장된 완료 기록이 있는지 확인하고 복원 (로그인된 경우)
    await checkAndRestoreSavedCompletion(dateStr);

  } catch (err) {
    console.error('Data loading error:', err);
    renderErrorState(err.message);
  }
}

// ── 앱 시작 ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);
