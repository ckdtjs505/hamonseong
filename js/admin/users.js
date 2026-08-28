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

        // 반(Class) 정보: 미지정인 경우 '-' 표시
        const classGroup = user.class_group || '-';
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <!-- 반(Class) 열: 현재 반 이름 + [수정] 버튼 -->
            <td>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span id="class-text-${user.id}">${classGroup}</span>
                    <button class="admin-btn" style="padding: 2px 5px; font-size: 0.8rem;" onclick="promptEditClass(${user.id}, '${user.class_group || ''}')">수정</button>
                </div>
            </td>
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
 * 반 정보를 수정하는 프롬프트를 띄우고 API를 호출합니다.
 * 사용자 관리 테이블의 [수정] 버튼 클릭 시 호출됩니다.
 * 
 * @param {number} userId - 수정 대상 사용자 ID
 * @param {string} currentClass - 현재 설정된 반 이름 (예: '1반', '2반' 또는 빈 문자열)
 */
window.promptEditClass = async (userId, currentClass) => {
    // prompt() 대화상자로 새 반 이름 입력받기 (취소 시 null 반환)
    const newClass = prompt('새로운 반 이름을 입력하세요 (예: 1반, 2반). 지우려면 비워두세요.', currentClass);
    if (newClass === null) return; // 취소 버튼 클릭 시 아무 동작 안 함

    try {
        // update_user_class.php API를 호출하여 서버에 반 정보 저장
        const res = await fetch(API_BASE_URL + 'api/admin/update_user_class.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: userId, class_group: newClass.trim() })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert('반 정보가 수정되었습니다.');
            loadUsers(); // 목록 갱신
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
};

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
