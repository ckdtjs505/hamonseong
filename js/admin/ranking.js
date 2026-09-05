/**
 * js/admin/ranking.js
 * 열정 랭킹 탭 관리
 */

async function loadRanking() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_progress.php', { credentials: 'include' });
        const json = await res.json();

        if (json.status === 'success') {
            const { users, logs } = json.data;
            renderRanking(users, logs);
        } else {
            console.error('Failed to load ranking:', json.message);
            alert('랭킹 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('Error loading ranking:', error);
        alert('랭킹 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

function renderRanking(users, logs) {
    const members = users.filter(u => u.role === 'member');
    const memberIds = new Set(members.map(m => m.id));
    const memberLogs = logs.filter(log => memberIds.has(log.user_id));

    const userLogCounts = {};
    memberLogs.forEach(log => {
        if (!userLogCounts[log.user_id]) {
            userLogCounts[log.user_id] = { count: 0, lastActivity: log.timestamp };
        }
        userLogCounts[log.user_id].count++;
        // 가장 최근 날짜 유지 (Date 객체로 비교)
        const currentLast = new Date(userLogCounts[log.user_id].lastActivity.replace(/\./g, '-'));
        const newDate = new Date(log.timestamp.replace(/\./g, '-'));
        if (newDate > currentLast) {
            userLogCounts[log.user_id].lastActivity = log.timestamp;
        }
    });

    const rankingArray = [];
    Object.keys(userLogCounts).forEach(userId => {
        const user = members.find(u => u.id == userId);
        if (user) {
            rankingArray.push({
                name: user.name,
                classGroup: user.class_group || '미지정',
                count: userLogCounts[userId].count,
                lastActivity: userLogCounts[userId].lastActivity
            });
        }
    });

    // 횟수 내림차순, 같으면 최근 날짜 내림차순 정렬
    rankingArray.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const dateA = new Date(a.lastActivity.replace(/\./g, '-'));
        const dateB = new Date(b.lastActivity.replace(/\./g, '-'));
        return dateB - dateA;
    });

    const rankingBody = document.getElementById('rankingBody');
    if (rankingBody) {
        rankingBody.innerHTML = '';
        rankingArray.forEach((r, idx) => {
            const tr = document.createElement('tr');
            const rankBadge = idx < 3 ? `<span style="background:var(--accent-primary); color:white; padding:2px 8px; border-radius:12px; font-weight:bold;">${idx + 1}</span>` : `${idx + 1}`;
            tr.innerHTML = `
                <td>${rankBadge}</td>
                <td><strong>${r.name}</strong></td>
                <td>${r.classGroup}</td>
                <td>${r.count}회</td>
                <td>${r.lastActivity}</td>
            `;
            rankingBody.appendChild(tr);
        });

        if (rankingArray.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">랭킹 데이터가 없습니다.</td></tr>';
        }
    }
}
