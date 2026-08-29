<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 함온성 로그 전체 조회 (관리자 및 리더 접근 가능)
 */
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/check.php';
requireAdminOrLeader();
require_once __DIR__ . '/../common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    $stmt = $pdo->prepare("
        SELECT
            hl.id, hl.user_id, hl.timestamp, hl.name, hl.daycnt,
            hl.myMessage, hl.pray, hl.prayForUser, hl.created_at,
            u.username, u.role
        FROM `hamonseong_logs` hl
        LEFT JOIN `users` u ON hl.user_id = u.id
        ORDER BY hl.created_at DESC
    ");
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data'   => $logs
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
