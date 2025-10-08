# 🎯 Review2Earn (리뷰투언) - 최종 설계 문서 v4.0

**버전:** 4.0 (Phase 1 OAuth + ScriptTags 구현 완료)  
**작성일:** 2025년 10월 8일  
**프로젝트:** 카페24 기반 리뷰 추천 구매 자동 보상 시스템  
**저장소:** https://github.com/parktaejun/review2earn  
**배포 URL:** https://review2earn.vercel.app

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [핵심 비즈니스 플로우](#2-핵심-비즈니스-플로우)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [Phase 1 구현 완료](#5-phase-1-구현-완료)
6. [Phase 2 개발 계획](#6-phase-2-개발-계획)
7. [Phase 3 개발 계획](#7-phase-3-개발-계획)
8. [Phase 4 개발 계획](#8-phase-4-개발-계획)
9. [API 명세](#9-api-명세)
10. [보안 및 성능](#10-보안-및-성능)
11. [배포 및 운영](#11-배포-및-운영)
12. [개발 일정](#12-개발-일정)

---

## 📌 1. 프로젝트 개요

### 1.1 목표

**리뷰투언(Review2Earn)**은 카페24 쇼핑몰에서 리뷰를 통한 구매 전환 시, 리뷰 작성자와 구매자에게 자동으로 보상을 지급하는 성과형 마케팅 플랫폼입니다.

**핵심 차별점:**
- ✅ 광고비를 사전에 지불하지 않음 (성과형 과금)
- ✅ 리뷰 작성자가 반복적으로 수익 창출 가능
- ✅ 구매자는 신뢰도 높은 리뷰 기반 구매 유도
- ✅ 쇼핑몰은 실제 매출 발생 시에만 비용 지불

### 1.2 핵심 가치 제안

| 참여자 | 가치 제안 | 보상/비용 |
|--------|----------|----------|
| **리뷰 작성자 (A)** | 작성한 리뷰를 통해 구매 발생 시 지속적 수익 | 구매액의 **x%** 적립금 (무제한 반복) |
| **구매자 (B)** | 신뢰도 높은 리뷰 기반 구매 결정 + 할인 혜택 | **y%** 할인 쿠폰 자동 발급 |
| **쇼핑몰 운영자** | 실제 구매 발생 시에만 비용 지불 (성과형) | **(x + y + z)%** 비용 |
| **Review2Earn** | 플랫폼 운영 및 기술 제공 | **z = (x + y) × 0.25%** 수수료 |

---

### 1.3 보상 비율 시스템 (v3.0에서 도입)

#### 1.3.1 자동 계산 공식

```
플랫폼 수수료 (z) = (리뷰 작성자 비율(x) + 구매자 할인(y)) × 0.25

쇼핑몰 총 부담 = x + y + z
```

**예시:**
- x = 2%, y = 2% → z = (2 + 2) × 0.25 = **1%** → 총 부담 **5%**
- x = 5%, y = 5% → z = (5 + 5) × 0.25 = **2.5%** → 총 부담 **12.5%**

#### 1.3.2 최소 요율 제한

| 항목 | 최소값 | 최대값 | 기본값 |
|------|--------|--------|--------|
| 리뷰 작성자 비율 (x) | 1% | 제한없음 | 1% |
| 구매자 할인 (y) | 1% | 제한없음 | 1% |
| 플랫폼 수수료 (z) | 0.5% | 자동 계산 | 0.5% |

#### 1.3.3 3단계 우선순위 시스템

보상 비율은 다음 우선순위로 결정됩니다:

```
1순위: 제품별 설정 (ProductSettings)
   ↓ (없으면)
2순위: 쇼핑몰 기본 설정 (MallSettings.defaultRewardSettings)
   ↓ (없으면)
3순위: 시스템 기본값 (x=1%, y=1%, z=0.5%)
```

**의사결정 로직:**

```
function getRewardRates(mallId: string, productId: string) {
  // 1순위: 제품별 설정 확인
  const productSettings = await prisma.productSettings.findUnique({
    where: { mallId_productId: { mallId, productId } }
  });
  
  if (productSettings) {
    return {
      reviewerPercent: productSettings.reviewerPercent,
      buyerPercent: productSettings.buyerPercent,
      platformPercent: (productSettings.reviewerPercent + productSettings.buyerPercent) * 0.25
    };
  }
  
  // 2순위: 쇼핑몰 기본 설정
  const mallSettings = await prisma.mallSettings.findUnique({
    where: { mallId }
  });
  
  if (mallSettings?.defaultRewardSettings) {
    return mallSettings.defaultRewardSettings;
  }
  
  // 3순위: 시스템 기본값
  return {
    reviewerPercent: 1.0,
    buyerPercent: 1.0,
    platformPercent: 0.5
  };
}
```

---

### 1.4 보상 계산 예시

#### 예시 1: 기본 요율 (1%, 1%)

| 항목 | 계산식 | 금액 |
|------|--------|------|
| 구매액 | - | 100,000원 |
| 리뷰 작성자 적립금 (x=1%) | 100,000 × 0.01 | **1,000원** |
| 구매자 할인 (y=1%) | 100,000 × 0.01 | **1,000원** |
| 플랫폼 수수료 (z) | 100,000 × (1+1)×0.25% | **500원** |
| **쇼핑몰 부담 합계** | 1,000 + 1,000 + 500 | **2,500원 (2.5%)** |

#### 예시 2: 프리미엄 제품 (2%, 2%)

| 항목 | 계산식 | 금액 |
|------|--------|------|
| 구매액 | - | 100,000원 |
| 리뷰 작성자 적립금 (x=2%) | 100,000 × 0.02 | **2,000원** |
| 구매자 할인 (y=2%) | 100,000 × 0.02 | **2,000원** |
| 플랫폼 수수료 (z) | 100,000 × (2+2)×0.25% | **1,000원** |
| **쇼핑몰 부담 합계** | 2,000 + 2,000 + 1,000 | **5,000원 (5%)** |

#### 예시 3: 럭셔리 제품 (5%, 5%)

| 항목 | 계산식 | 금액 |
|------|--------|------|
| 구매액 | - | 1,000,000원 |
| 리뷰 작성자 적립금 (x=5%) | 1,000,000 × 0.05 | **50,000원** |
| 구매자 할인 (y=5%) | 1,000,000 × 0.05 | **50,000원** |
| 플랫폼 수수료 (z) | 1,000,000 × (5+5)×0.25% | **25,000원** |
| **쇼핑몰 부담 합계** | 50,000 + 50,000 + 25,000 | **125,000원 (12.5%)** |

#### 예시 4: 혼합 요율 (리뷰 작성자 3%, 구매자 1%)

| 항목 | 계산식 | 금액 |
|------|--------|------|
| 구매액 | - | 500,000원 |
| 리뷰 작성자 적립금 (x=3%) | 500,000 × 0.03 | **15,000원** |
| 구매자 할인 (y=1%) | 500,000 × 0.01 | **5,000원** |
| 플랫폼 수수료 (z) | 500,000 × (3+1)×0.25% | **5,000원** |
| **쇼핑몰 부담 합계** | 15,000 + 5,000 + 5,000 | **25,000원 (5%)** |

---

## 🎯 2. 핵심 비즈니스 플로우

### 2.1 전체 프로세스

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 리뷰 작성 (회원 A)                                        │
│   ↓ 카페24 쇼핑몰에서 구매 후 리뷰 작성                             │
│   ↓ ScriptTags로 삽입된 "Review2Earn 참여하기" 체크박스 표시       │
│   ↓ 동의 체크 → POST /api/consent → DB 저장                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: 리뷰 자동 감지                                            │
│   ↓ 카페24 Webhook: board/product/created                        │
│   ↓ POST /api/webhooks/review 수신                               │
│   ↓ Review2Earn: 추천 코드 생성 (10자리 nanoid)                  │
│   ↓ DB 저장: reviews 테이블                                       │
│   ↓ 제품별/쇼핑몰별 요율 조회 후 referrals 테이블 저장              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: 추천 버튼 표시 (회원 B)                                   │
│   ↓ 리뷰 페이지에 ScriptTags로 버튼 자동 삽입                       │
│   ↓ GET /api/reviews/{review_id}/button                          │
│   ↓ 제품별/쇼핑몰별 할인율 조회 → "리뷰로 y% 할인받기!" 버튼 생성   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: 구매 전환 추적 (회원 B)                                   │
│   ↓ 추천 버튼 클릭 → 제품 페이지 이동 (쿠키: r2e_ref=CODE)         │
│   ↓ 구매 완료 → 카페24 Webhook: order/confirm                     │
│   ↓ POST /api/webhooks/order 수신                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: 보상 자동 지급                                            │
│   ↓ 쿠키에서 추천 코드 확인                                        │
│   ↓ 제품별/쇼핑몰별 보상 요율 조회 (우선순위 적용)                   │
│   ↓ 보상 계산:                                                    │
│      - reviewer_reward = order_amount × x%                       │
│      - buyer_discount = order_amount × y%                        │
│      - platform_fee = order_amount × (x+y)×0.25%                 │
│   ↓ DB 저장: transactions 테이블                                  │
│   ↓ 카페24 API: 적립금 지급 (A)                                   │
│      POST /admin/customers/{customer_id}/mileage                │
│   ↓ 카페24 API: 쿠폰 발급 (B)                                     │
│      POST /admin/coupons                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 참여자별 상세 플로우

#### 2.2.1 리뷰 작성자 (A) 관점

```
1. 제품 구매 완료
   ↓
2. 리뷰 작성 페이지 접속
   ↓
3. "Review2Earn에 참여하기" 체크박스 확인
   - 체크 시: "이 리뷰로 구매가 발생하면 1% 적립금을 받습니다"
   ↓
4. 리뷰 제출
   ↓
5. 추천 링크 자동 생성 (백그라운드)
   ↓
6. 다른 사용자가 이 리뷰를 통해 구매
   ↓
7. 적립금 자동 지급 (알림 발송)
   ↓
8. 무제한 반복 수익 가능
```

#### 2.2.2 구매자 (B) 관점

```
1. 제품 페이지 접속
   ↓
2. 리뷰 확인
   ↓
3. "리뷰로 1% 할인받기!" 버튼 클릭
   ↓
4. 쿠키에 추천 코드 저장 (30일 유효)
   ↓
5. 제품 구매
   ↓
6. 1% 할인 쿠폰 자동 발급
   ↓
7. 다음 구매 시 자동 적용
```

#### 2.2.3 쇼핑몰 운영자 관점

```
1. Review2Earn 앱 설치
   ↓
2. OAuth 인증 완료
   ↓
3. 기본 요율 설정 (선택)
   - 전체 쇼핑몰: 1%, 1%
   - 특정 제품: 2%, 2% (프리미엄)
   ↓
4. ScriptTags 자동 설치 (원클릭)
   ↓
5. 리뷰 작성 시 자동 동작
   ↓
6. 구매 발생 시 보상 자동 지급
   ↓
7. 대시보드에서 실시간 통계 확인
   - 총 리뷰 수
   - 추천을 통한 구매 수
   - 지급한 보상 금액
```

---

## 🏗️ 3. 시스템 아키텍처

### 3.1 전체 구조도

```
┌──────────────────────────────────────────────────────────────┐
│              카페24 쇼핑몰 (mallId.cafe24.com)                │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  OAuth     │  │ ScriptTags │  │ Webhooks   │            │
│  │  인증      │  │ API        │  │ (리뷰/주문) │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Products   │  │ Orders     │  │ Customers  │            │
│  │ API        │  │ API        │  │ API        │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌──────────────────────────────────────────────────────────────┐
│           Review2Earn (review2earn.vercel.app)                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 App Router (Frontend + API)               │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Dashboard│  │  OAuth   │  │ Webhooks │           │  │
│  │  │ (Admin)  │  │  Handler │  │ Handler  │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  API Routes (Serverless Functions)                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐          │  │
│  │  │ /api/oauth/*     │  │ /api/scripttags  │          │  │
│  │  │ /api/consent     │  │ /api/reviews     │          │  │
│  │  │ /api/webhooks/*  │  │ /api/rewards     │          │  │
│  │  └──────────────────┘  └──────────────────┘          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Prisma ORM + PostgreSQL (Vercel Postgres)            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐   │  │
│  │  │ MallSettings │  │ Referrals    │  │ Rewards   │   │  │
│  │  │ Reviews      │  │ Transactions │  │ Webhooks  │   │  │
│  │  └──────────────┘  └──────────────┘  └───────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 기술 스택

#### 3.2.1 Frontend
- **Next.js 15.0** (App Router)
- **React 19**
- **TypeScript 5.6**
- **Tailwind CSS 3.4**

#### 3.2.2 Backend
- **Next.js API Routes** (Serverless Functions)
- **Prisma ORM 5.20**
- **PostgreSQL 16** (Vercel Postgres)

#### 3.2.3 배포 및 인프라
- **Vercel** (Frontend + Serverless Backend)
- **Vercel Postgres** (Database)
- **GitHub** (Version Control)

#### 3.2.4 외부 API
- **Cafe24 Admin API v2**
  - OAuth 2.0 인증
  - ScriptTags API
  - Products API
  - Orders API
  - Customers API (적립금 지급)
  - Coupons API

## 4. 데이터베이스 설계

### 4.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│  MallSettings   │
│─────────────────│
│ id (PK)         │
│ mallId (UK)     │◄──────────┐
│ accessToken     │           │
│ refreshToken    │           │
│ expiresAt       │           │
│ scopes          │           │
│ isActive        │           │
└─────────────────┘           │
                              │
┌─────────────────┐           │
│ ProductSettings │           │
│─────────────────│           │
│ id (PK)         │           │
│ mallId (FK)     │───────────┤
│ productId       │           │
│ reviewerPercent │           │
│ buyerPercent    │           │
└─────────────────┘           │
                              │
┌─────────────────┐           │
│    Reviews      │           │
│─────────────────│           │
│ id (PK)         │           │
│ mallId (FK)     │───────────┤
│ reviewId        │           │
│ productId       │           │
│ customerId      │           │
│ isR2EEnabled    │           │
│ consentedAt     │           │
└─────────────────┘           │
        │                     │
        │                     │
        ▼                     │
┌─────────────────┐           │
│   Referrals     │           │
│─────────────────│           │
│ id (PK)         │           │
│ mallId (FK)     │───────────┤
│ reviewId (FK)   │           │
│ referralCode(UK)│           │
│ clicks          │           │
│ conversions     │           │
└─────────────────┘           │
        │                     │
        │                     │
        ▼                     │
┌─────────────────┐           │
│  Transactions   │           │
│─────────────────│           │
│ id (PK)         │           │
│ mallId (FK)     │───────────┘
│ orderId (UK)    │
│ referralId (FK) │
│ orderAmount     │
│ reviewerReward  │
│ buyerDiscount   │
│ platformFee     │
└─────────────────┘
```

### 4.2 Prisma Schema (완전판)

```
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

// ============================================
// Phase 1: OAuth & Settings (✅ 구현 완료)
// ============================================

model MallSettings {
  id                      String    @id @default(cuid())
  mallId                  String    @unique
  
  // OAuth 토큰
  accessToken             String
  refreshToken            String?
  expiresAt               DateTime
  scopes                  String
  
  // 기본 보상 설정 (JSON)
  defaultRewardSettings   Json?     // { reviewerPercent: 1.0, buyerPercent: 1.0 }
  
  // 앱 상태
  isActive                Boolean   @default(true)
  
  // 타임스탬프
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  // Relations
  productSettings         ProductSettings[]
  reviews                 Review[]
  referrals               Referral[]
  transactions            Transaction[]
  webhookLogs             WebhookLog[]
  
  @@map("mall_settings")
  @@index([mallId])
}

// ============================================
// Phase 2: 제품별 보상 설정 (계획)
// ============================================

model ProductSettings {
  id                String    @id @default(cuid())
  mallId            String
  productId         String
  
  // 보상 비율
  reviewerPercent   Decimal   @db.Decimal(5, 2) // 0.00 ~ 100.00
  buyerPercent      Decimal   @db.Decimal(5, 2)
  
  // 활성화 여부
  isActive          Boolean   @default(true)
  
  // 타임스탬프
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  mall              MallSettings @relation(fields: [mallId], references: [mallId], onDelete: Cascade)
  
  @@unique([mallId, productId])
  @@map("product_settings")
  @@index([mallId, productId])
}

// ============================================
// Phase 2: 리뷰 관리 (계획)
// ============================================

model Review {
  id                String    @id @default(cuid())
  mallId            String
  reviewId          String    // 카페24 리뷰 ID
  productId         String
  customerId        String
  customerEmail     String?
  
  // 리뷰 내용
  content           String?
  rating            Int?
  
  // Review2Earn 동의 여부
  isR2EEnabled      Boolean   @default(false)
  consentedAt       DateTime?
  
  // 타임스탬프
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  mall              MallSettings @relation(fields: [mallId], references: [mallId], onDelete: Cascade)
  referrals         Referral[]
  
  @@unique([mallId, reviewId])
  @@map("reviews")
  @@index([mallId, reviewId])
  @@index([mallId, productId])
  @@index([customerId])
}

// ============================================
// Phase 2: 추천 링크 (계획)
// ============================================

model Referral {
  id                String    @id @default(cuid())
  mallId            String
  reviewId          String
  referralCode      String    @unique // 10자리 nanoid
  
  // 통계
  clicks            Int       @default(0)
  conversions       Int       @default(0)
  totalRevenue      Decimal   @default(0) @db.Decimal(10, 2)
  totalReward       Decimal   @default(0) @db.Decimal(10, 2)
  
  // 활성화 상태
  isActive          Boolean   @default(true)
  expiresAt         DateTime? // 만료 시간 (선택)
  
  // 타임스탬프
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  mall              MallSettings @relation(fields: [mallId], references: [mallId], onDelete: Cascade)
  review            Review    @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  transactions      Transaction[]
  
  @@map("referrals")
  @@index([referralCode])
  @@index([mallId, reviewId])
  @@index([createdAt])
}

// ============================================
// Phase 3: 거래 내역 (계획)
// ============================================

model Transaction {
  id                String    @id @default(cuid())
  mallId            String
  orderId           String    // 카페24 주문 ID
  referralId        String
  
  // 구매자 정보
  customerId        String
  customerEmail     String?
  
  // 제품 정보
  productId         String
  productName       String
  quantity          Int
  
  // 금액 정보
  orderAmount       Decimal   @db.Decimal(10, 2)
  reviewerReward    Decimal   @db.Decimal(10, 2) // x%
  buyerDiscount     Decimal   @db.Decimal(10, 2) // y%
  platformFee       Decimal   @db.Decimal(10, 2) // z%
  
  // 보상 지급 상태
  rewardStatus      String    @default("pending") // pending, processing, completed, failed
  rewardPaidAt      DateTime?
  
  // 할인 쿠폰 발급 상태
  couponStatus      String    @default("pending")
  couponCode        String?
  couponIssuedAt    DateTime?
  
  // 타임스탬프
  orderedAt         DateTime
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  mall              MallSettings @relation(fields: [mallId], references: [mallId], onDelete: Cascade)
  referral          Referral  @relation(fields: [referralId], references: [id])
  
  @@unique([mallId, orderId])
  @@map("transactions")
  @@index([mallId, orderId])
  @@index([referralId])
  @@index([customerId])
  @@index([rewardStatus])
  @@index([orderedAt])
}

// ============================================
// Phase 3: Webhook 로그 (계획)
// ============================================

model WebhookLog {
  id                String    @id @default(cuid())
  mallId            String
  event             String    // order.created, review.created, etc.
  payload           Json
  
  // 처리 상태
  processed         Boolean   @default(false)
  processedAt       DateTime?
  error             String?
  
  // 타임스탬프
  createdAt         DateTime  @default(now())
  
  // Relations
  mall              MallSettings @relation(fields: [mallId], references: [mallId], onDelete: Cascade)
  
  @@map("webhook_logs")
  @@index([mallId, event])
  @@index([processed])
  @@index([createdAt])
}
```

### 4.3 데이터베이스 마이그레이션

```
# 초기 마이그레이션 (Phase 1)
npx prisma migrate dev --name init

# 새 필드 추가 예시
npx prisma migrate dev --name add_product_settings

# 프로덕션 배포
npx prisma migrate deploy
```

### 4.4 인덱스 최적화 전략

| 테이블 | 인덱스 | 목적 |
|--------|--------|------|
| `MallSettings` | `mallId` (UNIQUE) | OAuth 토큰 조회 최적화 |
| `ProductSettings` | `(mallId, productId)` (UNIQUE) | 제품별 요율 조회 |
| `Reviews` | `(mallId, reviewId)` (UNIQUE) | 리뷰 중복 방지 |
| `Referrals` | `referralCode` (UNIQUE) | 추천 링크 추적 |
| `Transactions` | `(mallId, orderId)` (UNIQUE) | 주문 중복 방지 |
| `Transactions` | `rewardStatus` | 미지급 보상 조회 |
| `WebhookLog` | `(mallId, event)` | Webhook 이벤트 조회 |

---

## 5. Phase 1 구현 완료 (2025.10.08)

### 5.1 OAuth 2.0 인증 시스템

#### 5.1.1 구현 파일

```
src/app/api/oauth/
├── auth-url/route.ts         # OAuth URL 생성
├── callback/route.ts          # 토큰 교환 + DB 저장
└── verify/route.ts            # 토큰 권한 검증
```

#### 5.1.2 OAuth URL 생성 API

**Endpoint:** `POST /api/oauth/auth-url`

**Request Body:**
```
{
  "mallId": "review2earn"
}
```

**Response:**
```
{
  "success": true,
  "authUrl": "https://review2earn.cafe24.com/api/v2/oauth/authorize?response_type=code&client_id=WYht5QinOtql2mDJe0hVvA&state=eyJtYWxsSWQiOiJyZXZpZXcyZWFybiIsInRpbWVzdGFtcCI6MTc1OTkyODAxMTU4NH0&redirect_uri=https://review2earn.vercel.app/api/oauth/callback&scope=mall.read_product,mall.write_design"
}
```

**구현 코드:**

```
// src/app/api/oauth/auth-url/route.ts
import { NextRequest, NextResponse } from 'next/server';

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI!;

export async function POST(request: NextRequest) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { success: false, message: 'Mall ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // State 생성 (CSRF 방어)
    const state = Buffer.from(
      JSON.stringify({
        mallId,
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(7)
      })
    ).toString('base64');

    // OAuth URL 생성
    const authUrl = new URL(`https://${mallId}.cafe24.com/api/v2/oauth/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', CAFE24_CLIENT_ID);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('redirect_uri', CAFE24_REDIRECT_URI);
    authUrl.searchParams.append('scope', [
      'mall.read_product',
      'mall.read_order',
      'mall.read_community',
      'mall.write_community',
      'mall.read_customer',
      'mall.write_customer',
      'mall.read_promotion',
      'mall.write_promotion',
      'mall.read_design',
      'mall.write_design',
      'mall.read_application',
      'mall.write_application'
    ].join(','));

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString()
    });

  } catch (error) {
    console.error('OAuth URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

#### 5.1.3 OAuth Callback API

**Endpoint:** `GET /api/oauth/callback?code=xxx&state=yyy`

**처리 과정:**
1. State 검증 (CSRF 방어)
2. Authorization Code → Access Token 교환
3. DB에 토큰 저장 (MallSettings)
4. 프론트엔드로 리다이렉트

**구현 코드:**

```
// src/app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/?error=missing_params`
      );
    }

    // State 파싱 및 검증
    const stateData = JSON.parse(
      Buffer.from(state, 'base64').toString('utf-8')
    );

    const { mallId, timestamp } = stateData;

    // 타임스탬프 검증 (10분 유효)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/?error=expired_state`
      );
    }

    // Access Token 요청
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CAFE24_REDIRECT_URI,
        client_id: CAFE24_CLIENT_ID,
        client_secret: CAFE24_CLIENT_SECRET
      })
    });

    if (!tokenResponse.ok) {
      console.error('토큰 교환 실패:', await tokenResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // DB에 저장
    await prisma.mallSettings.upsert({
      where: { mallId },
      create: {
        mallId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        scopes: tokenData.scope,
        isActive: true
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        scopes: tokenData.scope,
        updatedAt: new Date()
      }
    });

    // 성공 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/?oauth_success=true&mall_id=${mallId}`
    );

  } catch (error) {
    console.error('OAuth Callback 오류:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/?error=server_error`
    );
  }
}
```

---

### 5.2 ScriptTags API 통합

#### 5.2.1 구현 파일

```
src/app/api/scripttags/
├── install/route.ts           # ScriptTag 설치
└── uninstall/route.ts         # ScriptTag 제거
```

#### 5.2.2 ScriptTag 설치 API

**Endpoint:** `POST /api/scripttags/install`

**Request Body:**
```
{
  "mallId": "review2earn"
}
```

**Response:**
```
{
  "success": true,
  "message": "✅ ScriptTag 설치 완료!",
  "scriptTagId": 12345
}
```

**구현 코드:**

```
// src/app/api/scripttags/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { mallId } = await request.json();

    // DB에서 Access Token 조회
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId }
    });

    if (!mallSettings || !mallSettings.accessToken) {
      return NextResponse.json(
        { success: false, message: 'OAuth 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const accessToken = mallSettings.accessToken;

    // 1. 기존 ScriptTag 확인
    const listUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (listResponse.ok) {
      const { scripttags } = await listResponse.json();
      const existing = scripttags.find(
        (tag: any) => tag.src === 'https://review2earn.vercel.app/scripts/review-consent.js'
      );

      if (existing) {
        return NextResponse.json({
          success: false,
          message: '⚠️ 이미 설치되어 있습니다.',
          scriptTagId: existing.script_no
        });
      }
    }

    // 2. 새 ScriptTag 설치
    const createUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: {
          src: 'https://review2earn.vercel.app/scripts/review-consent.js',
          display_location: ['BOARD_WRITE'],
          exclude_path: []
        }
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('ScriptTag 설치 실패:', errorText);
      return NextResponse.json(
        { success: false, message: '설치 실패', error: errorText },
        { status: 500 }
      );
    }

    const { scripttag } = await createResponse.json();

    return NextResponse.json({
      success: true,
      message: '✅ ScriptTag 설치 완료!',
      scriptTagId: scripttag.script_no
    });

  } catch (error) {
    console.error('ScriptTag 설치 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}
```
## 6. Phase 2 개발 계획 (리뷰 동의 + 추천 링크)

### 6.1 목표

- ✅ 리뷰 작성 시 Review2Earn 동의 수집
- ✅ 추천 링크 자동 생성
- ✅ 추천 링크 클릭 추적
- ✅ 리뷰 페이지에 추천 버튼 자동 삽입

### 6.2 구현 예정 API

#### 6.2.1 리뷰 동의 수집 API

**Endpoint:** `POST /api/consent`

**Request Body:**
```
{
  "mallId": "review2earn",
  "reviewId": "12345",
  "productId": "67890",
  "customerId": "user123",
  "customerEmail": "user@example.com"
}
```

**Response:**
```
{
  "success": true,
  "message": "Review2Earn 참여 완료!",
  "referralLink": "https://review2earn.cafe24.com/product/67890?ref=R2E1234567",
  "referralCode": "R2E1234567"
}
```

**구현 코드 (예정):**

```
// src/app/api/consent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { mallId, reviewId, productId, customerId, customerEmail } = await request.json();

    // 1. Review 레코드 생성
    const review = await prisma.review.upsert({
      where: { mallId_reviewId: { mallId, reviewId } },
      create: {
        mallId,
        reviewId,
        productId,
        customerId,
        customerEmail,
        isR2EEnabled: true,
        consentedAt: new Date()
      },
      update: {
        isR2EEnabled: true,
        consentedAt: new Date()
      }
    });

    // 2. 추천 코드 생성 (10자리)
    const referralCode = 'R2E' + nanoid(7);

    // 3. Referral 레코드 생성
    const referral = await prisma.referral.create({
      data: {
        mallId,
        reviewId: review.id,
        referralCode,
        isActive: true
      }
    });

    // 4. 추천 링크 생성
    const referralLink = `https://${mallId}.cafe24.com/product/${productId}?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      message: 'Review2Earn 참여 완료!',
      referralLink,
      referralCode
    });

  } catch (error) {
    console.error('Consent API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}
```

#### 6.2.2 추천 링크 추적 API

**Endpoint:** `GET /api/track?ref=R2E1234567`

**처리 과정:**
1. 추천 코드 유효성 확인
2. 클릭 수 증가 (Referrals.clicks + 1)
3. 쿠키에 추천 코드 저장 (30일 유효)
4. 제품 페이지로 리다이렉트

**구현 코드 (예정):**

```
// src/app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('ref');
    const productId = searchParams.get('product_id');

    if (!referralCode) {
      return NextResponse.redirect('/');
    }

    // Referral 조회
    const referral = await prisma.referral.findUnique({
      where: { referralCode },
      include: {
        review: true,
        mall: true
      }
    });

    if (!referral || !referral.isActive) {
      return NextResponse.redirect('/');
    }

    // 클릭 수 증가
    await prisma.referral.update({
      where: { referralCode },
      data: {
        clicks: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // 리다이렉트 URL 생성
    const redirectUrl = `https://${referral.mallId}.cafe24.com/product/${productId || referral.review.productId}`;
    
    const response = NextResponse.redirect(redirectUrl);

    // 쿠키 설정 (30일 유효)
    response.cookies.set('r2e_ref', referralCode, {
      maxAge: 30 * 24 * 60 * 60, // 30일
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Track API 오류:', error);
    return NextResponse.redirect('/');
  }
}
```

#### 6.2.3 리뷰 버튼 데이터 API

**Endpoint:** `GET /api/reviews/{reviewId}/button`

**Response:**
```
{
  "success": true,
  "hasReferral": true,
  "referralCode": "R2E1234567",
  "discountPercent": 1.0,
  "buttonText": "이 리뷰로 1% 할인받기!"
}
```

**구현 코드 (예정):**

```
// src/app/api/reviews/[reviewId]/button/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params;
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mall_id');

    if (!mallId) {
      return NextResponse.json(
        { success: false, message: 'Mall ID 필요' },
        { status: 400 }
      );
    }

    // Review 조회
    const review = await prisma.review.findUnique({
      where: { mallId_reviewId: { mallId, reviewId } },
      include: {
        referrals: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!review || !review.isR2EEnabled) {
      return NextResponse.json({
        success: true,
        hasReferral: false
      });
    }

    const referral = review.referrals;

    if (!referral) {
      return NextResponse.json({
        success: true,
        hasReferral: false
      });
    }

    // 보상 비율 조회 (우선순위: 제품별 > 쇼핑몰 > 기본값)
    const productSettings = await prisma.productSettings.findUnique({
      where: { mallId_productId: { mallId, productId: review.productId } }
    });

    let buyerPercent = 1.0;

    if (productSettings) {
      buyerPercent = Number(productSettings.buyerPercent);
    } else {
      const mallSettings = await prisma.mallSettings.findUnique({
        where: { mallId }
      });

      if (mallSettings?.defaultRewardSettings) {
        buyerPercent = (mallSettings.defaultRewardSettings as any).buyerPercent || 1.0;
      }
    }

    return NextResponse.json({
      success: true,
      hasReferral: true,
      referralCode: referral.referralCode,
      discountPercent: buyerPercent,
      buttonText: `이 리뷰로 ${buyerPercent}% 할인받기!`
    });

  } catch (error) {
    console.error('Button API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}
```

### 6.3 ScriptTag 스크립트 (review-consent.js)

**파일 위치:** `public/scripts/review-consent.js`

**기능:**
1. 리뷰 작성 페이지 감지
2. "Review2Earn 참여하기" 체크박스 추가
3. 리뷰 제출 시 동의 정보 전송

**구현 코드 (예정):**

```
// public/scripts/review-consent.js
(function() {
  'use strict';

  // 리뷰 작성 페이지인지 확인
  if (!window.location.pathname.includes('/board/product/write')) {
    return;
  }

  console.log('Review2Earn: 리뷰 작성 페이지 감지');

  // Mall ID 추출
  const mallId = window.location.hostname.split('.');

  // 체크박스 HTML
  const checkboxHtml = `
    <div id="r2e-consent-wrapper" style="margin: 20px 0; padding: 15px; background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px;">
      <label style="display: flex; align-items: center; cursor: pointer;">
        <input type="checkbox" id="r2e-consent-checkbox" style="width: 20px; height: 20px; margin-right: 10px;">
        <div>
          <strong style="color: #1e40af;">Review2Earn에 참여하기</strong>
          <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #64748b;">
            이 리뷰를 통해 구매가 발생하면 구매액의 1%를 적립금으로 받습니다!
          </p>
        </div>
      </label>
    </div>
  `;

  // 폼 찾기
  const form = document.querySelector('form[name="boardWriteForm"]');
  
  if (!form) {
    console.error('Review2Earn: 리뷰 작성 폼을 찾을 수 없습니다.');
    return;
  }

  // 체크박스 삽입
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.insertAdjacentHTML('beforebegin', checkboxHtml);
  }

  // 폼 제출 이벤트 감지
  form.addEventListener('submit', async function(event) {
    const checkbox = document.getElementById('r2e-consent-checkbox');

    if (!checkbox || !checkbox.checked) {
      return; // 동의하지 않으면 무시
    }

    // 리뷰 데이터 추출
    const productId = new URLSearchParams(window.location.search).get('product_no');
    const customerId = getCookie('member_id'); // 카페24 회원 ID 쿠키

    if (!productId || !customerId) {
      console.error('Review2Earn: 제품 ID 또는 회원 ID를 찾을 수 없습니다.');
      return;
    }

    // Review2Earn API 호출 (비동기, 블로킹 없음)
    setTimeout(async () => {
      try {
        const response = await fetch('https://review2earn.vercel.app/api/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mallId,
            reviewId: 'pending', // Webhook으로 나중에 업데이트
            productId,
            customerId
          })
        });

        const data = await response.json();
        console.log('Review2Earn 참여 완료:', data);

      } catch (error) {
        console.error('Review2Earn API 오류:', error);
      }
    }, 0);
  });

  // 쿠키 읽기 헬퍼
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

})();
```

---

## 7. Phase 3 개발 계획 (주문 추적 + 자동 보상)

### 7.1 목표

- ✅ 카페24 주문 Webhook 수신
- ✅ 추천 링크 확인 (쿠키 기반)
- ✅ 보상 자동 계산 (제품별/쇼핑몰별 요율 적용)
- ✅ 적립금 자동 지급 (리뷰 작성자)
- ✅ 할인 쿠폰 자동 발급 (구매자)

### 7.2 Webhook 설정

#### 7.2.1 카페24 Webhook 등록

**이벤트:** `order/confirm` (주문 확정)

**Webhook URL:** `https://review2earn.vercel.app/api/webhooks/order`

**설정 방법:**
1. 카페24 관리자 → 앱스토어 → Review2Earn
2. Webhook 설정
3. `order/confirm` 이벤트 선택
4. URL 입력: `https://review2earn.vercel.app/api/webhooks/order`
5. 저장

#### 7.2.2 Webhook 수신 API

**Endpoint:** `POST /api/webhooks/order`

**Request Body (카페24에서 전송):**
```
{
  "resource": {
    "mall_id": "review2earn",
    "order_id": "20251008-0001234",
    "currency": "KRW",
    "order_date": "2025-10-08T22:30:00+09:00",
    "items": [
      {
        "product_no": 12345,
        "product_name": "테스트 상품",
        "quantity": 1,
        "product_price": "100000.00"
      }
    ],
    "member_id": "user123",
    "member_email": "user@example.com"
  }
}
```

**구현 코드 (예정):**

```
// src/app/api/webhooks/order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    const { resource } = webhookData;

    const {
      mall_id: mallId,
      order_id: orderId,
      items,
      member_id: customerId,
      member_email: customerEmail
    } = resource;

    // 1. Webhook 로그 저장
    await prisma.webhookLog.create({
      data: {
        mallId,
        event: 'order.confirm',
        payload: webhookData,
        processed: false
      }
    });

    // 2. 쿠키에서 추천 코드 확인
    const referralCode = request.cookies.get('r2e_ref')?.value;

    if (!referralCode) {
      console.log('추천 코드 없음 - 일반 주문');
      return NextResponse.json({ success: true, message: '일반 주문' });
    }

    // 3. Referral 조회
    const referral = await prisma.referral.findUnique({
      where: { referralCode },
      include: {
        review: true,
        mall: true
      }
    });

    if (!referral || !referral.isActive) {
      console.log('유효하지 않은 추천 코드');
      return NextResponse.json({ success: true, message: '유효하지 않은 추천 코드' });
    }

    // 4. 각 상품별 보상 계산 및 지급
    for (const item of items) {
      const orderAmount = parseFloat(item.product_price) * item.quantity;

      // 보상 비율 조회 (우선순위: 제품별 > 쇼핑몰 > 기본값)
      const rates = await getRewardRates(mallId, item.product_no.toString());

      const reviewerReward = orderAmount * (rates.reviewerPercent / 100);
      const buyerDiscount = orderAmount * (rates.buyerPercent / 100);
      const platformFee = orderAmount * (rates.platformPercent / 100);

      // 5. Transaction 레코드 생성
      const transaction = await prisma.transaction.create({
        data: {
          mallId,
          orderId: `${orderId}-${item.product_no}`,
          referralId: referral.id,
          customerId,
          customerEmail,
          productId: item.product_no.toString(),
          productName: item.product_name,
          quantity: item.quantity,
          orderAmount,
          reviewerReward,
          buyerDiscount,
          platformFee,
          rewardStatus: 'pending',
          couponStatus: 'pending',
          orderedAt: new Date(resource.order_date)
        }
      });

      // 6. 비동기 보상 지급 (백그라운드)
      processRewards(transaction.id);
    }

    // 7. Referral 통계 업데이트
    await prisma.referral.update({
      where: { referralCode },
      data: {
        conversions: { increment: 1 },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: '주문 처리 완료'
    });

  } catch (error) {
    console.error('Webhook 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}

// 보상 비율 조회 함수
async function getRewardRates(mallId: string, productId: string) {
  // 1순위: 제품별 설정
  const productSettings = await prisma.productSettings.findUnique({
    where: { mallId_productId: { mallId, productId } }
  });

  if (productSettings) {
    const reviewerPercent = Number(productSettings.reviewerPercent);
    const buyerPercent = Number(productSettings.buyerPercent);
    return {
      reviewerPercent,
      buyerPercent,
      platformPercent: (reviewerPercent + buyerPercent) * 0.25
    };
  }

  // 2순위: 쇼핑몰 기본 설정
  const mallSettings = await prisma.mallSettings.findUnique({
    where: { mallId }
  });

  if (mallSettings?.defaultRewardSettings) {
    const settings = mallSettings.defaultRewardSettings as any;
    return {
      reviewerPercent: settings.reviewerPercent || 1.0,
      buyerPercent: settings.buyerPercent || 1.0,
      platformPercent: ((settings.reviewerPercent || 1.0) + (settings.buyerPercent || 1.0)) * 0.25
    };
  }

  // 3순위: 시스템 기본값
  return {
    reviewerPercent: 1.0,
    buyerPercent: 1.0,
    platformPercent: 0.5
  };
}

// 보상 지급 처리 (비동기)
async function processRewards(transactionId: string) {
  // 이 함수는 별도의 큐 시스템으로 처리 (향후 개선)
  // 현재는 setTimeout으로 비동기 처리
  setTimeout(async () => {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          mall: true,
          referral: {
            include: { review: true }
          }
        }
      });

      if (!transaction) return;

      // 1. 리뷰 작성자에게 적립금 지급
      await grantMileage(
        transaction.mallId,
        transaction.referral.review.customerId,
        transaction.reviewerReward,
        `Review2Earn: ${transaction.productName} 추천 보상`
      );

      // 2. 구매자에게 쿠폰 발급
      await issueCoupon(
        transaction.mallId,
        transaction.customerId,
        transaction.buyerDiscount
      );

      // 3. Transaction 상태 업데이트
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          rewardStatus: 'completed',
          rewardPaidAt: new Date(),
          couponStatus: 'completed',
          couponIssuedAt: new Date()
        }
      });

    } catch (error) {
      console.error('보상 지급 오류:', error);
      
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          rewardStatus: 'failed'
        }
      });
    }
  }, 0);
}

// 적립금 지급 함수
async function grantMileage(
  mallId: string,
  customerId: string,
  amount: number,
  reason: string
) {
  const mallSettings = await prisma.mallSettings.findUnique({
    where: { mallId }
  });

  if (!mallSettings) throw new Error('Mall settings not found');

  const url = `https://${mallId}.cafe24api.com/api/v2/admin/customers/${customerId}/mileage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mallSettings.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      request: {
        mileage: Math.round(amount),
        reason
      }
    })
  });

  if (!response.ok) {
    throw new Error(`적립금 지급 실패: ${await response.text()}`);
  }

  return await response.json();
}

