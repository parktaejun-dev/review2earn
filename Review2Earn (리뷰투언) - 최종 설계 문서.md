<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 🎯 Review2Earn (리뷰투언) - 최종 설계 문서

**버전:** 2.0 (최종 확정)
**작성일:** 2025년 10월 7일
**프로젝트:** 카페24 기반 리뷰 추천 구매 자동 보상 시스템

***

## 📌 1. 프로젝트 개요

### 1.1 목표

**리뷰투언(Review2Earn)**은 카페24 쇼핑몰에서 리뷰를 통한 구매 전환 시, 리뷰 작성자와 구매자에게 자동으로 보상을 지급하는 성과형 마케팅 플랫폼입니다.

### 1.2 핵심 가치 제안

- **리뷰 작성자(A):** 자신의 리뷰를 보고 구매한 사람이 있으면 **구매액의 1%를 적립금**으로 무제한 수익
- **구매자(B):** 리뷰를 통해 구매 시 **1% 할인 쿠폰** 자동 발급
- **쇼핑몰 운영자:** 실제 구매 발생 시에만 **2.5% 비용** (성과형 과금)
    - 리뷰 작성자 1% + 구매자 1% + 플랫폼 수수료 0.5%


### 1.3 비즈니스 모델

| 구분 | 비용/수익 | 발생 시점 |
| :-- | :-- | :-- |
| 리뷰 작성자 적립금 | 구매액의 1% | 구매 완료 시 |
| 구매자 할인 쿠폰 | 구매액의 1% | 구매 완료 시 |
| 쇼핑몰 부담 비용 | 구매액의 2.5% | 구매 완료 시 (성과형) |
| Review2Earn 수수료 | 구매액의 0.5% | 구매 완료 시 |

**예시:**

- 구매액: 100,000원
- 리뷰 작성자 적립금: 1,000원
- 구매자 할인: 1,000원
- 쇼핑몰 부담: 2,500원
- Review2Earn 수익: 500원

***

## 🎯 2. 핵심 비즈니스 플로우

### 2.1 전체 프로세스

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 리뷰 작성 및 동의                                     │
└─────────────────────────────────────────────────────────────┘
고객(A)이 상품 구매 후 "리뷰 쓰기" 클릭
   ↓
리뷰 작성 페이지 로드
   ↓
ScriptTags 스크립트 실행 → 동의 팝업 자동 표시
┌──────────────────────────────────────────────────────────┐
│ 💰 리뷰투언 참여 안내                                      │
│                                                            │
│ 귀하의 리뷰를 보고 다른 고객이 구매하면,                   │
│ 구매액의 1%를 적립금으로 지급해드립니다!                   │
│                                                            │
│ ☑️ 리뷰투언에 참여하시겠습니까?                            │
│                                                            │
│ [다음에] [🎁 참여하기]                                     │
└──────────────────────────────────────────────────────────┘
   ↓
[참여하기] 클릭 → 동의 정보 저장 (DB + 쇼핑몰 관리자 알림)
   ↓
리뷰 작성 및 제출 (카페24 기본 리뷰 시스템)
   ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Webhook으로 리뷰 등록                                 │
└─────────────────────────────────────────────────────────────┘
카페24 Webhook: board_product_created
   ↓
Review2Earn 서버로 이벤트 전송
   ↓
동의 여부 확인 (DB 조회)
   ↓
✅ 동의한 경우: Review2Earn DB에 리뷰 등록
❌ 미동의 경우: 무시
   ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 상품 페이지에 버튼 표시                                │
└─────────────────────────────────────────────────────────────┘
다른 고객(B)이 상품 페이지 접속
   ↓
ScriptTags 스크립트 실행
   ↓
Review2Earn API 호출 → 활성 리뷰 목록 조회
   ↓
각 리뷰 옆에 버튼 표시:
┌──────────────────────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ 정말 좋은 제품입니다! - 홍길동              │
│                                                            │
│ [💰 이 리뷰로 구매하면 1% 할인!]                           │
│ [🎁 이 리뷰로 구매하기]                                    │
└──────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 구매 전환 추적                                        │
└─────────────────────────────────────────────────────────────┘
B가 버튼 클릭
   ↓
쿠키에 리뷰 ID 저장: r2e_ref=R2E-20251007-001
   ↓
장바구니에 상품 담기
   ↓
결제 진행
   ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: 구매 완료 시 자동 보상                                 │
└─────────────────────────────────────────────────────────────┘
카페24 Webhook: order_confirm
   ↓
Review2Earn 서버로 주문 정보 전송
   ↓
쿠키에서 리뷰 ID 확인
   ↓
