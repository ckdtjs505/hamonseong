<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 청소년부 함온성 공동체 현황 및 인기 말씀 통계 API
 *
 * 응답 데이터:
 * - summary    : 오늘 읽은 학생 수, 전체 완독 횟수
 * - rankings   : 멤버별 완독 횟수 랭킹 (TOP 10)
 * - recentFeed : 최근 묵상/기도 피드 (20건)
 * - topVerses  : 가장 많이 선택된 인기 말씀 (TOP 10)
 */
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'GET 요청만 허용됩니다.']);
    exit();
}

require_once __DIR__ . '/../common/ensure_tables.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결 실패");
    }

    ensureHamonseongLogsTable($pdo);

    // 1. 요약 통계
    $todayStmt = $pdo->query("
        SELECT COUNT(DISTINCT COALESCE(user_id, name)) as today_users
        FROM `hamonseong_logs`
        WHERE DATE(created_at) = CURDATE()
    ");
    $todayUsers = (int)($todayStmt->fetchColumn() ?? 0);

    $totalStmt = $pdo->query("SELECT COUNT(*) FROM `hamonseong_logs`");
    $totalCompletions = (int)($totalStmt->fetchColumn() ?? 0);

    // 2. 멤버 랭킹
    $rankStmt = $pdo->query("
        SELECT `name`, COUNT(*) as total_count, MAX(`created_at`) as last_active
        FROM `hamonseong_logs`
        GROUP BY `name`
        ORDER BY total_count DESC, last_active DESC
        LIMIT 10
    ");
    $rankings = $rankStmt->fetchAll();

    // 3. 최근 묵상/기도 피드 (20건)
    $feedStmt = $pdo->query("
        SELECT `id`, `name`, `timestamp`, `daycnt`, `myMessage`, `pray`, `prayForUser`, `created_at`
        FROM `hamonseong_logs`
        ORDER BY `id` DESC
        LIMIT 20
    ");
    $recentFeed = $feedStmt->fetchAll();

    // 4. 인기 말씀 TOP 10 (myMessage에서 구절 파싱)
    $allLogsStmt = $pdo->query("SELECT `myMessage` FROM `hamonseong_logs` WHERE `myMessage` IS NOT NULL AND `myMessage` != ''");
    $allMessages = $allLogsStmt->fetchAll(PDO::FETCH_COLUMN);

    $verseCounts = [];

    foreach ($allMessages as $msg) {
        $lines = explode("\n", $msg);
        $currentBookName = '성경';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // 성경 권명 행 (예: 창세기, 마태복음)
            if (!preg_match('/^\d+:\d+/', $line)) {
                $currentBookName = $line;
                continue;
            }

            // "1:1 태초에..." 형태 파싱
            if (preg_match('/^(\d+:\d+)\s*(.*)$/', $line, $matches)) {
                $verseRef = $currentBookName . ' ' . $matches[1];
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

    usort($verseCounts, fn($a, $b) => $b['count'] - $a['count']);
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
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '현황 데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
