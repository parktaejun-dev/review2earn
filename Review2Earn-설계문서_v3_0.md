<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 다운로드가 안돼. 글씨가 다 깨져. 그냥 대화창에 쭉 적어줘. 내보내기 버튼으로 저장할께

알겠습니다! 전체 설계 문서를 대화창에 작성하겠습니다. 조금 길지만 완전한 내용입니다!

***

# 🎯 Review2Earn (리뷰투언) - 최종 설계 문서 v3.0

**버전:** 3.0 (제품별 요율 시스템 추가)
**작성일:** 2025년 10월 7일
**프로젝트:** 카페24 기반 리뷰 추천 구매 자동 보상 시스템

***

## 📌 1. 프로젝트 개요

### 1.1 목표

**리뷰투언(Review2Earn)**은 카페24 쇼핑몰에서 리뷰를 통한 구매 전환 시, 리뷰 작성자와 구매자에게 자동으로 보상을 지급하는 성과형 마케팅 플랫폼입니다.

### 1.2 핵심 가치 제안

- **리뷰 작성자(A):** 자신의 리뷰를 보고 구매한 사람이 있으면 **구매액의 x%를 적립금**으로 무제한 수익
- **구매자(B):** 리뷰를 통해 구매 시 **y% 할인 쿠폰** 자동 발급
- **쇼핑몰 운영자:** 실제 구매 발생 시에만 **비용 지불** (성과형 과금)
    - 리뷰 작성자 x% + 구매자 y% + 플랫폼 수수료 z%
    - **플랫폼 수수료 자동 계산:** z = (x + y) × 0.25
    - **최소 요율:** x ≥ 1%, y ≥ 1%, z ≥ 0.5%


### 1.3 보상 비율 시스템 (v3.0 신규)

**3단계 우선순위:**

1. **제품별 설정** - 특정 제품에 개별 요율 적용 가능
2. **쇼핑몰 기본 설정** - 전체 쇼핑몰의 기본 요율
3. **시스템 기본값** - 설정이 없을 경우 (1%, 1%, 0.5%)

**예시 1 (기본 요율):**

- 구매액: 100,000원
- 리뷰 작성자 적립금: 1,000원 (1%)
- 구매자 할인: 1,000원 (1%)
- 쇼핑몰 부담: 2,500원 (2.5%)
- Review2Earn 수익: 500원 (0.5%)

**예시 2 (프리미엄 제품 - 2%, 2%):**

- 구매액: 100,000원
- 리뷰 작성자 적립금: 2,000원 (2%)
- 구매자 할인: 2,000원 (2%)
- 플랫폼 수수료: 1,000원 (1% = (2+2)×0.25)
- 쇼핑몰 부담: 5,000원 (5%)

***

## 🎯 2. 핵심 비즈니스 플로우

### 2.1 전체 프로세스

```
Step 1: 리뷰 작성 (회원 A)
  ↓ 카페24 쇼핑몰에서 구매 후 리뷰 작성
  ↓ ScriptTags로 삽입된 "참여하기" 버튼 클릭
  ↓ 동의 체크 → DB 저장

Step 2: 리뷰 자동 감지
  ↓ 카페24 Webhook (board/product/created)
  ↓ Review2Earn API: 추천 코드 생성 (10자리 nanoid)
  ↓ DB 저장: reviews 테이블

Step 3: 추천 버튼 표시 (회원 B)
  ↓ 리뷰 페이지에 ScriptTags로 버튼 삽입
  ↓ Review2Earn API 호출: 추천 코드 조회
  ↓ "리뷰로 1% 할인받기!" 버튼 생성

Step 4: 구매 전환 추적 (회원 B)
  ↓ 추천 버튼 클릭 → 제품 페이지 이동 (referral_code 포함)
  ↓ 구매 완료 → 카페24 Webhook (order/confirm)

Step 5: 보상 자동 지급
  ↓ Review2Earn API: 추천 코드 확인
  ↓ 제품별/쇼핑몰별 보상 요율 조회
  ↓ 보상 계산 (리뷰어, 구매자, 플랫폼)
  ↓ DB 저장: transactions 테이블
  ↓ 카페24 API: 적립금 지급 (A)
  ↓ 카페24 API: 쿠폰 발급 (B)
```


