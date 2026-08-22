<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 로그인 API
 */
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/../common/ensure_tables.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    ensureUsersTable($pdo);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    // 1. 사용자 입력 검증: 아이디와 비밀번호 필수 확인
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '아이디와 비밀번호를 모두 입력해주세요.']);
        exit();
    }

    // 2. 사용자 정보 조회: 아이디로 사용자 찾기
    $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `username` = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    // 3. 비밀번호 확인: 사용자가 존재하지 않거나 비밀번호 해시가 일치하지 않으면 실패
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => '아이디 또는 비밀번호가 올바르지 않습니다.']);
        exit();
    }

    // 4. 세션에 저장할 사용자 정보 구성 (비밀번호 제외)
    $userData = [
        'id'       => (int)$user['id'],
        'username' => $user['username'],
        'name'     => $user['name'],
        'role'     => $user['role']
    ];

    // 세션 저장
    $_SESSION['user'] = $userData;

    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'message' => '로그인에 성공하였습니다.',
        'user'    => $userData
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '로그인 처리 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
