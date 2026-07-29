<?php
// 1. CORS 및 JSON 응답 헤더 설정
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// OPTIONS (Preflight) 요청 들어왔을 때 즉시 종료
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. 공통 DB 연결 모듈 불러오기
require_once __DIR__ . '/common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("DB 연결 실패");
    }

    // 3. GET 파라미터로 날짜(date)가 주어진 경우 해당 날짜로 조회, 없으면 오늘 날짜(CURDATE()) 조회
    if (isset($_GET['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date'])) {
        $sql = "SELECT * FROM `read_plan` WHERE `date` = :date";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['date' => $_GET['date']]);
    } else {
        $sql = "SELECT * FROM `read_plan` WHERE `date` = CURDATE()";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    }

    $plans = $stmt->fetchAll();

    // 4. 성공 응답 (JSON)
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'count'  => count($plans),
        'data'   => $plans
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // 서버 오류 예외 처리
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '계획 데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
