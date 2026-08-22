<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 저장된 함온성 기록 삭제 API
 */
header("Content-Type: application/json; charset=UTF-8");



if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 또는 DELETE 요청만 허용됩니다.']);
    exit();
}

if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => '로그인이 필요한 기능입니다.']);
    exit();
}

require_once __DIR__ . '/../common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결 실패");
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '삭제할 기록 ID가 지정되지 않았습니다.']);
        exit();
    }

    $user = $_SESSION['user'];
    $userId = (int)($user['id'] ?? 0);

    // 해당 사용자 본인의 기록인지 확인 및 삭제
    $stmt = $pdo->prepare("DELETE FROM `hamonseong_logs` WHERE `id` = :id AND `user_id` = :user_id");
    $stmt->execute([
        'id'      => $id,
        'user_id' => $userId
    ]);

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => '기록이 성공적으로 삭제되었습니다.']);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => '삭제할 기록을 찾을 수 없거나 권한이 없습니다.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '기록 삭제 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
