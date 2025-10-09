// public/scripts/review-consent.js (최종 버전)

(function() {
  'use strict';

  console.log('✅ Review2Earn 스크립트 로드됨');

  // ✅ 리뷰 작성 페이지인지 확인
  const isReviewWritePage = 
    window.location.href.includes('/board/product/write') ||
    window.location.pathname.includes('/board/product/write');

  if (!isReviewWritePage) {
    console.log('ℹ️ Review2Earn: Not a review write page, skipping...');
    return; // 리뷰 페이지가 아니면 종료
  }

  console.log('✅ Review2Earn: 리뷰 작성 페이지 감지됨');

  // 전역 설정
  const API_BASE_URL = 'https://review2earn.vercel.app';
  const DEFAULT_REVIEWER_PERCENT = 1.0;
  const DEFAULT_BUYER_PERCENT = 5.0;

  // 현재 mall_id와 product_id 추출
  function extractMallAndProductId() {
    const hostname = window.location.hostname;
    const mallId = hostname.split('.')[0]; // 예: dhdshop.cafe24.com → dhdshop
    
    // URL에서 product_no 추출
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_no') || 
                      urlParams.get('no') ||
                      document.querySelector('[name="product_no"]')?.value ||
                      '0';

    return { mallId, productId };
  }

  // API에서 동적 비율 가져오기
  async function fetchRewardRates() {
    try {
      const { mallId, productId } = extractMallAndProductId();
      
      const response = await fetch(
        `${API_BASE_URL}/api/reward-rate?mall_id=${mallId}&product_id=${productId}`
      );
      
      if (!response.ok) {
        throw new Error('API 호출 실패');
      }
      
      const data = await response.json();
      
      if (data.success) {
        return {
          reviewerPercent: data.reviewerPercent || DEFAULT_REVIEWER_PERCENT,
          buyerPercent: data.buyerPercent || DEFAULT_BUYER_PERCENT,
        };
      }
      
      throw new Error('API 응답 실패');
    } catch (error) {
      console.warn('⚠️ Review2Earn API 오류, 기본값 사용:', error);
      return {
        reviewerPercent: DEFAULT_REVIEWER_PERCENT,
        buyerPercent: DEFAULT_BUYER_PERCENT,
      };
    }
  }

  // 체크박스 HTML 생성 (개선된 디자인)
  function createCheckboxHtml(reviewerPercent, buyerPercent) {
    return `
      <div id="r2e-consent-wrapper" style="
        margin: 20px 0; 
        padding: 25px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      " 
      onmouseover="this.style.transform='translateY(-4px) scale(1.01)'; this.style.boxShadow='0 20px 60px rgba(102, 126, 234, 0.5)';" 
      onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 10px 40px rgba(102, 126, 234, 0.4)';">
        
        <label style="display: flex; align-items: flex-start; cursor: pointer;">
          
          <!-- ✨ 체크박스 (32px + drop-shadow) -->
          <input 
            type="checkbox" 
            id="r2e-consent-checkbox" 
            style="
              width: 32px; 
              height: 32px; 
              margin-right: 18px; 
              margin-top: 2px;
              cursor: pointer; 
              accent-color: #10b981;
              flex-shrink: 0;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            "
          >
          
          <div style="color: white; flex: 1;">
            
            <!-- 🎯 헤더 (이모지 + 제목) -->
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <span style="
                font-size: 1.5em; 
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              ">💰</span>
              <strong style="
                font-size: 1.25em; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ">Review2Earn에 참여하기</strong>
            </div>
            
            <!-- 💡 메인 메시지 -->
            <p style="
              margin: 0; 
              font-size: 1.05em; 
              line-height: 1.7; 
              opacity: 0.95;
            ">
              이 리뷰를 통해 구매가 발생하면<br>
              <strong style="
                color: #fcd34d; 
                font-size: 1.3em; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">${reviewerPercent}%</strong> 
              <span style="font-size: 0.95em;">적립금을 받습니다!</span>
            </p>
            
            <!-- 💸 보조 메시지 -->
            <p style="
              margin: 12px 0 0 0; 
              padding-top: 12px; 
              border-top: 1px solid rgba(255,255,255,0.3); 
              font-size: 0.9em; 
              opacity: 0.85;
            ">
              💸 구매자는 <strong style="color: #fcd34d;">${buyerPercent}%</strong> 할인 혜택을 받습니다.
            </p>
            
          </div>
        </label>
      </div>
    `;
  }

  // 체크박스 삽입 (개선된 버튼 찾기)
  function insertConsentCheckbox(reviewerPercent, buyerPercent) {
    // 이미 삽입되었는지 확인
    if (document.getElementById('r2e-consent-wrapper')) {
      console.log('ℹ️ Review2Earn: 이미 체크박스가 삽입되어 있습니다.');
      return;
    }

    const checkboxHtml = createCheckboxHtml(reviewerPercent, buyerPercent);

    // 폼 찾기
    const form = document.querySelector('form[name="boardWriteForm"]') ||
                 document.querySelector('form#boardWriteForm') ||
                 document.querySelector('form[action*="write"]') ||
                 document.querySelector('form[action*="review"]');
    
    if (!form) {
      console.error('❌ Review2Earn: 리뷰 작성 폼을 찾을 수 없습니다.');
      return;
    }

    console.log('✅ Review2Earn: 폼 발견', form);

    // 제출 버튼 찾기 (개선된 패턴)
    const submitButton = 
      form.querySelector('button[type="submit"]') || 
      form.querySelector('input[type="submit"]') ||
      form.querySelector('input[type="image"]') ||
      form.querySelector('a.btnSubmit') ||
      form.querySelector('.btn-submit') ||
      form.querySelector('button.submit') ||
      form.querySelector('[class*="submit" i]') ||
      form.querySelector('[class*="Submit"]') ||
      form.querySelector('button[onclick*="submit"]') ||
      form.querySelector('a[onclick*="submit"]') ||
      form.querySelector('a[href*="javascript"]') ||
      // 버튼 텍스트로 찾기
      Array.from(form.querySelectorAll('button, input[type="button"], a.btn')).find(
        btn => /등록|저장|완료|submit/i.test(btn.textContent || btn.value)
      ) ||
      // 마지막 버튼 찾기
      Array.from(form.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn')).pop();
    
    if (submitButton) {
      submitButton.insertAdjacentHTML('beforebegin', checkboxHtml);
      console.log(`✅ Review2Earn: 체크박스 삽입 완료 (리뷰 작성자: ${reviewerPercent}%, 구매자: ${buyerPercent}%)`);
    } else {
      console.warn('⚠️ Review2Earn: 제출 버튼을 찾을 수 없습니다. 폼 끝에 삽입합니다.');
      form.insertAdjacentHTML('beforeend', checkboxHtml);
      console.log('⚠️ Review2Earn: 폼 끝에 체크박스 삽입');
    }

    // 폼 제출 이벤트 리스너 추가
    form.addEventListener('submit', handleFormSubmit);
  }

  // 폼 제출 처리
  function handleFormSubmit(event) {
    const checkbox = document.getElementById('r2e-consent-checkbox');
    
    if (!checkbox) {
      console.warn('⚠️ Review2Earn: 체크박스를 찾을 수 없습니다.');
      return;
    }

    if (checkbox.checked) {
      console.log('✅ Review2Earn: 사용자가 참여에 동의했습니다.');
      
      // 폼에 hidden input 추가 (서버 전송용)
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'r2e_consent';
      hiddenInput.value = 'true';
      event.target.appendChild(hiddenInput);
      
      console.log('✅ Review2Earn: r2e_consent=true 전송');
    } else {
      console.log('ℹ️ Review2Earn: 사용자가 참여하지 않기로 선택했습니다.');
    }
  }

  // 초기화
  async function init() {
    console.log('🚀 Review2Earn: 초기화 시작');

    // 동적 비율 가져오기
    const { reviewerPercent, buyerPercent } = await fetchRewardRates();
    
    console.log(`📊 Review2Earn: 리뷰어 ${reviewerPercent}%, 구매자 ${buyerPercent}%`);

    // 체크박스 삽입 시도
    insertConsentCheckbox(reviewerPercent, buyerPercent);

    // DOM 변경 감지 (동적 페이지 대응)
    const observer = new MutationObserver((mutations) => {
      if (!document.getElementById('r2e-consent-wrapper')) {
        insertConsentCheckbox(reviewerPercent, buyerPercent);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // DOM 로드 완료 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 페이지 완전 로드 후에도 한번 더 시도
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!document.getElementById('r2e-consent-wrapper')) {
        init();
      }
    }, 1000);
  });

})();
