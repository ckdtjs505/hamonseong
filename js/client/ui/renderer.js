/**
 * renderer.js
 * UI 렌더링 함수: 성경 읽기 계획 및 뷰 상태 표시
 */

// ── 상태 뷰 렌더러 ──────────────────────────────────────────

/** 로딩 스켈레톤 표시 */
function renderLoadingState() {
  if (elements.planSummaryCard) elements.planSummaryCard.style.display = 'none';
  if (elements.readingContainer) {
    elements.readingContainer.innerHTML = `
      <div class="loading-skeleton">
        <div class="skeleton-line" style="width: 40%; height: 28px;"></div>
        <div class="skeleton-line" style="width: 100%;"></div>
        <div class="skeleton-line" style="width: 92%;"></div>
        <div class="skeleton-line" style="width: 96%;"></div>
        <div class="skeleton-line" style="width: 88%;"></div>
        <div style="height: 1.5rem;"></div>
        <div class="skeleton-line" style="width: 35%; height: 28px;"></div>
        <div class="skeleton-line" style="width: 98%;"></div>
        <div class="skeleton-line" style="width: 90%;"></div>
      </div>
    `;
  }
}

/**
 * 해당 날짜에 읽기 계획이 없을 때 표시
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
function renderEmptyPlanState(dateStr) {
  if (elements.planSummaryCard) elements.planSummaryCard.style.display = 'none';
  if (elements.readingContainer) {
    // 현재 날짜(오늘)인지 확인
    const todayStr = getFormattedDate(new Date());
    const isToday = dateStr === todayStr;

    // 안내 메시지 분기
    const iconHtml = isToday ? '☕️' : '📅';
    const title = isToday ? '오늘은 쉬어가는 날입니다 🌿' : `${dateStr} 읽기표가 없습니다`;
    const desc = isToday 
      ? '오늘은 예정된 성경 읽기(함온성) 일정이 없습니다. 그동안 읽은 말씀을 묵상하며 평안한 하루 보내세요!'
      : '해당 날짜에 등록된 성경 읽기 계획이 없습니다. 일정이 있는 다른 날짜를 선택해 주세요.';

    // 오늘이 아닐 때만 '오늘 날짜로 이동' 버튼 표시, 오늘이면 '친구들 현황 보기' 유도
    const buttonHtml = isToday 
      ? `<button class="btn-retry" onclick="if(typeof openCommunityDashboardModal === 'function') openCommunityDashboardModal()"><span style="margin-right:0.3rem">👥</span> 친구들 묵상 보기</button>` 
      : `<button class="btn-retry" onclick="currentDate=new Date(); updateDateView();">오늘 날짜로 이동</button>`;

    elements.readingContainer.innerHTML = `
      <div class="empty-state" style="padding: 4rem 1.5rem;">
        <span class="state-icon" style="font-size: 3.2rem; margin-bottom: 1.25rem;">${iconHtml}</span>
        <div class="state-title" style="font-size: 1.2rem; margin-bottom: 0.75rem;">${title}</div>
        <div class="state-desc" style="line-height: 1.6; margin-bottom: 2rem;">${desc}</div>
        ${buttonHtml}
      </div>
    `;
  }
}

/**
 * 데이터 로드 오류 발생 시 표시
 * @param {string} errorMessage
 */
function renderErrorState(errorMessage) {
  if (elements.planSummaryCard) elements.planSummaryCard.style.display = 'none';
  if (elements.readingContainer) {
    elements.readingContainer.innerHTML = `
      <div class="error-state">
        <span class="state-icon">⚠️</span>
        <div class="state-title">데이터를 불러오는 중 오류가 발생했습니다</div>
        <div class="state-desc">${errorMessage || '서버와의 통신이 원활하지 않습니다.'}</div>
        <button class="btn-retry" onclick="updateDateView()">다시 시도</button>
      </div>
    `;
  }
}

// ── 읽기 계획 렌더러 ─────────────────────────────────────────

/**
 * 성경 읽기 계획 및 말씀 구절을 화면에 렌더링합니다.
 * @param {Array} plans - 읽기 계획 배열
 * @param {Array} wordResults - { planInfo, verses } 배열
 */
