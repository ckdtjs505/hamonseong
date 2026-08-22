/**
 * js/admin/main.js
 * 관리자 페이지 메인 초기화 및 네비게이션 제어
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if user is admin
    const checkRes = await fetch(API_BASE_URL + 'api/auth/check_session.php', { credentials: 'include' });
    const checkData = await checkRes.json();
    
    if (!checkData.isLoggedIn || checkData.user.role !== 'admin') {
        alert('관리자 권한이 없습니다.');
        window.location.href = '../index.html';
        return;
    }

    window.currentUser = checkData.user;
    document.getElementById('adminUserArea').textContent = `${window.currentUser.name} 관리자님 환영합니다.`;

    // 2. Navigation
    const navItems = document.querySelectorAll('.admin-nav-item[data-target]');
    const sections = {
        users: document.getElementById('usersSection'),
        logs: document.getElementById('logsSection'),
        plans: document.getElementById('plansSection')
    };
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const target = item.dataset.target;
            Object.values(sections).forEach(sec => sec.style.display = 'none');
            sections[target].style.display = 'block';
            
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

    // Initialize with users
    if (typeof loadUsers === 'function') {
        loadUsers();
    }
});
