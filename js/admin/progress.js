/**
 * js/admin/progress.js
 * 반별 진행사항 관리 기능
 *
 * 함온성 읽기 계획(read_plan)의 전체 일정을 열(Column)로,
 * 각 학생을 행(Row)으로 배치하여 날짜별 완료 여부를 O/X로 표시하는
 * 진행사항 테이블을 렌더링합니다.
 *
 * 주요 기능:
 * - 반별 필터 버튼 (전체 / 미지정 / 1반, 2반 등)
 * - 이름 검색을 통한 실시간 필터링
 * - 과거 시즌(기간 외) 기록 자동 제외
 */

/**
 * 서버에서 받아온 진행사항 데이터를 보관하는 전역 변수
 * - users: 사용자 목록 (id, name, username, class_group)
 * - logs:  함온성 기록 목록 (user_id, timestamp, daycnt)
 * - plans: 읽기 계획 목록 (id, daycount, date, book, start, end)
 */
let progressData = {
    users: [],
    logs: [],
    plans: []
};

/** 현재 선택된 반 필터 ('all' = 전체, 'none' = 미지정, '1반' 등) */
let currentClassFilter = 'all';

/**
 * 서버에서 반별 진행사항 데이터를 불러오고 화면을 갱신합니다.
 * GET api/admin/get_progress.php 호출
 */
async function loadProgress() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_progress.php', { credentials: 'include' });

        // 권한 없음(403) 처리
        if (res.status === 403) {
            return;
        }

        const data = await res.json();
        if (data.status === 'success') {
            progressData = data.data;
            renderClassFilters();   // 반 필터 버튼 렌더링
            renderProgressTable();  // 진행사항 O/X 테이블 렌더링
        }
    } catch (error) {
        console.error('Failed to load progress', error);
    }
}

/**
 * 함온성 기록의 타임스탬프 문자열을 Date 객체로 변환합니다.
 * @param {string} str - "2026. 1. 5" 형식의 날짜 문자열
 * @returns {Date} 파싱된 Date 객체
 */