### 2.2 참여자별 역할

| 참여자 | 역할 | 보상/비용 |
| :-- | :-- | :-- |
| 리뷰 작성자 (A) | 솔직한 리뷰 작성 | 구매액의 x% 적립금 (반복 수익) |
| 구매자 (B) | 리뷰를 보고 구매 | y% 할인 쿠폰 자동 발급 |
| 쇼핑몰 운영자 | 제품 판매 | (x+y+z)% 비용 (구매 완료 시만) |
| Review2Earn | 기술 플랫폼 제공 | z = (x+y)×0.25% 수수료 |


***

## 🏗️ 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────┐
│         카페24 쇼핑몰 (dhdshop.cafe24.com)         │
│  - OAuth 2.0 인증                                │
│  - ScriptTags API (스크립트 삽입)                 │
│  - Boards API (리뷰 조회)                        │
│  - Orders API (주문 조회)                        │
│  - Webhooks (리뷰/주문 이벤트)                    │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│      Review2Earn Backend (review2earn.vercel.app)│
│  - Next.js 14 App Router                        │
│    - OAuth 콜백 처리                             │
│    - ScriptTags 관리                             │
│    - API 엔드포인트                               │
│    - Webhook 수신                                │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│     PostgreSQL Database (Vercel Postgres)       │
│  - 쇼핑몰 설정 (mall_settings)                   │
│  - 동의 관리 (consents)                         │
│  - 리뷰 추적 (reviews)                          │
│  - 거래 내역 (transactions)                     │
│  - 제품별 요율 (product_rewards) ★ NEW          │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│            카페24 프론트엔드 스크립트              │
│  - review-consent.js (동의 팝업)                 │
│  - review-buttons.js (추천 버튼 생성)            │
└─────────────────────────────────────────────────┘
```


***

## 💾 4. 데이터베이스 설계

### 4.1 ERD

```
mall_settings (1) ──< (N) product_rewards ★ NEW
     │
     ├──< consents (N)
     │
     ├──< reviews (N)
     │        │
     │        └──< transactions (N)
     │
     └──< transactions (N)
```


### 4.2 테이블 상세 스키마

#### 4.2.1 mall_settings (쇼핑몰 설정)

```sql
CREATE TABLE mall_settings (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  api_version VARCHAR(20) DEFAULT '2025-09-01',
  
  -- 보상 비율 설정 ★ NEW
  reviewer_percent DECIMAL(5,2) DEFAULT 1.0,
  buyer_percent DECIMAL(5,2) DEFAULT 1.0,
  
  -- ScriptTag IDs
  scripttag_consent_id VARCHAR(50),
  scripttag_button_id VARCHAR(50),
  
  -- Webhook IDs
  webhook_review_id VARCHAR(50),
  webhook_order_id VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


#### 4.2.2 product_rewards (제품별 보상 설정) ★ NEW

```sql
CREATE TABLE product_rewards (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) NOT NULL,
  product_no INTEGER NOT NULL,
  reviewer_percent DECIMAL(5,2) NOT NULL CHECK (reviewer_percent >= 1.0),
  buyer_percent DECIMAL(5,2) NOT NULL CHECK (buyer_percent >= 1.0),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mall_id, product_no)
);

CREATE INDEX idx_product_rewards_mall_product 
  ON product_rewards(mall_id, product_no);
```


#### 4.2.3 consents (동의 관리)

```sql
CREATE TABLE consents (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) NOT NULL,
  member_id VARCHAR(100) NOT NULL,
  consented BOOLEAN DEFAULT true,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mall_id, member_id)
);

CREATE INDEX idx_consents_mall_member 
  ON consents(mall_id, member_id);
```


#### 4.2.4 reviews (리뷰 추적)

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) NOT NULL,
  review_id VARCHAR(100) NOT NULL,
  product_no INT NOT NULL,
  member_id VARCHAR(100) NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mall_id, review_id)
);

