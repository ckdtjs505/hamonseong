<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 오늘의 함온성 완료 기록 저장/수정 API
 *
 * - 동일 사용자(user_id) + 동일 날짜(timestamp)에 기존 기록이 있으면 UPDATE
 * - 없으면 새 기록 INSERT
 */
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

// 로그인 여부 확인
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => '로그인이 필요한 기능입니다. 먼저 로그인해주세요.']);
    exit();
}

require_once __DIR__ . '/../common/ensure_tables.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결 실패");
    }

    ensureHamonseongLogsTable($pdo);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $user = $_SESSION['user'];
    $userId = (int)($user['id'] ?? 0);
    $userName = trim($user['name'] ?? '익명');

    $myMessage = trim($input['myMessage'] ?? '');
    $pray = trim($input['pray'] ?? '');
    $prayForUser = trim($input['prayForUser'] ?? '');
    $daycnt = (int)($input['daycnt'] ?? 1);

    $dbDateStr = '';
    // 날짜 타임스탬프 포맷 생성 (예: 2026. 1. 5)
    if (!empty($input['timestamp'])) {
        $timestampStr = trim($input['timestamp']);
        // timestampStr 기반으로 dbDateStr 유추 시도 (2026. 9. 7 -> 2026-09-07)
        $parts = explode('.', str_replace(' ', '', $timestampStr));
        if (count($parts) >= 3) {
            $dbDateStr = sprintf("%04d-%02d-%02d", (int)$parts[0], (int)$parts[1], (int)$parts[2]);
        }
    } elseif (!empty($input['date'])) {
        $dbDateStr = trim($input['date']);
        $parts = explode('-', $dbDateStr);
        if (count($parts) === 3) {
            $timestampStr = sprintf("%d. %d. %d", (int)$parts[0], (int)$parts[1], (int)$parts[2]);
        } else {
            $now = new DateTime();
            $timestampStr = sprintf("%d. %d. %d", $now->format('Y'), $now->format('n'), $now->format('j'));
            $dbDateStr = $now->format('Y-m-d');
        }
    } else {
        $now = new DateTime();
        $timestampStr = sprintf("%d. %d. %d", $now->format('Y'), $now->format('n'), $now->format('j'));
        $dbDateStr = $now->format('Y-m-d');
    }

    // daycnt가 1로 하드코딩 되어 넘어오는 경우가 많으므로, read_plan에서 정확한 daycount를 조회
    if (!empty($dbDateStr)) {
        $planStmt = $pdo->prepare("SELECT `daycount` FROM `read_plan` WHERE `date` = :date LIMIT 1");
        $planStmt->execute(['date' => $dbDateStr]);
        $planData = $planStmt->fetch(PDO::FETCH_ASSOC);
        if ($planData && isset($planData['daycount'])) {
            $daycnt = (int)$planData['daycount'];
        }
    }

    if (empty($myMessage)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '저장할 성경 구절 내용(myMessage)이 없습니다.']);
        exit();
    }

    // 기존 기록이 있는지 확인 (user_id + timestamp 기준)
    $stmt = $pdo->prepare("SELECT id FROM `hamonseong_logs` WHERE `user_id` = :user_id AND `timestamp` = :timestamp LIMIT 1");
    $stmt->execute(['user_id' => $userId, 'timestamp' => $timestampStr]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // 기존 기록 업데이트 (수정)
        $stmt = $pdo->prepare("
            UPDATE `hamonseong_logs`
            SET `myMessage` = :myMessage, `pray` = :pray, `prayForUser` = :prayForUser, `name` = :name, `daycnt` = :daycnt
            WHERE `id` = :id
        ");
        $stmt->execute([
            'myMessage'   => $myMessage,
            'pray'        => $pray,
            'prayForUser' => $prayForUser,
            'name'        => $userName,
            'daycnt'      => $daycnt,
            'id'          => $existing['id']
        ]);
        $recordId = (int)$existing['id'];
        $httpCode = 200;
        $message = '함온성이 수정되었습니다!';
    } else {
        // 새 기록 삽입
        $stmt = $pdo->prepare("
            INSERT INTO `hamonseong_logs`
            (`user_id`, `timestamp`, `name`, `daycnt`, `myMessage`, `pray`, `prayForUser`)
            VALUES (:user_id, :timestamp, :name, :daycnt, :myMessage, :pray, :prayForUser)
        ");
        $stmt->execute([
            'user_id'     => $userId > 0 ? $userId : null,
            'timestamp'   => $timestampStr,
            'name'        => $userName,
            'daycnt'      => $daycnt,
            'myMessage'   => $myMessage,
            'pray'        => $pray,
            'prayForUser' => $prayForUser
        ]);
        $recordId = (int)$pdo->lastInsertId();
        $httpCode = 201;
        $message = '오늘의 함온성이 저장되었습니다!';
    }

    http_response_code($httpCode);
    echo json_encode([
        'status'  => 'success',
        'message' => $message,
        'data'    => [
            'index'       => $recordId,
            'Timestamp'   => $timestampStr,
            'name'        => $userName,
            'daycnt'      => $daycnt,
            'myMessage'   => $myMessage,
            'pray'        => $pray,
            'prayForUser' => $prayForUser
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '함온성 저장 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
