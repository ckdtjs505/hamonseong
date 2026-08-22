<?php
/**
 * check.php
 * 관리자 권한 확인을 위한 유틸리티 파일
 */
require_once __DIR__ . '/../common/cors_session.php';

function isAdmin(): bool
{
    return isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'admin';
}

function requireAdmin(): void
{
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => '관리자 권한이 필요합니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
