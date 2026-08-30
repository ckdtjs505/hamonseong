/**
 * js/admin/logs.js
 * 함온성 기록 관리 관련 기능
 */

/**
 * 서버에서 모든 함온성(말씀 완독) 기록을 불러옵니다.
 */
async function loadLogs() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_logs.php', { credentials: 'include' });
        const data = await res.json();
        
        if (data.status === 'success') {
            renderLogs(data.data);
        }
    } catch (error) {
        console.error('Failed to load logs', error);
    }
}

/**
 * 불러온 로그 데이터를 테이블에 렌더링합니다.
 * @param {Array} logs - 로그 객체 배열
 */
function renderLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '';

    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        // 테이블 레이아웃 유지를 위해 긴 텍스트(말씀, 기도)는 30자로 자르고 말줄임표(...) 처리
        const myMsg = log.myMessage ? log.myMessage.substring(0, 30) + (log.myMessage.length > 30 ? '...' : '') : '-';
        const pray = log.pray ? log.pray.substring(0, 30) + (log.pray.length > 30 ? '...' : '') : '-';

        const fullMyMsg = escapeHtml(log.myMessage || '-');
        const fullPray = escapeHtml(log.pray || '-');
        
        tr.innerHTML = `
            <td>${log.id}</td>
            <td>${log.timestamp}</td>
            <td>${log.name} (${log.username || '알수없음'})</td>
            <td>${log.daycnt}</td>
            <td>
                <div style="font-size: 0.8rem; margin-bottom: 4px; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                    <strong>말씀:</strong> ${myMsg}
                  </span>
                </div>
                <div style="font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                    <strong>기도:</strong> ${pray}
                  </span>
                  <button class="admin-btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: var(--bg-primary); border: 1px solid var(--border-color);" onclick="openLogDetailModal(\`${fullMyMsg}\`, \`${fullPray}\`)">자세히</button>
                </div>
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

/**
 * 특정 함온성 기록을 삭제합니다.
 * @param {number} logId - 삭제할 기록 ID
 */
window.deleteLog = async (logId) => {
    if (!confirm('이 기록을 정말 삭제하시겠습니까?')) return;
    
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/delete_log.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ log_id: logId })
        });
        const data = await res.json();
        
        if (res.ok) {
            alert('삭제되었습니다.');
            loadLogs();
        } else {
            alert(data.message || '삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Delete log error', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
};

/**
 * 로그 상세 모달 열기
 */
window.openLogDetailModal = function(myMsg, pray) {
    document.getElementById('logDetailMsg').textContent = myMsg;
    document.getElementById('logDetailPray').textContent = pray;
    document.getElementById('logDetailModal').style.display = 'flex';
};

/**
 * 로그 상세 모달 닫기
 */
window.closeLogDetailModal = function() {
    document.getElementById('logDetailModal').style.display = 'none';
};
