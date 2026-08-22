/**
 * state.js
 * 전역 상태(State) & DOM 요소(Elements) 참조
 */

// ── 전역 상태 ──────────────────────────────────────────────
let currentDate = new Date();
let currentFontSize = parseFloat(localStorage.getItem('bible_font_size')) || 1.125;
let currentUser = null;
const selectedVersesMap = new Map();

// ── DOM 요소 참조 ───────────────────────────────────────────
const elements = {
  // 공통 UI
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
  toast: document.getElementById('toast'),

  // 인증 (Auth)
  loginOpenBtn: document.getElementById('loginOpenBtn'),
  userProfileArea: document.getElementById('userProfileArea'),
  userNameSpan: document.getElementById('userNameSpan'),
  adminLinkBtn: document.getElementById('adminLinkBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  authModal: document.getElementById('authModal'),
  authModalCloseBtn: document.getElementById('authModalCloseBtn'),
  tabLoginBtn: document.getElementById('tabLoginBtn'),
  tabRegisterBtn: document.getElementById('tabRegisterBtn'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginErrorMsg: document.getElementById('loginErrorMsg'),
  registerErrorMsg: document.getElementById('registerErrorMsg'),

  // 함온성 완료
  selectedVersesBar: document.getElementById('selectedVersesBar'),
  selectedCountText: document.getElementById('selectedCountText'),
  clearSelectionBtn: document.getElementById('clearSelectionBtn'),
  openCompletionBtn: document.getElementById('openCompletionBtn'),
  completionModal: document.getElementById('completionModal'),
  completionModalCloseBtn: document.getElementById('completionModalCloseBtn'),
  completionCancelBtn: document.getElementById('completionCancelBtn'),
  completionForm: document.getElementById('completionForm'),
  completionMyMessage: document.getElementById('completionMyMessage'),
  completionPray: document.getElementById('completionPray'),
  completionPrayForUser: document.getElementById('completionPrayForUser'),
  completionErrorMsg: document.getElementById('completionErrorMsg'),

  // 완료 배너 & 기도 기록
  myPrayersBtn: document.getElementById('myPrayersBtn'),
  completionBanner: document.getElementById('completionBanner'),
  completionBannerTitle: document.getElementById('completionBannerTitle'),
  completionBannerSub: document.getElementById('completionBannerSub'),
  editCompletionBtn: document.getElementById('editCompletionBtn'),
  prayerHistoryModal: document.getElementById('prayerHistoryModal'),
  prayerHistoryCloseBtn: document.getElementById('prayerHistoryCloseBtn'),
  prayerHistoryList: document.getElementById('prayerHistoryList'),

  // 커뮤니티 대시보드 & 인기 말씀
  communityDashboardBtn: document.getElementById('communityDashboardBtn'),
  communityDashboardModal: document.getElementById('communityDashboardModal'),
  communityDashboardCloseBtn: document.getElementById('communityDashboardCloseBtn'),
  tabFriendsBtn: document.getElementById('tabFriendsBtn'),
  tabPopularVersesBtn: document.getElementById('tabPopularVersesBtn'),
  friendsStatsTab: document.getElementById('friendsStatsTab'),
  popularVersesTab: document.getElementById('popularVersesTab'),
  statTodayCount: document.getElementById('statTodayCount'),
  statTotalCount: document.getElementById('statTotalCount'),
  memberRankingsList: document.getElementById('memberRankingsList'),
  communityFeedList: document.getElementById('communityFeedList'),
  popularVersesList: document.getElementById('popularVersesList')
};
