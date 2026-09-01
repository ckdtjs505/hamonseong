<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 성경 읽기 계획 조회 API
 *
 * - ?date=YYYY-MM-DD : 특정 날짜의 계획 조회
 * - 파라미터 없음     : 오늘 날짜(CURDATE()) 기준 조회
 */
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("DB 연결 실패");
    }

    // 1. 파라미터 확인 및 유효성 검사
    if (isset($_GET['type']) && $_GET['type'] === 'all') {
        // 모든 계획이 있는 날짜들만 반환
        $stmt = $pdo->prepare("SELECT DISTINCT `date` FROM `read_plan` ORDER BY `date` ASC");
        $stmt->execute();
    } elseif (isset($_GET['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date'])) {
        // 지정된 날짜의 읽기 계획을 가져옵니다.
        $stmt = $pdo->prepare("SELECT * FROM `read_plan` WHERE `date` = :date");
        $stmt->execute(['date' => $_GET['date']]);
    } else {
        // 파라미터가 없거나 유효하지 않으면 오늘 날짜(CURDATE())의 계획을 가져옵니다.
        $stmt = $pdo->prepare("SELECT * FROM `read_plan` WHERE `date` = CURDATE()");
        $stmt->execute();
    }

    // 2. 결과 가져오기
    $plans = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'count'  => count($plans),
        'data'   => $plans
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '계획 데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