function renderReadingPlan(plans, wordResults) {
  // 1. 요약 헤더 카드 렌더링
  if (elements.planSummaryCard) {
    elements.planSummaryCard.style.display = 'flex';

    const uniqueRangeSet = new Set();
    wordResults.forEach(item => {
      const bookName = getBookName(item.planInfo.book);
      const start = item.planInfo.start;
      const end = item.planInfo.end;
      const titleText = (start === end || !end)
        ? `${bookName} ${start}장`
        : `${bookName} ${start}장 ~ ${end}장`;
      uniqueRangeSet.add(titleText);
    });

    const rangeTitles = Array.from(uniqueRangeSet);

    if (elements.planTitle) elements.planTitle.textContent = rangeTitles.join(', ');

    if (elements.planDayCount) {
      if (plans.length > 0 && plans[0].daycount) {
        currentDayCount = parseInt(plans[0].daycount, 10);
        elements.planDayCount.textContent = `Day ${currentDayCount}`;
        elements.planDayCount.style.display = 'inline-block';
      } else {
        currentDayCount = 1;
        elements.planDayCount.style.display = 'none';
      }
    }

    if (elements.planRangeList) {
      elements.planRangeList.innerHTML = rangeTitles
        .map(text => `<span class="range-chip">${text}</span>`)
        .join('');
    }
  }

  // 2. 구절 렌더링
  if (!elements.readingContainer) return;
  elements.readingContainer.innerHTML = '';

  // 중복 제거하며 구절 수집
  const allVerses = [];
  const seenVerseKeys = new Set();

  wordResults.forEach(item => {
    const verses = item.verses || [];
    verses.forEach(v => {
      const bCode = v.book || item.planInfo.book;
      const ch = v.chapter || 1;
      const vs = v.verse || 1;
      const key = v.id ? `id_${v.id}` : `${bCode}_${ch}_${vs}`;

      if (!seenVerseKeys.has(key)) {
        seenVerseKeys.add(key);
        allVerses.push({ ...v, book: bCode, chapter: ch, verse: vs });
      }
    });
  });

  if (allVerses.length === 0) {
    renderEmptyPlanState(getFormattedDate(currentDate));
    return;
  }

  // 책 & 장 기준으로 그룹화
  const grouped = {};
  allVerses.forEach(v => {
    const bName = getBookName(v.book);
    const key = `${bName} ${v.chapter}장`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });

  // 각 장(chapter) 섹션 렌더링
  for (const [chapterTitle, chapterVerses] of Object.entries(grouped)) {
    const chapterSection = document.createElement('div');
    chapterSection.className = 'chapter-section';

    const titleEl = document.createElement('h2');
    titleEl.className = 'chapter-title';
    titleEl.innerHTML = `<span>📖</span> ${chapterTitle}`;
    chapterSection.appendChild(titleEl);

    const versesListEl = document.createElement('div');
    versesListEl.className = 'verses-list';

    // 절 번호 기준 정렬
    chapterVerses.sort((a, b) => (parseInt(a.verse, 10) || 0) - (parseInt(b.verse, 10) || 0));

    chapterVerses.forEach(verseObj => {
      const verseItem = document.createElement('div');
      verseItem.className = 'verse-item';

      const verseNum = verseObj.verse || '';
      const verseText = verseObj.content || verseObj.text || verseObj.message || verseObj.verse_content || '';
      const bName = getBookName(verseObj.book);
      const verseKey = `${verseObj.book}_${verseObj.chapter}_${verseNum}`;

      verseItem.setAttribute('data-verse-key', verseKey);

      // 이전에 선택된 구절이면 강조 표시
      if (selectedVersesMap.has(verseKey)) {
        verseItem.classList.add('selected');
      }

      verseItem.innerHTML = `
        <span class="verse-num">${verseNum}</span>
        <span class="verse-text">${verseText}</span>
      `;

      // 클릭 시 구절 선택 토글 (함온성 기능)
      verseItem.addEventListener('click', () => {
        if (selectedVersesMap.has(verseKey)) {
          selectedVersesMap.delete(verseKey);
          verseItem.classList.remove('selected');
        } else {
          selectedVersesMap.set(verseKey, {
            book: verseObj.book,
            bookName: bName,
            chapter: verseObj.chapter,
            verse: verseNum,
            content: verseText
          });
          verseItem.classList.add('selected');
        }
        updateSelectedVersesBar();
      });

      versesListEl.appendChild(verseItem);
    });

    chapterSection.appendChild(versesListEl);
    elements.readingContainer.appendChild(chapterSection);
  }
}
