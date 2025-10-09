(function () {
  'use strict';

  console.log('✅ Review2Earn 스크립트 로드됨');

  // ✅ 리뷰 작성 페이지 필터링
  const isReviewWritePage =
    window.location.pathname.includes('/board/product/write') ||
    window.location.pathname.includes('review_write') ||
    window.location.search.includes('board_no=4');

  if (!isReviewWritePage) {
    console.log('❌ Review2Earn: 리뷰 작성 페이지가 아님. 실행 중단.');
    return;
  }

  console.log('✅ Review2Earn: 리뷰 작성 페이지 감지됨');
  console.log('🚀 Review2Earn: 초기화 시작');

  const REVIEWER_PERCENTAGE = 0.01;
  const BUYER_PERCENTAGE = 0.05;

  console.log(`📊 Review2Earn: 리뷰어 ${REVIEWER_PERCENTAGE * 100}%, 구매자 ${BUYER_PERCENTAGE * 100}%`);

  function waitForElement(selector, callback, timeout = 10000) {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        callback(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.error('⏱️ Review2Earn: 요소를 찾지 못했습니다:', selector);
      }
    }, 100);
  }

  waitForElement('form[name="boardWriteForm"], form#boardWriteForm, form.boardWrite', (form) => {
    console.log('✅ Review2Earn: 폼 발견', form);

    const consentBox = document.createElement('div');
    consentBox.id = 'review2earn-consent';
    consentBox.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    consentBox.innerHTML = `
      <label style="display: flex; align-items: center; cursor: pointer; color: white;">
        <input 
          type="checkbox" 
          id="r2e_consent_checkbox" 
          name="r2e_consent_checkbox"
          style="
            width: 24px;
            height: 24px;
            margin-right: 12px;
            cursor: pointer;
            accent-color: #fff;
          "
        />
        <div>
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 8px;">💰</span>
            <span>Review2Earn에 참여하기</span>
          </div>
          <div style="font-size: 14px; opacity: 0.95; line-height: 1.6;">
            이 리뷰를 통해 구매가 발생하면<br>
            <strong style="color: #ffd700;">1% 적립금</strong>을 받습니다!<br>
            <span style="font-size: 12px; opacity: 0.8;">💸 구매자는 5% 할인 혜택을 받습니다.</span>
          </div>
        </div>
      </label>
    `;

    const submitButton = form.querySelector('button[type="submit"], input[type="submit"], .btnSubmit');
    if (submitButton) {
      submitButton.parentNode.insertBefore(consentBox, submitButton);
      console.log('✅ Review2Earn: 체크박스 삽입 완료');
    } else {
      form.appendChild(consentBox);
      console.log('⚠️ Review2Earn: 제출 버튼을 찾지 못해 폼 끝에 삽입');
    }

    form.addEventListener('submit', (event) => {
      const checkbox = document.getElementById('r2e_consent_checkbox');
      if (checkbox && checkbox.checked) {
        console.log('✅ Review2Earn: 사용자가 참여에 동의했습니다.');

        let hiddenInput = form.querySelector('input[name="r2e_consent"]');
        if (!hiddenInput) {
          hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'r2e_consent';
          hiddenInput.value = 'true';
          form.appendChild(hiddenInput);
          console.log('✅ Review2Earn: r2e_consent=true 전송');
        }
      } else {
        console.log('ℹ️ Review2Earn: 사용자가 참여하지 않음');
      }
    });
  });
})();
