<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * admin_update_role.php
 * 사용자 권한을 변경합니다. (관리자 전용)
 */

header("Content-Type: application/json; charset=UTF-8");



if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/check.php';
requireAdmin();
require_once __DIR__ . '/../common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $targetUserId = (int)($input['user_id'] ?? 0);
    $newRole = trim($input['role'] ?? '');

    if ($targetUserId <= 0 || !in_array($newRole, ['member', 'admin'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '잘못된 요청입니다.']);
        exit();
    }

    // 본인의 권한은 변경할 수 없도록 방어
    if ($_SESSION['user']['id'] == $targetUserId) {
         http_response_code(400);
         echo json_encode(['status' => 'error', 'message' => '본인의 권한은 변경할 수 없습니다.']);
         exit();
    }

    $stmt = $pdo->prepare("UPDATE `users` SET `role` = :role WHERE `id` = :id");
    $stmt->execute(['role' => $newRole, 'id' => $targetUserId]);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => '권한이 변경되었습니다.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => '처리 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
