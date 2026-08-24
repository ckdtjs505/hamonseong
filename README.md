# 📖 청소년부 성경 읽기 (L&G Youth Bible Reading)

> **함께 온전히 성경읽기 — 함온성**  
> 사랑과 은혜 교회 청소년부를 위한 매일 성경 읽기 & 묵상 기록 웹 애플리케이션

[![Domain](https://img.shields.io/badge/서비스-hamonseong.com-blue)](https://hamonseong.com)
[![Language](https://img.shields.io/badge/language-HTML%20%2F%20JS%20%2F%20PHP-orange)](#)
[![DB](https://img.shields.io/badge/database-MySQL-4479A1)](#)

---

## 🌐 서비스 접속

| 환경 | URL |
|------|-----|
| 메인 도메인 | https://hamonseong.com |
| 보조 도메인 (카페24) | https://ckdtjst505.mycafe24.com |

> 두 도메인 모두 동일한 서버에서 서비스됩니다. `API_BASE_URL`은 접속 도메인을 자동으로 감지하여 동일 도메인으로 API를 호출합니다.

---

## ✨ 주요 기능

### 📅 성경 읽기 계획 (Bible Reading Plan)
- **날짜별 읽기 범위 표시**: 관리자가 등록한 날짜별 성경 읽기 계획을 자동으로 불러옵니다.
- **성경 본문 렌더링**: 계획에 따른 말씀 구절을 선택한 번역본으로 실시간 조회합니다.
- **날짜 네비게이션**: 이전/다음 날짜, 직접 날짜 선택, 오늘 버튼으로 원하는 날짜의 말씀 확인 가능.

### 📖 성경 번역본 선택
- **우리말성경** (기본값)
- **개역개정**
- **새한글성경**

### 🌗 테마 & 글자 크기
- **라이트 모드** / **다크 모드** / **페이퍼 모드** (3가지 테마)
- 글자 크기 A− / A+ 버튼으로 개인 맞춤 조정 (0.85rem ~ 2.0rem)
- 마지막 설정은 `localStorage`에 저장되어 다음 방문 시 자동 복원

### ✅ 함온성 (함께 온전히 성경읽기) 완료 기록
- **구절 선택**: 읽은 말씀 중 감동받은 구절을 클릭하여 선택
- **완료 모달**: 선택한 구절 + 오늘의 묵상 한 줄 + 서로를 위한 기도제목 3개 항목 입력
- **기록 저장**: 서버 DB에 저장되며, 이미 완료한 날짜는 배너로 안내 및 수정 가능
- **나의 기도함**: 로그인 사용자가 과거에 작성한 모든 함온성 기록을 시간순으로 확인

### 📊 커뮤니티 대시보드
- **친구들 현황 & 묵상 피드**: 같은 청소년부 친구들의 오늘 완독 현황, 누적 횟수, 최신 묵상/기도 피드
- **인기 말씀 TOP 10**: 친구들이 함온성 작성 시 가장 많이 선택한 구절 랭킹
- **열정 랭킹**: 누적 함온성 완료 횟수 기반 멤버 랭킹

### 🔐 인증 (Auth)
- **회원가입**: 실명 + 아이디 + 비밀번호 (아이디 중복 체크 포함)
- **로그인 / 로그아웃**: PHP 세션 기반 인증
- **관리자(admin) 권한**: role이 `admin`인 계정은 어드민 페이지 접근 가능

### 🛠 관리자 페이지 (`/admin`)
- 읽기 계획 등록 / 수정 / 삭제
- 회원 목록 조회 및 역할(role) 변경 / 회원 삭제
- 함온성 로그 전체 조회 및 개별 삭제

---

## 🗂 프로젝트 구조

```
L-G-youth-bible-reading/
│
├── index.html              # 메인 페이지 (클라이언트 앱 진입점)
├── README.md
│
├── css/
│   ├── style.css           # 메인 페이지 스타일 (테마 포함)
│   └── admin.css           # 관리자 페이지 전용 스타일
│
├── admin/
│   └── index.html          # 관리자 페이지
│
├── js/
│   ├── core/
│   │   ├── constants.js    # 성경 66권 데이터, API_BASE_URL 설정
│   │   └── utils.js        # 공통 헬퍼 함수 (날짜 포맷, 구절 ID 변환 등)
│   │
│   ├── client/
│   │   ├── state.js        # 전역 상태 및 DOM 요소 참조
│   │   ├── app.js          # 앱 진입점 (초기화, API 데이터 페칭)
│   │   │
│   │   ├── ui/
│   │   │   └── renderer.js # 성경 본문 UI 렌더링 담당
│   │   │
│   │   └── features/
│   │       ├── auth.js         # 로그인/회원가입/세션 체크
│   │       ├── hamonseong.js   # 함온성 완료 기록 저장/복원
│   │       ├── prayer.js       # 나의 기도함 (기록 조회)
│   │       └── community.js    # 커뮤니티 대시보드
│   │
│   └── admin/
│       ├── main.js         # 관리자 페이지 진입점
│       ├── plans.js        # 읽기 계획 관리
│       ├── users.js        # 회원 관리
│       └── logs.js         # 함온성 로그 관리
│
└── api/
    ├── common/
    │   ├── cors_session.php    # CORS 헤더 + 세션 시작 공통 처리
    │   ├── db_connect.php      # DB 연결 (환경변수 또는 직접 설정)
    │   ├── db_helper.php       # DB 헬퍼 함수
    │   └── ensure_tables.php   # 테이블 자동 생성 (첫 실행 시)
    │
    ├── auth/
    │   ├── login.php           # 로그인 처리
    │   ├── logout.php          # 로그아웃 처리
    │   ├── register.php        # 회원가입 처리
    │   └── check_session.php   # 세션 유효성 확인
    │
    ├── bible/
    │   ├── get_plan.php        # 날짜별 읽기 계획 조회
    │   └── get_word.php        # 성경 본문 구절 조회
    │
    ├── hamonseong/
    │   ├── save_completion.php     # 함온성 완료 기록 저장
    │   ├── get_completions.php     # 내 기록 조회
    │   ├── delete_completion.php   # 기록 삭제
    │   └── get_community_stats.php # 커뮤니티 통계 및 인기 말씀
    │
    ├── admin/
    │   ├── check.php           # 관리자 권한 확인
    │   ├── save_plan.php       # 읽기 계획 저장
    │   ├── get_all_plans.php   # 전체 계획 조회
    │   ├── delete_plan.php     # 계획 삭제
    │   ├── get_users.php       # 전체 회원 조회
    │   ├── update_role.php     # 회원 역할 변경
    │   ├── delete_user.php     # 회원 삭제
    │   ├── get_logs.php        # 함온성 로그 조회
    │   └── delete_log.php      # 로그 삭제
    │
    └── db/
        ├── schema_read_plan.sql    # 읽기 계획 테이블 DDL
        └── schema_hamonseong.sql   # 함온성 기록 테이블 DDL
```

---

## 🗄 데이터베이스 스키마

### `read_plan` — 성경 읽기 계획

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INT (PK) | 자동 증가 인덱스 |
| `week` | INT | 주차 번호 |
| `daycount` | INT | 일차 번호 |
| `date` | DATE | 읽기 날짜 |
| `lang` | VARCHAR(50) | 언어/번역 구분 |
| `book` | VARCHAR(50) | 성경 책 이름 |
| `start` | INT | 시작 장 |
| `end` | INT | 끝 장 |
| `img` | VARCHAR(50) | 관련 이미지 |
| `videoId` | VARCHAR(50) | 유튜브 영상 ID |

### `hamonseong_logs` — 함온성 완료 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INT (PK) | 자동 증가 인덱스 |
| `user_id` | INT | 사용자 ID (FK) |
| `timestamp` | VARCHAR(50) | 기록 날짜 (예: `2026. 1. 5`) |
| `name` | VARCHAR(50) | 사용자 이름 |
| `daycnt` | INT | 읽기 회차 |
| `myMessage` | TEXT | 선택한 성경 구절 모음 |
| `pray` | TEXT | 오늘의 묵상 & 기도 |
| `prayForUser` | TEXT | 서로를 위한 기도제목 |
| `created_at` | DATETIME | 생성 일시 |

---

## ⚙️ JavaScript 로드 순서

`index.html`에서 스크립트는 의존성 순서에 따라 아래 순서로 로드됩니다:

```
1. js/core/constants.js   — 성경 66권 데이터, API_BASE_URL
2. js/client/state.js     — 전역 상태 & DOM 요소 참조
3. js/core/utils.js       — 공통 헬퍼 함수
4. js/client/ui/renderer.js  — UI 렌더링
5. js/client/features/auth.js        — 인증
6. js/client/features/hamonseong.js  — 함온성 기능
7. js/client/features/prayer.js      — 기도 기록
8. js/client/features/community.js   — 커뮤니티 대시보드
9. js/client/app.js       — 진입점 (initApp 실행)
```

---

## 🚀 배포 (SFTP)

VS Code **SFTP 확장**을 사용하여 저장 시 자동 업로드 설정이 되어 있습니다.

| 항목 | 값 |
|------|----|
| 호스트 | 카페24 서버 |
| 프로토콜 | SFTP (포트 22) |
| 원격 경로 | `./www` |
| 자동 업로드 | `uploadOnSave: true` |

> `.vscode/sftp.json`에 서버 접속 정보가 포함되어 있습니다.  
> ⚠️ **이 파일은 절대 공개 저장소에 커밋하지 마세요.** `.gitignore`에 등록하는 것을 권장합니다.

---

## 🔧 로컬 개발 환경

이 프로젝트는 별도의 빌드 도구 없이 **Vanilla HTML/CSS/JS + PHP 백엔드**로 구성되어 있습니다.

- **프론트엔드**: 정적 파일 (빌드 불필요)
- **백엔드(API)**: PHP 7.4+ 및 MySQL 필요
- **로컬 테스트**: XAMPP, MAMP, Laravel Valet 등 로컬 PHP 서버 사용 권장

```bash
# 예시: PHP 내장 서버로 로컬 실행
php -S localhost:8080
```

---

## 🌏 다국어 & 접근성

- UI 언어: **한국어**
- 성경 번역: 우리말성경 / 개역개정 / 새한글
- `aria-label` 속성으로 스크린 리더 지원
- 반응형 디자인 (모바일 우선)

---

## 📌 개발 메모

- `API_BASE_URL`은 접속 도메인(`location.origin`)을 자동 감지합니다.  
  `hamonseong.com` 또는 `ckdtjst505.mycafe24.com` 어느 쪽에서 접속해도 동일하게 동작합니다.
- 성경 책 이름 별칭(예: `오바디야 → 오바댜`, `스카리야 → 스가랴`)이 `BIBLE_BOOK_IDS`에 포함되어 있어 다양한 표기 호환 가능.
- 함온성 기록은 `user_id` + `timestamp` 조합으로 날짜별 중복 저장을 방지합니다.

---

## 📞 관리자 문의

사랑과 은혜 교회 담당자에게 문의하세요.