CREATE INDEX idx_reviews_mall ON reviews(mall_id);
CREATE INDEX idx_reviews_product ON reviews(mall_id, product_no);
CREATE INDEX idx_reviews_referral ON reviews(referral_code);
```


#### 4.2.5 transactions (거래 추적)

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  reviewer_member_id VARCHAR(100) NOT NULL,
  buyer_member_id VARCHAR(100) NOT NULL,
  order_amount DECIMAL(12, 2) NOT NULL,
  reviewer_reward DECIMAL(12, 2) NOT NULL,
  buyer_discount DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) NOT NULL,
  reward_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mall_id, order_id)
);

CREATE INDEX idx_transactions_mall ON transactions(mall_id);
CREATE INDEX idx_transactions_referral ON transactions(referral_code);
```


***

## 🔌 5. API 엔드포인트

### 5.1 OAuth 인증

#### POST /api/oauth/callback

카페24 OAuth 인증 완료 후 토큰 저장

**Request Body:**

```typescript
{
  code: string,
  mall_id: string
}
```

**Response:**

```typescript
{
  success: true,
  mall_id: string,
  token_saved: true
}
```


### 5.2 동의 관리

#### POST /api/consent

회원의 참여 동의 저장

**Request Body:**

```typescript
{
  mall_id: string,
  member_id: string,
  consented: boolean,
  ip_address?: string,
  user_agent?: string
}
```


#### GET /api/consent?mall_id={mall_id}\&member_id={member_id}

동의 여부 확인

**Response:**

```typescript
{
  consented: boolean
}
```


### 5.3 보상 요율 관리 ★ NEW

#### GET /api/rewards/rates?mall_id={mall_id}\&product_no={product_no}

제품별 또는 쇼핑몰 기본 요율 조회

**Response:**

```typescript
{
  reviewer_percent: number,  // 리뷰어 보상 %
  buyer_percent: number,     // 구매자 할인 %
  platform_percent: number,  // 플랫폼 수수료 % (자동 계산)
  source: "product" | "mall" | "default"
}
```


#### POST /api/rewards/mall

쇼핑몰 기본 요율 설정

**Request Body:**

```typescript
{
  mall_id: string,
  reviewer_percent: number,  // >= 1.0
  buyer_percent: number      // >= 1.0
}
```


#### POST /api/rewards/product

제품별 요율 설정

**Request Body:**

```typescript
{
  mall_id: string,
  product_no: number,
  reviewer_percent: number,  // >= 1.0
  buyer_percent: number,     // >= 1.0
  is_enabled: boolean
}
```


### 5.4 Webhook 수신

#### POST /api/webhooks/review

카페24 리뷰 작성 이벤트 수신

**Cafe24 Webhook Body:**

```typescript
{
  event_no: number,
  resource: {
    mall_id: string,
    event: "created",
    board_no: number,
    product_no: number,
    member_id: string,
    article_no: number
  }
}
```

**처리 로직:**

1. 회원 동의 여부 확인
2. 추천 코드 생성 (nanoid 10자리)
3. reviews 테이블에 저장

#### POST /api/webhooks/order

카페24 주문 확정 이벤트 수신

**Cafe24 Webhook Body:**

```typescript
{
  event_no: number,
  resource: {
    mall_id: string,
    event: "updated",
    order_id: string,
    member_id: string,
    order_amount: number,
    order_status: string,
    payment_status: string,
    referral_code?: string
  }
}
```

**처리 로직:**

1. 추천 코드 확인
2. 제품별/쇼핑몰별 보상 요율 조회 ★ NEW
3. 보상 금액 계산
    - reviewer_reward = order_amount × reviewer_percent / 100
    - buyer_discount = order_amount × buyer_percent / 100
    - platform_fee = order_amount × (reviewer_percent + buyer_percent) × 0.25 / 100
4. transactions 테이블에 저장
5. 카페24 API로 보상 지급

***

## 📂 6. 프로젝트 구조