리뷰 정보 조회 (리뷰 작성자 ID 확인)
   ↓
자동 보상 처리:
1. 카페24 API 호출 → A에게 1% 적립금 지급
2. 카페24 API 호출 → B에게 1% 할인 쿠폰 발급
3. Review2Earn DB에 거래 기록 저장
   ↓
✅ 완료!
```


***

## 🏗️ 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    카페24 쇼핑몰                          │
│  (dhdshop.cafe24.com)                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ OAuth 2.0
                         │ ScriptTags API
                         │ Boards API
                         │ Orders API
                         │ Webhooks
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Review2Earn 서버                            │
│        (review2earn.vercel.app)                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Next.js 14 App Router                            │   │
│  │  - OAuth 인증 처리                                │   │
│  │  - ScriptTags 설치                                │   │
│  │  - API 엔드포인트                                 │   │
│  │  - Webhook 처리                                   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database (Vercel Postgres)           │   │
│  │  - 사용자 동의 정보                               │   │
│  │  - 리뷰 등록 정보                                 │   │
│  │  - 거래 기록                                      │   │
│  │  - 쇼핑몰 설정                                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ 스크립트 제공
                         ↓
┌─────────────────────────────────────────────────────────┐
│            카페24 쇼핑몰 프론트엔드                        │
│                                                           │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │ review-consent.js │    │ review-buttons.js │          │
│  │ (동의 팝업)       │    │ (버튼 표시)       │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```


### 3.2 기술 스택

| 구분 | 기술 |
| :-- | :-- |
| **프론트엔드** | Next.js 14, React 18, TypeScript |
| **백엔드** | Next.js API Routes, TypeScript |
| **데이터베이스** | PostgreSQL (Vercel Postgres) |
| **배포** | Vercel (자동 배포, CDN, Edge Functions) |
| **인증** | OAuth 2.0 (카페24) |
| **API 통신** | REST API, Webhook |
| **스크립트** | Vanilla JavaScript (카페24 삽입용) |


***

## 📊 4. 데이터베이스 설계

### 4.1 ERD

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   consents      │       │    reviews      │       │  transactions   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ member_id       │◄──────┤ member_id       │◄──────┤ review_id (FK)  │
│ mall_id         │       │ mall_id         │       │ reviewer_id     │
│ consented       │       │ cafe24_board_no │       │ buyer_id        │
│ consented_at    │       │ product_no      │       │ order_id        │
│ ip_address      │       │ content         │       │ order_amount    │
│ user_agent      │       │ participate_r2e │       │ reviewer_reward │
│ created_at      │       │ created_at      │       │ buyer_discount  │
└─────────────────┘       └─────────────────┘       │ platform_fee    │
                                                      │ created_at      │
                                                      └─────────────────┘
                          ┌─────────────────┐
                          │ mall_settings   │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ mall_id (UNIQUE)│
                          │ access_token    │
                          │ refresh_token   │
                          │ token_expires_at│
                          │ is_active       │
                          │ created_at      │
                          └─────────────────┘
```


### 4.2 테이블 스키마

```sql
-- 1. 사용자 동의 정보
CREATE TABLE consents (
  id SERIAL PRIMARY KEY,
  member_id VARCHAR(100) NOT NULL,
  mall_id VARCHAR(100) NOT NULL,
  consented BOOLEAN DEFAULT false,
  consented_at TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, mall_id)
);

CREATE INDEX idx_consents_member ON consents(member_id, mall_id);

-- 2. 리뷰 등록 정보
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  cafe24_board_no INTEGER NOT NULL,
  member_id VARCHAR(100) NOT NULL,
  mall_id VARCHAR(100) NOT NULL,
  product_no INTEGER NOT NULL,
  content TEXT,
  participate_r2e BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cafe24_board_no, mall_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_no, mall_id);
CREATE INDEX idx_reviews_member ON reviews(member_id);

-- 3. 거래 (추천 구매) 기록
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id),
  reviewer_id VARCHAR(100) NOT NULL,
  buyer_id VARCHAR(100) NOT NULL,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  mall_id VARCHAR(100) NOT NULL,
  order_amount INTEGER NOT NULL,
  reviewer_reward INTEGER NOT NULL,
  buyer_discount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_reviewer ON transactions(reviewer_id);
CREATE INDEX idx_transactions_order ON transactions(order_id);

