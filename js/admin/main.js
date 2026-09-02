/**
 * js/admin/main.js
 * 관리자 페이지 메인 초기화 및 네비게이션 제어
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 권한 확인: 서버에 현재 세션 상태를 요청하여 관리자인지 확인
    const checkRes = await fetch(API_BASE_URL + 'api/auth/check_session.php', { credentials: 'include' });
    const checkData = await checkRes.json();

    // 비로그인 상태이거나 권한이 'admin' 또는 'leader'가 아닌 경우 메인 페이지로 강제 리다이렉트
    if (!checkData.isLoggedIn || !['admin', 'leader'].includes(checkData.user.role)) {
        alert('접근 권한이 없습니다.');
        window.location.href = '../index.html';
        return;
    }

    // 전역 변수에 현재 사용자 정보 저장 (다른 관리자 스크립트에서 활용)
    window.currentUser = checkData.user;

    // 역할에 따른 환영 메시지 표시
    const roleLabel = checkData.user.role === 'admin' ? '관리자' : '리더';
    document.getElementById('adminUserArea').textContent = `${window.currentUser.name} ${roleLabel}님 환영합니다.`;

    // leader인 경우 사용자 관리 탭 숨김 처리 (사용자 관리는 admin 전용)
    if (checkData.user.role === 'leader') {
        const usersNavBtn = document.querySelector('.admin-nav-item[data-target="users"]');
        if (usersNavBtn) usersNavBtn.style.display = 'none';
    }

    // 모바일 메뉴 토글 제어
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (mobileMenuToggle && sidebarMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebarMenu.classList.toggle('active');
        });
    }

    // 2. 네비게이션 탭 이벤트 설정
    const navItems = document.querySelectorAll('.admin-nav-item[data-target]');
    // 각 탭에 대응하는 콘텐츠 섹션(Section) 요소를 매핑
    // data-target 속성값을 key로, 해당 섹션 DOM 요소를 value로 저장
    const sections = {
        users: document.getElementById('usersSection'),       // 사용자 관리
        progress: document.getElementById('progressSection'), // 반별 진행사항 관리
        logs: document.getElementById('logsSection'),         // 함온성 기록 관리
        plans: document.getElementById('plansSection')        // 함온성 계획 관리
    };
    const pageTitle = document.getElementById('pageTitle');

    // 각 네비게이션 항목에 클릭 이벤트 리스너 등록
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 모든 탭의 활성화 상태 해제 후 클릭된 탭만 활성화
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 대상 섹션(data-target) 파악
            const target = item.dataset.target;

            // 모든 섹션을 숨기고 대상 섹션만 표시
            // 안전 처리: 섹션 요소가 존재하지 않을 경우(캐시 문제 등) 에러 방지
            Object.values(sections).forEach(sec => {
                if (sec) sec.style.display = 'none';
            });
            if (sections[target]) {
                sections[target].style.display = 'block';
            } else {
                // HTML에는 탭 버튼이 있지만 대응하는 섹션이 없는 경우 (캐시/배포 불일치 등)
                console.warn('Section not found in sections object:', target);
            }

            // 선택된 탭에 따라 페이지 제목 변경 및 해당 데이터 로드 함수 호출
            if (target === 'users') {
                pageTitle.textContent = '사용자 관리';
                if (typeof loadUsers === 'function') loadUsers();
            }
            // 반별 진행사항 관리 탭: progress.js의 loadProgress() 호출
            if (target === 'progress') {
                pageTitle.textContent = '반별 진행사항 관리';
                if (typeof loadProgress === 'function') loadProgress();
            }
            if (target === 'logs') {
                pageTitle.textContent = '함온성 기록 관리';
                if (typeof loadLogs === 'function') loadLogs();
            }
            if (target === 'plans') {
                pageTitle.textContent = '함온성 계획 관리';
                if (typeof loadPlans === 'function') loadPlans();
            }

            // 모바일 환경에서 메뉴 항목 클릭 시 메뉴 닫기
            if (sidebarMenu && sidebarMenu.classList.contains('active')) {
                sidebarMenu.classList.remove('active');
            }
        });
    });

    // 3. 초기 화면 설정
    //    - admin: 사용자 관리(users) 탭으로 시작
    //    - leader: 반별 진행사항(progress) 탭으로 시작
    if (checkData.user.role === 'leader') {
        // leader 진입 시 기본 탭을 진행사항으로 설정
        const progressNavBtn = document.querySelector('.admin-nav-item[data-target="progress"]');
        if (progressNavBtn) progressNavBtn.click();
    } else {
        if (typeof loadUsers === 'function') {
            loadUsers();
        }
    }
});
