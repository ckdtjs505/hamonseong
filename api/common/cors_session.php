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
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-Id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$isSecure = false;
if (isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) === 'on') {
    $isSecure = true;
} elseif (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
    $isSecure = true;
}

$cookieParams = [
    'lifetime' => 60 * 60 * 24 * 30, // 30 days (카카오 브라우저 등에서 세션 쿠키가 쉽게 날아가는 것을 방지)
    'path' => '/',
    'httponly' => true,
    'secure' => $isSecure
];

// SameSite=None은 localhost 개발 환경(크로스 도메인)에서만 필요함
// 프로덕션(같은 도메인)에서는 SameSite=None을 쓰면 카카오톡 인앱 브라우저나 일부 iOS 기기에서 쿠키를 거부/삭제하는 버그가 있음
if ($isLocalhost) {
    $cookieParams['secure'] = true;
    $cookieParams['samesite'] = 'None';
} else {
    $cookieParams['samesite'] = 'Lax';
}

// 서버 측 세션 유지 시간 설정 (30일)
ini_set('session.gc_maxlifetime', 60 * 60 * 24 * 30);


// API 응답 캐싱 방지 (카카오 인앱 브라우저의 강력한 캐싱으로 인한 과거 상태 반환 방지)
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

session_set_cookie_params($cookieParams);

// 카카오톡 브라우저의 쿠키 유실 버그를 완전히 우회하기 위해, 클라이언트에서 헤더로 세션 ID를 보내면 이를 강제로 적용합니다.
if (isset($_SERVER['HTTP_X_SESSION_ID']) && !empty($_SERVER['HTTP_X_SESSION_ID'])) {
    session_id($_SERVER['HTTP_X_SESSION_ID']);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
