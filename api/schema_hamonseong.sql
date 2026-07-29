-- 함온성(함께 온전히 성경읽기) 기록 저장 테이블 스키마
CREATE TABLE IF NOT EXISTS `hamonseong_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'index',
    `user_id` INT NULL COMMENT '사용자 ID',
    `timestamp` VARCHAR(50) NOT NULL COMMENT 'Timestamp (예: 2026. 1. 5)',
    `name` VARCHAR(50) NOT NULL COMMENT '사용자 이름 (name)',
    `daycnt` INT NOT NULL DEFAULT 1 COMMENT '읽기 회차/일수 (daycnt)',
    `myMessage` TEXT NOT NULL COMMENT '선택한 성경 구절 모음 (myMessage)',
    `pray` TEXT NULL COMMENT '오늘의 기도 (pray)',
    `prayForUser` TEXT NULL COMMENT '서로를 위한 기도제목 (prayForUser)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
