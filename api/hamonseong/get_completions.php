<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 저장된 함온성 완료 기록 및 기도 데이터 조회 API
 *
 * - ?date=YYYY-MM-DD : 특정 날짜의 기록 1건 조회
 * - ?type=all        : 해당 사용자의 전체 기록 조회
 */
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'GET 요청만 허용됩니다.']);
    exit();
}

if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => '로그인이 필요합니다.']);
    exit();
}

require_once __DIR__ . '/../common/ensure_tables.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결 실패");
    }

    ensureHamonseongLogsTable($pdo);

    $user = $_SESSION['user'];
    $userId = (int)($user['id'] ?? 0);

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '유효하지 않은 사용자 정보입니다.']);
        exit();
    }

    // 날짜별 조회 (?date=YYYY-MM-DD)
    if (isset($_GET['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date'])) {
        $rawDate = $_GET['date'];
        $parts = explode('-', $rawDate);
        $tsFormatted = sprintf("%d. %d. %d", (int)$parts[0], (int)$parts[1], (int)$parts[2]);

        $stmt = $pdo->prepare("
            SELECT * FROM `hamonseong_logs`
            WHERE `user_id` = :user_id
              AND (`timestamp` = :tsFormatted OR `timestamp` = :rawDate)
            ORDER BY `id` DESC
            LIMIT 1
        ");
        $stmt->execute([
            'user_id'     => $userId,
            'tsFormatted' => $tsFormatted,
            'rawDate'     => $rawDate
        ]);

        $log = $stmt->fetch();

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data'   => $log ?: null
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 전체 기록 리스트 조회
    $stmt = $pdo->prepare("
        SELECT * FROM `hamonseong_logs`
        WHERE `user_id` = :user_id
        ORDER BY `id` DESC
    ");
    $stmt->execute(['user_id' => $userId]);
    $logs = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'count'  => count($logs),
        'data'   => $logs
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '기록을 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
