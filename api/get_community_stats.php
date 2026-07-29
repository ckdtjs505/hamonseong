<?php
/**
 * 청소년부 함온성 공동체 현황 및 인기 말씀 통계 API
 */
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'GET 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/common/db_connect.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결 실패");
    }

    // hamonseong_logs 테이블 존재 보장
    $createTableSql = "
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
    ";
    $pdo->exec($createTableSql);

    // 1. Summary Metrics (오늘 읽은 학생 수, 전체 완독 횟수)
    $todayStmt = $pdo->query("
        SELECT COUNT(DISTINCT COALESCE(user_id, name)) as today_users 
        FROM `hamonseong_logs` 
        WHERE DATE(created_at) = CURDATE()
    ");
    $todayUsers = (int)($todayStmt->fetchColumn() ?? 0);

    $totalStmt = $pdo->query("SELECT COUNT(*) as total_completions FROM `hamonseong_logs`");
    $totalCompletions = (int)($totalStmt->fetchColumn() ?? 0);

    // 2. Member Rankings (친구별 완독 횟수 랭킹)
    $rankStmt = $pdo->query("
        SELECT 
            `name`, 
            COUNT(*) as total_count, 
            MAX(`created_at`) as last_active 
        FROM `hamonseong_logs` 
        GROUP BY `name` 
        ORDER BY total_count DESC, last_active DESC 
        LIMIT 10
    ");
    $rankings = $rankStmt->fetchAll();

    // 3. Recent Reflection & Prayer Feed (최근 묵상/기도 피드 20건)
    $feedStmt = $pdo->query("
        SELECT `id`, `name`, `timestamp`, `daycnt`, `myMessage`, `pray`, `prayForUser`, `created_at` 
        FROM `hamonseong_logs` 
        ORDER BY `id` DESC 
        LIMIT 20
    ");
    $recentFeed = $feedStmt->fetchAll();

    // 4. Top Picked Bible Verses (가장 많이 선택된 인기 말씀 TOP 10)
    $allLogsStmt = $pdo->query("SELECT `myMessage` FROM `hamonseong_logs` WHERE `myMessage` IS NOT NULL AND `myMessage` != ''");
    $allMessages = $allLogsStmt->fetchAll(PDO::FETCH_COLUMN);

    $verseCounts = [];
    
    foreach ($allMessages as $msg) {
        $lines = explode("\n", $msg);
        $currentBookName = '성경';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // 줄이 성경 권명인지 확인 (예: 창세기, 마태복음)
            if (!preg_match('/^\d+:\d+/', $line)) {
                $currentBookName = $line;
                continue;
            }

            // "1:1 태초에..." 형태 파싱
            if (preg_match('/^(\d+:\d+)\s*(.*)$/', $line, $matches)) {
                $verseRef = $currentBookName . ' ' . $matches[1]; // 예: "창세기 1:1"
                $verseContent = trim($matches[2]);
                
                $key = $verseRef;
                if (!isset($verseCounts[$key])) {
                    $verseCounts[$key] = [
                        'reference' => $verseRef,
                        'content'   => $verseContent,
                        'count'     => 0
                    ];
                }
                $verseCounts[$key]['count']++;
            }
        }
    }

    // 개수 내림차순 정렬
    usort($verseCounts, function($a, $b) {
        return $b['count'] - $a['count'];
    });

    $topVerses = array_slice($verseCounts, 0, 10);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data'   => [
            'summary' => [
                'today_users'       => $todayUsers,
                'total_completions' => $totalCompletions
            ],
            'rankings'   => $rankings,
            'recentFeed' => $recentFeed,
            'topVerses'  => $topVerses
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '현황 데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
