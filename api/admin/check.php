<?php
/**
 * check.php
 * 권한 확인을 위한 유틸리티 파일
 * 역할(role): admin > leader > member
 */
require_once __DIR__ . '/../common/cors_session.php';

/** 최고 관리자 여부 확인 */
function isAdmin(): bool
{
    return isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'admin';
}

/** 리더(교사/부장) 여부 확인 */
function isLeader(): bool
{
    return isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'leader';
}

/** admin 또는 leader 여부 확인 */
function isAdminOrLeader(): bool
{
    return isAdmin() || isLeader();
}

/** admin 전용 API 보호 - admin 외 403 반환 */
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

/** admin 또는 leader 전용 API 보호 - member는 403 반환 */
function requireAdminOrLeader(): void
{
    if (!isAdminOrLeader()) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => '리더 이상의 권한이 필요합니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
