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
 * 반 수정 모달을 열어 사용자의 반 정보를 수정합니다.
 * 사용자 관리 테이블의 [수정] 버튼 클릭 시 호출됩니다.
 *
 * 기능:
 *  - 프리셋 버튼(1반~6반)으로 빠르게 선택
 *  - 직접 입력 필드로 커스텀 반 이름 지정
 *  - "미지정으로 초기화" 버튼으로 반 정보 삭제
 *
 * @param {number} userId - 수정 대상 사용자 ID
 * @param {string} currentClass - 현재 설정된 반 이름 (예: '1반', '2반' 또는 빈 문자열)
 */
window.promptEditClass = (userId, currentClass) => {
    // 기존 모달이 열려있으면 닫기
    const existing = document.querySelector('.class-edit-overlay');
    if (existing) existing.remove();

    // 프리셋 반 목록 (중학교/고등학교 학년-반 구조)
    const presets = [
        '중1-1', '중1-2', '중1-3',
        '중2-1', '중2-2',
        '중3-1', '중3-2',
        '고1-1', '고1-2', '고1-3',
        '고2-1', '고2-2',
        '고3-1'
    ];

    // 모달 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'class-edit-overlay';

    // 모달 본체 HTML 구성
    overlay.innerHTML = `
        <div class="class-edit-modal">
            <h3>📋 반 지정</h3>
            <p class="modal-subtitle">아래에서 반을 선택하거나 직접 입력하세요.</p>

            <!-- 프리셋 반 선택 버튼 그리드 -->
            <div class="preset-grid">
                ${presets.map(p => `
                    <button class="preset-btn ${currentClass === p ? 'selected' : ''}" data-value="${p}">
                        ${p}
                    </button>
                `).join('')}
            </div>

            <!-- 구분선 -->
            <div class="divider">또는 직접 입력</div>

            <!-- 커스텀 반 이름 입력 필드 -->
            <input type="text"
                   class="custom-input"
                   id="classCustomInput"
                   placeholder="예: 교사, 특별반..."
                   value="${!presets.includes(currentClass) ? currentClass : ''}">

            <!-- 하단 액션 버튼 -->
            <div class="modal-actions">
                <button class="btn-clear" id="classBtnClear">미지정으로 초기화</button>
                <button class="btn-cancel" id="classBtnCancel">취소</button>
                <button class="btn-save" id="classBtnSave">저장</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // ===== 이벤트 바인딩 =====
    let selectedValue = currentClass;

    // 프리셋 버튼 클릭 이벤트: 선택 시 해당 버튼 활성화 + 입력 필드 비우기
    overlay.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedValue = btn.dataset.value;
            document.getElementById('classCustomInput').value = '';
        });
    });

    // 직접 입력 필드 입력 이벤트: 입력 시 프리셋 버튼 선택 해제
    const customInput = document.getElementById('classCustomInput');
    customInput.addEventListener('input', () => {
        overlay.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
        selectedValue = customInput.value.trim();
    });

    // Enter 키로 저장
    customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('classBtnSave').click();
    });

    // 취소 버튼: 모달 닫기
    document.getElementById('classBtnCancel').addEventListener('click', () => overlay.remove());

    // 오버레이(배경) 클릭 시 모달 닫기
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // ESC 키로 모달 닫기
    const escHandler = (e) => {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    // "미지정으로 초기화" 버튼: 반 정보를 빈 문자열로 설정 후 저장
    document.getElementById('classBtnClear').addEventListener('click', async () => {
        await saveUserClass(userId, '', overlay);
    });

    // 저장 버튼: 선택된 값 또는 직접 입력된 값으로 저장
    document.getElementById('classBtnSave').addEventListener('click', async () => {
        const finalValue = customInput.value.trim() || selectedValue;
        await saveUserClass(userId, finalValue, overlay);
    });
};

/**
 * 서버에 반 정보를 저장하는 함수 (update_user_class.php API 호출)
 * @param {number} userId - 대상 사용자 ID
 * @param {string} classGroup - 저장할 반 이름 (빈 문자열이면 NULL로 저장됨)
 * @param {HTMLElement} overlay - 저장 완료 후 제거할 모달 오버레이 요소
 */
async function saveUserClass(userId, classGroup, overlay) {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/update_user_class.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: userId, class_group: classGroup })
        });
        const data = await res.json();
        if (data.status === 'success') {
            overlay.remove(); // 모달 닫기
            loadUsers();      // 사용자 목록 갱신
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
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
