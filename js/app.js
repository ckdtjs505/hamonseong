/**
 * 청년부 성경 읽기 (Youth Bible Reading) App Script
 */

// 1. 성경 66권 한글 명칭 및 숫자 ID 맵
const BIBLE_BOOKS = {
  1: "창세기", 2: "출애굽기", 3: "레위기", 4: "민수기", 5: "신명기",
  6: "여호수아", 7: "사사기", 8: "룻기", 9: "사무엘상", 10: "사무엘하",
  11: "열왕기상", 12: "열왕기하", 13: "역대상", 14: "역대하", 15: "에스라",
  16: "느헤미야", 17: "에스더", 18: "욥기", 19: "시편", 20: "잠언",
  21: "전도서", 22: "아가", 23: "이사야", 24: "예레미야", 25: "예레미야애가",
  26: "에스겔", 27: "다니엘", 28: "호세아", 29: "요엘", 30: "아모스",
  31: "오바댜", 32: "요나", 33: "미가", 34: "나훔", 35: "하박국",
  36: "스바냐", 37: "학개", 38: "스가랴", 39: "말라기",
  40: "마태복음", 41: "마가복음", 42: "누가복음", 43: "요한복음", 44: "사도행전",
  45: "로마서", 46: "고린도전서", 47: "고린도후서", 48: "갈라디아서", 49: "에베소서",
  50: "빌립보서", 51: "골로새서", 52: "데살로니가전서", 53: "데살로니가후서", 54: "디모데전서",
  55: "디모데후서", 56: "디도서", 57: "빌레몬서", 58: "히브리서", 59: "야고보서",
  60: "베드로전서", 61: "베드로후서", 62: "요한1서", 63: "요한2서", 64: "요한3서",
  65: "유다서", 66: "요한계시록"
};

const BIBLE_BOOK_IDS = {
  창세기: 1, 출애굽기: 2, 레위기: 3, 민수기: 4, 신명기: 5,
  여호수아: 6, 사사기: 7, 룻기: 8, 사무엘상: 9, 사무엘하: 10,
  열왕기상: 11, 열왕기하: 12, 역대상: 13, 역대하: 14, 에스라: 15,
  느헤미야: 16, 에스더: 17, 욥기: 18, 시편: 19, 잠언: 20,
  전도서: 21, 아가: 22, 이사야: 23, 예레미야: 24, 예레미야애가: 25,
  에스겔: 26, 다니엘: 27, 호세아: 28, 요엘: 29, 아모스: 30,
  오바댜: 31, 오바디야: 31, 요나: 32, 미가: 33, 나훔: 34, 하박국: 35,
  스바냐: 36, 학개: 37, 스가랴: 38, 스카리야: 38, 말라기: 39,
  마태복음: 40, 마가복음: 41, 누가복음: 42, 요한복음: 43, 사도행전: 44,
  로마서: 45, 고린도전서: 46, 고린도후서: 47, 갈라디아서: 48, 에베소서: 49,
  빌립보서: 50, 골로새서: 51, 데살로니가전서: 52, 데살로니가후서: 53, 디모데전서: 54,
  디모데후서: 55, 디도서: 56, 빌레몬서: 57, 히브리서: 58, 야고보서: 59,
  베드로전서: 60, 베드로후서: 61, 요한1서: 62, 요한2서: 63, 요한3서: 64,
  유다서: 65, 요한계시록: 66
};

function getBookNumericId(bookInput) {
  if (typeof bookInput === 'number') return bookInput;
  const num = parseInt(bookInput, 10);
  if (!isNaN(num)) return num;
  if (typeof bookInput === 'string' && BIBLE_BOOK_IDS[bookInput.trim()]) {
    return BIBLE_BOOK_IDS[bookInput.trim()];
  }
  return 1; // 기본값 (창세기)
}

// 2. State & DOM Elements
let currentDate = new Date();
let currentFontSize = parseFloat(localStorage.getItem('bible_font_size')) || 1.125;

const elements = {
  themeSelect: document.getElementById('themeSelect'),
  fontDecreaseBtn: document.getElementById('fontDecreaseBtn'),
  fontIncreaseBtn: document.getElementById('fontIncreaseBtn'),
  prevDateBtn: document.getElementById('prevDateBtn'),
  nextDateBtn: document.getElementById('nextDateBtn'),
  todayBtn: document.getElementById('todayBtn'),
  dateInput: document.getElementById('dateInput'),
  dateDisplayText: document.getElementById('dateDisplayText'),
  planSummaryCard: document.getElementById('planSummaryCard'),
  planTitle: document.getElementById('planTitle'),
  planRangeList: document.getElementById('planRangeList'),
  readingContainer: document.getElementById('readingContainer'),
  toast: document.getElementById('toast')
};

