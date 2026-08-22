/**
 * js/admin/logs.js
 * 함온성 기록 관리 관련 기능
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
