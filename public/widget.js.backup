// public/widget.js
// Review2Earn v6.0 Widget - 라이트/다크 모드 완벽 대응
// 리뷰 작성 페이지에 자동으로 버튼 생성

(function() {
  'use strict';

  // ============================================
  // 설정
  // ============================================
  const CONFIG = {
    API_BASE: window.location.origin,
    BUTTON_TEXT: '💰 R2E 참여하고 수익 받기',
    BUTTON_STYLE: `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin: 10px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `,
    MODAL_OVERLAY_STYLE: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6) !important;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      backdrop-filter: blur(4px);
    `,
    MODAL_CONTENT_STYLE: `
      background: #ffffff !important;
      color: #1a1a1a !important;
      padding: 35px;
      border-radius: 16px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      position: relative;
    `,
  };

  // ============================================
  // 유틸리티
  // ============================================
  
  function validateReferralCode(code) {
    const pattern = /^R2E-[A-F0-9]{12}$/i;
    return pattern.test(code);
  }

  function getSavedReferralCode() {
    return localStorage.getItem('r2e_referral_code');
  }

  function saveReferralCode(code) {
    localStorage.setItem('r2e_referral_code', code.toUpperCase());
  }

  function getReferralCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('r2e') || params.get('ref');
    return code && validateReferralCode(code) ? code.toUpperCase() : null;
  }

  // ============================================
  // 모달 생성 (다크 모드 완벽 대응)
  // ============================================
  
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'r2e-modal';
    modal.style.cssText = CONFIG.MODAL_OVERLAY_STYLE;
    
    const savedCode = getSavedReferralCode();
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = CONFIG.MODAL_CONTENT_STYLE;
    
    modalContent.innerHTML = `
      <h2 style="
        margin: 0 0 12px 0; 
        font-size: 26px; 
        color: #1a1a1a !important;
        font-weight: 700;
        line-height: 1.3;
      ">
        💰 Review2Earn 참여
      </h2>
      
      <p style="
        color: #2d3748 !important; 
        margin: 0 0 24px 0; 
        line-height: 1.7;
        font-size: 15px;
      ">
        추천인 레퍼럴 코드를 입력하면, 이 리뷰를 통해 발생하는 구매에서 수익을 받을 수 있습니다!
      </p>
      
      <div style="margin-bottom: 24px;">
        <label style="
          display: block; 
          margin-bottom: 10px; 
          font-weight: 600; 
          color: #1a1a1a !important;
          font-size: 14px;
        ">
          레퍼럴 코드 입력
        </label>
        <input 
          type="text" 
          id="r2e-referral-input"
          placeholder="R2E-XXXXXXXXXXXX"
          value="${savedCode || ''}"
          maxlength="16"
          autocomplete="off"
          style="
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #cbd5e0 !important;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
            font-family: 'Courier New', Consolas, monospace;
            text-transform: uppercase;
            color: #1a1a1a !important;
            background: #f7fafc !important;
            transition: all 0.2s ease;
            outline: none;
          "
        />
        <small style="
          display: block; 
          margin-top: 8px; 
          color: #718096 !important;
          font-size: 13px;
        ">
          형식: R2E-로 시작하는 12자리 코드
        </small>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <button 
          id="r2e-submit-btn"
          style="
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 14px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          "
        >
          ✅ 확인
        </button>
        <button 
          id="r2e-skip-btn"
          style="
            flex: 1;
            background: #e2e8f0 !important;
            color: #2d3748 !important;
            padding: 14px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          "
        >
          ⏭️ 참여 안함
        </button>
      </div>

      <div style="
        padding-top: 16px; 
        border-top: 1px solid #e2e8f0;
      ">
        <p style="
          font-size: 13px; 
          color: #718096 !important; 
          margin: 0;
          line-height: 1.6;
        ">
          💡 <strong style="color: #2d3748 !important;">레퍼럴 코드가 없으신가요?</strong><br>
          리뷰를 작성하면 자동으로 생성됩니다!
        </p>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // ============================================
    // 이벤트 리스너
    // ============================================
    
    const input = document.getElementById('r2e-referral-input');
    const submitBtn = document.getElementById('r2e-submit-btn');
    const skipBtn = document.getElementById('r2e-skip-btn');
    
    // 포커스 효과
    input.addEventListener('focus', () => {
      input.style.borderColor = '#667eea';
      input.style.background = '#ffffff';
    });
    
    input.addEventListener('blur', () => {
      input.style.borderColor = '#cbd5e0';
      input.style.background = '#f7fafc';
    });
    
    // 자동 대문자 변환
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
    
    // 버튼 호버 효과
    submitBtn.addEventListener('mouseenter', () => {
      submitBtn.style.transform = 'translateY(-2px)';
      submitBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
    });
    
    submitBtn.addEventListener('mouseleave', () => {
      submitBtn.style.transform = 'translateY(0)';
      submitBtn.style.boxShadow = 'none';
    });
    
    skipBtn.addEventListener('mouseenter', () => {
      skipBtn.style.background = '#cbd5e0';
    });
    
    skipBtn.addEventListener('mouseleave', () => {
      skipBtn.style.background = '#e2e8f0';
    });
    
    // 확인 버튼
    submitBtn.addEventListener('click', () => {
      const code = input.value.trim();
      
      if (code && !validateReferralCode(code)) {
        alert('올바른 레퍼럴 코드 형식이 아닙니다.\n형식: R2E-XXXXXXXXXXXX');
        input.focus();
        return;
      }
      
      if (code) {
        saveReferralCode(code);
        alert('✅ 레퍼럴 코드가 저장되었습니다!\n리뷰 작성 시 자동으로 적용됩니다.');
      }
      
      modal.remove();
    });
    
    // 참여 안함 버튼
    skipBtn.addEventListener('click', () => {
      localStorage.removeItem('r2e_referral_code');
      modal.remove();
    });
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // ESC 키로 닫기
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // 입력 필드에 자동 포커스
    setTimeout(() => {
      input.focus();
    }, 100);
  }

  // ============================================
  // 버튼 생성
  // ============================================
  
  function createButton() {
    const button = document.createElement('button');
    button.id = 'r2e-widget-button';
    button.type = 'button';
    button.textContent = CONFIG.BUTTON_TEXT;
    button.style.cssText = CONFIG.BUTTON_STYLE;
    
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
    button.addEventListener('click', () => {
      createModal();
    });
    
    return button;
  }

  // ============================================
  // 버튼 삽입 위치 찾기
  // ============================================
  
  function findInsertionPoint() {
    const selectors = [
      'form[name="boardWriteForm"]',
      'form[action*="board_write"]',
      'form.boardWrite',
      '#boardWriteForm',
      'textarea[name="content"]',
      'textarea[name="board_content"]',
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.tagName === 'FORM' ? element : element.closest('form');
      }
    }
    
    return null;
  }

  // ============================================
  // 초기화
  // ============================================
  
  function init() {
    console.log('🚀 Review2Earn Widget v6.0 Loaded (Light/Dark Mode Compatible)');
    
    // URL에서 레퍼럴 코드 확인
    const urlCode = getReferralCodeFromURL();
    if (urlCode) {
      saveReferralCode(urlCode);
      console.log('✅ 레퍼럴 코드 저장됨:', urlCode);
    }
    
    // 리뷰 작성 페이지 확인
    if (window.location.pathname.includes('board_write') || 
        window.location.pathname.includes('review') ||
        window.location.pathname.includes('test-widget')) {
      
      const insertionPoint = findInsertionPoint();
      
      if (insertionPoint) {
        const button = createButton();
        insertionPoint.insertBefore(button, insertionPoint.firstChild);
        console.log('✅ R2E 버튼 생성 완료');
        
        // 저장된 코드가 없으면 자동으로 모달 표시
        if (!getSavedReferralCode() && !urlCode) {
          setTimeout(() => {
            createModal();
          }, 1000);
        }
      } else {
        console.warn('⚠️ 리뷰 작성 폼을 찾을 수 없습니다.');
      }
    }
  }

  // ============================================
  // 실행
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
