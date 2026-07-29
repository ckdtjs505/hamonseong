<?php
// 1. CORS 및 JSON 응답 헤더 설정
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// OPTIONS (Preflight) 요청 들어왔을 때 즉시 종료
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. 공통 DB 모듈 불러오기
require_once __DIR__ . '/common/db_helper.php';

try {
    // 3. GET 파라미터 받기 (기본값: book=1, chapter=1)
    $book    = isset($_GET['book']) ? (int)$_GET['book'] : 1;
    $chapter = isset($_GET['chapter']) ? (int)$_GET['chapter'] : 1;

    // 4. 조건절 구성
    $conditions = [
        'book'    => $book,
        'chapter' => $chapter
    ];

    // 5. DB에서 bibles_woori 테이블 데이터 조회
    $verses = getTableData($pdo, 'bibles_woori', $conditions, 200);

    // 6. 성공 응답 (JSON)
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'count'  => count($verses),
        'data'   => $verses
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $e) {
    // 보안 이슈(허용되지 않은 테이블 등) 예외 처리
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // 기타 서버 오류 예외 처리
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
