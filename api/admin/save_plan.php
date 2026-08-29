<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 성경 읽기 계획 추가/수정 (관리자 및 리더 접근 가능)
 */
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/check.php';
requireAdminOrLeader();
require_once __DIR__ . '/../common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $id       = (int)($input['id'] ?? 0);
    $daycount = (int)($input['daycount'] ?? 0);
    $date     = trim($input['date'] ?? '');
    $book     = trim($input['book'] ?? '');
    $start    = (int)($input['start'] ?? 0);
    $end      = (int)($input['end'] ?? 0);

    if (empty($date) || empty($book) || $start <= 0 || $end <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '모든 값을 올바르게 입력해주세요.']);
        exit();
    }

    if ($id > 0) {
        // 수정
        $stmt = $pdo->prepare("UPDATE `read_plan` SET `daycount` = :daycount, `date` = :date, `book` = :book, `start` = :start, `end` = :end WHERE `id` = :id");
        $stmt->execute(['daycount' => $daycount, 'date' => $date, 'book' => $book, 'start' => $start, 'end' => $end, 'id' => $id]);
    } else {
        // 추가
        $stmt = $pdo->prepare("INSERT INTO `read_plan` (`daycount`, `date`, `book`, `start`, `end`) VALUES (:daycount, :date, :book, :start, :end)");
        $stmt->execute(['daycount' => $daycount, 'date' => $date, 'book' => $book, 'start' => $start, 'end' => $end]);
    }

    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'message' => '계획이 저장되었습니다.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '처리 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
