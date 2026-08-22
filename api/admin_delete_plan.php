<?php
require_once __DIR__ . '/common/cors_session.php';

/**
 * admin_delete_plan.php
 * 성경 읽기 계획을 삭제합니다. (관리자 전용)
 */

header("Content-Type: application/json; charset=UTF-8");



if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/admin_check.php';
requireAdmin();
require_once __DIR__ . '/common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $planId = (int)($input['plan_id'] ?? 0);

    if ($planId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '잘못된 요청입니다.']);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM `read_plan` WHERE `id` = :id");
    $stmt->execute(['id' => $planId]);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => '계획이 삭제되었습니다.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => '처리 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
