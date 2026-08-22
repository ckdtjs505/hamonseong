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
            `role` VARCHAR(20) NOT NULL DEFAULT 'member',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $created = true;
}