```
review2earn/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── oauth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts          # OAuth 콜백
│   │   │   ├── consent/
│   │   │   │   └── route.ts              # 동의 저장/조회
│   │   │   ├── rewards/                  # ★ NEW
│   │   │   │   ├── rates/
│   │   │   │   │   └── route.ts          # 요율 조회
│   │   │   │   ├── mall/
│   │   │   │   │   └── route.ts          # 쇼핑몰 요율 설정
│   │   │   │   └── product/
│   │   │   │       └── route.ts          # 제품별 요율 설정
│   │   │   └── webhooks/
│   │   │       ├── review/
│   │   │       │   └── route.ts          # 리뷰 Webhook
│   │   │       └── order/
│   │   │           └── route.ts          # 주문 Webhook
│   │   └── page.tsx                      # 메인 페이지
│   └── lib/
│       └── db.ts                         # 데이터베이스 헬퍼 함수
├── public/
│   └── scripts/
│       ├── review-consent.js             # 동의 팝업
│       └── review-buttons.js             # 추천 버튼
├── .env.local                            # 환경 변수
├── package.json
└── tsconfig.json
```


***

## 🛠️ 7. 핵심 헬퍼 함수 (src/lib/db.ts)

### 7.1 기본 함수

```typescript
// 쇼핑몰 토큰 저장
export async function saveMallToken(...)

// 동의 저장
export async function saveConsent(...)

// 동의 확인
export async function checkConsent(mall_id, member_id)

// 리뷰 저장
export async function saveReview(...)

// 추천 코드로 리뷰 조회
export async function getReviewByReferralCode(referral_code)

// 거래 저장
export async function saveTransaction(...)
```


### 7.2 보상 요율 관리 함수 ★ NEW

```typescript
// 제품별/쇼핑몰별 요율 조회 (자동 우선순위)
export async function getRewardRates(
  mall_id: string, 
  product_no: number
): Promise<{
  reviewer_percent: number,
  buyer_percent: number,
  platform_percent: number  // (reviewer + buyer) × 0.25
}>

// 쇼핑몰 기본 요율 설정
export async function updateMallRewardRates(
  mall_id: string,
  reviewer_percent: number,
  buyer_percent: number
)

// 제품별 요율 설정
export async function setProductRewardRate(
  mall_id: string,
  product_no: number,
  reviewer_percent: number,
  buyer_percent: number,
  is_enabled: boolean = true
)

// 제품 참여 활성화/비활성화
export async function toggleProductReward(
  mall_id: string,
  product_no: number,
  is_enabled: boolean
)
```


***

## 🔐 8. 환경 변수 (.env.local)

```bash
# 카페24 OAuth
CAFE24_CLIENT_ID=your_client_id
CAFE24_CLIENT_SECRET=your_client_secret
CAFE24_REDIRECT_URI=https://review2earn.vercel.app/api/oauth/callback

# 데이터베이스
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NO_SSL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
POSTGRES_USER=username
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database

# Next.js
NEXT_PUBLIC_API_URL=https://review2earn.vercel.app
```


***

## 📦 9. 배포 가이드

### 9.1 Vercel 배포

1. **GitHub 연동**
    - Vercel 계정 로그인
    - GitHub 저장소 연결
2. **환경 변수 설정**
    - Vercel Dashboard → Settings → Environment Variables
    - .env.local의 모든 변수 입력
3. **자동 배포**
    - main 브랜치에 push하면 자동 배포
    - 도메인: https://review2earn.vercel.app

### 9.2 데이터베이스 마이그레이션

```bash
# Neon Postgres SQL Editor에서 실행

-- 1. 기존 테이블 생성 (이미 완료)
-- 2. 보상 요율 컬럼 추가
ALTER TABLE mall_settings
ADD COLUMN IF NOT EXISTS reviewer_percent DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS buyer_percent DECIMAL(5,2) DEFAULT 1.0;

-- 3. 제품별 요율 테이블 생성
CREATE TABLE IF NOT EXISTS product_rewards (
  id SERIAL PRIMARY KEY,
  mall_id VARCHAR(100) NOT NULL,
  product_no INTEGER NOT NULL,
  reviewer_percent DECIMAL(5,2) NOT NULL CHECK (reviewer_percent >= 1.0),
  buyer_percent DECIMAL(5,2) NOT NULL CHECK (buyer_percent >= 1.0),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mall_id, product_no)
);

CREATE INDEX IF NOT EXISTS idx_product_rewards_mall_product 
  ON product_rewards(mall_id, product_no);
```


