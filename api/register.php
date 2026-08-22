<?php
require_once __DIR__ . '/common/cors_session.php';

/**
 * 회원가입 API
 */
header("Content-Type: application/json; charset=UTF-8");



if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    // users 테이블이 존재하지 않으면 자동 생성
    $createTableSql = "
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `name` VARCHAR(50) NOT NULL,
            `role` VARCHAR(20) NOT NULL DEFAULT 'member',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($createTableSql);

    // JSON 본문 또는 POST 변수 읽기
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');
    $name = trim($input['name'] ?? '');

    // 입력값 검증
    if (empty($username) || empty($password) || empty($name)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '아이디, 비밀번호, 이름을 모두 입력해주세요.']);
        exit();
    }

    if (mb_strlen($username) < 3 || mb_strlen($username) > 30) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '아이디는 3자 이상 30자 이하이어야 합니다.']);
        exit();
    }

    if (mb_strlen($password) < 4) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '비밀번호는 최소 4자 이상이어야 합니다.']);
        exit();
    }

    // 아이디 중복 확인
    $checkStmt = $pdo->prepare("SELECT `id` FROM `users` WHERE `username` = :username");
    $checkStmt->execute(['username' => $username]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => '이미 사용 중인 아이디입니다.']);
        exit();
    }

    // 비밀번호 해싱 및 사용자 등록
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $insertStmt = $pdo->prepare("
        INSERT INTO `users` (`username`, `password`, `name`, `role`)
        VALUES (:username, :password, :name, 'member')
    ");
    $insertStmt->execute([
        'username' => $username,
        'password' => $hashedPassword,
        'name'     => $name
    ]);

    $newUserId = (int)$pdo->lastInsertId();

    $userData = [
        'id'       => $newUserId,
        'username' => $username,
        'name'     => $name,
        'role'     => 'member'
    ];

    // 자동 로그인 세션 처리
    $_SESSION['user'] = $userData;

    http_response_code(201);
    echo json_encode([
        'status'  => 'success',
        'message' => '회원가입이 완료되었습니다.',
        'user'    => $userData
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '회원가입 처리 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
