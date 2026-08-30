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

/**
 * 카카오톡 인앱 브라우저 등의 쿠키 유실 문제를 우회하기 위해
 * 전역 fetch를 오버라이딩하여 localStorage에 있는 세션 토큰을 헤더에 자동 주입합니다.
 */
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  let [resource, config] = args;
  
  // API 요청인 경우에만 토큰 주입
  if (typeof resource === 'string' && resource.includes('api/')) {
    config = config || {};
    config.headers = config.headers || {};
    
    // 헤더가 Headers 객체일 경우와 일반 객체일 경우 처리
    const token = localStorage.getItem('api_token');
    if (token) {
      if (config.headers instanceof Headers) {
        config.headers.append('X-Session-Id', token);
      } else {
        config.headers['X-Session-Id'] = token;
      }
    }
    args[1] = config;
  }
  
  return originalFetch.apply(window, args);
};