// 3. Helper Functions
function getFormattedDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getKoreanDateText(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]}요일)`;
}

function getBookName(bookCode) {
  if (!bookCode) return '성경';
  const numericBook = getBookNumericId(bookCode);
  if (BIBLE_BOOKS[numericBook]) {
    return BIBLE_BOOKS[numericBook];
  }
  return String(bookCode);
}

function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2500);
}

// 4. Initialization & Options
function initApp() {
  // Restore Theme
  const savedTheme = localStorage.getItem('bible_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (elements.themeSelect) elements.themeSelect.value = savedTheme;

  // Restore Font Size
  document.documentElement.style.setProperty('--bible-font-size', `${currentFontSize}rem`);

  // Event Listeners
  if (elements.themeSelect) {
    elements.themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('bible_theme', theme);
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

  // Initial Load
  updateDateView();
}

function updateDateView() {
  const dateStr = getFormattedDate(currentDate);
  if (elements.dateInput) elements.dateInput.value = dateStr;
  if (elements.dateDisplayText) elements.dateDisplayText.textContent = getKoreanDateText(currentDate);

  loadBibleReading(dateStr);
}

// 5. API Data Fetching & Rendering
async function loadBibleReading(dateStr) {
  renderLoadingState();

  try {
    // Step 1: Get Today's Reading Plan
    const planRes = await fetch(`api/get_plan.php?date=${dateStr}`);
    if (!planRes.ok) {
      throw new Error(`읽기 표를 불러오는데 실패했습니다. (상태 코드: ${planRes.status})`);
    }
    const planResult = await planRes.json();

    if (planResult.status !== 'success' || !planResult.data || planResult.data.length === 0) {
      renderEmptyPlanState(dateStr);
      return;
    }

    const plans = planResult.data;

    // Step 2: Fetch verses for all plan entries
    const wordPromises = plans.map(plan => {
      const rawBook = plan.book || plan.book_id || 1;
      const bookId = getBookNumericId(rawBook);
      const start = plan.start || plan.start_chapter || plan.chapter_start || 1;
      const end = plan.end || plan.end_chapter || plan.chapter_end || start;

      return fetch(`api/get_word.php?book=${bookId}&start=${start}&end=${end}`)
        .then(res => {
          if (!res.ok) throw new Error('말씀 본문을 불러오지 못했습니다.');
          return res.json();
        })
        .then(resData => ({
          planInfo: { book: bookId, start, end },
          verses: resData.status === 'success' ? resData.data : []
        }));
    });

    const results = await Promise.all(wordPromises);
    renderReadingPlan(plans, results);

  } catch (err) {
    console.error('Data loading error:', err);
    renderErrorState(err.message);
  }
}

// 6. UI Renderers
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

function renderEmptyPlanState(dateStr) {
  if (elements.planSummaryCard) elements.planSummaryCard.style.display = 'none';
  if (elements.readingContainer) {
    elements.readingContainer.innerHTML = `
      <div class="empty-state">
        <span class="state-icon">📖</span>
        <div class="state-title">${dateStr} 읽기표가 존재하지 않습니다</div>
        <div class="state-desc">해당 날짜에 등록된 성경 읽기 계획이 없습니다. 상단의 날짜 이동 버튼을 이용하여 다른 날짜를 선택해 주세요.</div>
        <button class="btn-retry" onclick="currentDate=new Date(); updateDateView();">오늘 날짜로 이동</button>
      </div>
    `;
  }
}

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

function renderReadingPlan(plans, wordResults) {
  // 1. Render Summary Header Card
  if (elements.planSummaryCard) {
    elements.planSummaryCard.style.display = 'flex';

    // Create Range Titles
    const rangeTitles = wordResults.map(item => {
      const bookName = getBookName(item.planInfo.book);
      const start = item.planInfo.start;
      const end = item.planInfo.end;
      return start === end ? `${bookName} ${start}장` : `${bookName} ${start}장 ~ ${end}장`;
    });

    if (elements.planTitle) elements.planTitle.textContent = rangeTitles.join(', ');

    if (elements.planRangeList) {
      elements.planRangeList.innerHTML = wordResults.map(item => {
        const bookName = getBookName(item.planInfo.book);
        const start = item.planInfo.start;
        const end = item.planInfo.end;
        const text = start === end ? `${bookName} ${start}장` : `${bookName} ${start}~${end}장`;
        return `<span class="range-chip">${text}</span>`;
      }).join('');
    }
  }

  // 2. Render Verses
  if (!elements.readingContainer) return;
  elements.readingContainer.innerHTML = '';

  let totalVerseCount = 0;

  wordResults.forEach(item => {
    const verses = item.verses || [];
    if (verses.length === 0) return;

    totalVerseCount += verses.length;

    // Group verses by book and chapter
    const grouped = {};
    verses.forEach(v => {
      const bName = getBookName(v.book || item.planInfo.book);
      const ch = v.chapter || 1;
      const key = `${bName} ${ch}장`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    });

    for (const [chapterTitle, chapterVerses] of Object.entries(grouped)) {
      const chapterSection = document.createElement('div');
      chapterSection.className = 'chapter-section';

      const titleEl = document.createElement('h2');
      titleEl.className = 'chapter-title';
      titleEl.innerHTML = `<span>📖</span> ${chapterTitle}`;
      chapterSection.appendChild(titleEl);

      const versesListEl = document.createElement('div');
      versesListEl.className = 'verses-list';

      chapterVerses.forEach(verseObj => {
        const verseItem = document.createElement('div');
        verseItem.className = 'verse-item';

        const verseNum = verseObj.verse || '';
        const verseText = verseObj.content || verseObj.text || verseObj.message || verseObj.verse_content || '';
        const bName = getBookName(verseObj.book || item.planInfo.book);

        verseItem.innerHTML = `
          <span class="verse-num">${verseNum}</span>
          <span class="verse-text">${verseText}</span>
        `;

        // Click to copy verse text & highlight
        verseItem.addEventListener('click', () => {
          verseItem.classList.toggle('highlighted');
          const copyContent = `${bName} ${verseObj.chapter}:${verseNum} - ${verseText}`;
          navigator.clipboard.writeText(copyContent).then(() => {
            showToast(`구절이 복사되었습니다: ${bName} ${verseObj.chapter}:${verseNum}`);
          }).catch(err => {
            console.error('Clipboard copy failed:', err);
          });
        });

        versesListEl.appendChild(verseItem);
      });

      chapterSection.appendChild(versesListEl);
      elements.readingContainer.appendChild(chapterSection);
    }
  });

  if (totalVerseCount === 0) {
    renderEmptyPlanState(getFormattedDate(currentDate));
  }
}

// 7. Start App on DOM Ready
document.addEventListener('DOMContentLoaded', initApp);
