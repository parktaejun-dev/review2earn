import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시작: v6.0 예시 데이터 삽입...\n');

  // ============================================
  // 1. 쇼핑몰 설정
  // ============================================
  console.log('1️⃣ 쇼핑몰 생성 중...');
  
  const mall1 = await prisma.mallSettings.upsert({
    where: { mallId: 'fashionstore' },
    update: {},
    create: {
      mallId: 'fashionstore',
      accessToken: 'test_access_token_fashionstore',
      reviewerRewardRate: 0.01,
      buyerDiscountRate: 0.01,
      platformFeeRate: 0.005,
      prepaidBalance: 1000000,
      isActive: true,
    },
  });

  const mall2 = await prisma.mallSettings.upsert({
    where: { mallId: 'techshop' },
    update: {},
    create: {
      mallId: 'techshop',
      accessToken: 'test_access_token_techshop',
      reviewerRewardRate: 0.01,
      buyerDiscountRate: 0.01,
      platformFeeRate: 0.005,
      prepaidBalance: 500000,
      isActive: true,
    },
  });

  console.log('✅ 쇼핑몰 2개 생성 완료');

  // ============================================
  // 2. R2E 계정
  // ============================================
  console.log('\n2️⃣ R2E 계정 생성 중...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const alice = await prisma.r2EAccount.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      password: hashedPassword,
      referralCode: 'R2E-A7F3B2E1C9D4',
      totalPoints: 15000,
      availablePoints: 15000,
      consentMarketing: true,
      consentDataSharing: true,
    },
  });

  const bob = await prisma.r2EAccount.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      password: hashedPassword,
      referralCode: 'R2E-B8D4C3F2A1E5',
      totalPoints: 8000,
      availablePoints: 8000,
      consentMarketing: false,
      consentDataSharing: true,
    },
  });

  console.log('✅ Alice:', alice.email, alice.referralCode);
  console.log('✅ Bob:', bob.email, bob.referralCode);

  // ============================================
  // 3. 멀티몰 연동
  // ============================================
  console.log('\n3️⃣ 멀티몰 연동 중...');

  await prisma.r2EMallLink.upsert({
    where: {
      r2eAccountId_mallId: {
        r2eAccountId: alice.id,
        mallId: 'fashionstore',
      },
    },
    update: {},
    create: {
      r2eAccountId: alice.id,
      mallId: 'fashionstore',
      mallEmail: 'alice@fashionstore.com',
      mallMemberId: 'alice123',
      isVerified: true,
    },
  });

  await prisma.r2EMallLink.upsert({
    where: {
      r2eAccountId_mallId: {
        r2eAccountId: alice.id,
        mallId: 'techshop',
      },
    },
    update: {},
    create: {
      r2eAccountId: alice.id,
      mallId: 'techshop',
      mallEmail: 'alice@techshop.com',
      mallMemberId: 'alice456',
      isVerified: true,
    },
  });

  await prisma.r2EMallLink.upsert({
    where: {
      r2eAccountId_mallId: {
        r2eAccountId: bob.id,
        mallId: 'fashionstore',
      },
    },
    update: {},
    create: {
      r2eAccountId: bob.id,
      mallId: 'fashionstore',
      mallEmail: 'bob@fashionstore.com',
      mallMemberId: 'bob789',
      isVerified: true,
    },
  });

  console.log('✅ 멀티몰 연동 3개 완료');

  // ============================================
  // 4. 리뷰
  // ============================================
  console.log('\n4️⃣ 리뷰 생성 중...');

  const review1 = await prisma.review.upsert({
    where: {
      cafe24BoardNo_mallId: {
        cafe24BoardNo: 1001,
        mallId: 'fashionstore',
      },
    },
    update: {},
    create: {
      cafe24BoardNo: 1001,
      productNo: 100,
      mallId: 'fashionstore',
      memberId: 'alice123',
      memberEmail: 'alice@fashionstore.com',
      r2eUserId: alice.id,
      content: '정말 예쁜 원피스예요! 핏도 좋고 색상도 마음에 들어요. 강력 추천합니다!',
      rating: 5,
      referralCode: alice.referralCode,
      participateR2e: true,
      clickCount: 15,
      conversionCount: 3,
      totalRevenue: 150000,
    },
  });

  const review2 = await prisma.review.upsert({
    where: {
      cafe24BoardNo_mallId: {
        cafe24BoardNo: 2001,
        mallId: 'techshop',
      },
    },
    update: {},
    create: {
      cafe24BoardNo: 2001,
      productNo: 200,
      mallId: 'techshop',
      memberId: 'alice456',
      memberEmail: 'alice@techshop.com',
      r2eUserId: alice.id,
      content: '노트북 성능이 정말 좋아요! 배터리도 오래가고 가성비 최고입니다.',
      rating: 5,
      referralCode: alice.referralCode,
      participateR2e: true,
      clickCount: 25,
      conversionCount: 5,
      totalRevenue: 5000000,
    },
  });

  const review3 = await prisma.review.upsert({
    where: {
      cafe24BoardNo_mallId: {
        cafe24BoardNo: 1002,
        mallId: 'fashionstore',
      },
    },
    update: {},
    create: {
      cafe24BoardNo: 1002,
      productNo: 101,
      mallId: 'fashionstore',
      memberId: 'bob789',
      memberEmail: 'bob@fashionstore.com',
      r2eUserId: bob.id,
      content: '청바지 사이즈가 딱 맞아요. 품질도 좋고 만족스럽습니다!',
      rating: 4,
      referralCode: bob.referralCode,
      participateR2e: true,
      clickCount: 8,
      conversionCount: 2,
      totalRevenue: 80000,
    },
  });

  console.log('✅ 리뷰 3개 생성 완료');

  // ============================================
  // 5. R2E 거래 내역
  // ============================================
  console.log('\n5️⃣ 거래 내역 생성 중...');

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);

  await prisma.r2ETransaction.createMany({
    data: [
      {
        r2eUserId: alice.id,
        reviewId: review1.id,
        mallId: 'fashionstore',
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
        amount: 500,
        description: '추천 구매로 인한 보상',
        referralCode: alice.referralCode,
        expiryDate,
      },
      {
        r2eUserId: alice.id,
        reviewId: review2.id,
        mallId: 'techshop',
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
        amount: 5000,
        description: '추천 구매로 인한 보상 (노트북)',
        referralCode: alice.referralCode,
        expiryDate,
      },
      {
        r2eUserId: bob.id,
        reviewId: review3.id,
        mallId: 'fashionstore',
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
        amount: 800,
        description: '추천 구매로 인한 보상',
        referralCode: bob.referralCode,
        expiryDate,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ 거래 내역 3건 생성 완료');

  console.log('\n🎉 모든 예시 데이터 삽입 완료!\n');
  console.log('📊 생성된 데이터:');
  console.log('- 쇼핑몰: 2개 (fashionstore, techshop)');
  console.log('- R2E 계정: 2개');
  console.log('- 멀티몰 연동: 3개');
  console.log('- 리뷰: 3개');
  console.log('- 거래 내역: 3건');
  console.log('\n✅ 테스트 계정:');
  console.log('- alice@example.com / password123');
  console.log('  레퍼럴 코드: R2E-A7F3B2E1C9D4');
  console.log('- bob@example.com / password123');
  console.log('  레퍼럴 코드: R2E-B8D4C3F2A1E5');
}

main()
  .catch((e) => {
    console.error('\n❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
