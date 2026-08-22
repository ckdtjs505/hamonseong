/**
 * utils.js
 * 공통 헬퍼 유틸리티 함수
 */

/**
 * 숫자형 성경 ID를 반환합니다.
 * @param {number|string} bookInput - 성경 권번 또는 한글 명칭
 * @returns {number}
 */
function getBookNumericId(bookInput) {
  if (typeof bookInput === 'number') return bookInput;
  const num = parseInt(bookInput, 10);
  if (!isNaN(num)) return num;
  if (typeof bookInput === 'string' && BIBLE_BOOK_IDS[bookInput.trim()]) {
    return BIBLE_BOOK_IDS[bookInput.trim()];
  }
  return 1; // 기본값 (창세기)
}

/**
 * Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환합니다.
 * @param {Date} date
 * @returns {string}
 */
function getFormattedDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Date 객체를 '2025년 1월 1일 (수요일)' 형태의 한국어 문자열로 변환합니다.
 * @param {Date} date
 * @returns {string}
 */
function getKoreanDateText(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]}요일)`;
}

/**
 * 성경 권 코드를 한글 이름으로 반환합니다.
 * @param {number|string} bookCode
 * @returns {string}
 */
function getBookName(bookCode) {
  if (!bookCode) return '성경';
  const numericBook = getBookNumericId(bookCode);
  if (BIBLE_BOOKS[numericBook]) {
    return BIBLE_BOOKS[numericBook];
  }
  return String(bookCode);
}

/**
 * 화면 하단에 토스트 메시지를 잠깐 표시합니다.
 * @param {string} message
 */
function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2500);
}

/**
 * HTML 특수문자를 이스케이프합니다 (XSS 방지).
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
