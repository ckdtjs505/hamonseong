<?php
/**
 * ensure_tables.php
 * 필수 테이블이 존재하지 않는 경우 자동 생성합니다.
 * 여러 API에서 중복되던 CREATE TABLE 로직을 이 파일에서 통합 관리합니다.
 */

require_once __DIR__ . '/db_connect.php';

/**
 * hamonseong_logs 테이블을 생성합니다 (존재하지 않는 경우).
 */
function ensureHamonseongLogsTable(PDO $pdo): void
{
    static $created = false;
    if ($created) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `hamonseong_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `timestamp` VARCHAR(50) NOT NULL,
            `name` VARCHAR(50) NOT NULL,
            `daycnt` INT NOT NULL DEFAULT 1,
            `myMessage` TEXT NOT NULL,
            `pray` TEXT NULL,
            `prayForUser` TEXT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $created = true;
}

/**
 * users 테이블을 생성합니다 (존재하지 않는 경우).
 * class_group 컬럼: 사용자의 소속 반 정보 (예: "1반", "2반" 등)
 * 기존 테이블에 class_group 컬럼이 없는 경우 ALTER TABLE로 자동 추가합니다.
 */
function ensureUsersTable(PDO $pdo): void
{
    static $created = false;
    if ($created) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `name` VARCHAR(50) NOT NULL,
            `class_group` VARCHAR(50) NULL DEFAULT NULL,  -- 소속 반 정보 (예: '1반', '2반', NULL=미지정)
            `role` VARCHAR(20) NOT NULL DEFAULT 'member',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 컬럼이 없는 경우(기존 DB 마이그레이션) 추가 시도
    try {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `class_group` VARCHAR(50) NULL DEFAULT NULL AFTER `name`");
    } catch (PDOException $e) {
        // 이미 컬럼이 존재하는 등의 에러 무시
    }

    $created = true;
}
