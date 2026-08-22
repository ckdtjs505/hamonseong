/**
 * js/admin/users.js
 * 사용자 관리 관련 기능
 */

async function loadUsers() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_users.php', { credentials: 'include' });
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
                <button class="admin-btn admin-btn-primary" onclick="toggleRole(${user.id}, '${user.role === 'admin' ? 'member' : 'admin'}')" ${window.currentUser && window.currentUser.id == user.id ? 'disabled' : ''}>
                    권한변경
                </button>
                <button class="admin-btn admin-btn-danger" onclick="deleteUser(${user.id})" ${window.currentUser && window.currentUser.id == user.id ? 'disabled' : ''}>
                    삭제
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

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
        const res = await fetch(API_BASE_URL + 'api/admin/delete_user.php', {
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
