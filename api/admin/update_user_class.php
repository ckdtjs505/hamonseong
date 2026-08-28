<?php
/**
 * update_user_class.php
 * 사용자 반(Class) 정보 수정 API (관리자 전용)
 * 
 * 관리자가 특정 사용자의 소속 반(class_group)을 수정할 때 사용합니다.
 * 
 * 요청 방식: POST
 * 요청 바디(JSON):
 *  - id (int, 필수): 수정 대상 사용자의 ID
 *  - class_group (string, 선택): 새로운 반 이름 (예: "1반", "2반"). 빈 문자열이면 NULL로 저장
 */
require_once __DIR__ . '/../common/cors_session.php';
header("Content-Type: application/json; charset=UTF-8");

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 허용됩니다.']);
    exit();
}

// 관리자 권한 확인
require_once __DIR__ . '/check.php';
requireAdmin();
require_once __DIR__ . '/../common/ensure_tables.php';

try {
    if (!$pdo) {
        throw new Exception("데이터베이스 연결에 실패했습니다.");
    }

    // users 테이블 존재 여부 확인 (class_group 컬럼 마이그레이션 포함)
    ensureUsersTable($pdo);

    // 요청 바디에서 사용자 ID와 반 이름 추출
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $userId = $input['id'] ?? null;
    $classGroup = $input['class_group'] ?? null;

    // 필수값 검증: 사용자 ID가 없으면 에러
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => '사용자 ID가 필요합니다.']);
        exit();
    }

    // 반 정보 업데이트 (빈 문자열이면 NULL로 저장하여 "미지정" 상태로 처리)
    $stmt = $pdo->prepare("UPDATE `users` SET `class_group` = :class_group WHERE `id` = :id");
    $stmt->execute([
        'class_group' => $classGroup === '' ? null : $classGroup,
        'id' => $userId
    ]);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => '반 정보가 수정되었습니다.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => '반 정보 수정 중 오류가 발생했습니다: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
