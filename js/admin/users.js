/**
 * js/admin/users.js
 * 사용자 관리 관련 기능
 */

/**
 * 서버에서 전체 사용자 목록을 불러옵니다.
 */
async function loadUsers() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_users.php', { credentials: 'include' });
        
        // 권한 만료/없음 처리
        if (res.status === 403) {
            alert('권한이 만료되었습니다.');
            window.location.href = '../index.html';
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

/**
 * 불러온 사용자 데이터를 테이블에 렌더링합니다.
 * @param {Array} users - 사용자 객체 배열
 */
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        // 역할(Role)에 따른 뱃지 스타일과 텍스트 설정
        const badgeClass = user.role === 'admin' ? 'badge-admin' : 'badge-member';
        const roleText = user.role === 'admin' ? '관리자' : '일반회원';
        
        // 현재 로그인한 본인 계정인 경우 권한변경 및 삭제 버튼 비활성화 처리
        const isSelf = window.currentUser && window.currentUser.id == user.id;
        const disabledAttr = isSelf ? 'disabled' : '';

        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td><span class="badge ${badgeClass}">${roleText}</span></td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
            <td>
                <button class="admin-btn admin-btn-primary" onclick="toggleRole(${user.id}, '${user.role === 'admin' ? 'member' : 'admin'}')" ${disabledAttr}>
                    권한변경
                </button>
                <button class="admin-btn admin-btn-danger" onclick="deleteUser(${user.id})" ${disabledAttr}>
                    삭제
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 사용자의 권한을 변경합니다 (일반회원 <-> 관리자)
 * @param {number} userId - 대상 사용자 ID
 * @param {string} newRole - 변경할 권한 ('member' 또는 'admin')
 */
window.toggleRole = async (userId, newRole) => {
    if (!confirm(`해당 사용자의 권한을 '${newRole}'(으)로 변경하시겠습니까?`)) return;
    
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/update_role.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId, role: newRole })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            alert('권한이 변경되었습니다.');
            loadUsers(); // 목록 갱신
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
};

/**
 * 사용자를 삭제합니다. (관련 로그도 백엔드에서 함께 삭제됨)
 * @param {number} userId - 삭제할 사용자 ID
 */
window.deleteUser = async (userId) => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까? 해당 사용자의 모든 기록도 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/delete_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            alert('삭제되었습니다.');
            loadUsers(); // 목록 갱신
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
};
