<?php
require_once __DIR__ . '/../common/cors_session.php';

/**
 * 성경 말씀(구절) 조회 API
 *
 * 파라미터:
 * - book    : 성경 권 번호 또는 이름 (기본값: 1)
 * - start   : 시작 장 (또는 chapter)
 * - end     : 끝 장 (기본값: start와 동일)
 */
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../common/db_helper.php';

try {
    if (!$pdo) {
        throw new Exception("DB 연결 실패");
    }

    // 1. 파라미터 파싱: 성경 권(book) 확인. 없으면 기본값 1(창세기) 사용
    $bookInput = $_GET['book'] ?? 1;
    $book = is_numeric($bookInput) ? (int)$bookInput : trim($bookInput);

    // 2. 파라미터 파싱: 시작 장(start/chapter)과 끝 장(end) 확인
    if (isset($_GET['start'])) {
        // 'start' 파라미터가 있을 경우
        $start = (int)$_GET['start'];
        $end   = isset($_GET['end']) ? (int)$_GET['end'] : $start; // 'end' 파라미터가 없으면 start와 동일하게 설정
    } elseif (isset($_GET['chapter'])) {
        // 'chapter' 파라미터가 있을 경우 (단일 장 조회)
        $start = (int)$_GET['chapter'];
        $end   = $start;
    } else {
        // 둘 다 없으면 기본값 1장
        $start = 1;
        $end   = 1;
    }

    // 3. start와 end 값 정렬 (start가 항상 작거나 같도록 보장)
    $realStart = min($start, $end);
    $realEnd   = max($start, $end);

    // 4. 버전 파라미터 처리 및 테이블 이름 설정
    $versionParam = $_GET['version'] ?? 'woori';
    $allowedVersions = [
        'woori' => 'bibles_woori',
        'krv' => 'bibles_krv',
        'shg' => 'bibles_shg'
    ];
    $tableName = $allowedVersions[$versionParam] ?? 'bibles_woori';

    // 5. 데이터베이스 쿼리 실행: 장(chapter) 범위로 구절 검색
    // $tableName은 허용된 문자열 중 하나임이 보장되므로 안전합니다.
    $stmt = $pdo->prepare("
        SELECT * FROM `$tableName`
        WHERE `book` = :book AND `chapter` >= :start AND `chapter` <= :end
    ");
    
    // book 파라미터는 문자열일 수도, 정수일 수도 있으므로 타입에 맞게 바인딩
    $stmt->bindValue(':book', $book, is_int($book) ? PDO::PARAM_INT : PDO::PARAM_STR);
    $stmt->bindValue(':start', $realStart, PDO::PARAM_INT);
    $stmt->bindValue(':end', $realEnd, PDO::PARAM_INT);
    $stmt->execute();

    $verses = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'query'  => ['book' => $book, 'start' => $realStart, 'end' => $realEnd],
        'count'  => count($verses),
        'data'   => $verses
    ], JSON_UNESCAPED_UNICODE);

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
