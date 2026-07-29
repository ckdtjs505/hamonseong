<?php
/**
 * DB 연결 (PDO) 처리 파일
 */

// config/db_config.php 로드
require_once __DIR__ . '/../../../config/db_config.php';

/**
 * PDO 데이터베이스 인스턴스를 반환합니다 (싱글톤 패턴).
 *
 * @return PDO
 */
function getDbConnection(): PDO 
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            "mysql:host=%s;port=%s;dbname=%s;charset=%s",
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("DB Connection Error: " . $e->getMessage());
            throw new Exception("데이터베이스 연결 실패: 관리자에게 문의하세요.");
        }
    }

    return $pdo;
}

// 글로벌 $pdo 객체 생성 (기존 스크립트 및 db_helper.php와의 호환성)
try {
    $pdo = getDbConnection();
} catch (Exception $e) {
    $pdo = null;
}
