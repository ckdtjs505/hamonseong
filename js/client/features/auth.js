/**
 * auth.js
 * 로그인 / 회원가입 / 로그아웃 / 세션 확인
 */

// ── 세션 ─────────────────────────────────────────────────────

/** 서버 세션을 확인하고, 로그인 상태이면 UI를 업데이트합니다. */
async function checkSession() {
  try {
    const res = await fetch(`${API_BASE_URL}api/auth/check_session.php`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === 'success' && data.isLoggedIn) {
      currentUser = data.user;
      updateAuthUI();
      checkAndRestoreSavedCompletion(getFormattedDate(currentDate));
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
}

// ── UI 업데이트 ───────────────────────────────────────────────

/** 로그인/로그아웃 상태에 따라 헤더 인증 영역을 업데이트합니다. */
function updateAuthUI() {
  if (currentUser) {
    if (elements.loginOpenBtn) elements.loginOpenBtn.style.display = 'none';
    if (elements.userProfileArea) elements.userProfileArea.style.display = 'flex';
    if (elements.userNameSpan) elements.userNameSpan.textContent = `${currentUser.name} 님`;
    if (elements.myPrayersBtn) elements.myPrayersBtn.style.display = 'inline-flex';
  } else {
    if (elements.loginOpenBtn) elements.loginOpenBtn.style.display = 'inline-block';
    if (elements.userProfileArea) elements.userProfileArea.style.display = 'none';
    if (elements.userNameSpan) elements.userNameSpan.textContent = '';
    if (elements.myPrayersBtn) elements.myPrayersBtn.style.display = 'none';
  }
}

// ── 이벤트 등록 ──────────────────────────────────────────────

/** 인증 관련 이벤트 리스너를 초기화합니다. */
function setupAuthEvents() {
  if (elements.loginOpenBtn) {
    elements.loginOpenBtn.addEventListener('click', () => openAuthModal('login'));
  }
  if (elements.authModalCloseBtn) {
    elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
  }
  if (elements.authModal) {
    elements.authModal.addEventListener('click', (e) => {
      if (e.target === elements.authModal) closeAuthModal();
    });
  }
  if (elements.tabLoginBtn) {
    elements.tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  }
  if (elements.tabRegisterBtn) {
    elements.tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
  }
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLogin);
  }
  if (elements.registerForm) {
    elements.registerForm.addEventListener('submit', handleRegister);
  }
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }
}

// ── 모달 제어 ────────────────────────────────────────────────

/**
 * 인증 모달을 엽니다.
 * @param {'login'|'register'} defaultTab
 */
function openAuthModal(defaultTab = 'login') {
  if (elements.authModal) {
    elements.authModal.style.display = 'flex';
    clearAuthErrors();
    switchAuthTab(defaultTab);
  }
}

/** 인증 모달을 닫습니다. */
function closeAuthModal() {
  if (elements.authModal) {
    elements.authModal.style.display = 'none';
    clearAuthErrors();
  }
}

/**
 * 로그인 / 회원가입 탭을 전환합니다.
 * @param {'login'|'register'} tab
 */
function switchAuthTab(tab) {
  clearAuthErrors();
  if (tab === 'login') {
    if (elements.tabLoginBtn) elements.tabLoginBtn.classList.add('active');
    if (elements.tabRegisterBtn) elements.tabRegisterBtn.classList.remove('active');
    if (elements.loginForm) elements.loginForm.style.display = 'flex';
    if (elements.registerForm) elements.registerForm.style.display = 'none';
  } else {
    if (elements.tabRegisterBtn) elements.tabRegisterBtn.classList.add('active');
    if (elements.tabLoginBtn) elements.tabLoginBtn.classList.remove('active');
    if (elements.registerForm) elements.registerForm.style.display = 'flex';
    if (elements.loginForm) elements.loginForm.style.display = 'none';
  }
}

/** 로그인/회원가입 오류 메시지를 초기화합니다. */
function clearAuthErrors() {
  if (elements.loginErrorMsg) {
    elements.loginErrorMsg.style.display = 'none';
    elements.loginErrorMsg.textContent = '';
  }
  if (elements.registerErrorMsg) {
    elements.registerErrorMsg.style.display = 'none';
    elements.registerErrorMsg.textContent = '';
  }
}

/**
 * 오류 메시지 요소에 오류를 표시합니다.
 * @param {HTMLElement} targetEl
 * @param {string} msg
 */
function showAuthError(targetEl, msg) {
  if (targetEl) {
    targetEl.textContent = msg;
    targetEl.style.display = 'block';
  }
}

// ── 핸들러 ──────────────────────────────────────────────────

/**
 * 로그인 폼 제출 핸들러
 * @param {SubmitEvent} e
 */
async function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!username || !password) {
    showAuthError(elements.loginErrorMsg, '아이디와 비밀번호를 모두 입력해주세요.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}api/auth/login.php`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.status === 'success') {
      currentUser = data.user;
      updateAuthUI();
      closeAuthModal();
      showToast(`반갑습니다, ${currentUser.name} 님!`);
      elements.loginForm.reset();
    } else {
      showAuthError(elements.loginErrorMsg, data.message || '로그인에 실패했습니다.');
    }
  } catch (err) {
    console.error('Login error:', err);
    showAuthError(elements.loginErrorMsg, '로그인 처리 중 네트워크 오류가 발생했습니다.');
  }
}

/**
 * 회원가입 폼 제출 핸들러
 * @param {SubmitEvent} e
 */
async function handleRegister(e) {
  e.preventDefault();
  clearAuthErrors();

  const name = document.getElementById('registerName').value.trim();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  if (!name || !username || !password) {
    showAuthError(elements.registerErrorMsg, '모든 필수 항목을 입력해주세요.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}api/auth/register.php`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password })
    });

    const data = await res.json();

    if (data.status === 'success') {
      currentUser = data.user;
      updateAuthUI();
      closeAuthModal();
      showToast(`회원가입 완료! 환영합니다, ${currentUser.name} 님!`);
      elements.registerForm.reset();
    } else {
      showAuthError(elements.registerErrorMsg, data.message || '회원가입에 실패했습니다.');
    }
  } catch (err) {
    console.error('Register error:', err);
    showAuthError(elements.registerErrorMsg, '회원가입 처리 중 네트워크 오류가 발생했습니다.');
  }
}

/** 로그아웃 핸들러 */
async function handleLogout() {
  try {
    const res = await fetch(`${API_BASE_URL}api/auth/logout.php`, { credentials: 'include' });
    const data = await res.json();

    currentUser = null;
    updateAuthUI();
    hideCompletionBanner();
    selectedVersesMap.clear();
    updateSelectedVersesBar();
    showToast(data.message || '로그아웃 되었습니다.');
  } catch (err) {
    console.error('Logout error:', err);
    currentUser = null;
    updateAuthUI();
  }
}
