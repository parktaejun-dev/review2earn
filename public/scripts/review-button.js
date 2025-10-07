// public/scripts/review-button.js
(function() {
  'use strict';
  
  console.log('✅ Review2Earn 스크립트 로드됨');
  
  // 리뷰 작성 페이지에서만 실행
  const isReviewPage = 
    window.location.href.includes('/board/product/write.html') ||
    window.location.href.includes('/review/write') ||
    document.querySelector('form[name="BoardWriteForm"]') !== null;
  
  if (!isReviewPage) {
    console.log('ℹ️ 리뷰 페이지가 아니므로 스크립트 종료');
    return;
  }
  
  console.log('🎯 리뷰 작성 페이지 감지!');
  
  // DOM 로드 대기
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewButton);
  } else {
    initReviewButton();
  }
  
  function initReviewButton() {
    // 리뷰 작성 폼 찾기
    const reviewForm = document.querySelector('form[name="BoardWriteForm"]');
    
    if (!reviewForm) {
      console.warn('⚠️ 리뷰 작성 폼을 찾을 수 없습니다.');
      return;
    }
    
    console.log('✅ 리뷰 작성 폼 발견!');
    
    // 이미 버튼이 있는지 확인
    if (reviewForm.querySelector('.review2earn-button')) {
      console.log('⚠️ 버튼이 이미 존재합니다.');
      return;
    }
    
    // 버튼 생성
    const container = document.createElement('div');
    container.className = 'review2earn-container';
    container.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      text-align: center;
    `;
    
    container.innerHTML = `
      <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        💰 리뷰투언으로 수익 창출하기
      </div>
      <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 15px;">
        ✅ 리뷰를 보고 구매한 사람이 있으면 구매액의 1%를 적립금으로 지급!<br>
        ✅ 구매자도 1% 할인 쿠폰 자동 발급
      </div>
      <button type="button" class="review2earn-button" style="
        background: white;
        color: #667eea;
        padding: 14px 28px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        🎁 리뷰 등록하고 수익받기
      </button>
    `;
    
    const button = container.querySelector('.review2earn-button');
    
    button.addEventListener('click', function() {
      alert('🎉 리뷰투언 등록 완료!\n\n이제 이 리뷰를 보고 구매한 사람이 있으면\n구매액의 1%를 적립금으로 받게 됩니다!');
    });
    
    // 리뷰 작성 폼 위에 버튼 삽입
    reviewForm.insertBefore(container, reviewForm.firstChild);
    
    console.log('✅ Review2Earn 버튼 삽입 완료!');
  }
})();
