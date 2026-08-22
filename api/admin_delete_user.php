<?php
require_once __DIR__ . '/common/cors_session.php';

/**
 * admin_delete_user.php
 * 사용자를 삭제합니다. (관리자 전용)
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
    $targetUserId = (int)($input['user_id'] ?? 0);

    if ($targetUserId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '잘못된 요청입니다.']);
        exit();
    }

    // 본인은 삭제 불가
    if ($_SESSION['user']['id'] == $targetUserId) {
         http_response_code(400);
         echo json_encode(['status' => 'error', 'message' => '본인 계정은 삭제할 수 없습니다.']);
         exit();
    }

    // 트랜잭션 시작 (관련 로그 삭제 포함 시)
    $pdo->beginTransaction();

    // 사용자의 로그도 같이 삭제 (선택적)
    $deleteLogsStmt = $pdo->prepare("DELETE FROM `hamonseong_logs` WHERE `user_id` = :id");
    $deleteLogsStmt->execute(['id' => $targetUserId]);

    $stmt = $pdo->prepare("DELETE FROM `users` WHERE `id` = :id");
    $stmt->execute(['id' => $targetUserId]);

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => '사용자(및 관련 기록)가 삭제되었습니다.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => '처리 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
