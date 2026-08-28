/**
 * js/admin/plans.js
 * 성경 읽기 계획 관리 관련 기능
 */

let allPlans = [];
// 현재 정렬 상태를 저장하는 객체 (기본값: 일차 오름차순)
let currentSort = { column: 'daycount', order: 'asc' };

/** 서버에서 모든 성경 읽기 계획을 불러옵니다. */
async function loadPlans() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_all_plans.php', { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') {
            allPlans = data.data;
            applySort(); // 데이터를 불러온 후 현재 설정된 정렬 기준 적용
        }
    } catch (error) {
        console.error('Failed to load plans', error);
    }
}

/** 현재 설정된 정렬 기준(currentSort)에 따라 allPlans 배열을 정렬하고 화면에 다시 렌더링합니다. */
function applySort() {
    allPlans.sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];

        // 숫자형 데이터인 경우 숫자로 변환하여 비교 (정상적인 정렬을 위해)
        if (['daycount', 'book', 'start', 'end', 'id'].includes(currentSort.column)) {
            valA = Number(valA || 0);
            valB = Number(valB || 0);
        }

        if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });
    renderPlans(allPlans);
}

/** 
 * 테이블 헤더 클릭 시 호출되어 정렬 기준을 변경합니다.
 * @param {string} column - 정렬할 컬럼명
 */
window.sortPlans = (column) => {
    if (currentSort.column === column) {
        // 같은 컬럼을 다시 클릭하면 정렬 순서(오름차순/내림차순) 토글
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        // 새로운 컬럼을 클릭하면 해당 컬럼의 오름차순으로 설정
        currentSort.column = column;
        currentSort.order = 'asc';
    }
    applySort();
};

/** 정렬된 계획 데이터를 테이블에 렌더링합니다. */
function renderPlans(plans) {
    const tbody = document.getElementById('plansTableBody');
    tbody.innerHTML = '';

    plans.forEach(plan => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${plan.daycount || ''}</td>
            <td>${plan.date}</td>
            <td>${typeof BIBLE_BOOKS !== 'undefined' && BIBLE_BOOKS[plan.book] ? BIBLE_BOOKS[plan.book] + ' (' + plan.book + ')' : plan.book}</td>
            <td>${plan.start}</td>
            <td>${plan.end}</td>
            <td>
                <button class="admin-btn admin-btn-primary" onclick="editPlan(${plan.id || 0}, '${plan.date || ''}', '${plan.book || ''}', ${plan.start || 0}, ${plan.end || 0}, ${plan.daycount || 0})">
                    수정
                </button>
                <button class="admin-btn admin-btn-danger" onclick="deletePlan(${plan.id || 0})">
                    삭제
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/** 새 계획 추가를 위해 모달을 초기화하고 엽니다. */
window.openPlanModal = () => {
    document.getElementById('planModalTitle').textContent = '새 계획 추가';
    document.getElementById('planId').value = '';
    document.getElementById('planForm').reset();
    document.getElementById('planModal').style.display = 'flex';
};

/** 계획 모달을 닫습니다. */
window.closePlanModal = () => {
    document.getElementById('planModal').style.display = 'none';
};

/** 
 * 기존 계획 수정을 위해 모달에 데이터를 채우고 엽니다.
 */
window.editPlan = (id, date, book, start, end, daycount) => {
    document.getElementById('planModalTitle').textContent = '계획 수정';
    document.getElementById('planId').value = id;
    document.getElementById('planDaycount').value = daycount;
    document.getElementById('planDate').value = date;
    document.getElementById('planBook').value = book;
    document.getElementById('planStart').value = start;
    document.getElementById('planEnd').value = end;
    document.getElementById('planModal').style.display = 'flex';
};

/** 
 * 특정 계획을 삭제합니다.
 * @param {number} id - 삭제할 계획 ID
 */
window.deletePlan = async (id) => {
    if (!confirm('이 계획을 정말 삭제하시겠습니까?')) return;
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/delete_plan.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ plan_id: id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            loadPlans(); // 삭제 후 리스트 갱신
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
};

/** 계획 폼(추가/수정) 제출 이벤트 핸들러 */
document.addEventListener('DOMContentLoaded', () => {
    const planForm = document.getElementById('planForm');
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // 폼 데이터 수집
            const id = document.getElementById('planId').value;
            const daycount = document.getElementById('planDaycount').value;
            const date = document.getElementById('planDate').value;
            const book = document.getElementById('planBook').value;
            const start = document.getElementById('planStart').value;
            const end = document.getElementById('planEnd').value;

            try {
                // 저장 API 호출 (id가 있으면 UPDATE, 없으면 INSERT)
                const res = await fetch(API_BASE_URL + 'api/admin/save_plan.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id, daycount, date, book, start, end })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    closePlanModal();
                    loadPlans(); // 저장 완료 후 리스트 갱신
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
});