function parseDateStr(str) {
    const parts = str.split('.').map(p => p.trim());
    if (parts.length >= 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(0);
}

/**
 * 반별 필터 버튼을 동적으로 생성하여 렌더링합니다.
 * 사용자 데이터에서 고유한 반(class_group) 목록을 추출하고,
 * "전체", "미지정", 각 반별 버튼을 생성합니다.
 */
function renderClassFilters() {
    const container = document.getElementById('classFilterContainer');
    container.innerHTML = '';

    // 사용자 데이터에서 고유한 반 이름 추출
    const classes = new Set();
    progressData.users.forEach(u => {
        if (u.class_group) classes.add(u.class_group);
    });

    const classArray = Array.from(classes).sort();

    // "전체" 버튼 생성 (모든 반 표시)
    const btnAll = document.createElement('button');
    btnAll.className = `admin-btn ${currentClassFilter === 'all' ? 'admin-btn-primary' : ''}`;
    btnAll.style.backgroundColor = currentClassFilter === 'all' ? '' : 'var(--bg-subtle)';
    btnAll.textContent = '전체';
    btnAll.onclick = () => { currentClassFilter = 'all'; renderProgressTable(); renderClassFilters(); };
    container.appendChild(btnAll);

    // "미지정" 버튼 생성 (반이 아직 지정되지 않은 사용자 표시)
    const hasUnassigned = progressData.users.some(u => !u.class_group);
    if (hasUnassigned) {
        const btnUnassigned = document.createElement('button');
        btnUnassigned.className = `admin-btn ${currentClassFilter === 'none' ? 'admin-btn-primary' : ''}`;
        btnUnassigned.style.backgroundColor = currentClassFilter === 'none' ? '' : 'var(--bg-subtle)';
        btnUnassigned.textContent = '미지정';
        btnUnassigned.onclick = () => { currentClassFilter = 'none'; renderProgressTable(); renderClassFilters(); };
        container.appendChild(btnUnassigned);
    }

    // 각 반(1반, 2반 등)별 필터 버튼 생성
    classArray.forEach(cls => {
        const btn = document.createElement('button');
        btn.className = `admin-btn ${currentClassFilter === cls ? 'admin-btn-primary' : ''}`;
        btn.style.backgroundColor = currentClassFilter === cls ? '' : 'var(--bg-subtle)';
        btn.textContent = cls;
        btn.onclick = () => { currentClassFilter = cls; renderProgressTable(); renderClassFilters(); };
        container.appendChild(btn);
    });
}

/**
 * 진행사항 O/X 테이블을 렌더링합니다.
 *
 * 열(Column): 읽기 계획(read_plan)의 각 일차(Day)
 *   - 헤더에 "Day N"과 날짜(M/D)를 표시
 *   - 마우스 호버(hover) 시 해당 일차의 성경 범위(book, start~end장)를 툴팁으로 표시
 *
 * 행(Row): 각 학생
 *   - 이름과 반 정보를 좌측에 고정(sticky)하여 가로 스크롤 시에도 보이도록 처리
 *   - 해당 일차에 함온성 기록이 있으면 O(초록색), 없으면 X(회색) 표시
 */
function renderProgressTable() {
    // 이름 검색 필터 값 가져오기
    const searchInput = document.getElementById('progressSearchInput').value.toLowerCase().trim();

    // 반 필터 + 이름 검색 조건으로 사용자 필터링
    let filteredUsers = progressData.users.filter(u => {
        // 반(class) 필터 적용
        if (currentClassFilter === 'none' && u.class_group) return false;
        if (currentClassFilter !== 'all' && currentClassFilter !== 'none' && u.class_group !== currentClassFilter) return false;

        // 이름 검색 필터 적용
        if (searchInput && !u.name.toLowerCase().includes(searchInput)) return false;

        return true;
    });

    // 읽기 계획 데이터를 일차(daycount) 기준으로 오름차순 정렬
    const plans = progressData.plans || [];
    plans.sort((a, b) => a.daycount - b.daycount);

    // ===== 테이블 헤더(thead) 렌더링 =====
    // 각 계획(Day)의 날짜를 "M/D" 형식으로 축약하여 표시
    const nameColStyleTh = "position: sticky; left: 0; width: 80px; min-width: 80px; max-width: 80px; box-sizing: border-box; background-color: var(--bg-card); z-index: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";

    const thead = document.getElementById('progressTableHead');
    let headHtml = `<tr>
        <th style="${nameColStyleTh}">이름</th>`;

    plans.forEach(plan => {
        // 날짜를 "월/일" 축약 형식으로 변환 (예: "2026-09-07" → "9/7")
        let shortDate = plan.date;
        if (shortDate) {
            const dateObj = new Date(shortDate);
            shortDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        } else {
            shortDate = `Day ${plan.daycount}`;
        }
        // 툴팁(title)에 날짜 + 성경 범위 표시 (예: "창세기 1~3장")
        headHtml += `<th title="${plan.date || ''}\n${plan.book} ${plan.start}~${plan.end}장">Day ${plan.daycount}<br><small style="color:var(--text-muted); font-weight:normal;">${shortDate}</small></th>`;
    });
    headHtml += `</tr>`;
    thead.innerHTML = headHtml;

    // ===== 테이블 바디(tbody) 렌더링 =====
    const tbody = document.getElementById('progressTableBody');
    tbody.innerHTML = '';

    // 필터 결과가 없을 때 안내 메시지 표시
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${plans.length + 1}" style="padding: 2rem; color: var(--text-muted);">검색 결과가 없습니다.</td></tr>`;
        return;
    }

    // 과거 시즌 기록 제외를 위해 읽기 계획의 최소 시작 날짜를 계산
    // (계획 시작일보다 7일 이상 전의 기록은 이전 시즌으로 간주하여 무시)
    let minPlanDate = new Date(8640000000000000); // 초기값: 가장 먼 미래 날짜
    plans.forEach(plan => {
        if (plan.date) {
            const d = new Date(plan.date);
            if (d < minPlanDate) minPlanDate = d;
        }
    });

    // 사용자별 완료한 일차(daycnt) 목록을 Map으로 구성
    // key: user_id, value: Map('day_1' -> log, 'date_2026. 9. 7' -> log)
    const userLogsMap = {};
    progressData.logs.forEach(log => {
        // 기록 날짜 파싱: "2026. 7. 29." 형식
        const logParts = log.timestamp.split('.');
        if (logParts.length >= 3) {
            const logDate = new Date(parseInt(logParts[0]), parseInt(logParts[1]) - 1, parseInt(logParts[2]));
            // 계획 시작일 기준 7일 전보다 오래된 기록은 이전 시즌 데이터이므로 제외
            const planStartThreshold = new Date(minPlanDate);
            planStartThreshold.setDate(planStartThreshold.getDate() - 7);

            if (logDate < planStartThreshold) {
                return; // 이전 시즌 기록 무시
            }
        }

        if (!userLogsMap[log.user_id]) userLogsMap[log.user_id] = new Map();
        // daycnt(일차) 값이 있으면 일차 기준으로 기록
        if (log.daycnt) {
            userLogsMap[log.user_id].set('day_' + log.daycnt, log);
        }
        // daycnt가 정확하지 않을 수 있으므로 (예: 프론트엔드에서 1로 하드코딩 등), 날짜(timestamp) 기준 기록도 항상 추가
        if (log.timestamp) {
            userLogsMap[log.user_id].set('date_' + log.timestamp, log);
        }
    });

    // 각 사용자별로 행(Row)을 생성하고, 각 계획 일차에 대해 O/X를 판정
    filteredUsers.forEach(user => {
        const tr = document.createElement('tr');

        const nameColStyleTd = "position: sticky; left: 0; width: 80px; min-width: 80px; max-width: 80px; box-sizing: border-box; background-color: var(--bg-card); font-weight: bold; z-index: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";

        // 이름 정보 셀 (좌측 고정: sticky)
        let rowHtml = `
            <td style="${nameColStyleTd}" title="${user.name}">${user.name}</td>
        `;

        // 해당 사용자의 완료 기록 Map
        const userCompletedMap = userLogsMap[user.id] || new Map();

        plans.forEach(plan => {
            // 1차 판정: daycnt(일차) 기준으로 완료 여부 확인
            let completedLog = userCompletedMap.get('day_' + plan.daycount);

            // 2차 판정 (폴백): daycnt가 없거나 0인 경우, 날짜(timestamp) 기준으로 매칭 시도
            // read_plan.date: "2026-09-07", hamonseong_logs.timestamp: "2026. 9. 7"
            if (!completedLog && plan.date) {
                const dateObj = new Date(plan.date);
                const possibleLogStr1 = `date_${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}`;
                completedLog = userCompletedMap.get(possibleLogStr1);
            }

            // O(완료, 초록색) 또는 X(미완료, 회색) 표시
            if (completedLog) {
                const encMyMsg = encodeURIComponent(completedLog.myMessage || '-');
                const encPray = encodeURIComponent(completedLog.pray || '-');
                const encPrayForUser = encodeURIComponent(completedLog.prayForUser || '-');
                rowHtml += `<td style="color: #4ade80; font-weight: bold; cursor: pointer; text-decoration: underline;" onclick="openLogDetailModal('${encMyMsg}', '${encPray}', '${encPrayForUser}')" title="클릭하여 내용 보기">O</td>`;
            } else {
                rowHtml += `<td style="color: var(--border-color);">X</td>`;
            }
        });

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
}

// 이름 검색창에 입력할 때마다 실시간으로 테이블을 다시 렌더링
document.getElementById('progressSearchInput').addEventListener('input', renderProgressTable);
