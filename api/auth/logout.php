<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 로그아웃 API
 */
header("Content-Type: application/json; charset=UTF-8");

$_SESSION = array();

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();

http_response_code(200);
echo json_encode([
    'status'  => 'success',
    'message' => '로그아웃 되었습니다.'
], JSON_UNESCAPED_UNICODE);
