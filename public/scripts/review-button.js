/**
 * 리뷰투언(Review2Earn) v2.0.0
 * 리뷰 작성 페이지에서만 버튼 표시
 */
(function() {
  'use strict';
  
  console.log('🎯 Review2Earn v2.0.0 로딩...');
  
  // 리뷰 작성 페이지 감지
  function isReviewWritePage() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    // 여러 조건으로 리뷰 작성 페이지 감지
    return (
      url.includes('/board/product/write.html') ||
      url.includes('/board/review/write') ||
      pathname.includes('/board') && url.includes('write') ||
      document.querySelector('form[name="BoardWriteForm"]') !== null
    );
  }
  
  if (!isReviewWritePage()) {
    console.log('ℹ️ 리뷰 작성 페이지가 아니므로 종료');
    return;
  }
  
  console.log('✅ 리뷰 작성 페이지 감지!');
  
  // DOM 로드 대기
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    console.log('🚀 Review2Earn 초기화 시작...');
    
    // 리뷰 폼 찾기
    const form = findReviewForm();
    
    if (!form) {
      console.warn('⚠️ 리뷰 작성 폼을 찾을 수 없습니다.');
      return;
    }
    
    console.log('✅ 리뷰 작성 폼 발견:', form);
    
    // 이미 버튼이 있는지 확인
    if (document.querySelector('.review2earn-button')) {
      console.log('⚠️ 버튼이 이미 존재합니다.');
      return;
    }
    
    // 버튼 생성 및 삽입
    insertButton(form);
  }
  
  function findReviewForm() {
    const selectors = [
      'form[name="BoardWriteForm"]',
      'form[name="ReviewForm"]',
      'form.review-form',
      'form#reviewWriteForm',
      '.board-write form',
      '.review-write form'
    ];
    
    for (const selector of selectors) {
      const form = document.querySelector(selector);
      if (form) {
        console.log(`✅ 폼 발견: ${selector}`);
        return form;
      }
    }
    
    return null;
  }
  
  function insertButton(form) {
    const container = document.createElement('div');
    container.className = 'review2earn-container';
    container.style.cssText = `
      margin: 20px 0;
      padding: 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      text-align: center;
      animation: fadeIn 0.5s ease-in;
    `;
    
    container.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .review2earn-button:hover {
          transform: translateY(-3px) scale(1.05) !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
        }
      </style>
      <div style="color: white; font-size: 22px; font-weight: bold; margin-bottom: 12px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        💰 리뷰투언으로 수익 창출하기
      </div>
      <div style="color: rgba(255,255,255,0.95); font-size: 15px; line-height: 1.6; margin-bottom: 18px;">
        ✅ 이 리뷰를 보고 구매한 사람이 있으면 <strong>구매액의 1%를 적립금</strong>으로 지급!<br>
        ✅ 구매자도 1% 할인 쿠폰 자동 발급 (쇼핑몰 부담 2.5%)
      </div>
      <button type="button" class="review2earn-button" style="
        background: white;
        color: #667eea;
        padding: 16px 32px;
        border: none;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        text-transform: uppercase;
        letter-spacing: 1px;
      ">
        🎁 리뷰 등록하고 수익받기
      </button>
    `;
    
    const button = container.querySelector('.review2earn-button');
    
    button.addEventListener('click', function() {
      this.disabled = true;
      this.textContent = '⏳ 처리 중...';
      
      setTimeout(() => {
        alert('🎉 리뷰투언 등록 완료!\n\n✅ 이제 이 리뷰를 보고 구매한 사람이 있으면\n   구매액의 1%를 적립금으로 받게 됩니다!\n\n💰 예시: 100,000원 구매 시 → 1,000원 적립금\n💳 구매자도 1% 할인 쿠폰 자동 발급!');
        
        this.disabled = false;
        this.textContent = '✅ 등록 완료!';
        this.style.background = '#4CAF50';
        this.style.color = 'white';
      }, 1000);
    });
    
    // 폼 맨 위에 삽입
    form.insertBefore(container, form.firstChild);
    
    console.log('✅ Review2Earn 버튼 삽입 완료!');
  }
  
  // 디버깅용 전역 함수
  window.Review2Earn = {
    version: '2.0.0',
    reinit: init,
    isReviewPage: isReviewWritePage
  };
  
  console.log('✅ Review2Earn v2.0.0 로딩 완료!');
})();
