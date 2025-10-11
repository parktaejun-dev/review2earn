// public/widget.js
// Review2Earn v6.1 Widget - 카페24 리뷰 작성 페이지 최적화
// Webhook 기반 자동 처리 (v6.0 멤버 전용)

(function() {
  'use strict';

  console.log('🚀 Review2Earn Widget v6.1 Loaded');

  // ============================================
  // 설정
  // ============================================
  const CONFIG = {
    CHECKBOX_STYLE: `
      margin: 20px 0; 
      padding: 18px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      border-radius: 12px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `,
    LABEL_STYLE: `
      display: flex; 
      align-items: center; 
      cursor: pointer;
      color: white !important;
    `,
    INPUT_STYLE: `
      width: 24px; 
      height: 24px; 
      margin-right: 12px; 
      cursor: pointer; 
      accent-color: #10b981;
    `,
  };

  // ============================================
  // 유틸리티
  // ============================================
  
  function isReviewWritePage() {
    const path = window.location.pathname;
    const search = window.location.search;
    
    return path.includes('/board/product/write') ||
           path.includes('/exec/front/Board/write') ||
           search.includes('board_no=');
  }

  function getSavedReferralCode() {
    return localStorage.getItem('r2e_referral_code');
  }

  function validateReferralCode(code) {
    const pattern = /^R2E-[A-F0-9]{12}$/i;
    return pattern.test(code);
  }

  // ============================================
  // 체크박스 생성 (카페24 최적화)
  // ============================================
  
  function createCheckbox() {
    // 중복 방지
    if (document.getElementById('r2e-checkbox-container')) {
      console.log('⚠️ R2E: Checkbox already exists');
      return;
    }

    const container = document.createElement('div');
    container.id = 'r2e-checkbox-container';
    container.style.cssText = CONFIG.CHECKBOX_STYLE;
    
    const savedCode = getSavedReferralCode();
    
    container.innerHTML = `
      <label style="${CONFIG.LABEL_STYLE}">
        <input 
          type="checkbox" 
          id="r2e-participate" 
          name="r2e_participate" 
          value="true"
          ${savedCode ? 'checked' : ''}
          style="${CONFIG.INPUT_STYLE}"
        />
        <div style="flex: 1;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
            🎯 Review2Earn 참여하기
          </div>
          <div style="font-size: 14px; opacity: 0.95;">
            ${savedCode 
              ? `✅ 레퍼럴 코드: <strong>${savedCode}</strong> (리뷰 작성 시 자동 적용)`
              : '리뷰 작성 시 자동으로 레퍼럴 코드가 생성되어 수익을 받을 수 있습니다!'
            }
          </div>
        </div>
      </label>
      ${!savedCode ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
          <button 
            type="button"
            id="r2e-enter-code-btn"
            style="
              background: white;
              color: #667eea;
              padding: 8px 16px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            "
          >
            📝 추천인 코드 입력
          </button>
        </div>
      ` : ''}
    `;

    // 이벤트 리스너
    const checkbox = container.querySelector('#r2e-participate');
    if (checkbox) {
      checkbox.addEventListener('change', function() {
        console.log(this.checked ? '✅ R2E 참여' : '⚠️ R2E 참여 취소');
      });
    }

    // 추천인 코드 입력 버튼
    const enterCodeBtn = container.querySelector('#r2e-enter-code-btn');
    if (enterCodeBtn) {
      enterCodeBtn.addEventListener('click', () => {
        const code = prompt('추천인 레퍼럴 코드를 입력하세요:\n(형식: R2E-XXXXXXXXXXXX)');
        if (code && validateReferralCode(code)) {
          localStorage.setItem('r2e_referral_code', code.toUpperCase());
          alert('✅ 레퍼럴 코드가 저장되었습니다!');
          location.reload(); // 페이지 새로고침
        } else if (code) {
          alert('❌ 올바른 형식이 아닙니다.\n형식: R2E-XXXXXXXXXXXX');
        }
      });
    }

    return container;
  }

  // ============================================
  // 삽입 위치 찾기 (카페24 폼 구조 최적화)
  // ============================================
  
  function findInsertionPoint() {
    // 시도 1: 제출 버튼 찾기
    const submitButtons = [
      'button[type="submit"]',
      '.btnSubmit',
      '.btnBasicFix',
      'a.btnSubmit',
    ];

    for (const selector of submitButtons) {
      const btn = document.querySelector(selector);
      if (btn) {
        console.log(`✅ R2E: Submit button found: ${selector}`);
        return { element: btn, position: 'before' };
      }
    }

    // 시도 2: 폼 찾기
    const forms = [
      'form#boardWriteForm',
      'form[name="boardWriteForm"]',
      'form.boardWrite',
    ];

    for (const selector of forms) {
      const form = document.querySelector(selector);
      if (form) {
        console.log(`✅ R2E: Form found: ${selector}`);
        return { element: form, position: 'prepend' };
      }
    }

    // 시도 3: textarea 찾기
    const textarea = document.querySelector('textarea[name="content"]') || 
                     document.querySelector('textarea');
    
    if (textarea) {
      console.log('✅ R2E: Textarea found');
      return { element: textarea, position: 'after' };
    }

    console.warn('⚠️ R2E: No insertion point found');
    return null;
  }

  // ============================================
  // 초기화
  // ============================================
  
  function init() {
    if (!isReviewWritePage()) {
      console.log('⚠️ R2E: Not a review write page');
      return;
    }

    console.log('✅ R2E: Review write page detected');

    // 삽입 위치 찾기
    const insertionPoint = findInsertionPoint();
    
    if (!insertionPoint) {
      console.error('❌ R2E: Cannot find insertion point');
      return;
    }

    // 체크박스 생성 및 삽입
    const checkbox = createCheckbox();
    const { element, position } = insertionPoint;

    if (position === 'before' && element.parentElement) {
      element.parentElement.insertBefore(checkbox, element);
      console.log('✅ R2E: Checkbox inserted before submit button');
    } else if (position === 'after' && element.parentElement) {
      element.parentElement.insertBefore(checkbox, element.nextSibling);
      console.log('✅ R2E: Checkbox inserted after textarea');
    } else if (position === 'prepend') {
      element.insertBefore(checkbox, element.firstChild);
      console.log('✅ R2E: Checkbox prepended to form');
    }
  }

  // ============================================
  // 실행 (여러 시점에서 시도)
  // ============================================
  
  // 즉시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 지연 실행 (동적 로딩 대비)
  setTimeout(init, 1000);
  setTimeout(init, 2000);
})();
