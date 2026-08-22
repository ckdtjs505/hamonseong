-- 성경 읽기 계획(read_plan) 테이블 스키마
CREATE TABLE IF NOT EXISTS `read_plan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'index',
  `week` int(11) DEFAULT NULL,
  `daycount` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `lang` varchar(50) DEFAULT NULL,
  `book` varchar(50) DEFAULT NULL,
  `start` int(11) DEFAULT NULL,
  `end` int(11) DEFAULT NULL,
  `img` varchar(50) DEFAULT NULL,
  `videoId` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
