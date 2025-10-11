// public/widget.js
// Review2Earn v6.0 Widget - 카페24 게시판 구조 대응

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
  // 페이지 감지 (상품 상세 or 게시판)
  // ============================================
  function isProductPage() {
    return window.location.pathname.includes('/product/') ||
           window.location.pathname.includes('/board/product');
  }

  // ============================================
  // 리뷰 컨테이너 찾기 (여러 패턴 지원)
  // ============================================
  function findReviewContainers() {
    // 패턴 1: 게시판 테이블 행
    const boardRows = document.querySelectorAll('table.board_list tbody tr, table.boardList tbody tr, .xans-board-list tbody tr');
    
    // 패턴 2: 상품 리뷰 영역
    const reviewDivs = document.querySelectorAll('.review, .board-content, .prdReview, .reviewArea, .product-review');
    
    // 패턴 3: 리뷰 상세 페이지
    const detailContent = document.querySelectorAll('.board-view, .boardView, .detail-content');

    const containers = [];
    
    // 게시판 행 추가
    boardRows.forEach(row => {
      if (row.textContent && row.textContent.trim()) {
        containers.push(row);
      }
    });
    
    // 리뷰 div 추가
    reviewDivs.forEach(div => {
      if (div.textContent && div.textContent.trim()) {
        containers.push(div);
      }
    });
    
    // 상세 페이지 추가
    detailContent.forEach(div => {
      if (div.textContent && div.textContent.trim()) {
        containers.push(div);
      }
    });

    return containers;
  }

  // ============================================
  // 리뷰에서 R2E 코드 감지 및 버튼 생성
  // ============================================
  function processReviews() {
    const containers = findReviewContainers();
    
    if (containers.length === 0) {
      console.log('⚠️ R2E: No review containers found');
      console.log('💡 R2E: Try looking for elements manually:');
      console.log('   document.querySelectorAll("table tbody tr")');
      return;
    }

    console.log(`✅ R2E: Found ${containers.length} review containers`);

    containers.forEach((container, index) => {
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
        
        // 테이블 행이면 td에 삽입
        if (container.tagName === 'TR') {
          const lastTd = container.querySelector('td:last-child');
          if (lastTd) {
            lastTd.appendChild(button);
          }
        } else {
          container.appendChild(button);
        }
      }
    });
  }

  // ============================================
  // 레퍼럴 코드 숨김 처리
  // ============================================
  function hideReferralCode(container, code) {
    // 텍스트 노드에서 코드 제거
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToUpdate = [];
    let node;
    
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes(code)) {
        nodesToUpdate.push(node);
      }
    }

    nodesToUpdate.forEach(node => {
      node.nodeValue = node.nodeValue.replace(code, '');
    });

    console.log(`✅ R2E: Code hidden: ${code}`);
  }

  // ============================================
  // 할인 버튼 생성
  // ============================================
  function createDiscountButton(referralCode) {
    const button = document.createElement('button');
    button.className = 'r2e-discount-button';
    button.type = 'button';
    button.textContent = '🎁 1% 할인';
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin: 4px;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: inline-block;
    `;

    // 호버 효과
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
    });

    // 클릭 이벤트
    button.addEventListener('click', async () => {
      try {
        console.log(`🔄 R2E: Issuing coupon for code: ${referralCode}`);
        
        // 레퍼럴 코드 저장
        document.cookie = `r2e_referral_code=${referralCode}; path=/; max-age=2592000`;
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
          // API 없어도 일단 코드 저장은 완료
          alert('✅ 할인 코드가 저장되었습니다!\n구매 시 자동 적용됩니다.');
          console.log('⚠️ R2E: API not ready, but code saved');
        }
      } catch (error) {
        console.error('❌ R2E: Error:', error);
        alert('✅ 할인 코드가 저장되었습니다!');
      }
    });

    return button;
  }

  // ============================================
  // 초기화
  // ============================================
  function init() {
    if (!isProductPage()) {
      console.log('⚠️ R2E: Not a product page');
      return;
    }

    console.log('✅ R2E: Product page detected');
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
