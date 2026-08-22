/**
 * admin_app.js
 * 관리자 페이지 기능 (사용자 조회/수정/삭제, 로그 조회/삭제)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if user is admin
    const checkRes = await fetch(API_BASE_URL + 'api/check_session.php', { credentials: 'include' });
    const checkData = await checkRes.json();
    
    if (!checkData.isLoggedIn || checkData.user.role !== 'admin') {
        alert('관리자 권한이 없습니다.');
        window.location.href = 'index.html';
        return;
    }

    const currentUser = checkData.user;
    document.getElementById('adminUserArea').textContent = `${currentUser.name} 관리자님 환영합니다.`;

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
            
            if (target === 'users') { pageTitle.textContent = '사용자 관리'; loadUsers(); }
            if (target === 'logs') { pageTitle.textContent = '함온성 기록 관리'; loadLogs(); }
            if (target === 'plans') { pageTitle.textContent = '성경 읽기 계획 관리'; loadPlans(); }
        });
    });

    // 3. Load Data Functions
    async function loadUsers() {
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_get_users.php', { credentials: 'include' });
            if (res.status === 403) {
                alert('권한이 만료되었습니다.');
                window.location.href = 'index.html';
                return;
            }
            const data = await res.json();
            if (data.status === 'success') {
                renderUsers(data.data);
            }
        } catch (error) {
            console.error('Failed to load users', error);
        }
    }

    async function loadLogs() {
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_get_logs.php', { credentials: 'include' });
            const data = await res.json();
            if (data.status === 'success') {
                renderLogs(data.data);
            }
        } catch (error) {
            console.error('Failed to load logs', error);
        }
    }

    function renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            
            const badgeClass = user.role === 'admin' ? 'badge-admin' : 'badge-member';
            const roleText = user.role === 'admin' ? '관리자' : '일반회원';
            
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td><span class="badge ${badgeClass}">${roleText}</span></td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                    <button class="admin-btn admin-btn-primary" onclick="toggleRole(${user.id}, '${user.role === 'admin' ? 'member' : 'admin'}')" ${currentUser.id == user.id ? 'disabled' : ''}>
                        권한변경
                    </button>
                    <button class="admin-btn admin-btn-danger" onclick="deleteUser(${user.id})" ${currentUser.id == user.id ? 'disabled' : ''}>
                        삭제
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderLogs(logs) {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = '';

        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            // Truncate text for display
            const myMsg = log.myMessage ? log.myMessage.substring(0, 30) + (log.myMessage.length > 30 ? '...' : '') : '-';
            const pray = log.pray ? log.pray.substring(0, 30) + (log.pray.length > 30 ? '...' : '') : '-';

            tr.innerHTML = `
                <td>${log.id}</td>
                <td>${log.timestamp}</td>
                <td>${log.name} (${log.username || '알수없음'})</td>
                <td>${log.daycnt}</td>
                <td>
                    <div style="font-size: 0.8rem; margin-bottom: 4px;"><strong>말씀:</strong> ${myMsg}</div>
                    <div style="font-size: 0.8rem;"><strong>기도:</strong> ${pray}</div>
                </td>
                <td>${new Date(log.created_at).toLocaleString()}</td>
                <td>
                    <button class="admin-btn admin-btn-danger" onclick="deleteLog(${log.id})">
                        삭제
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function loadPlans() {
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_get_all_plans.php', { credentials: 'include' });
            const data = await res.json();
            if (data.status === 'success') {
                renderPlans(data.data);
            }
        } catch (error) {
            console.error('Failed to load plans', error);
        }
    }

    function renderPlans(plans) {
        const tbody = document.getElementById('plansTableBody');
        tbody.innerHTML = '';

        plans.forEach(plan => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${plan.id}</td>
                <td>${plan.date}</td>
                <td>${plan.book}</td>
                <td>${plan.start}</td>
                <td>${plan.end}</td>
                <td>
                    <button class="admin-btn admin-btn-primary" onclick="editPlan(${plan.id}, '${plan.date}', ${plan.book}, ${plan.start}, ${plan.end})">
                        수정
                    </button>
                    <button class="admin-btn admin-btn-danger" onclick="deletePlan(${plan.id})">
                        삭제
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Initialize with users
    loadUsers();

    // Make functions globally available for inline onclick attributes
    window.toggleRole = async (userId, newRole) => {
        if (!confirm(`해당 사용자의 권한을 '${newRole}'(으)로 변경하시겠습니까?`)) return;
        
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_update_role.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId, role: newRole })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('권한이 변경되었습니다.');
                loadUsers();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    window.deleteUser = async (userId) => {
        if (!confirm('정말 이 사용자를 삭제하시겠습니까? 해당 사용자의 모든 기록도 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.')) return;
        
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_delete_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('삭제되었습니다.');
                loadUsers();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    window.deleteLog = async (logId) => {
        if (!confirm('이 기록을 정말 삭제하시겠습니까?')) return;
        
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_delete_log.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ log_id: logId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('삭제되었습니다.');
                loadLogs();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Plan Management Functions
    window.openPlanModal = () => {
        document.getElementById('planModalTitle').textContent = '새 계획 추가';
        document.getElementById('planId').value = '';
        document.getElementById('planForm').reset();
        document.getElementById('planModal').style.display = 'flex';
    };

    window.closePlanModal = () => {
        document.getElementById('planModal').style.display = 'none';
    };

    window.editPlan = (id, date, book, start, end) => {
        document.getElementById('planModalTitle').textContent = '계획 수정';
        document.getElementById('planId').value = id;
        document.getElementById('planDate').value = date;
        document.getElementById('planBook').value = book;
        document.getElementById('planStart').value = start;
        document.getElementById('planEnd').value = end;
        document.getElementById('planModal').style.display = 'flex';
    };

    window.deletePlan = async (id) => {
        if (!confirm('이 계획을 정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(API_BASE_URL + 'api/admin_delete_plan.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan_id: id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                loadPlans();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    document.getElementById('planForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('planId').value;
        const date = document.getElementById('planDate').value;
        const book = document.getElementById('planBook').value;
        const start = document.getElementById('planStart').value;
        const end = document.getElementById('planEnd').value;

        try {
            const res = await fetch(API_BASE_URL + 'api/admin_save_plan.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id, date, book, start, end })
            });
            const data = await res.json();
            if (data.status === 'success') {
                closePlanModal();
                loadPlans();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    });
});
