/**
 * prayer.js
 * 기도 기록 관련 기능:
 * - 저장된 완료 복원 (checkAndRestoreSavedCompletion)
 * - 기도 기록 모달 열기/닫기 & 목록 불러오기
 * - 기도 기록 삭제 & 날짜 이동
 */

// ── 저장된 완료 복원 ─────────────────────────────────────────

/**
 * 서버에서 저장된 완료 데이터를 불러와 복원합니다.
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
async function checkAndRestoreSavedCompletion(dateStr) {
  hideCompletionBanner();
  if (!currentUser) return;

  try {
    const res = await fetch(`${API_BASE_URL}api/get_completions.php?date=${dateStr}`);
    if (!res.ok) return;
    const result = await res.json();

    if (result.status === 'success' && result.data) {
      const completion = result.data;
      showCompletionBanner(completion);
      restoreSavedMyMessage(completion.myMessage);

      if (elements.completionPray) elements.completionPray.value = completion.pray || '';
      if (elements.completionPrayForUser) elements.completionPrayForUser.value = completion.prayForUser || '';
    }
  } catch (err) {
    console.error('Error checking saved completion:', err);
  }
}

/**
 * 저장된 myMessage 텍스트를 파싱하여 구절 선택 상태를 복원합니다.
 * @param {string} myMessage
 */
function restoreSavedMyMessage(myMessage) {
  if (!myMessage) return;

  const lines = myMessage.split('\n');
  let currentBookId = 1;

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;

    // 성경 권 이름 행
    if (BIBLE_BOOK_IDS[line]) {
      currentBookId = BIBLE_BOOK_IDS[line];
      return;
    }

    // '장:절 내용' 형식 파싱
    const match = line.match(/^(\d+):(\d+)\s*(.*)$/);
    if (match) {
      const chapter = parseInt(match[1], 10);
      const verse = match[2];
      const content = match[3] || '';
      const verseKey = `${currentBookId}_${chapter}_${verse}`;

      selectedVersesMap.set(verseKey, {
        book: currentBookId,
        bookName: getBookName(currentBookId),
        chapter: chapter,
        verse: verse,
        content: content
      });

      const el = document.querySelector(`.verse-item[data-verse-key="${verseKey}"]`);
      if (el) {
        el.classList.add('selected');
      }
    }
  });

  updateSelectedVersesBar();
}

// ── 기도 기록 모달 ───────────────────────────────────────────

/** 기도 기록 모달을 열고 목록을 불러옵니다. */
async function openPrayerHistoryModal() {
  if (!currentUser) {
    showToast('나의 기도함을 확인하시려면 먼저 로그인해주세요.');
    openAuthModal('login');
    return;
  }

  if (elements.prayerHistoryModal) {
    elements.prayerHistoryModal.style.display = 'flex';
  }

  loadPrayerHistory();
}

/** 기도 기록 모달을 닫습니다. */
function closePrayerHistoryModal() {
  if (elements.prayerHistoryModal) {
    elements.prayerHistoryModal.style.display = 'none';
  }
}

/** 서버에서 기도 기록 전체를 불러와 렌더링합니다. */
async function loadPrayerHistory() {
  if (!elements.prayerHistoryList) return;

  elements.prayerHistoryList.innerHTML = `
    <div class="empty-history">기도 기록을 불러오는 중입니다...</div>
  `;

  try {
    const res = await fetch(`${API_BASE_URL}api/get_completions.php?type=all`);
    const result = await res.json();

    if (result.status !== 'success' || !result.data || result.data.length === 0) {
      elements.prayerHistoryList.innerHTML = `
        <div class="empty-history">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🙏</span>
          <p style="font-weight: 600; color: var(--text-main);">아직 저장된 기도나 말씀 묵상 기록이 없습니다.</p>
          <p style="font-size: 0.85rem; color: var(--text-subtle); margin-top: 0.25rem;">오늘 말씀을 읽고 '완료하기'를 눌러 첫 기도를 남겨보세요!</p>
        </div>
      `;
      return;
    }

    elements.prayerHistoryList.innerHTML = result.data.map(item => {
      const dateText = item.timestamp || item.created_at;
      const myMessageHtml = item.myMessage ? escapeHtml(item.myMessage) : '';
      const prayHtml = item.pray ? escapeHtml(item.pray) : '';
      const prayForUserHtml = item.prayForUser ? escapeHtml(item.prayForUser) : '';
      const rawDateStr = item.created_at || item.timestamp;

      return `
        <div class="prayer-card">
          <div class="prayer-card-header">
            <div class="prayer-card-date">
              <span>📅</span> ${escapeHtml(dateText)} ${item.daycnt ? `(${item.daycnt}회차)` : ''}
            </div>
            <div class="prayer-card-actions">
              <button class="btn-prayer-jump" onclick="jumpToPrayerDate('${escapeHtml(rawDateStr)}')">이 날짜로 이동</button>
              <button class="btn-prayer-delete" onclick="deletePrayerRecord(${item.id})">삭제</button>
            </div>
          </div>

          <div class="prayer-section">
            <div class="prayer-section-label">선택한 말씀</div>
            <div class="prayer-section-content scripture-box">${myMessageHtml}</div>
          </div>

          ${prayHtml ? `
            <div class="prayer-section">
              <div class="prayer-section-label">오늘의 묵상 및 기도</div>
              <div class="prayer-section-content">${prayHtml}</div>
            </div>
          ` : ''}

          ${prayForUserHtml ? `
            <div class="prayer-section">
              <div class="prayer-section-label">서로를 위한 기도제목</div>
              <div class="prayer-section-content">${prayForUserHtml}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading prayer history:', err);
    elements.prayerHistoryList.innerHTML = `
      <div class="empty-history" style="color: #ef4444;">
        기도 기록을 불러오지 못했습니다. 다시 시도해 주세요.
      </div>
    `;
  }
}

// ── 날짜 이동 & 삭제 ─────────────────────────────────────────

/**
 * 기도 기록 카드에서 해당 날짜로 이동합니다.
 * @param {string} rawDateStr
 */
function jumpToPrayerDate(rawDateStr) {
  let dateObj = null;

  if (rawDateStr.includes('-')) {
    const parts = rawDateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  } else if (rawDateStr.includes('.')) {
    const parts = rawDateStr.split('.').map(p => p.trim());
    if (parts.length >= 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    currentDate = dateObj;
    closePrayerHistoryModal();
    updateDateView();
    showToast(`${getFormattedDate(dateObj)} 말씀으로 이동했습니다.`);
  }
}

/**
 * 특정 기도 기록을 삭제합니다.
 * @param {number} id - 기도 기록 ID
 */
async function deletePrayerRecord(id) {
  if (!confirm('정말로 이 기도 기록을 삭제하시겠습니까?')) return;

  try {
    const res = await fetch(`${API_BASE_URL}api/delete_completion.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();

    if (data.status === 'success') {
      showToast('기도 기록이 삭제되었습니다.');
      loadPrayerHistory();
      updateDateView();
    } else {
      showToast(data.message || '삭제에 실패했습니다.');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showToast('삭제 중 오류가 발생했습니다.');
  }
}

// 인라인 onclick 핸들러에서 접근 가능하도록 전역 등록
window.jumpToPrayerDate = jumpToPrayerDate;
window.deletePrayerRecord = deletePrayerRecord;
