/**
 * community.js
 * 커뮤니티 대시보드 & 인기 말씀 통계 기능
 */

// ── 모달 제어 ────────────────────────────────────────────────

/** 커뮤니티 대시보드 모달을 열고 데이터를 불러옵니다. */
function openCommunityDashboardModal() {
  if (elements.communityDashboardModal) {
    elements.communityDashboardModal.style.display = 'flex';
    // 모바일에서 바텀시트 열릴 때 배경 스크롤 방지
    document.body.style.overflow = 'hidden';
  }
  switchDashboardTab('friends');
  loadCommunityStats();
}

/** 커뮤니티 대시보드 모달을 닫습니다. */
function closeCommunityDashboardModal() {
  if (elements.communityDashboardModal) {
    elements.communityDashboardModal.style.display = 'none';
    // 바텀시트 닫힐 때 배경 스크롤 복원
    document.body.style.overflow = '';
  }
}

// ── 탭 전환 ──────────────────────────────────────────────────

/**
 * 대시보드 탭을 전환합니다.
 * @param {'friends'|'popular'} tab
 */
function switchDashboardTab(tab) {
  if (tab === 'friends') {
    if (elements.tabFriendsBtn) elements.tabFriendsBtn.classList.add('active');
    if (elements.tabPopularVersesBtn) elements.tabPopularVersesBtn.classList.remove('active');
    if (elements.friendsStatsTab) elements.friendsStatsTab.style.display = 'block';
    if (elements.popularVersesTab) elements.popularVersesTab.style.display = 'none';
  } else {
    if (elements.tabPopularVersesBtn) elements.tabPopularVersesBtn.classList.add('active');
    if (elements.tabFriendsBtn) elements.tabFriendsBtn.classList.remove('active');
    if (elements.popularVersesTab) elements.popularVersesTab.style.display = 'block';
    if (elements.friendsStatsTab) elements.friendsStatsTab.style.display = 'none';
  }
}

// ── 데이터 불러오기 & 렌더링 ─────────────────────────────────

/** 서버에서 커뮤니티 통계를 불러와 렌더링합니다. */
async function loadCommunityStats() {
  try {
    const res = await fetch(`${API_BASE_URL}api/hamonseong/get_community_stats.php`, { credentials: 'include' });
    if (!res.ok) return;
    const result = await res.json();
    if (result.status !== 'success' || !result.data) return;

    const data = result.data;

    // 1. 요약 통계
    if (elements.statTodayCount) elements.statTodayCount.textContent = `${data.summary.today_users || 0}명`;
    if (elements.statTotalCount) elements.statTotalCount.textContent = `${data.summary.total_completions || 0}회`;


    // 3. 커뮤니티 묵상 피드
    if (elements.communityFeedList) {
      if (!data.recentFeed || data.recentFeed.length === 0) {
        elements.communityFeedList.innerHTML = `<div style="font-size:0.85rem; color:var(--text-subtle); padding:0.5rem 0;">아직 공유된 묵상이 없습니다.</div>`;
      } else {
        elements.communityFeedList.innerHTML = data.recentFeed.map(item => {
          const prayHtml = item.pray ? escapeHtml(item.pray) : '';
          const prayForUserHtml = item.prayForUser ? escapeHtml(item.prayForUser) : '';
          const scriptureHtml = item.myMessage ? escapeHtml(item.myMessage) : '';

          return `
            <div class="feed-card">
              <div class="feed-card-header">
                <span class="feed-author">👤 ${escapeHtml(item.name)} ${item.daycnt ? `(${item.daycnt}회차)` : ''}</span>
                <span class="feed-time">${escapeHtml(item.timestamp || item.created_at)}</span>
              </div>

              ${scriptureHtml ? `
                <div class="prayer-section">
                  <div class="prayer-section-label">선택 구절</div>
                  <div class="prayer-section-content scripture-box">${scriptureHtml}</div>
                </div>
              ` : ''}

              ${prayHtml ? `
                <div class="prayer-section">
                  <div class="prayer-section-label">오늘의 묵상</div>
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
      }
    }

    // 4. 인기 말씀 TOP 10
    if (elements.popularVersesList) {
      if (!data.topVerses || data.topVerses.length === 0) {
        elements.popularVersesList.innerHTML = `<div style="font-size:0.85rem; color:var(--text-subtle); padding:0.5rem 0;">아직 선택된 인기 말씀이 없습니다.</div>`;
      } else {
        const maxCount = data.topVerses[0].count || 1;
        elements.popularVersesList.innerHTML = data.topVerses.map((v, idx) => {
          const rank = idx + 1;
          const percent = Math.min(100, Math.round((v.count / maxCount) * 100));

          return `
            <div class="popular-verse-card">
              <div class="popular-verse-header">
                <div class="popular-verse-ref">
                  <span class="popular-rank-tag">${rank}위</span>
                  <span>${escapeHtml(v.reference)}</span>
                </div>
                <span class="popular-count-tag">❤️ ${v.count}회 선택됨</span>
              </div>
              <div class="popular-verse-text">${escapeHtml(v.content)}</div>
              <div class="popular-bar-wrapper">
                <div class="popular-bar-fill" style="width: ${percent}%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Error loading community stats:', err);
  }
}
