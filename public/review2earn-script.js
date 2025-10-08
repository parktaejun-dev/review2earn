// public/review2earn-script.js
(function() {
  'use strict';
  
  console.log('✅ Review2Earn 스크립트 로드됨!');
  
  // DOM이 완전히 로드될 때까지 대기
  function init() {
    console.log('🔍 페이지 로드 완료, 폼 찾기 시작...');
    
    // 1. 폼 찾기
    const form = document.querySelector('form');
    
    if (!form) {
      console.error('❌ 폼을 찾을 수 없습니다!');
      return;
    }
    
    console.log('✅ 폼 발견:', form);
    
    // 2. 체크박스 생성
    const checkbox = document.createElement('div');
    checkbox.innerHTML = `
      <label style="display: block; margin: 20px 0; padding: 15px; background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px;">
        <input type="checkbox" id="review2earn-consent" style="margin-right: 10px;">
        <strong>Review2Earn에 참여하시겠습니까?</strong>
        <p style="margin: 5px 0 0 24px; font-size: 12px; color: #666;">
          체크하시면 추천 링크가 생성되어 추가 수익을 얻을 수 있습니다.
        </p>
      </label>
    `;
    
    // 3. 폼 최상단에 삽입
    form.insertBefore(checkbox, form.firstChild);
    
    console.log('✅ 체크박스 삽입 완료!');
    
    // 4. 체크박스 이벤트 리스너
    const consentCheckbox = document.getElementById('review2earn-consent');
    
    consentCheckbox.addEventListener('change', function(e) {
      console.log('📝 동의 상태 변경:', e.target.checked);
      
      // localStorage에 저장
      localStorage.setItem('review2earn_consent', e.target.checked);
      
      if (e.target.checked) {
        console.log('✅ Review2Earn 참여 동의!');
      } else {
        console.log('❌ Review2Earn 참여 거부');
      }
    });
  }
  
  // DOM 로드 완료 확인
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
