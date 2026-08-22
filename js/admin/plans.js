/**
 * js/admin/plans.js
 * 성경 읽기 계획 관리 관련 기능
 */

async function loadPlans() {
    try {
        const res = await fetch(API_BASE_URL + 'api/admin/get_all_plans.php', { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') {
            renderPlans(data.data);
        }
    } catch (error) {
        console.error('Failed to load plans', error);
    }
}

function renderPlans(plans) {
    const tbody = document.getElementById('plansTableBody');
    tbody.innerHTML = '';

    plans.forEach(plan => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${plan.id}</td>
            <td>${plan.date}</td>
            <td>${plan.book}</td>
            <td>${plan.start}</td>
            <td>${plan.end}</td>
            <td>
                <button class="admin-btn admin-btn-primary" onclick="editPlan(${plan.id}, '${plan.date}', ${plan.book}, ${plan.start}, ${plan.end})">
                    수정
                </button>
                <button class="admin-btn admin-btn-danger" onclick="deletePlan(${plan.id})">
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

window.editPlan = (id, date, book, start, end) => {
    document.getElementById('planModalTitle').textContent = '계획 수정';
    document.getElementById('planId').value = id;
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
            const date = document.getElementById('planDate').value;
            const book = document.getElementById('planBook').value;
            const start = document.getElementById('planStart').value;
            const end = document.getElementById('planEnd').value;

            try {
                const res = await fetch(API_BASE_URL + 'api/admin/save_plan.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id, date, book, start, end })
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
