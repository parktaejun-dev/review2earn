// public/widget.js
// Review2Earn v6.0 Widget - 리뷰 읽기 페이지 버튼 자동 생성

(function() {
  'use strict';

  console.log('🚀 Review2Earn Widget v6.0 Loaded');

  // ============================================
  // 설정
  // ============================================
  const CONFIG = {
    REFERRAL_CODE_PATTERN: /R2E-[A-F0-9]{12}/gi,
    API_BASE: window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://review2earn.vercel.app',
  };

  // ============================================
  // 리뷰 상세 페이지 감지
  // ============================================
  function isProductDetailPage() {
    return window.location.pathname.includes('/product/detail') ||
           window.location.pathname.includes('/board/product/read');
  }

  // ============================================
  // 리뷰에서 R2E 코드 감지 및 버튼 생성
  // ============================================
  function processReviews() {
    // 리뷰 컨테이너 찾기
    const reviewContainers = document.querySelectorAll('.review, .board-content, .prdReview');
    
    if (reviewContainers.length === 0) {
      console.log('⚠️ R2E: No review containers found');
      return;
    }

    console.log(`✅ R2E: Found ${reviewContainers.length} review containers`);

    reviewContainers.forEach((container, index) => {
      const textContent = container.textContent || '';
      const match = textContent.match(CONFIG.REFERRAL_CODE_PATTERN);

      if (match && match[0]) {
        const referralCode = match[0].toUpperCase();
        console.log(`✅ R2E: Code detected in review ${index}: ${referralCode}`);

        // 이미 버튼이 있는지 확인
        if (container.querySelector('.r2e-discount-button')) {
          return;
        }

        // 원본 코드 숨김 처리
        hideReferralCode(container, referralCode);

        // 버튼 생성 및 삽입
        const button = createDiscountButton(referralCode);
        container.appendChild(button);
      }
    });
  }

  // ============================================
  // 레퍼럴 코드 숨김 처리
  // ============================================
  function hideReferralCode(container, code) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes(code)) {
        node.nodeValue = node.nodeValue.replace(code, '');
        console.log(`✅ R2E: Code hidden: ${code}`);
      }
    }
  }

  // ============================================
  // 할인 버튼 생성
  // ============================================
  function createDiscountButton(referralCode) {
    const button = document.createElement('button');
    button.className = 'r2e-discount-button';
    button.type = 'button';
    button.textContent = '🎁 1% 할인받고 구매하기';
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin: 12px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `;

    // 호버 효과
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    // 클릭 이벤트
    button.addEventListener('click', async () => {
      try {
        console.log(`🔄 R2E: Issuing coupon for code: ${referralCode}`);
        
        // 레퍼럴 코드 저장 (쿠키 + LocalStorage)
        document.cookie = `r2e_referral_code=${referralCode}; path=/; max-age=2592000`; // 30일
        localStorage.setItem('r2e_referral_code', referralCode);

        // 쿠폰 발급 API 호출
        const response = await fetch(`${CONFIG.API_BASE}/api/coupons/issue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referralCode: referralCode,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(`✅ 1% 할인 쿠폰이 발급되었습니다!\n쿠폰 코드: ${data.couponCode || '자동 적용'}`);
          console.log('✅ R2E: Coupon issued successfully');
        } else {
          alert('⚠️ 쿠폰 발급에 실패했습니다. 다시 시도해주세요.');
          console.error('❌ R2E: Coupon issue failed');
        }
      } catch (error) {
        console.error('❌ R2E: Error:', error);
        alert('❌ 오류가 발생했습니다.');
      }
    });

    return button;
  }

  // ============================================
  // 초기화
  // ============================================
  function init() {
    if (!isProductDetailPage()) {
      console.log('⚠️ R2E: Not a product detail page');
      return;
    }

    console.log('✅ R2E: Product detail page detected');
    processReviews();
  }

  // ============================================
  // 실행 (여러 시점에서 시도)
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 지연 실행 (동적 로딩 대비)
  setTimeout(init, 1000);
  setTimeout(init, 2000);
  setTimeout(init, 3000);
})();
