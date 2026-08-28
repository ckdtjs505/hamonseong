/**
 * swipe-dismiss.js
 * 모바일 바텀시트 스와이프 닫기 기능
 *
 * 바텀시트 상단의 드래그 핸들(::before 회색 바)을 아래로 스와이프하면
 * 시트가 자연스럽게 닫히도록 하는 터치 이벤트 처리 모듈입니다.
 *
 * 동작 방식:
 *  1. 바텀시트의 modal-card 영역에서 터치 시작(touchstart) 감지
 *  2. 아래 방향으로 스와이프(touchmove) 시 시트를 실시간으로 끌어내림
 *  3. 일정 거리(100px) 이상 내리면 닫기, 아니면 원위치로 복귀
 */

(function () {
  /**
   * 모달 카드에 스와이프 닫기 기능을 바인딩합니다.
   * @param {HTMLElement} overlay - .modal-overlay 요소
   * @param {Function} closeFn - 해당 모달을 닫는 함수
   */
  function bindSwipeDismiss(overlay, closeFn) {
    if (!overlay) return;

    // MutationObserver를 사용하여 모달이 화면에 나타날 때마다 이벤트 바인딩
    const observer = new MutationObserver(() => {
      if (overlay.style.display === 'flex') {
        attachSwipeToCard(overlay, closeFn);
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
  }

  /**
   * modal-card 요소에 터치 이벤트를 부착합니다.
   * @param {HTMLElement} overlay - .modal-overlay 요소
   * @param {Function} closeFn - 닫기 함수
   */
  function attachSwipeToCard(overlay, closeFn) {
    const card = overlay.querySelector('.modal-card, .modal-card-large, .modal-card-history, .modal-card-dashboard');
    if (!card || card._swipeBound) return; // 중복 바인딩 방지
    card._swipeBound = true;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    card.addEventListener('touchstart', (e) => {
      // 시트 상단 40px 영역(드래그 핸들 근처)에서만 드래그 시작 허용
      const cardRect = card.getBoundingClientRect();
      const touchY = e.touches[0].clientY - cardRect.top;
      if (touchY > 40) return;

      startY = e.touches[0].clientY;
      isDragging = true;
      card.style.transition = 'none'; // 드래그 중에는 애니메이션 비활성화
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // 아래로만 끌 수 있도록 (위로는 못 끌게)
      if (diff > 0) {
        card.style.transform = `translateY(${diff}px)`;
        // 스와이프 거리에 비례하여 오버레이 투명도 조절
        overlay.style.opacity = Math.max(0.3, 1 - diff / 400);
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;

      const diff = currentY - startY;
      card.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
      overlay.style.transition = 'opacity 0.25s ease';

      if (diff > 100) {
        // 충분히 내렸으면 → 닫기 애니메이션 후 실제 닫기
        card.style.transform = 'translateY(100%)';
        overlay.style.opacity = '0';
        setTimeout(() => {
          card.style.transform = '';
          card.style.transition = '';
          overlay.style.opacity = '';
          overlay.style.transition = '';
          closeFn();
        }, 250);
      } else {
        // 부족하면 → 원위치로 복귀
        card.style.transform = '';
        overlay.style.opacity = '';
        setTimeout(() => {
          card.style.transition = '';
          overlay.style.transition = '';
        }, 250);
      }
      currentY = 0;
    }, { passive: true });
  }

  // DOM 로드 완료 후 모든 모달에 스와이프 닫기 바인딩
  document.addEventListener('DOMContentLoaded', () => {
    // 모달 ID와 닫기 함수를 매핑
    const modals = [
      { id: 'communityDashboardModal', closeFn: () => { if (typeof closeCommunityDashboardModal === 'function') closeCommunityDashboardModal(); } },
      { id: 'authModal', closeFn: () => { if (typeof closeAuthModal === 'function') closeAuthModal(); } },
      { id: 'completionModal', closeFn: () => { if (typeof closeCompletionModal === 'function') closeCompletionModal(); } },
      { id: 'prayerHistoryModal', closeFn: () => { if (typeof closePrayerHistoryModal === 'function') closePrayerHistoryModal(); } },
    ];

    modals.forEach(({ id, closeFn }) => {
      const overlay = document.getElementById(id);
      bindSwipeDismiss(overlay, closeFn);
    });
  });
})();
