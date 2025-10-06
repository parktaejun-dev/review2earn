// review-button.js - Review2Earn 할인 버튼 스크립트
(function() {
    'use strict';
    
    console.log('🎯 Review2Earn 스크립트 로드됨 - v2.0');
    
    // 스크립트 중복 실행 방지
    if (window.review2earnLoaded) {
        console.log('⚠️ Review2Earn 이미 로드됨');
        return;
    }
    window.review2earnLoaded = true;
    
    function initializeReviewButton() {
        console.log('📝 리뷰 작성 폼 초기화 시작');
        
        // 다양한 리뷰 폼 선택자들 시도
        const selectors = [
            'form[name="BoardWriteForm"]',
            'form[action*="board_write"]',
            'form.boardWrite',
            'form[id*="review"]',
            'form[class*="review"]',
            'form[name*="board"]',
            'form[name*="Board"]'
        ];
        
        let reviewForm = null;
        for (const selector of selectors) {
            reviewForm = document.querySelector(selector);
            if (reviewForm) {
                console.log(`✅ 리뷰 폼 발견: ${selector}`);
                break;
            }
        }
        
        if (!reviewForm) {
            console.log('❌ 리뷰 작성 폼을 찾을 수 없습니다. 2초 후 재시도...');
            setTimeout(initializeReviewButton, 2000);
            return;
        }
        
        // 기존 버튼 중복 확인
        if (document.getElementById('review2earn-discount-btn')) {
            console.log('⚠️ Review2Earn 버튼이 이미 존재합니다.');
            return;
        }
        
        createDiscountButton(reviewForm);
    }
    
    function createDiscountButton(form) {
        console.log('🔨 할인 버튼 생성 중...');
        
        // 할인 버튼 컨테이너 생성
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'review2earn-container';
        buttonContainer.style.cssText = `
            margin: 20px 0;
            text-align: center;
            padding: 15px;
            background: linear-gradient(135deg, #fff7e6, #ffe6cc);
            border-radius: 12px;
            border: 2px dashed #FF6B35;
        `;
        
        // 설명 텍스트
        const description = document.createElement('p');
        description.innerHTML = '📝 <strong>리뷰를 작성하시면 할인 쿠폰을 드려요!</strong>';
        description.style.cssText = `
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: bold;
        `;
        
        // 할인 버튼 생성
        const discountButton = document.createElement('button');
        discountButton.id = 'review2earn-discount-btn';
        discountButton.type = 'button';
        discountButton.innerHTML = `
            <span style="font-size: 20px;">🎁</span>
            <span style="margin: 0 8px;">할인 쿠폰 받기</span>
            <span style="font-size: 14px; display: block; margin-top: 4px; opacity: 0.9;">최대 30% 할인!</span>
        `;
        
        // 버튼 스타일링
        discountButton.style.cssText = `
            background: linear-gradient(135deg, #FF6B35, #F7931E);
            color: white;
            padding: 18px 30px;
            border: none;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
            transition: all 0.3s ease;
            text-align: center;
            position: relative;
            overflow: hidden;
            min-width: 200px;
        `;
        
        // CSS 애니메이션 추가
        if (!document.getElementById('review2earn-styles')) {
            const style = document.createElement('style');
            style.id = 'review2earn-styles';
            style.textContent = `
                @keyframes review2earn-pulse {
                    0% { transform: scale(1); box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4); }
                    100% { transform: scale(1); box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3); }
                }
                
                #review2earn-discount-btn:hover {
                    background: linear-gradient(135deg, #E55A2B, #E6821A) !important;
                    transform: translateY(-3px) !important;
                    box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4) !important;
                    animation: none !important;
                }
                
                #review2earn-discount-btn:active {
                    transform: translateY(-1px) !important;
                }
                
                #review2earn-discount-btn.pulsing {
                    animation: review2earn-pulse 2s infinite;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 펄스 애니메이션 추가
        discountButton.classList.add('pulsing');
        
        // 클릭 이벤트
        discountButton.addEventListener('click', handleButtonClick);
        
        // 컨테이너에 요소들 추가
        buttonContainer.appendChild(description);
        buttonContainer.appendChild(discountButton);
        
        // 버튼 삽입 위치 찾기
        insertButtonInForm(form, buttonContainer);
    }
    
    function insertButtonInForm(form, container) {
        // 다양한 삽입 위치 시도
        const insertTargets = [
            form.querySelector('textarea[name*="content"]'),
            form.querySelector('textarea[name*="Content"]'),
            form.querySelector('textarea'),
            form.querySelector('input[type="submit"]'),
            form.querySelector('button[type="submit"]'),
            form.querySelector('.btn'),
            form.querySelector('.button')
        ];
        
        let inserted = false;
        for (const target of insertTargets) {
            if (target) {
                // 텍스트 영역이면 뒤에, 버튼이면 앞에 삽입
                if (target.tagName === 'TEXTAREA') {
                    target.parentNode.insertBefore(container, target.nextSibling);
                    console.log('✅ 할인 버튼을 텍스트 영역 뒤에 삽입');
                } else {
                    target.parentNode.insertBefore(container, target);
                    console.log('✅ 할인 버튼을 제출 버튼 앞에 삽입');
                }
                inserted = true;
                break;
            }
        }
        
        if (!inserted) {
            form.appendChild(container);
            console.log('✅ 할인 버튼을 폼 끝에 추가');
        }
    }
    
    function handleButtonClick() {
        console.log('🎫 쿠폰 생성 프로세스 시작');
        
        const button = document.getElementById('review2earn-discount-btn');
        const originalHTML = button.innerHTML;
        
        // 버튼 로딩 상태
        button.innerHTML = '<span style="animation: review2earn-spin 1s linear infinite;">⏳</span> 쿠폰 생성 중...';
        button.disabled = true;
        button.classList.remove('pulsing');
        
        // 스피너 애니메이션 추가
        if (!document.getElementById('review2earn-spinner')) {
            const spinStyle = document.createElement('style');
            spinStyle.id = 'review2earn-spinner';
            spinStyle.textContent = `
                @keyframes review2earn-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(spinStyle);
        }
        
        setTimeout(() => {
            generateCoupon(button, originalHTML);
        }, 1500);
    }
    
    function generateCoupon(button, originalHTML) {
        // 쿠폰 데이터 생성
        const discountValue = Math.floor(Math.random() * 21) + 10; // 10-30%
        const couponData = {
            couponId: 'R2E-' + Date.now(),
            discountType: 'percentage',
            discountValue: discountValue,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            mallId: extractMallId(),
            timestamp: new Date().toISOString(),
            used: false,
            generatedUrl: window.location.href
        };
        
        try {
            // 로컬스토리지에 쿠폰 저장
            localStorage.setItem('review2earn_coupon', JSON.stringify(couponData));
            console.log('✅ 쿠폰 생성 완료:', couponData);
            
            // 백엔드 연동 시도
            notifyBackend(couponData);
            
            // 성공 상태 표시
            button.innerHTML = `
                <span style="font-size: 20px;">✅</span>
                <span>${discountValue}% 할인 쿠폰 발급!</span>
                <span style="font-size: 12px; display: block; margin-top: 4px;">주문 시 자동 적용됩니다</span>
            `;
            button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            
            // 성공 팝업 표시
            showCouponPopup(couponData);
            
            // 3초 후 원래 상태로 복원
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
                button.style.background = 'linear-gradient(135deg, #FF6B35, #F7931E)';
                button.classList.add('pulsing');
            }, 4000);
            
        } catch (error) {
            console.error('❌ 쿠폰 생성 실패:', error);
            handleCouponError(button, originalHTML);
        }
    }
    
    function extractMallId() {
        try {
            const hostname = window.location.hostname;
            return hostname.split('.')[0]; // xxx.cafe24.com에서 xxx 추출
        } catch (error) {
            return 'unknown';
        }
    }
    
    function notifyBackend(couponData) {
        fetch('https://review2earn.vercel.app/api/generate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generateCoupon',
                couponData: couponData
            })
        })
        .then(response => response.json())
        .then(data => console.log('🚀 백엔드 연동 성공:', data))
        .catch(error => console.warn('⚠️ 백엔드 연동 실패 (쿠폰은 정상 생성됨):', error));
    }
    
    function showCouponPopup(couponData) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('review2earn-popup');
        if (existingPopup) existingPopup.remove();
        
        const popup = document.createElement('div');
        popup.id = 'review2earn-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 999999;
            text-align: center;
            border: 3px solid #FF6B35;
            max-width: 400px;
            animation: review2earn-popup-show 0.3s ease-out;
        `;
        
        // 팝업 애니메이션 추가
        if (!document.getElementById('review2earn-popup-styles')) {
            const popupStyle = document.createElement('style');
            popupStyle.id = 'review2earn-popup-styles';
            popupStyle.textContent = `
                @keyframes review2earn-popup-show {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(popupStyle);
        }
        
        popup.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
            <h3 style="color: #FF6B35; margin-bottom: 15px; font-size: 28px;">할인 쿠폰 발급 완료!</h3>
            <div style="background: linear-gradient(135deg, #FFF3E0, #FFE0B2); padding: 20px; border-radius: 15px; margin: 20px 0; border: 2px solid #FFB74D;">
                <div style="font-size: 36px; font-weight: bold; color: #FF6B35; margin-bottom: 8px;">${couponData.discountValue}% 할인</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">쿠폰 ID: ${couponData.couponId}</div>
                <div style="font-size: 12px; color: #888;">유효기간: 7일</div>
            </div>
            <p style="margin: 20px 0; color: #333; font-size: 16px; font-weight: bold;">🛒 주문 페이지에서 자동으로 적용됩니다!</p>
            <p style="font-size: 13px; color: #666; margin-bottom: 25px;">쿠폰은 브라우저에 안전하게 저장되었습니다.</p>
            <button onclick="this.parentNode.remove()" style="
                background: linear-gradient(135deg, #FF6B35, #F7931E); 
                color: white; 
                border: none; 
                padding: 15px 30px; 
                border-radius: 25px; 
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">확인</button>
        `;
        
        document.body.appendChild(popup);
        
        // 자동 닫기
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 10000);
    }
    
    function handleCouponError(button, originalHTML) {
        button.innerHTML = '❌ 오류 발생 - 다시 시도해주세요';
        button.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        button.classList.remove('pulsing');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
            button.style.background = 'linear-gradient(135deg, #FF6B35, #F7931E)';
            button.classList.add('pulsing');
        }, 3000);
    }
    
    // 초기화 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReviewButton);
    } else {
        setTimeout(initializeReviewButton, 1000);
    }
    
    // 동적 페이지 변경 감지 (SPA 대응)
    let currentUrl = location.href;
    const urlObserver = setInterval(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            if (currentUrl.includes('board') || currentUrl.includes('review') || currentUrl.includes('Board')) {
                console.log('📱 페이지 변경 감지, 버튼 재초기화');
                setTimeout(initializeReviewButton, 1500);
            }
        }
    }, 1000);
    
    console.log('🎯 Review2Earn 스크립트 초기화 완료 - 리뷰 페이지 감시 중');
    
})();
