// public/scripts/review-consent.js
(function() {
  'use strict';

  // ============================================
  // 0. 리뷰 작성 페이지 확인 (수정!)
  // ============================================
  const path = window.location.pathname;
  const isReviewPage = 
    path.includes('/board/product/write') ||  // ✅ /board/product/write.html
    path.includes('/board/review/write') ||
    path.includes('write.html');

  if (!isReviewPage) {
    console.log('ℹ️ Review2Earn: 리뷰 작성 페이지가 아닙니다.', path);
    return;
  }

  console.log('✅ Review2Earn: 리뷰 작성 페이지 감지');

  // ============================================
  // 1. Mall ID 추출
  // ============================================
  const hostname = window.location.hostname;
  const mallId = hostname.split('.')[0];
  console.log('🏪 Mall ID:', mallId);

  // ============================================
  // 2. 제품 ID 추출
  // ============================================
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product_no');

  if (!productId) {
    console.error('❌ Review2Earn: 제품 ID를 찾을 수 없습니다.');
    console.log('URL:', window.location.href);
    console.log('Query Params:', window.location.search);
    return;
  }

  console.log('📦 Product ID:', productId);

  // ============================================
  // 3. 보상 비율 조회 (비동기)
  // ============================================
  fetchRewardRate(mallId, productId);

  // ============================================
  // 보상 비율 조회 함수
  // ============================================
  async function fetchRewardRate(mallId, productId) {
    try {
      const apiUrl = `https://review2earn.vercel.app/api/reward-rate?mall_id=${mallId}&product_id=${productId}`;
      console.log('🔍 API 호출:', apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API 응답:', data);

      if (!data.success) {
        throw new Error('보상 비율 조회 실패');
      }

      // 체크박스 생성 (동적 비율 적용)
      insertConsentCheckbox(data.reviewerPercent, data.buyerPercent);

    } catch (error) {
      console.error('❌ Review2Earn 비율 조회 오류:', error);
      // 에러 발생 시 기본값 사용
      insertConsentCheckbox(1.0, 5.0);
    }
  }

  // ============================================
  // 체크박스 삽입 함수
  // ============================================
  function insertConsentCheckbox(reviewerPercent, buyerPercent) {
    const checkboxHtml = `
      <div id="r2e-consent-wrapper" style="
        margin: 20px 0; 
        padding: 20px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
      " 
      onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(102, 126, 234, 0.4)';" 
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(102, 126, 234, 0.3)';">
        <label style="display: flex; align-items: flex-start; cursor: pointer;">
          <input type="checkbox" id="r2e-consent-checkbox" style="
            width: 28px; 
            height: 28px; 
            margin-right: 15px; 
            margin-top: 4px;
            cursor: pointer; 
            accent-color: #10b981;
            flex-shrink: 0;
          ">
          <div style="color: white; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 1.3em;">💰</span>
              <strong style="font-size: 1.15em;">Review2Earn에 참여하기</strong>
            </div>
            <p style="margin: 0; font-size: 1em; line-height: 1.6; opacity: 0.95;">
              이 리뷰를 통해 구매가 발생하면<br>
              <strong style="color: #fcd34d; font-size: 1.2em;">${reviewerPercent}%</strong> 
              <span style="font-size: 0.9em;">적립금을 받습니다!</span>
            </p>
            <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.85em; opacity: 0.8;">
              💸 구매자는 <strong>${buyerPercent}%</strong> 할인 혜택을 받습니다.
            </p>
          </div>
        </label>
      </div>
    `;

    // 폼 찾기 (여러 패턴 시도)
    const form = document.querySelector('form[name="boardWriteForm"]') ||
                 document.querySelector('form#boardWriteForm') ||
                 document.querySelector('form[action*="write"]');
    
    if (!form) {
      console.error('❌ Review2Earn: 리뷰 작성 폼을 찾을 수 없습니다.');
      console.log('페이지 내 모든 폼:', document.querySelectorAll('form'));
      return;
    }

    console.log('✅ 폼 발견:', form);

    // 제출 버튼 찾기 (여러 패턴 시도)
    const submitButton = form.querySelector('button[type="submit"]') || 
                         form.querySelector('input[type="submit"]') ||
                         form.querySelector('a.btnSubmit') ||
                         form.querySelector('.btn-submit') ||
                         form.querySelector('button.submit') ||
                         form.querySelector('[class*="submit"]');
    
    if (submitButton) {
      submitButton.insertAdjacentHTML('beforebegin', checkboxHtml);
      console.log(`✅ Review2Earn: 체크박스 삽입 완료 (리뷰 작성자: ${reviewerPercent}%, 구매자: ${buyerPercent}%)`);
    } else {
      console.warn('⚠️ Review2Earn: 제출 버튼을 찾을 수 없습니다. 폼 끝에 삽입합니다.');
      // 폼 끝에 삽입 (대체 방법)
      form.insertAdjacentHTML('beforeend', checkboxHtml);
      console.log('⚠️ Review2Earn: 폼 끝에 체크박스 삽입');
    }

    // 폼 제출 이벤트 리스너 추가
    form.addEventListener('submit', handleFormSubmit);
  }

  // ============================================
  // 폼 제출 핸들러
  // ============================================
  function handleFormSubmit(event) {
    const checkbox = document.getElementById('r2e-consent-checkbox');

    if (!checkbox || !checkbox.checked) {
      console.log('ℹ️ Review2Earn: 동의하지 않음');
      return;
    }

    console.log('✅ Review2Earn: 동의 체크됨, API 호출 준비');

    // 동의 정보를 Review2Earn API로 전송 (비동기, 논블로킹)
    setTimeout(async () => {
      try {
        const customerId = getCookie('member_id'); // 카페24 회원 ID
        const customerEmail = getCookie('member_email'); // 카페24 이메일
        
        if (!customerId) {
          console.error('❌ Review2Earn: 회원 ID를 찾을 수 없습니다.');
          console.log('쿠키 전체:', document.cookie);
          return;
        }

        const mallId = window.location.hostname.split('.')[0];
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product_no');

        const payload = {
          mallId,
          reviewId: 'pending',
          productId,
          customerId,
          customerEmail: customerEmail || null
        };

        console.log('📤 API 전송:', payload);

        const response = await fetch('https://review2earn.vercel.app/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('✅ Review2Earn 참여 완료:', data);

      } catch (error) {
        console.error('❌ Review2Earn API 오류:', error);
      }
    }, 0);
  }

  // ============================================
  // 쿠키 읽기 헬퍼
  // ============================================
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

})();
