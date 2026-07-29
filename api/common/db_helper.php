<?php
require_once __DIR__ . '/db_connect.php';

/**
 * 특정 테이블의 데이터를 안전하게 SELECT하는 함수
 *
 * @param PDO $pdo DB 객체
 * @param string $tableName 조회할 테이블명
 * @param array $conditions WHERE 조건 배열 (예: ['status' => 'active'])
 * @param int $limit 가져올 개수
 * @return array 조회 결과
 */
function getTableData(PDO $pdo, string $tableName, array $conditions = [], int $limit = 100): array 
{
    // 1. 허용된 테이블만 조회 가능하도록 화이트리스트 검증 (보안)
    $allowedTables = ['bibles_woori']; // 허용할 테이블 목록 지정
    if (!in_array($tableName, $allowedTables, true)) {
        throw new InvalidArgumentException("허용되지 않은 테이블 접근입니다.");
    }

    // 2. 기본 SELECT 쿼리 생성
    $sql = "SELECT * FROM `{$tableName}`";
    
    // 3. WHERE 조건 처리
    $whereClause = [];
    $params = [];
    
    if (!empty($conditions)) {
        foreach ($conditions as $column => $value) {
            // 컬럼명에는 영문, 숫자, 언더바만 허용 (보안)
            if (preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
                $whereClause[] = "`{$column}` = :{$column}";
                $params[$column] = $value;
            }
        }
        
        if (!empty($whereClause)) {
            $sql .= " WHERE " . implode(" AND ", $whereClause);
        }
    }

    // 4. LIMIT 처리
    $sql .= " LIMIT " . (int)$limit;

    // 5. 쿼리 실행
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
}
