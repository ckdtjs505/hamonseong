<?php
require_once __DIR__ . '/common/cors_session.php';

/**
 * admin_get_users.php
 * 모든 사용자 목록을 가져옵니다. (관리자 전용)
 */

header("Content-Type: application/json; charset=UTF-8");



require_once __DIR__ . '/admin_check.php';
requireAdmin();
require_once __DIR__ . '/common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    $stmt = $pdo->prepare("SELECT `id`, `username`, `name`, `role`, `created_at` FROM `users` ORDER BY `created_at` DESC");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data' => $users
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => '데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
