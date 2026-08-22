/**
 * js/admin/main.js
 * 관리자 페이지 메인 초기화 및 네비게이션 제어
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 권한 확인: 서버에 현재 세션 상태를 요청하여 관리자인지 확인
    const checkRes = await fetch(API_BASE_URL + 'api/auth/check_session.php', { credentials: 'include' });
    const checkData = await checkRes.json();
    
    // 비로그인 상태이거나 권한이 'admin'이 아닌 경우 메인 페이지로 강제 리다이렉트
    if (!checkData.isLoggedIn || checkData.user.role !== 'admin') {
        alert('관리자 권한이 없습니다.');
        window.location.href = '../index.html';
        return;
    }

    // 전역 변수에 현재 사용자 정보 저장 (다른 관리자 스크립트에서 활용)
    window.currentUser = checkData.user;
    document.getElementById('adminUserArea').textContent = `${window.currentUser.name} 관리자님 환영합니다.`;

    // 2. 네비게이션 탭 이벤트 설정
    const navItems = document.querySelectorAll('.admin-nav-item[data-target]');
    const sections = {
        users: document.getElementById('usersSection'),
        logs: document.getElementById('logsSection'),
        plans: document.getElementById('plansSection')
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
            Object.values(sections).forEach(sec => sec.style.display = 'none');
            sections[target].style.display = 'block';
            
            // 선택된 탭에 따라 페이지 제목 변경 및 해당 데이터 로드 함수 호출
            if (target === 'users') { 
                pageTitle.textContent = '사용자 관리'; 
                if (typeof loadUsers === 'function') loadUsers(); 
            }
            if (target === 'logs') { 
                pageTitle.textContent = '함온성 기록 관리'; 
                if (typeof loadLogs === 'function') loadLogs(); 
            }
            if (target === 'plans') { 
                pageTitle.textContent = '함온성 계획 관리'; 
                if (typeof loadPlans === 'function') loadPlans(); 
            }
        });
    });

    // 3. 초기 화면 설정: 기본적으로 사용자 관리(users) 탭을 로드
    if (typeof loadUsers === 'function') {
        loadUsers();
    }
});
