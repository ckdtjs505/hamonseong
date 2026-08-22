/**
 * js/admin/plans.js
 * 성경 읽기 계획 관리 관련 기능
 */

let allPlans = [];
let currentSort = { column: 'date', order: 'desc' };

async function loadPlans() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_all_plans.php', { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') {
            allPlans = data.data;
            applySort();
        }
    } catch (error) {
        console.error('Failed to load plans', error);
    }
}

function applySort() {
    allPlans.sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];

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

window.sortPlans = (column) => {
    if (currentSort.column === column) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.order = 'asc';
    }
    applySort();
};

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

window.openPlanModal = () => {
    document.getElementById('planModalTitle').textContent = '새 계획 추가';
    document.getElementById('planId').value = '';
    document.getElementById('planForm').reset();
    document.getElementById('planModal').style.display = 'flex';
};

window.closePlanModal = () => {
    document.getElementById('planModal').style.display = 'none';
};

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
            loadPlans();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const planForm = document.getElementById('planForm');
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('planId').value;
            const daycount = document.getElementById('planDaycount').value;
            const date = document.getElementById('planDate').value;
            const book = document.getElementById('planBook').value;
            const start = document.getElementById('planStart').value;
            const end = document.getElementById('planEnd').value;

            try {
                const res = await fetch(API_BASE_URL + 'api/admin/save_plan.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id, daycount, date, book, start, end })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    closePlanModal();
                    loadPlans();
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
});
