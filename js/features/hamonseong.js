/**
 * hamonseong.js
 * 함온성(말씀 완독 완료) 기능:
 * - 구절 선택 / 해제
 * - 완료 모달 열기/닫기 & 제출
 * - 완료 배너 표시/숨기기
 */

// ── 이벤트 등록 ──────────────────────────────────────────────

/** 함온성 관련 이벤트 리스너를 초기화합니다. */
function setupHamonseongEvents() {
  if (elements.clearSelectionBtn) {
    elements.clearSelectionBtn.addEventListener('click', clearSelectedVerses);
  }
  if (elements.openCompletionBtn) {
    elements.openCompletionBtn.addEventListener('click', openCompletionModal);
  }
  if (elements.completionModalCloseBtn) {
    elements.completionModalCloseBtn.addEventListener('click', closeCompletionModal);
  }
  if (elements.completionCancelBtn) {
    elements.completionCancelBtn.addEventListener('click', closeCompletionModal);
  }
  if (elements.completionModal) {
    elements.completionModal.addEventListener('click', (e) => {
      if (e.target === elements.completionModal) closeCompletionModal();
    });
  }
  if (elements.completionForm) {
    elements.completionForm.addEventListener('submit', handleCompletionSubmit);
  }
  if (elements.myPrayersBtn) {
    elements.myPrayersBtn.addEventListener('click', openPrayerHistoryModal);
  }
  if (elements.editCompletionBtn) {
    elements.editCompletionBtn.addEventListener('click', openCompletionModal);
  }
  if (elements.prayerHistoryCloseBtn) {
    elements.prayerHistoryCloseBtn.addEventListener('click', closePrayerHistoryModal);
  }
  if (elements.prayerHistoryModal) {
    elements.prayerHistoryModal.addEventListener('click', (e) => {
      if (e.target === elements.prayerHistoryModal) closePrayerHistoryModal();
    });
  }
  if (elements.communityDashboardBtn) {
    elements.communityDashboardBtn.addEventListener('click', openCommunityDashboardModal);
  }
  if (elements.communityDashboardCloseBtn) {
    elements.communityDashboardCloseBtn.addEventListener('click', closeCommunityDashboardModal);
  }
  if (elements.communityDashboardModal) {
    elements.communityDashboardModal.addEventListener('click', (e) => {
      if (e.target === elements.communityDashboardModal) closeCommunityDashboardModal();
    });
  }
  if (elements.tabFriendsBtn) {
    elements.tabFriendsBtn.addEventListener('click', () => switchDashboardTab('friends'));
  }
  if (elements.tabPopularVersesBtn) {
    elements.tabPopularVersesBtn.addEventListener('click', () => switchDashboardTab('popular'));
  }
}

// ── 구절 선택 바 ─────────────────────────────────────────────

/** 선택된 구절 수에 따라 하단 플로팅 바를 업데이트합니다. */
function updateSelectedVersesBar() {
  const count = selectedVersesMap.size;
  if (elements.selectedCountText) {
    elements.selectedCountText.textContent = count;
  }
  if (elements.selectedVersesBar) {
    elements.selectedVersesBar.style.display = count > 0 ? 'flex' : 'none';
  }
}

/** 선택된 모든 구절을 해제합니다. */
function clearSelectedVerses() {
  selectedVersesMap.clear();
  document.querySelectorAll('.verse-item.selected').forEach(el => {
    el.classList.remove('selected');
  });
  updateSelectedVersesBar();
  showToast('선택한 구절이 모두 해제되었습니다.');
}

// ── myMessage 포맷 생성 ──────────────────────────────────────

/**
 * 선택된 구절을 저장용 텍스트 형식으로 변환합니다.
 * @returns {string}
 */
function generateFormattedMyMessage() {
  if (selectedVersesMap.size === 0) return '';

  // 성경 권 이름으로 그룹화
  const groupedByBook = {};
  for (const item of selectedVersesMap.values()) {
    if (!groupedByBook[item.bookName]) {
      groupedByBook[item.bookName] = [];
    }
    groupedByBook[item.bookName].push(item);
  }

  const resultLines = [];
  for (const [bName, verses] of Object.entries(groupedByBook)) {
    resultLines.push(bName);
    verses.sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return parseInt(a.verse, 10) - parseInt(b.verse, 10);
    });
    verses.forEach(v => {
      resultLines.push(`${v.chapter}:${v.verse} ${v.content}`);
    });
  }

  return resultLines.join('\n');
}

// ── 완료 모달 ────────────────────────────────────────────────

/** 함온성 완료 모달을 엽니다. */
function openCompletionModal() {
  if (!currentUser) {
    showToast('함온성 완료를 저장하려면 먼저 로그인해주세요.');
    openAuthModal('login');
    return;
  }

  if (selectedVersesMap.size === 0) {
    showToast('구절을 먼저 하나 이상 선택해주세요.');
    return;
  }

  const formattedMsg = generateFormattedMyMessage();
  if (elements.completionMyMessage) {
    elements.completionMyMessage.value = formattedMsg;
  }

  if (elements.completionErrorMsg) {
    elements.completionErrorMsg.style.display = 'none';
    elements.completionErrorMsg.textContent = '';
  }

  if (elements.completionModal) {
    elements.completionModal.style.display = 'flex';
  }
}

/** 함온성 완료 모달을 닫습니다. */
function closeCompletionModal() {
  if (elements.completionModal) {
    elements.completionModal.style.display = 'none';
  }
}

/**
 * 함온성 완료 폼 제출 핸들러
 * @param {SubmitEvent} e
 */
async function handleCompletionSubmit(e) {
  e.preventDefault();

  if (elements.completionErrorMsg) {
    elements.completionErrorMsg.style.display = 'none';
    elements.completionErrorMsg.textContent = '';
  }

  const myMessage = elements.completionMyMessage ? elements.completionMyMessage.value.trim() : '';
  const pray = elements.completionPray ? elements.completionPray.value.trim() : '';
  const prayForUser = elements.completionPrayForUser ? elements.completionPrayForUser.value.trim() : '';

  if (!myMessage) {
    showAuthError(elements.completionErrorMsg, '선택된 구절 정보가 없습니다.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}api/save_completion.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myMessage, pray, prayForUser, daycnt: 1 })
    });

    const data = await res.json();

    if (data.status === 'success') {
      closeCompletionModal();
      showToast(`🎉 오늘의 함온성이 성공적으로 저장되었습니다! (${data.data.name} 님)`);
      checkAndRestoreSavedCompletion(getFormattedDate(currentDate));
    } else {
      showAuthError(elements.completionErrorMsg, data.message || '저장에 실패했습니다.');
    }
  } catch (err) {
    console.error('Save completion error:', err);
    showAuthError(elements.completionErrorMsg, '저장 처리 중 네트워크 오류가 발생했습니다.');
  }
}

// ── 완료 배너 ────────────────────────────────────────────────

/**
 * 오늘의 함온성 완료 배너를 표시합니다.
 * @param {Object} completion
 */
function showCompletionBanner(completion) {
  if (elements.completionBanner) {
    elements.completionBanner.style.display = 'flex';
  }
}

/** 완료 배너를 숨깁니다. */
function hideCompletionBanner() {
  if (elements.completionBanner) {
    elements.completionBanner.style.display = 'none';
  }
}
