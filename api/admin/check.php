<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * admin_check.php
 * 관리자 권한 확인을 위한 유틸리티 파일입니다.
 */

function isAdmin() {
    return isset($_SESSION['user']) && isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'admin';
}

function requireAdmin() {
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => '관리자 권한이 필요합니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
?>