// 쿠폰 발급 함수
async function issueCoupon(
  mallId: string,
  customerId: string,
  discountAmount: number
) {
  const mallSettings = await prisma.mallSettings.findUnique({
    where: { mallId }
  });

  if (!mallSettings) throw new Error('Mall settings not found');

  const url = `https://${mallId}.cafe24api.com/api/v2/admin/coupons`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mallSettings.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      request: {
        coupon_name: `Review2Earn ${discountAmount}원 할인`,
        coupon_type: 'P',
        benefit_type: 'A',
        benefit_value: Math.round(discountAmount),
        available_begin_datetime: new Date().toISOString(),
        available_end_datetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        issue_member_join_type: 'A',
        issue_member_ids: [customerId]
      }
    })
  });

  if (!response.ok) {
    throw new Error(`쿠폰 발급 실패: ${await response.text()}`);
  }

  return await response.json();
}
```
## 8. Phase 4 개발 계획 (관리자 대시보드)

### 8.1 목표

- ✅ 실시간 통계 대시보드
- ✅ 보상 비율 설정 UI (쇼핑몰/제품별)
- ✅ 리뷰 및 거래 내역 조회
- ✅ 보상 지급 내역 확인
- ✅ Webhook 로그 조회

### 8.2 대시보드 페이지 구조

```
src/app/
├── page.tsx                    # 메인 대시보드 (OAuth + 통계)
├── dashboard/
│   ├── layout.tsx              # 대시보드 레이아웃
│   ├── page.tsx                # 통계 대시보드
│   ├── settings/
│   │   ├── page.tsx            # 기본 설정
│   │   └── products/
│   │       └── page.tsx        # 제품별 요율 설정
│   ├── reviews/
│   │   └── page.tsx            # 리뷰 내역
│   ├── transactions/
│   │   └── page.tsx            # 거래 내역
│   └── logs/
│       └── page.tsx            # Webhook 로그
```

### 8.3 통계 API

#### 8.3.1 대시보드 통계 API

**Endpoint:** `GET /api/dashboard/stats?mallId=review2earn`

**Response:**
```
{
  "success": true,
  "stats": {
    "totalReviews": 150,
    "r2eEnabledReviews": 80,
    "totalClicks": 1200,
    "totalConversions": 45,
    "conversionRate": 3.75,
    "totalRevenue": 4500000,
    "totalRewards": 45000,
    "totalDiscounts": 45000,
    "platformFees": 22500,
    "period": {
      "start": "2025-10-01",
      "end": "2025-10-08"
    }
  }
}
```

**구현 코드 (예정):**

```
// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mallId');
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end') || new Date().toISOString();

    if (!mallId) {
      return NextResponse.json(
        { success: false, message: 'Mall ID 필요' },
        { status: 400 }
      );
    }

    // 1. 총 리뷰 수
    const totalReviews = await prisma.review.count({
      where: {
        mallId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    // 2. R2E 참여 리뷰 수
    const r2eEnabledReviews = await prisma.review.count({
      where: {
        mallId,
        isR2EEnabled: true,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    // 3. 총 클릭 수
    const clicksSum = await prisma.referral.aggregate({
      where: {
        mallId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: { clicks: true }
    });

    // 4. 총 전환 수
    const conversionsSum = await prisma.referral.aggregate({
      where: {
        mallId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: { conversions: true }
    });

    // 5. 거래 통계
    const transactionStats = await prisma.transaction.aggregate({
      where: {
        mallId,
        orderedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: {
        orderAmount: true,
        reviewerReward: true,
        buyerDiscount: true,
        platformFee: true
      }
    });

    const totalClicks = clicksSum._sum.clicks || 0;
    const totalConversions = conversionsSum._sum.conversions || 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews,
        r2eEnabledReviews,
        totalClicks,
        totalConversions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalRevenue: parseFloat(transactionStats._sum.orderAmount?.toString() || '0'),
        totalRewards: parseFloat(transactionStats._sum.reviewerReward?.toString() || '0'),
        totalDiscounts: parseFloat(transactionStats._sum.buyerDiscount?.toString() || '0'),
        platformFees: parseFloat(transactionStats._sum.platformFee?.toString() || '0'),
        period: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error('Stats API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}
```

#### 8.3.2 보상 비율 설정 API

**Endpoint:** `PUT /api/settings/rewards`

**Request Body:**
```
{
  "mallId": "review2earn",
  "defaultRewardSettings": {
    "reviewerPercent": 1.5,
    "buyerPercent": 1.5
  }
}
```

**Response:**
```
{
  "success": true,
  "message": "기본 보상 비율이 업데이트되었습니다.",
  "settings": {
    "reviewerPercent": 1.5,
    "buyerPercent": 1.5,
    "platformPercent": 0.75
  }
}
```

#### 8.3.3 제품별 보상 비율 설정 API

**Endpoint:** `POST /api/settings/products`

**Request Body:**
```
{
  "mallId": "review2earn",
  "productId": "12345",
  "reviewerPercent": 3.0,
  "buyerPercent": 2.0
}
```

**Response:**
```
{
  "success": true,
  "message": "제품별 보상 비율이 설정되었습니다.",
  "productSettings": {
    "productId": "12345",
    "reviewerPercent": 3.0,
    "buyerPercent": 2.0,
    "platformPercent": 1.25
  }
}
```

---

## 9. API 명세 (완전판)

### 9.1 OAuth APIs

| Method | Endpoint | 설명 | Phase |
|--------|----------|------|-------|
| POST | `/api/oauth/auth-url` | OAuth URL 생성 | ✅ Phase 1 |
| GET | `/api/oauth/callback` | OAuth 토큰 교환 | ✅ Phase 1 |
| POST | `/api/verify-token` | 토큰 권한 검증 | ✅ Phase 1 |
| GET | `/api/test-connection` | API 연결 테스트 | ✅ Phase 1 |

### 9.2 ScriptTags APIs

| Method | Endpoint | 설명 | Phase |
|--------|----------|------|-------|
| POST | `/api/scripttags/install` | ScriptTag 설치 | ✅ Phase 1 |
| POST | `/api/scripttags/uninstall` | ScriptTag 제거 | ✅ Phase 1 |

### 9.3 Review APIs

| Method | Endpoint | 설명 | Phase |
|--------|----------|------|-------|
| POST | `/api/consent` | 리뷰 동의 수집 | 📋 Phase 2 |
| GET | `/api/reviews/{reviewId}/button` | 버튼 데이터 조회 | 📋 Phase 2 |
| GET | `/api/reviews?mallId={mallId}` | 리뷰 목록 조회 | 📋 Phase 4 |

### 9.4 Referral APIs

| Method | Endpoint | 설명 | Phase |
|--------|----------|------|-------|
| GET | `/api/track?ref={code}` | 추천 링크 추적 | 📋 Phase 2 |
| GET | `/api/referrals?mallId={mallId}` | 추천 링크 목록 | 📋 Phase 4 |

### 9.5 Webhook APIs

| Method | Endpoint | 설명 | Phase |
|--------|----------|------|-------|
| POST | `/api/webhooks/order` | 주문 Webhook | 📋 Phase 3 |
| POST | `/api/webhooks/review` | 리뷰 Webhook | 📋 Phase 3 |

### 9.6 Dashboard APIs

| Method | Endpoint | 설명 | Phase |
|--------|----------|------|-------|
| GET | `/api/dashboard/stats` | 통계 조회 | 📋 Phase 4 |
| GET | `/api/transactions` | 거래 내역 | 📋 Phase 4 |
| PUT | `/api/settings/rewards` | 기본 보상 설정 | 📋 Phase 4 |
| POST | `/api/settings/products` | 제품별 보상 설정 | 📋 Phase 4 |

---

## 10. 보안 및 성능

### 10.1 보안 전략

#### 10.1.1 OAuth 토큰 보안

**현재 (Phase 1):**
- PostgreSQL에 평문 저장
- HTTPS를 통한 전송 보안

**향후 개선 (Phase 2):**
```
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  });
}

export function decrypt(encryptedJson: string): string {
  const { iv, encryptedData, authTag } = JSON.parse(encryptedJson);
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### 10.1.2 CSRF 방어

**구현됨 (Phase 1):**
- OAuth State 매개변수에 타임스탬프 포함
- 10분 유효 기간

**향후 개선:**
```
// lib/csrf.ts
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}
```

#### 10.1.3 Webhook 서명 검증

**예정 (Phase 3):**
```
// lib/webhook-verify.ts
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

#### 10.1.4 Rate Limiting

**예정 (Phase 4):**
```
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  return {
    success,
    limit,
    reset,
    remaining
  };
}
```

### 10.2 성능 최적화

#### 10.2.1 데이터베이스 인덱스

**이미 적용된 인덱스:**
```
// MallSettings
@@index([mallId])

// ProductSettings
@@index([mallId, productId])

// Reviews
@@index([mallId, reviewId])
@@index([mallId, productId])
@@index([customerId])

// Referrals
@@index([referralCode])
@@index([mallId, reviewId])
@@index([createdAt])

// Transactions
@@index([mallId, orderId])
@@index([referralId])
@@index([customerId])
@@index([rewardStatus])
@@index([orderedAt])

// WebhookLog
@@index([mallId, event])
@@index([processed])
@@index([createdAt])
```

#### 10.2.2 캐싱 전략

**Redis 캐싱 (예정):**
```
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get<T>(key);
  return cached;
}

export async function setCached<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
  await redis.set(key, value, { ex: ttl });
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// 사용 예시
async function getRewardRates(mallId: string, productId: string) {
  const cacheKey = `reward-rates:${mallId}:${productId}`;
  
  // 캐시 확인
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  // DB 조회
  const rates = await fetchRewardRatesFromDB(mallId, productId);
  
  // 캐시 저장 (1시간)
  await setCached(cacheKey, rates, 3600);
  
  return rates;
}
```

#### 10.2.3 API 응답 압축

**Next.js 자동 압축 활성화:**
```
// next.config.js
module.exports = {
  compress: true,
  // ...
};
```

#### 10.2.4 Connection Pooling

**Prisma Connection Pool 설정:**
```
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/review2earn?connection_limit=10&pool_timeout=20"
```

---

## 11. 배포 및 운영

### 11.1 배포 환경

| 환경 | URL | Branch | 용도 |
|------|-----|--------|------|
| Production | https://review2earn.vercel.app | main | 실제 서비스 |
| Staging | https://review2earn-staging.vercel.app | develop | 테스트 |
| Development | http://localhost:3000 | feature/* | 로컬 개발 |

### 11.2 환경 변수

```
# .env.local (로컬 개발)
# .env.production (Vercel 프로덕션)

# Database
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Cafe24 OAuth
CAFE24_CLIENT_ID="WYht5QinOtql2mDJe0hVvA"
CAFE24_CLIENT_SECRET="xxxxxxxxxxxxx"
CAFE24_REDIRECT_URI="https://review2earn.vercel.app/api/oauth/callback"

# Next.js
NEXT_PUBLIC_BASE_URL="https://review2earn.vercel.app"

# Security (Phase 2)
ENCRYPTION_KEY="64자리 hex 키"
WEBHOOK_SECRET="카페24에서 제공"

# Redis (Phase 4)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 11.3 배포 프로세스

#### 11.3.1 자동 배포 (Git Push)

```
# 1. 개발 완료
git add .
git commit -m "feat: 추천 링크 생성 기능 추가"

# 2. Push
git push origin main

# 3. Vercel 자동 배포 (1-2분)
# → GitHub Webhook → Vercel Build → Deploy
```

#### 11.3.2 수동 배포 (Vercel CLI)

```
# 프로덕션 배포
vercel --prod

# 프리뷰 배포
vercel
```

### 11.4 데이터베이스 마이그레이션

```
# 1. 로컬에서 마이그레이션 생성
npx prisma migrate dev --name add_product_settings

# 2. Git에 커밋
git add prisma/migrations
git commit -m "db: 제품별 보상 설정 테이블 추가"
git push

# 3. Vercel에서 자동 실행
# vercel.json에 build 명령 포함:
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

### 11.5 모니터링

#### 11.5.1 Vercel Analytics

- 자동 활성화 (Vercel 대시보드)
- 페이지 로드 시간
- API 응답 시간
- 에러율

#### 11.5.2 로그 모니터링

```
# Vercel CLI로 실시간 로그 확인
vercel logs --follow

# 특정 함수 로그
vercel logs /api/webhooks/order
```

#### 11.5.3 에러 트래킹 (Sentry - 선택)

```
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
});
```

## 12. 개발 일정 및 마일스톤

### 12.1 Phase 1: OAuth + ScriptTags ✅ 완료

**기간:** 2025.10.01 ~ 2025.10.08 (1주)

| 작업 | 상태 | 완료일 |
|------|------|--------|
| 카페24 OAuth 2.0 인증 구현 | ✅ | 2025.10.03 |
| Access Token DB 저장 | ✅ | 2025.10.05 |
| ScriptTags API 통합 | ✅ | 2025.10.06 |
| 관리자 대시보드 (기본) | ✅ | 2025.10.07 |
| Vercel 배포 | ✅ | 2025.10.08 |

**주요 성과:**
- ✅ OAuth 완전 자동화
- ✅ 원클릭 ScriptTag 설치/제거
- ✅ PostgreSQL 토큰 저장
- ✅ 에러 처리 완료

---

### 12.2 Phase 2: 리뷰 동의 + 추천 링크 📋 계획

**목표 기간:** 2025.10.09 ~ 2025.10.20 (2주)

| 작업 | 우선순위 | 예상 기간 |
|------|----------|-----------|
| 리뷰 동의 API 구현 | 🔥 높음 | 2일 |
| 추천 코드 생성 로직 | 🔥 높음 | 1일 |
| 추천 링크 추적 API | 🔥 높음 | 2일 |
| review-consent.js 스크립트 | 🔥 높음 | 3일 |
| 리뷰 버튼 표시 스크립트 | 🔶 중간 | 3일 |
| 클릭 통계 수집 | 🔶 중간 | 2일 |
| 테스트 및 디버깅 | 🔥 높음 | 2일 |

**체크리스트:**
- [ ] POST /api/consent 구현
- [ ] GET /api/track 구현
- [ ] GET /api/reviews/{id}/button 구현
- [ ] review-consent.js 완성
- [ ] review-button.js 완성
- [ ] Referrals 테이블 마이그레이션
- [ ] 카페24 테스트 스토어에서 E2E 테스트

---

### 12.3 Phase 3: 주문 추적 + 자동 보상 📋 계획

**목표 기간:** 2025.10.21 ~ 2025.11.05 (2주)

| 작업 | 우선순위 | 예상 기간 |
|------|----------|-----------|
| 주문 Webhook 구현 | 🔥 높음 | 3일 |
| 보상 계산 로직 | 🔥 높음 | 2일 |
| 적립금 지급 API 연동 | 🔥 높음 | 2일 |
| 쿠폰 발급 API 연동 | 🔥 높음 | 2일 |
| 제품별 보상 설정 | 🔶 중간 | 2일 |
| Webhook 재시도 로직 | 🔶 중간 | 2일 |
| 테스트 및 디버깅 | 🔥 높음 | 2일 |

**체크리스트:**
- [ ] POST /api/webhooks/order 구현
- [ ] 보상 비율 우선순위 로직 (제품별 > 쇼핑몰 > 기본값)
- [ ] grantMileage() 함수
- [ ] issueCoupon() 함수
- [ ] Transactions 테이블 마이그레이션
- [ ] ProductSettings 테이블 마이그레이션
- [ ] Webhook 서명 검증
- [ ] 실제 주문으로 E2E 테스트

---

### 12.4 Phase 4: 관리자 대시보드 📋 계획

**목표 기간:** 2025.11.06 ~ 2025.11.20 (2주)

| 작업 | 우선순위 | 예상 기간 |
|------|----------|-----------|
| 통계 대시보드 UI | 🔥 높음 | 3일 |
| 보상 설정 UI | 🔥 높음 | 3일 |
| 리뷰 내역 조회 | 🔶 중간 | 2일 |
| 거래 내역 조회 | 🔶 중간 | 2일 |
| Webhook 로그 조회 | 🔵 낮음 | 1일 |
| 차트 시각화 | 🔶 중간 | 2일 |
| 테스트 및 디버깅 | 🔥 높음 | 2일 |

**체크리스트:**
- [ ] /dashboard 페이지
- [ ] GET /api/dashboard/stats 구현
- [ ] PUT /api/settings/rewards 구현
- [ ] POST /api/settings/products 구현
- [ ] Chart.js 또는 Recharts 통합
- [ ] 모바일 반응형 디자인
- [ ] UX 테스트

---

### 12.5 전체 타임라인

```
2025년 10월                              2025년 11월
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Week 1 │ Week 2 │ Week 3 │ Week 4 │ Week 1 │ Week 2 │ Week 3 │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ ✅ P1  │ ✅ P1  │ 📋 P2  │ 📋 P2  │ 📋 P3  │ 📋 P3  │ 📋 P4  │
│ OAuth  │ Script │ Review │ Refer  │ Webhook│ Reward │ Admin  │
│        │ Tags   │ Consent│ Track  │        │        │ Panel  │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘

✅ 완료    📋 예정
```

---

## 13. 테스트 전략

### 13.1 단위 테스트 (Unit Tests)

**프레임워크:** Jest + React Testing Library

```
// __tests__/lib/reward-calculator.test.ts
import { calculateRewards } from '@/lib/reward-calculator';

describe('calculateRewards', () => {
  it('should calculate rewards with default rates (1%, 1%)', () => {
    const result = calculateRewards(100000, 1.0, 1.0);
    
    expect(result.reviewerReward).toBe(1000);
    expect(result.buyerDiscount).toBe(1000);
    expect(result.platformFee).toBe(500);
    expect(result.total).toBe(2500);
  });

  it('should calculate rewards with custom rates (3%, 2%)', () => {
    const result = calculateRewards(500000, 3.0, 2.0);
    
    expect(result.reviewerReward).toBe(15000);
    expect(result.buyerDiscount).toBe(10000);
    expect(result.platformFee).toBe(6250); // (3+2)*0.25% = 1.25%
    expect(result.total).toBe(31250);
  });
});
```

**실행:**
```
npm test
```

### 13.2 통합 테스트 (Integration Tests)

**테스트 케이스:**

1. **OAuth 플로우**
   - Mall ID 입력 → OAuth URL 생성
   - 카페24 동의 → Callback 처리
   - DB에 토큰 저장 확인

2. **ScriptTags 설치**
   - 설치 API 호출
   - 카페24에서 ScriptTag 확인
   - 중복 설치 방지 확인

3. **리뷰 동의 플로우 (Phase 2)**
   - 동의 체크 → API 호출
   - Referral 생성 확인
   - 추천 링크 유효성

4. **주문 → 보상 플로우 (Phase 3)**
   - 추천 링크 클릭 → 쿠키 저장
   - 주문 완료 → Webhook 수신
   - 보상 계산 → 적립금/쿠폰 지급

### 13.3 E2E 테스트 (End-to-End)

**도구:** Playwright 또는 Cypress

```
// e2e/oauth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('OAuth 인증 플로우', async ({ page }) => {
  // 1. 메인 페이지 접속
  await page.goto('https://review2earn.vercel.app');
  
  // 2. Mall ID 입력
  await page.fill('input[name="mallId"]', 'review2earn');
  await page.click('button:has-text("OAuth 인증 시작")');
  
  // 3. OAuth URL로 리다이렉트 확인
  await expect(page).toHaveURL(/cafe24\.com\/api\/v2\/oauth\/authorize/);
  
  // 4. 카페24 로그인 (테스트 계정)
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // 5. 동의 버튼 클릭
  await page.click('button:has-text("동의")');
  
  // 6. Callback 후 대시보드로 리다이렉트
  await expect(page).toHaveURL(/\?oauth_success=true/);
  
  // 7. 성공 메시지 확인
  await expect(page.locator('text=OAuth 인증 완료')).toBeVisible();
});
```

### 13.4 성능 테스트

**도구:** k6

```
// load-test/webhook.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const payload = JSON.stringify({
    resource: {
      mall_id: 'review2earn',
      order_id: `TEST-${Date.now()}`,
      items: [{ product_no: 12345, product_price: '100000' }]
    }
  });

  const res = http.post('https://review2earn.vercel.app/api/webhooks/order', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 14. 트러블슈팅 가이드

### 14.1 OAuth 관련 오류

#### 문제: "토큰 교환 실패"

**증상:**
```
OAuth Callback 오류: 토큰 교환 실패
```

**원인:**
1. Client Secret 불일치
2. Redirect URI 불일치
3. Authorization Code 만료 (10분)

**해결:**
```
# 1. 환경 변수 확인
echo $CAFE24_CLIENT_SECRET
echo $CAFE24_REDIRECT_URI

# 2. 카페24 개발자 센터에서 확인
# https://developers.cafe24.com/app/my

# 3. Vercel 환경 변수 업데이트
vercel env pull
```

#### 문제: "Access Token 만료"

**증상:**
```
Cafe24 API 오류: 401 Unauthorized
```

**해결:**
```
// lib/cafe24-api.ts
async function refreshAccessToken(mallId: string) {
  const settings = await prisma.mallSettings.findUnique({
    where: { mallId }
  });

  if (!settings?.refreshToken) {
    throw new Error('Refresh token not found');
  }

  const response = await fetch(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: settings.refreshToken,
      client_id: process.env.CAFE24_CLIENT_ID!,
      client_secret: process.env.CAFE24_CLIENT_SECRET!
    })
  });

  const data = await response.json();

  // DB 업데이트
  await prisma.mallSettings.update({
    where: { mallId },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    }
  });

  return data.access_token;
}
```

---

### 14.2 ScriptTags 관련 오류

#### 문제: "ScriptTag가 실행되지 않음"

**증상:**
- 리뷰 작성 페이지에 체크박스 없음

**원인:**
1. display_location 설정 오류
2. 스크립트 URL 오류
3. 캐시 문제

**해결:**
```
# 1. 카페24 관리자에서 ScriptTag 확인
# 쇼핑몰 관리 → 앱 → Review2Earn → 설정

# 2. 브라우저 캐시 삭제
Ctrl + Shift + R (강력 새로고침)

# 3. 스크립트 URL 직접 접속
https://review2earn.vercel.app/scripts/review-consent.js

# 4. 콘솔에서 에러 확인
F12 → Console 탭
```

---

### 14.3 Webhook 관련 오류

#### 문제: "Webhook이 수신되지 않음"

**증상:**
- 주문 완료해도 보상 지급 안됨

**원인:**
1. Webhook URL 미등록
2. 서버 오류로 500 응답
3. 타임아웃

**해결:**
```
# 1. Webhook 로그 확인
SELECT * FROM webhook_logs 
WHERE mall_id = 'review2earn' 
ORDER BY created_at DESC 
LIMIT 10;

# 2. Vercel 함수 로그 확인
vercel logs /api/webhooks/order --follow

# 3. Webhook 재전송 (카페24 관리자)
쇼핑몰 관리 → 개발자 도구 → Webhook → 재전송
```

---

### 14.4 데이터베이스 관련 오류

#### 문제: "Prisma Client 생성 오류"

**증상:**
```
Error: Cannot find module '@prisma/client'
```

**해결:**
```
# 1. Prisma Client 재생성
npx prisma generate

# 2. 의존성 재설치
rm -rf node_modules
npm install

# 3. 마이그레이션 동기화
npx prisma migrate deploy
```

---

## 15. FAQ (자주 묻는 질문)

### Q1. 카페24 외 다른 플랫폼도 지원하나요?

**A:** 현재는 카페24만 지원합니다. 향후 Shopify, WooCommerce 지원 예정입니다.

**로드맵:**
- ✅ Phase 1-4: 카페24 완성
- 📋 Phase 5: Shopify 통합
- 📋 Phase 6: WooCommerce 통합

---

### Q2. 보상 비율은 얼마까지 설정 가능한가요?

**A:** 최소 1%부터 제한 없습니다.

**권장 비율:**
- **저가 제품 (1만원 이하):** 1% / 1%
- **중가 제품 (1만~10만원):** 2% / 2%
- **고가 제품 (10만원 이상):** 3% / 3%
- **럭셔리 제품 (100만원 이상):** 5% / 5%

---

### Q3. 적립금이 자동으로 지급 안 돼요.

**A:** 다음을 확인하세요:

1. **OAuth 권한 확인**
   - `mall.write_customer` 권한 필요
   - 카페24 개발자 센터에서 확인

2. **Webhook 등록 확인**
   - `order/confirm` 이벤트 등록
   - URL: `https://review2earn.vercel.app/api/webhooks/order`

3. **Transaction 상태 확인**
   ```
   SELECT * FROM transactions 
   WHERE mall_id = 'your_mall_id' 
   AND reward_status = 'failed';
   ```

---

### Q4. 플랫폼 수수료는 언제 청구되나요?

**A:** 월말 정산입니다.

**청구 프로세스:**
1. 매월 1일: 전월 거래 집계
2. 매월 5일: 청구서 발행
3. 매월 10일: 결제 (자동 이체)

**계산 공식:**
```
월 플랫폼 수수료 = Σ(거래별 platformFee)
```

---

### Q5. 리뷰 작성자가 본인 추천 링크로 구매하면 어떻게 되나요?

**A:** 자가 추천은 방지됩니다.

**로직:**
```
// Phase 3에서 구현 예정
if (order.customerId === referral.review.customerId) {
  console.log('자가 추천 감지 - 보상 지급 안함');
  return;
}
```

---

## 16. 참고 문서

### 16.1 내부 문서

- [v3.0 설계 문서] Review2Earn (리뷰투언) - 최종 설계 문서.md
- [개발 완료 보고서] 리뷰투언(Review2Earn) 카페24 앱 개발 완료 보고서.md
- [프로토타입 보고서] 리뷰투언(Review2Earn) 프로토타입 개발 완료 보고서.docx

### 16.2 카페24 공식 문서

- [OAuth 가이드] Cafe24_manual_01.pdf
- [API 사용 가이드] Cafe24_manual_02.pdf
- [Webhook 가이드] Cafe24_manual_03.pdf
- [개발자 센터] https://developers.cafe24.com

### 16.3 기술 스택 문서

- [Next.js 15] https://nextjs.org/docs
- [Prisma ORM] https://www.prisma.io/docs
- [Vercel 배포] https://vercel.com/docs

---

## 17. 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 |
|------|------|---------------|
| v4.0 | 2025.10.08 | Phase 1 완료 반영, 전체 재구성 |
| v3.0 | 2025.10.07 | 제품별 보상 비율 시스템 추가 |
| v2.0 | 2025.10.07 | 최초 설계 문서 작성 |
| v1.0 | 2025.10.05 | 프로토타입 기획 |

---

## 18. 라이선스

**Proprietary License**

Copyright (c) 2025 Review2Earn (parktaejun)

이 소프트웨어 및 관련 문서는 저작권법의 보호를 받습니다.  
무단 복제, 배포, 수정을 금지합니다.

---

## 19. 연락처

**개발자:**
- Name: Park Taejun
- Email: parktaejun@gmail.com
- GitHub: https://github.com/parktaejun/review2earn

**지원:**
- Documentation: https://review2earn.vercel.app/docs
- Issues: https://github.com/parktaejun/review2earn/issues

---

**🎉 Review2Earn v4.0 설계 문서 완료!**

**다음 단계:**
1. Phase 2 착수 (리뷰 동의 + 추천 링크)
2. 주간 개발 회의 (매주 월요일)
3. 월간 리뷰 (매월 말일)

**Happy Coding! 🚀**
```

