# 🎯 Review2Earn v6.0 - Production Hardcoding Fixes

## 우선순위 1: PrismaClient Singleton (즉시 수정 필요!)

### ❌ 문제:
- 4개의 PrismaClient 인스턴스 생성
- 메모리 누수, 커넥션 풀 고갈 위험

### ✅ 해결책:
전체 프로젝트에서 `src/lib/prisma.ts` 하나만 사용

---

## 우선순위 2: shop_no 동적 처리

### ❌ 문제:
- 멀티샵 지원 불가
- 현재: shop_no: 1 (하드코딩)

### ✅ 해결책:
- DB에 shop_no 저장
- 환경변수 fallback: DEFAULT_SHOP_NO=1

---

## 우선순위 3: API Version 중앙 관리

### ❌ 문제:
- 5개 파일에서 각각 다른 버전 사용
- 업데이트시 5개 파일 모두 수정 필요

### ✅ 해결책:
- src/lib/cafe24-config.ts 생성
- 환경변수: CAFE24_API_VERSION=2025-09-01

---

## 우선순위 4: 로케일 동적 처리

### ✅ 해결책:
- 사용자 브라우저 언어 감지
- 환경변수: DEFAULT_LOCALE=ko-KR

---

## 우선순위 5: Production Logger

### ✅ 해결책:
- pino 또는 winston 도입
- 개발: console.log
- 프로덕션: 파일/클라우드 로깅
