<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 로그인 세션 상태 확인 API
 */
header("Content-Type: application/json; charset=UTF-8");



if (isset($_SESSION['user']) && !empty($_SESSION['user'])) {
    http_response_code(200);
    echo json_encode([
        'status'     => 'success',
        'isLoggedIn' => true,
        'user'       => $_SESSION['user']
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(200);
    echo json_encode([
        'status'     => 'success',
        'isLoggedIn' => false,
        'user'       => null
    ], JSON_UNESCAPED_UNICODE);
}