***

## 🧪 10. 테스트 시나리오

### 10.1 기본 시나리오 (쇼핑몰 기본 요율)

1. **OAuth 인증**
    - 카페24 앱스토어에서 앱 설치
    - 토큰 저장 확인
2. **리뷰 작성 및 추천 코드 생성**
    - 회원 A가 리뷰 작성
    - "참여하기" 버튼 클릭 → 동의 저장
    - Webhook 수신 → 추천 코드 생성
3. **추천 버튼 표시**
    - 회원 B가 리뷰 페이지 방문
    - "리뷰로 1% 할인받기!" 버튼 표시
4. **구매 및 보상 지급**
    - 회원 B가 버튼 클릭 → 구매
    - 주문 확정 → Webhook 수신
    - 보상 계산: A 1,000원, B 1,000원, 플랫폼 500원
    - 적립금/쿠폰 자동 발급

### 10.2 제품별 요율 시나리오 ★ NEW

1. **프리미엄 제품 요율 설정**
    - 특정 제품(product_no: 123)에 2%, 2% 설정
    - product_rewards 테이블에 저장
2. **보상 계산 확인**
    - 해당 제품 구매 시
    - 보상 계산: A 2,000원 (2%), B 2,000원 (2%), 플랫폼 1,000원 (1%)
3. **제품 참여 비활성화**
    - 특정 제품 is_enabled = false
    - 해당 제품 리뷰에서 추천 버튼 미표시

***

## 📊 11. 성능 및 확장성

### 11.1 예상 부하

- **동시 접속자:** 1,000명
- **일일 리뷰 작성:** 5,000건
- **일일 주문 건수:** 1,000건
- **API 호출:** 50,000회/일


### 11.2 최적화 전략

1. **데이터베이스 인덱싱**
    - mall_id, member_id, referral_code에 인덱스 설정
2. **Webhook 응답 시간**
    - 카페24 요구사항: 24시간 내 200 응답
    - 비동기 처리로 즉시 200 응답 후 백그라운드 처리
3. **캐싱**
    - 보상 요율 조회 결과 Redis 캐싱 (추후 구현)
    - 자주 조회되는 리뷰 정보 캐싱

***

## 🚀 12. 다음 단계

### 12.1 완료된 작업 ✅

- [x] 데이터베이스 설계 및 구축
- [x] OAuth 인증 시스템
- [x] 동의 관리 API
- [x] 리뷰 Webhook 처리
- [x] 주문 Webhook 처리
- [x] 제품별/쇼핑몰별 보상 요율 시스템 ★ NEW


### 12.2 진행 중인 작업 🚧

- [ ] 프론트엔드 스크립트 개발
    - [ ] review-consent.js (동의 팝업)
    - [ ] review-buttons.js (추천 버튼)
- [ ] 관리자 대시보드
    - [ ] 통계 조회
    - [ ] 요율 설정 UI
    - [ ] 거래 내역 조회


### 12.3 향후 계획 📋

- [ ] 카페24 API 연동
    - [ ] 적립금 자동 지급
    - [ ] 쿠폰 자동 발급
- [ ] 이메일 알림 시스템
- [ ] 실시간 대시보드
- [ ] 모바일 앱 연동
- [ ] 다국어 지원

***

## 📞 13. 지원 및 문의

**개발자:** Park Tae Joon
**이메일:** parktaejun@gmail.com
**프로젝트 저장소:** (GitHub URL)
**라이브 데모:** https://review2earn.vercel.app

***

**문서 버전 히스토리:**

- v3.0 (2025-10-07): 제품별/쇼핑몰별 보상 요율 시스템 추가, 플랫폼 수수료 자동 계산 공식 추가
- v2.0 (2025-10-07): 최초 완성
- v1.0 (2025-10-06): 초안 작성

***

이상입니다! 이 내용을 복사해서 "내보내기" 버튼으로 저장하시면 됩니다!

