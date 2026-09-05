<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 회원가입 API
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
    $name = trim($input['name'] ?? '');

    // 1. 입력값 기본 검증: 빈 값 확인
    if (empty($username) || empty($password) || empty($name)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '아이디, 비밀번호, 이름을 모두 입력해주세요.']);
        exit();
    }

    // 2. 아이디 길이 검증 (3~30자)
    if (mb_strlen($username) < 3 || mb_strlen($username) > 30) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '아이디는 3자 이상 30자 이하이어야 합니다.']);
        exit();
    }

    // 3. 비밀번호 길이 검증 (최소 4자)
    if (mb_strlen($password) < 4) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '비밀번호는 최소 4자 이상이어야 합니다.']);
        exit();
    }

    // 3.5. 이름 한글 검증 (정규식: 한글로 1~6글자)
    if (!preg_match('/^[가-힣]{1,6}$/u', $name)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '이름은 한글로 1~6글자만 입력 가능하며, 특수문자나 공백은 사용할 수 없습니다.']);
        exit();
    }

    // 4. 아이디 중복 확인: 이미 존재하는 아이디인지 검사
    $checkStmt = $pdo->prepare("SELECT `id` FROM `users` WHERE `username` = :username");
    $checkStmt->execute(['username' => $username]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => '이미 사용 중인 아이디입니다.']);
        exit();
    }

    // 5. 비밀번호 해싱 (안전한 저장을 위해 PASSWORD_DEFAULT 알고리즘 사용)
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // 6. 새 사용자 데이터베이스에 삽입 (기본 권한: 'member')
    $insertStmt = $pdo->prepare("
        INSERT INTO `users` (`username`, `password`, `name`, `role`)
        VALUES (:username, :password, :name, 'member')
    ");
    $insertStmt->execute([
        'username' => $username,
        'password' => $hashedPassword,
        'name'     => $name
    ]);

    // 7. 새로 생성된 사용자의 ID 가져오기
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