-- 4. 쇼핑몰 설정
CREATE TABLE mall_settings (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```


***

## 🔌 5. API 설계

### 5.1 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 | 인증 |
| :-- | :-- | :-- | :-- |
| **OAuth** |  |  |  |
| GET | `/api/oauth/authorize` | 카페24 OAuth 시작 | - |
| GET | `/api/oauth/callback` | OAuth 콜백 처리 | - |
| **설치** |  |  |  |
| POST | `/api/scripttags` | ScriptTag 설치 | OAuth Token |
| GET | `/api/scripttags` | ScriptTag 목록 조회 | OAuth Token |
| DELETE | `/api/scripttags` | ScriptTag 삭제 | OAuth Token |
| **동의** |  |  |  |
| POST | `/api/consent` | 사용자 동의 저장 | - |
| GET | `/api/consent/check` | 동의 여부 확인 | - |
| **리뷰** |  |  |  |
| GET | `/api/reviews/active` | 활성 리뷰 목록 조회 | - |
| **Webhook** |  |  |  |
| POST | `/api/webhook/board-created` | 리뷰 작성 이벤트 | Cafe24 Webhook |
| POST | `/api/webhook/order-complete` | 주문 완료 이벤트 | Cafe24 Webhook |
| **관리자** |  |  |  |
| GET | `/api/admin/dashboard` | 대시보드 데이터 | OAuth Token |
| GET | `/api/admin/transactions` | 거래 내역 조회 | OAuth Token |

### 5.2 주요 API 상세

#### 5.2.1 POST /api/consent

**요청:**

```json
{
  "member_id": "user123",
  "mall_id": "dhdshop",
  "consented": true,
  "timestamp": "2025-10-07T21:00:00Z"
}
```

**응답:**

```json
{
  "success": true,
  "message": "동의 정보가 저장되었습니다."
}
```


#### 5.2.2 GET /api/reviews/active

**요청:**

```
GET /api/reviews/active?product_no=12&mall_id=dhdshop
```

**응답:**

```json
{
  "success": true,
  "reviews": [
    {
      "id": 1,
      "cafe24_board_no": 45,
      "member_id": "user123",
      "product_no": 12,
      "content": "정말 좋은 제품입니다!",
      "created_at": "2025-10-07T20:00:00Z"
    }
  ]
}
```


#### 5.2.3 POST /api/webhook/board-created

**요청 (카페24에서 자동 전송):**

```json
{
  "event": "board_product_created",
  "mall_id": "dhdshop",
  "resource": {
    "no": 45,
    "member_id": "user123",
    "product_no": 12,
    "content": "정말 좋은 제품입니다!",
    "created_date": "2025-10-07T20:00:00Z"
  }
}
```

**응답:**

```json
{
  "success": true,
  "message": "리뷰가 등록되었습니다."
}
```


#### 5.2.4 POST /api/webhook/order-complete

**요청 (카페24에서 자동 전송):**

```json
{
  "event": "order_confirm",
  "mall_id": "dhdshop",
  "order_id": "20251007-12345",
  "buyer_id": "user456",
  "order_amount": 100000,
  "cookies": {
    "r2e_ref": "R2E-20251007-001"
  }
}
```

**응답:**

```json
{
  "success": true,
  "message": "보상이 지급되었습니다.",
  "transaction_id": 123
}
```


***

## 📁 6. 프로젝트 구조

```
review2earn/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── oauth/
│   │   │   │   ├── authorize/
│   │   │   │   │   └── route.ts
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── scripttags/
│   │   │   │   └── route.ts
│   │   │   ├── consent/
│   │   │   │   └── route.ts
│   │   │   ├── reviews/
│   │   │   │   ├── active/
│   │   │   │   │   └── route.ts
│   │   │   │   └── check/
│   │   │   │       └── route.ts
│   │   │   ├── webhook/
│   │   │   │   ├── board-created/
│   │   │   │   │   └── route.ts
│   │   │   │   └── order-complete/
│   │   │   │       └── route.ts
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       │   └── route.ts
│   │   │       └── transactions/
│   │   │           └── route.ts
│   │   ├── page.tsx                    # 메인 페이지 (OAuth 시작)
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db.ts                       # 데이터베이스 연결
│   │   ├── cafe24.ts                   # 카페24 API 클라이언트
│   │   └── utils.ts                    # 유틸리티 함수
│   └── types/
│       ├── cafe24.ts                   # 카페24 타입 정의
│       └── database.ts                 # DB 타입 정의
├── public/
│   └── scripts/
│       ├── review-consent.js           # 동의 팝업 스크립트
│       └── review-buttons.js           # 버튼 표시 스크립트
├── .env.local                          # 환경 변수
├── package.json
├── tsconfig.json
└── README.md
```


***

## 🔐 7. 보안 및 정책 준수

### 7.1 개인정보보호

- ✅ **명시적 동의:** 리뷰 작성 시 팝업으로 동의 받음
- ✅ **동의 기록:** IP, User-Agent, 타임스탬프 저장
- ✅ **데이터 최소화:** 필요한 정보만 수집 (회원ID, 리뷰 내용)
- ✅ **암호화:** 데이터베이스 연결 SSL/TLS
- ✅ **접근 제어:** OAuth 2.0 기반 인증


### 7.2 카페24 정책 준수

- ✅ **ScriptTags API 사용:** 공식 API로 스크립트 삽입
- ✅ **OAuth 2.0 인증:** 표준 인증 프로토콜
- ✅ **Webhook 사용:** 카페24 공식 Webhook
- ✅ **카페24 시스템 비수정:** 기본 기능 그대로 사용
- ✅ **성과형 과금:** 실제 구매 발생 시에만 비용

***

## 📈 8. 개발 일정

### 8.1 Phase 1: 핵심 기능 구현 (1-2주)

**Week 1:**

- ✅ 카페24 OAuth 연동
- ✅ ScriptTags API 구현
- 🔄 데이터베이스 설정
- 🔄 동의 팝업 스크립트
- 🔄 동의 API 구현

**Week 2:**

- 🔄 Webhook 구현 (리뷰 작성, 주문 완료)
- 🔄 버튼 표시 스크립트
- 🔄 적립금/쿠폰 발급 API 연동
- 🔄 거래 기록 저장


### 8.2 Phase 2: 테스트 및 디버깅 (1주)

- 🔄 단위 테스트
- 🔄 통합 테스트
- 🔄 실제 카페24 쇼핑몰 테스트
- 🔄 버그 수정


### 8.3 Phase 3: 관리자 대시보드 (1주)

- 🔄 거래 내역 조회
- 🔄 통계 대시보드
- 🔄 정산 리포트


### 8.4 Phase 4: 배포 및 출시 (1주)

- 🔄 프로덕션 배포
- 🔄 모니터링 설정
- 🔄 문서 작성
- 🔄 카페24 앱스토어 제출

**총 예상 기간:** 4-5주

***

## 🧪 9. 테스트 계획

### 9.1 테스트 시나리오

| 번호 | 시나리오 | 예상 결과 |
| :-- | :-- | :-- |
| 1 | OAuth 인증 | Access Token 획득 |
| 2 | ScriptTag 설치 | 스크립트 로드 확인 |
| 3 | 리뷰 작성 페이지 진입 | 동의 팝업 표시 |
| 4 | 동의 후 리뷰 작성 | DB에 동의 정보 저장 |
| 5 | 리뷰 제출 | Webhook 트리거, DB에 리뷰 등록 |
| 6 | 상품 페이지 접속 | 리뷰 옆 버튼 표시 |
| 7 | 버튼 클릭 → 장바구니 | 쿠키에 리뷰 ID 저장 |
| 8 | 구매 완료 | 적립금/쿠폰 자동 발급 |
| 9 | 거래 기록 조회 | 대시보드에서 확인 |


***

## 🚀 10. 배포 가이드

### 10.1 환경 변수 설정

```bash
# .env.local
POSTGRES_URL=postgresql://...
CAFE24_CLIENT_ID=WYht5QinOtql2mDJe0hVvA
CAFE24_CLIENT_SECRET=...
CAFE24_REDIRECT_URI=https://review2earn.vercel.app/api/oauth/callback
NEXT_PUBLIC_APP_URL=https://review2earn.vercel.app
```


### 10.2 배포 명령어

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. Vercel 배포
vercel --prod

# 4. 환경 변수 설정 (Vercel Dashboard)
# POSTGRES_URL, CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET 등
```


### 10.3 카페24 설정

1. **카페24 개발자센터**에서 앱 등록
2. **Webhook 설정:**
    - `board_product_created` → `https://review2earn.vercel.app/api/webhook/board-created`
    - `order_confirm` → `https://review2earn.vercel.app/api/webhook/order-complete`
3. **권한 요청:**
    - `mall.read_product`
    - `mall.read_order`
    - `mall.read_community`
    - `mall.write_community`
    - `mall.read_customer`
    - `mall.write_customer`
    - `mall.read_promotion`
    - `mall.write_promotion`

***

## 📞 11. 지원 및 문의

- **프로젝트:** Review2Earn (리뷰투언)
- **플랫폼:** 카페24 앱스토어
- **기술 스택:** Next.js 14, PostgreSQL, Vercel
- **문서 버전:** 2.0 (최종 확정)

***

**이 문서는 Review2Earn의 전체 목표, 설계, 구현 방법을 명확히 정의합니다.**

