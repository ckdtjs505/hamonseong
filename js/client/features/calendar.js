    // 달력 팝업 제어
    let calendarCurrentDate = new Date();
    let calendarSelectedDate = new Date();
    let completedDatesSet = new Set(); // ← 전역 변수로 선언
    let planDatesSet = new Set(); // ← 계획이 있는 날짜들

    // 연속 출석 여부를 판단하는 함수
    function isConsecutiveStrike(dateStr, completedDates) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const currentDate = new Date(year, month - 1, day);

      // 어제 또는 내일이 완료된 날짜인지 확인
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatCalendarDate(yesterday);

      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatCalendarDate(tomorrow);

      return completedDates.has(yesterdayStr) || completedDates.has(tomorrowStr);
    }

    function renderCustomCalendar() {
      const year = calendarCurrentDate.getFullYear();
      const month = calendarCurrentDate.getMonth();

      // 월년 업데이트
      const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
      const monthYearEl = document.getElementById('monthYear');
      if (monthYearEl) {
        monthYearEl.textContent = `${year}년 ${monthNames[month]}`;
      }

      // 첫째 날의 요일과 마지막 날
      const firstDay = new Date(year, month, 1).getDay();
      const lastDate = new Date(year, month + 1, 0).getDate();
      const lastDatePrevMonth = new Date(year, month, 0).getDate();

      const daysGrid = document.getElementById('daysGrid');
      if (!daysGrid) {
        return;
      }

      // completedDatesSet에서 완료 날짜 가져오기
      let allCompletedDates = new Set();
      if (typeof completedDatesSet !== 'undefined' && completedDatesSet) {
        completedDatesSet.forEach(date => allCompletedDates.add(date));
      }
      
      // planDatesSet에서 계획 있는 날짜 가져오기
      let allPlanDates = new Set();
      if (typeof planDatesSet !== 'undefined' && planDatesSet) {
        planDatesSet.forEach(date => allPlanDates.add(date));
      }

      const today = new Date();
      const currentMonthYearStr = `${year}-${month}`;
      const previousMonthYearStr = daysGrid.dataset.currentMonthYear;
      
      // 달이 바뀌지 않았다면 기존 DOM을 재사용하여 클래스만 업데이트 (깜빡임 방지 및 애니메이션 적용)
      if (previousMonthYearStr === currentMonthYearStr && daysGrid.children.length === 42) {
        let cellIndex = 0;
        
        // 이전 달
        for (let i = firstDay - 1; i >= 0; i--) {
          daysGrid.children[cellIndex++].className = 'day-cell other-month';
        }
        
        // 현재 달
        for (let day = 1; day <= lastDate; day++) {
          const dateObj = new Date(year, month, day);
          const dateStr = formatCalendarDate(dateObj);
          let classes = 'day-cell current-month';

          if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            classes += ' today';
          }
          if (year === calendarSelectedDate.getFullYear() && month === calendarSelectedDate.getMonth() && day === calendarSelectedDate.getDate()) {
            classes += ' selected';
          }
          if (allPlanDates.has(dateStr)) {
            classes += ' has-plan';
          }
          if (allCompletedDates.has(dateStr)) {
            classes += ' completed';
            if (isConsecutiveStrike(dateStr, allCompletedDates)) {
              classes += ' consecutive-strike';
            }
          }

          const cell = daysGrid.children[cellIndex++];
          if (cell.className !== classes) {
            cell.className = classes;
          }
        }
        
        // 다음 달
        for (let day = 1; cellIndex < 42; day++) {
          daysGrid.children[cellIndex++].className = 'day-cell other-month';
        }
        return;
      }

      // 달이 바뀌었거나 초기 렌더링인 경우 DOM 전체 다시 생성
      daysGrid.innerHTML = '';
      daysGrid.dataset.currentMonthYear = currentMonthYearStr;

      // 이전 달 날짜들
      for (let i = firstDay - 1; i >= 0; i--) {
        const day = lastDatePrevMonth - i;
        const cell = document.createElement('div');
        cell.className = 'day-cell other-month';
        cell.textContent = day;
        daysGrid.appendChild(cell);
      }

      // 현재 달 날짜들
      for (let day = 1; day <= lastDate; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = formatCalendarDate(dateObj);
        let classes = 'day-cell current-month';

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
          classes += ' today';
        }
        if (year === calendarSelectedDate.getFullYear() && month === calendarSelectedDate.getMonth() && day === calendarSelectedDate.getDate()) {
          classes += ' selected';
        }
        if (allPlanDates.has(dateStr)) {
          classes += ' has-plan';
        }
        if (allCompletedDates.has(dateStr)) {
          classes += ' completed';
          if (isConsecutiveStrike(dateStr, allCompletedDates)) {
            classes += ' consecutive-strike';
          }
        }

        const cell = document.createElement('div');
        cell.className = classes;
        cell.textContent = day;

        cell.addEventListener('click', () => {
          const selected = formatCalendarDate(dateObj);
          const dateInputEl = document.getElementById('dateInput');
          
          calendarSelectedDate = new Date(dateObj);
          renderCustomCalendar(); // 렌더링 업데이트 먼저 수행 (부드러운 전환)
          
          if (dateInputEl) {
            dateInputEl.value = selected;
            const event = new Event('change', { bubbles: true });
            dateInputEl.dispatchEvent(event);
          }
        });

        daysGrid.appendChild(cell);
      }

      // 다음 달 날짜들
      const totalCells = daysGrid.children.length;
      const remainingCells = 42 - totalCells;
      for (let day = 1; day <= remainingCells; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell other-month';
        cell.textContent = day;
        daysGrid.appendChild(cell);
      }
    }

    function formatCalendarDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 달력 이벤트 초기화
    function initCalendarEvents() {
      const prevMonth = document.getElementById('prevMonth');
      const nextMonth = document.getElementById('nextMonth');

      if (prevMonth) {
        prevMonth.addEventListener('click', () => {
          calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
          renderCustomCalendar();
        });
      }
      if (nextMonth) {
        nextMonth.addEventListener('click', () => {
          calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
          renderCustomCalendar();
        });
      }

      // 먼저 빈 달력 렌더링
      renderCustomCalendar();
      
      // 앱의 날짜 변경 시 달력도 동기화되도록 updateDateView 후킹
      if (typeof updateDateView === 'function') {
        const originalUpdateDateView = updateDateView;
        window.updateDateView = function() {
          originalUpdateDateView();
          if (typeof currentDate !== 'undefined') {
            calendarSelectedDate = new Date(currentDate);
            calendarCurrentDate = new Date(currentDate);
            renderCustomCalendar();
          }
        };
      }
      
      // 계획 날짜와 완료된 날짜 서버에서 가져와 렌더링 갱신
      loadPlanDates();
      loadCompletedDates();
    }
    
    // 서버에서 계획이 있는 날짜를 가져와 planDatesSet에 추가
    async function loadPlanDates() {
      try {
        const res = await fetch(`${API_BASE_URL}api/bible/get_plan.php?type=all`);
        if (!res.ok) return;
        const result = await res.json();
        
        if (result.status === 'success' && result.data && Array.isArray(result.data)) {
          result.data.forEach(item => {
            if (item.date && item.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              planDatesSet.add(item.date);
            }
          });
        }
      } catch (err) {
        console.error('Failed to load plan dates:', err);
      } finally {
        renderCustomCalendar();
      }
    }

    // 서버에서 모든 완료된 날짜를 가져와 completedDatesSet에 추가
    async function loadCompletedDates() {
      try {
        const res = await fetch(`${API_BASE_URL}api/hamonseong/get_completions.php?type=all`, { credentials: 'include' });
        if (!res.ok) return;
        const result = await res.json();

        if (result.status === 'success' && result.data && Array.isArray(result.data)) {
          console.log('Loaded completions:', result.data); // 디버깅
          result.data.forEach(item => {
            // timestamp 형식: "2026. 9. 8" → YYYY-MM-DD로 변환
            const rawTimestamp = item.timestamp || '';
            console.log('Raw timestamp:', rawTimestamp); // 디버깅

            let dateStr = null;

            // 형식 1: "YYYY. M. D" (예: "2026. 9. 8")
            if (rawTimestamp.match(/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}$/)) {
              const parts = rawTimestamp.split('.').map(p => p.trim());
              const year = parts[0];
              const month = String(parts[1]).padStart(2, '0');
              const day = String(parts[2]).padStart(2, '0');
              dateStr = `${year}-${month}-${day}`;
            }
            // 형식 2: "YYYY-MM-DD" (이미 올바른 형식)
            else if (rawTimestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateStr = rawTimestamp;
            }
            // 형식 3: created_at 필드 사용 (예: "2026-09-08 12:34:56")
            else if (item.created_at) {
              dateStr = item.created_at.split(' ')[0];
            }

            if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              completedDatesSet.add(dateStr);
              console.log('Added to set:', dateStr); // 디버깅
            }
          });
          console.log('Final completedDatesSet:', Array.from(completedDatesSet)); // 디버깅
        }
      } catch (err) {
        console.error('Failed to load completed dates:', err);
      } finally {
        renderCustomCalendar(); // 실패/성공 상관없이 다시 렌더링
      }
    }

    // 모든 스크립트 로드 후 초기화
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initCalendarEvents, 100);
    });
