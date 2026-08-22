<?php
/**
 * cors_session.php
 * 크로스 도메인(Localhost -> 원격 서버) 환경에서의 CORS 및 세션(쿠키) 처리
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// localhost(개발 환경) 및 특정 도메인 허용
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1'
];

$isLocalhost = false;
foreach ($allowedOrigins as $allowed) {
    if (strpos($origin, $allowed) === 0) { // e.g. http://localhost:5500
        $isLocalhost = true;
        break;
    }
}

if ($isLocalhost || $origin === 'https://ckdtjst505.mycafe24.com' || $origin === 'http://ckdtjst505.mycafe24.com') {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
} else {
    // 그 외의 경우 (기본 접근 허용을 위해)
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 크로스 도메인에서 쿠키 전송을 위해 SameSite=None, Secure 설정 필수
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,       // 반드시 HTTPS 환경이어야 함 (또는 브라우저 정책상 localhost는 예외적으로 허용됨)
    'httponly' => true,
    'samesite' => 'None'    // 크로스 도메인(Third-party) 쿠키 허용
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
