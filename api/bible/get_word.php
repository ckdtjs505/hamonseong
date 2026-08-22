<?php
require_once __DIR__ . '/../common/cors_session.php';

// 1. CORS 및 JSON 응답 헤더 설정
header("Content-Type: application/json; charset=UTF-8");

// OPTIONS (Preflight) 요청 들어왔을 때 즉시 종료


// 2. 공통 DB 모듈 불러오기
require_once __DIR__ . '/../common/db_helper.php';

try {
    if (!$pdo) {
        throw new Exception("DB 연결 실패");
    }

    // 3. 파라미터 파싱 (book, start, end 또는 chapter)
    $bookInput = isset($_GET['book']) ? $_GET['book'] : 1;
    $book      = is_numeric($bookInput) ? (int)$bookInput : trim($bookInput);

    if (isset($_GET['start'])) {
        $start = (int)$_GET['start'];
        $end   = isset($_GET['end']) ? (int)$_GET['end'] : $start;
    } elseif (isset($_GET['chapter'])) {
        $start = (int)$_GET['chapter'];
        $end   = $start;
    } else {
        $start = 1;
        $end   = 1;
    }

    // start와 end 범위 정렬
    $realStart = min($start, $end);
    $realEnd   = max($start, $end);

    // 4. SQL 쿼리 작성 (장(chapter) 범위 검색)
    $sql = "SELECT * FROM `bibles_woori` 
            WHERE `book` = :book 
              AND `chapter` >= :start 
              AND `chapter` <= :end";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':book', $book, is_int($book) ? PDO::PARAM_INT : PDO::PARAM_STR);
    $stmt->bindValue(':start', $realStart, PDO::PARAM_INT);
    $stmt->bindValue(':end', $realEnd, PDO::PARAM_INT);
    $stmt->execute();

    $verses = $stmt->fetchAll();

    // 5. 성공 응답 (JSON)
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'query'  => [
            'book'  => $book,
            'start' => $realStart,
            'end'   => $realEnd
        ],
        'count'  => count($verses),
        'data'   => $verses
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '데이터를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
