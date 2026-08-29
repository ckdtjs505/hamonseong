<?php
/**
 * get_progress.php
 * 반별 진행사항 조회 API (관리자 및 리더 접근 가능)
 * 
 * 모든 학생(admin 제외)의 정보, 함온성 기록, 읽기 계획을 한 번에 반환합니다.
 * 프론트엔드에서 이 데이터를 활용하여 반별 진행사항 O/X 표를 렌더링합니다.
 * 
 * 응답 형식:
 *  - users: [{ id, name, username, class_group }, ...]
 *  - logs:  [{ user_id, timestamp, daycnt }, ...]
 *  - plans: [{ id, daycount, date, book, start, end }, ...]
 */
require_once __DIR__ . '/../common/cors_session.php';
header("Content-Type: application/json; charset=UTF-8");

// 관리자 권한 확인
require_once __DIR__ . '/check.php';
requireAdminOrLeader();
require_once __DIR__ . '/../common/ensure_tables.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }
    
    // 테이블 존재 여부 확인 및 자동 생성
    ensureUsersTable($pdo);
    ensureHamonseongLogsTable($pdo);

    // 1. 모든 학생/일반 사용자 조회 (admin 제외)
    //    - class_group이 NULL인 사용자가 뒤로 가도록 정렬
    //    - 같은 반 내에서는 이름순 정렬
    $stmtUsers = $pdo->prepare("SELECT `id`, `name`, `username`, `class_group` FROM `users` WHERE `role` = 'member' ORDER BY `class_group` IS NULL, `class_group`, `name`");
    $stmtUsers->execute();
    $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

    // 2. 전체 함온성 기록 조회
    //    - user_id: 작성한 사용자 ID
    //    - timestamp: 기록 날짜 (예: "2026. 9. 7")
    //    - daycnt: 읽기 일차 (예: 1, 2, 3...)
    $stmtLogs = $pdo->prepare("SELECT `user_id`, `timestamp`, `daycnt` FROM `hamonseong_logs` ORDER BY `id` ASC");
    $stmtLogs->execute();
    $logs = $stmtLogs->fetchAll(PDO::FETCH_ASSOC);

    // 3. 전체 읽기 계획(read_plan) 조회
    //    - 진행사항 표의 열(Column) 헤더로 사용됨
    //    - daycount 기준 오름차순 정렬
    $stmtPlans = $pdo->prepare("SELECT `id`, `daycount`, `date`, `book`, `start`, `end` FROM `read_plan` ORDER BY `daycount` ASC, `date` ASC");
    $stmtPlans->execute();
    $plans = $stmtPlans->fetchAll(PDO::FETCH_ASSOC);

    // 성공 응답: users, logs, plans 데이터를 함께 반환
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data' => [
            'users' => $users,
            'logs'  => $logs,
            'plans' => $plans
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '진행사항을 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
