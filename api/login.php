<?php
/**
 * 로그인 API
 */
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

    // users 테이블이 존재하지 않는 경우 대비 생성
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

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '아이디와 비밀번호를 모두 입력해주세요.']);
        exit();
    }

    // 사용자 정보 조회
    $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `username` = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => '아이디 또는 비밀번호가 올바르지 않습니다.']);
        exit();
    }

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
