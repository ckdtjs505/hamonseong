/**
 * js/admin/home.js
 * 대시보드 홈 탭 관리 및 통계 표시
 */

async function loadHomeStats() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_progress.php', { credentials: 'include' });
        const json = await res.json();

        if (json.status === 'success') {
            const { users, logs, plans } = json.data;
            renderHomeStats(users, logs, plans);
        } else {
            console.error('Failed to load stats:', json.message);
            alert('통계 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('Error loading home stats:', error);
        alert('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

function renderHomeStats(users, logs, plans) {
    // 학생(member)만 통계에 포함하기 위해 필터링
    const members = users.filter(u => u.role === 'member');
    
    // 1. 기본 통계 계산 (학생 기준)
    const totalUsers = members.length;
    
    // 고유 반 목록 추출 (학생 기준)
    const classes = new Set();
    members.forEach(u => {
        if (u.class_group) classes.add(u.class_group);
    });
    const totalClasses = classes.size;

    // 제출 기록은 학생(member)이 제출한 것만 카운트
    const memberIds = new Set(members.map(m => m.id));
    const memberLogs = logs.filter(log => memberIds.has(log.user_id));
    const totalLogs = memberLogs.length;

    const avgLogsPerUser = totalUsers > 0 ? (totalLogs / totalUsers).toFixed(1) : 0;

    // 요약 카드 렌더링
    const statsContainer = document.getElementById('homeStatsContainer');
    statsContainer.innerHTML = `
        <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">총 소속 인원</div>
            <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">${totalUsers}명</div>
        </div>
        <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">운영 반 수</div>
            <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">${totalClasses}개</div>
        </div>
        <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">전체 제출 기록</div>
            <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">${totalLogs}건</div>
        </div>
        <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">1인당 평균 기록</div>
            <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">${avgLogsPerUser}건</div>
        </div>
    `;

    // 오늘의 계획 일차 찾기
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDaycount = 0;
    
    plans.forEach(p => {
        if (p.date) {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            if (pDate <= today) {
                currentDaycount = p.daycount;
            }
        }
    });

    // 테이블 헤더 업데이트 (오늘의 진행률)
    const dailyTh = document.getElementById('homeDailyProgressTh');
    if (dailyTh) {
        dailyTh.innerHTML = currentDaycount > 0 ? `오늘의 진행률 (Day ${currentDaycount})` : '오늘의 진행률';
    }

    // 2. 반별 요약 계산 (학생 기준)
    const classStats = {};
    members.forEach(u => {
        const c = u.class_group || '미지정';
        if (!classStats[c]) {
            classStats[c] = { members: 0, logs: 0, dailyLogs: new Set() };
        }
        classStats[c].members++;
    });

    // 학생이 제출한 기록만 반별 통계에 반영
    memberLogs.forEach(log => {
        const user = members.find(u => u.id == log.user_id);
        if (user) {
            const c = user.class_group || '미지정';
            if (classStats[c]) {
                classStats[c].logs++;
                if (parseInt(log.daycnt) === parseInt(currentDaycount)) {
                    classStats[c].dailyLogs.add(log.user_id);
                }
            }
        }
    });

    // 반 이름으로 정렬
    const sortedClasses = Object.keys(classStats).sort((a, b) => {
        if (a === '미지정') return 1;
        if (b === '미지정') return -1;
        return a.localeCompare(b);
    });

    const classTableBody = document.getElementById('homeClassTableBody');
    classTableBody.innerHTML = '';
    
    // 전체 읽기 일정 수
    const totalDays = plans.length;

    sortedClasses.forEach(c => {
        const stats = classStats[c];
        const totalTarget = stats.members * totalDays;
        const remaining = totalTarget - stats.logs;
        const progressPercent = totalTarget > 0 ? Math.round((stats.logs / totalTarget) * 100) : 0;
        
        // 일일 진행률 계산
        const dailyProgressPercent = stats.members > 0 ? Math.round((stats.dailyLogs.size / stats.members) * 100) : 0;
        
        // 일일 프로그레스 바 HTML (파란색 계열)
        const dailyProgressBarHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; min-width: 150px;">
                <div style="width: 100%; background-color: var(--border-color); border-radius: 8px; height: 12px; overflow: hidden; position: relative;">
                    <div style="background-color: #3b82f6; width: ${dailyProgressPercent}%; height: 100%; transition: width 0.3s ease;"></div>
                </div>
                <div style="font-size: 0.85rem; margin-top: 4px; color: var(--text-muted); width: 100%; text-align: center;">
                    <strong>${dailyProgressPercent}%</strong> (${stats.dailyLogs.size} / ${stats.members}명)
                </div>
            </div>
        `;

        // 전체(누적) 프로그레스 바 HTML (초록색 계열)
        const overallProgressBarHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; min-width: 150px;">
                <div style="width: 100%; background-color: var(--border-color); border-radius: 8px; height: 12px; overflow: hidden; position: relative;">
                    <div style="background-color: var(--accent-primary, #4ade80); width: ${progressPercent}%; height: 100%; transition: width 0.3s ease;"></div>
                </div>
                <div style="font-size: 0.85rem; margin-top: 4px; color: var(--text-muted); width: 100%; text-align: center;">
                    <strong>${progressPercent}%</strong> (${stats.logs} / ${totalTarget}건)
                </div>
            </div>
        `;
        
        const remainingHtml = remaining > 0 
            ? `<span style="color: #ef4444; font-weight: 600;">${remaining}건 남음</span>` 
            : `<span style="color: var(--accent-primary); font-weight: 600;">완료! 🎉</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c}</strong></td>
            <td>${stats.members}명</td>
            <td>${dailyProgressBarHtml}</td>
            <td>${overallProgressBarHtml}</td>
            <td>${remainingHtml}</td>
        `;
        classTableBody.appendChild(tr);
    });

    if (sortedClasses.length === 0) {
        classTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1rem;">반 정보가 없습니다.</td></tr>';
    }

    // 3. 최근 활동 내역 (학생 제출 기록만 대상)
    // 최신 기록이 뒤에 오므로 reverse
    const recentLogs = [...memberLogs].reverse().slice(0, 5);
    const recentActivityBody = document.getElementById('homeRecentActivityBody');
    recentActivityBody.innerHTML = '';

    recentLogs.forEach(log => {
        const user = members.find(u => u.id == log.user_id);
        const name = user ? user.name : '알 수 없음';
        const classGroup = user && user.class_group ? user.class_group : '미지정';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${name}</td>
            <td>${classGroup}</td>
            <td>Day ${log.daycnt}</td>
            <td>${log.timestamp}</td>
        `;
        recentActivityBody.appendChild(tr);
    });

    if (recentLogs.length === 0) {
        recentActivityBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1rem;">최근 활동 내역이 없습니다.</td></tr>';
    }


}
