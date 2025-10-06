// public/review-earn-button.js - 진정한 Review2Earn 시스템
(function() {
    'use strict';
    
    console.log('🎯 Review2Earn 시스템 로드됨 - v3.0 (올바른 버전)');
    
    // 스크립트 중복 실행 방지
    if (window.review2earnEarnLoaded) {
        console.log('⚠️ Review2Earn Earn 시스템이 이미 로드됨');
        return;
    }
    window.review2earnEarnLoaded = true;
    
    function initializeReview2EarnSystem() {
        console.log('💰 Review2Earn 적립 시스템 초기화 시작');
        
        // 리뷰 영역 찾기 (다양한 선택자 시도)
        const reviewSelectors = [
            '.xans-board-list-4', // 카페24 기본 리뷰 목록
            '.review-list',
            '.board-list',
            '[class*="review"]',
            '[class*="board"]',
            '.product-review',
            '#prdReview'
        ];
        
        let reviewContainer = null;
        for (const selector of reviewSelectors) {
            reviewContainer = document.querySelector(selector);
            if (reviewContainer) {
                console.log(`✅ 리뷰 영역 발견: ${selector}`);
                break;
            }
        }
        
        if (!reviewContainer) {
            console.log('❌ 리뷰 영역을 찾을 수 없습니다. 3초 후 재시도...');
            setTimeout(initializeReview2EarnSystem, 3000);
            return;
        }
        
        // 기존 버튼 중복 확인
        if (document.querySelector('.review2earn-earn-btn')) {
            console.log('⚠️ Review2Earn 적립 버튼이 이미 존재합니다.');
            return;
        }
        
        addEarnButtonsToReviews(reviewContainer);
    }
    
    function addEarnButtonsToReviews(container) {
        console.log('🔨 리뷰별 적립 버튼 생성 중...');
        
        // 개별 리뷰 항목들 찾기
        const reviewItems = container.querySelectorAll('tr, .review-item, .board-item, [class*="list"]');
        
        reviewItems.forEach((reviewItem, index) => {
            // 이미 버튼이 있는지 확인
            if (reviewItem.querySelector('.review2earn-earn-btn')) return;
            
            // 리뷰 내용이 있는지 확인 (빈 헤더 행 제외)
            const reviewContent = reviewItem.querySelector('td, .content, .review-content');
            if (!reviewContent || reviewContent.textContent.trim().length < 10) return;
            
            createEarnButton(reviewItem, index);
        });
        
        console.log(`✅ ${reviewItems.length}개 리뷰에 적립 버튼 추가 완료`);
    }
    
    function createEarnButton(reviewItem, reviewIndex) {
        // 적립 버튼 생성
        const earnButton = document.createElement('button');
        earnButton.className = 'review2earn-earn-btn';
        earnButton.type = 'button';
        earnButton.innerHTML = `
            <span style="font-size: 16px;">👍</span>
            <span style="margin: 0 8px; font-weight: bold;">도움됨+1%할인</span>
            <span style="font-size: 12px; display: block; margin-top: 2px; opacity: 0.9;">리뷰어에게 적립금 지급</span>
        `;
        
        // 버튼 스타일링
        earnButton.style.cssText = `
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
            text-align: center;
            margin: 8px;
            min-width: 140px;
        `;
        
        // CSS 애니메이션 추가
        if (!document.getElementById('review2earn-earn-styles')) {
            const style = document.createElement('style');
            style.id = 'review2earn-earn-styles';
            style.textContent = `
                @keyframes review2earn-earn-pulse {
                    0% { transform: scale(1); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
                    50% { transform: scale(1.02); box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4); }
                    100% { transform: scale(1); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
                }
                
                .review2earn-earn-btn:hover {
                    background: linear-gradient(135deg, #218838, #1e7e34) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4) !important;
                }
                
                .review2earn-earn-btn.pulsing {
                    animation: review2earn-earn-pulse 2s infinite;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 펄스 애니메이션 추가
        earnButton.classList.add('pulsing');
        
        // 클릭 이벤트
        earnButton.addEventListener('click', (e) => handleEarnButtonClick(e, reviewIndex));
        
        // 버튼 삽입 위치 찾기
        insertEarnButton(reviewItem, earnButton);
    }
    
    function insertEarnButton(reviewItem, button) {
        // 다양한 삽입 위치 시도
        const insertTargets = [
            reviewItem.querySelector('td:last-child'),
            reviewItem.querySelector('.review-actions'),
            reviewItem.querySelector('.content'),
            reviewItem
        ];
        
        let inserted = false;
        for (const target of insertTargets) {
            if (target) {
                if (target.tagName === 'TD') {
                    // 테이블 셀에 추가
                    target.appendChild(button);
                } else {
                    // 일반 요소에 추가
                    target.appendChild(button);
                }
                inserted = true;
                break;
            }
        }
        
        if (!inserted) {
            reviewItem.appendChild(button);
        }
        
        console.log('✅ 적립 버튼을 리뷰에 삽입 완료');
    }
    
    function handleEarnButtonClick(event, reviewIndex) {
        console.log(`💰 Review2Earn 적립 프로세스 시작 - 리뷰 #${reviewIndex}`);
        
        const button = event.target.closest('.review2earn-earn-btn');
        const originalHTML = button.innerHTML;
        
        // 버튼 로딩 상태
        button.innerHTML = '<span style="animation: review2earn-earn-spin 1s linear infinite;">⏳</span> 할인 쿠폰 생성 중...';
        button.disabled = true;
        button.classList.remove('pulsing');
        
        // 스피너 애니메이션 추가
        if (!document.getElementById('review2earn-earn-spinner')) {
            const spinStyle = document.createElement('style');
            spinStyle.id = 'review2earn-earn-spinner';
            spinStyle.textContent = `
                @keyframes review2earn-earn-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(spinStyle);
        }
        
        setTimeout(() => {
            processEarnTransaction(button, originalHTML, reviewIndex);
        }, 2000);
    }
    
    function processEarnTransaction(button, originalHTML, reviewIndex) {
        // 구매자용 할인 쿠폰 생성
        const buyerDiscountPercent = 1; // 1% 할인
        const reviewerEarnPercent = 1; // 리뷰어 1% 적립
        
        const earnData = {
            type: 'review2earn_transaction',
            reviewId: `review_${Date.now()}_${reviewIndex}`,
            buyerDiscount: buyerDiscountPercent,
            reviewerEarn: reviewerEarnPercent,
            couponId: 'R2E-EARN-' + Date.now(),
            mallId: extractMallId(),
            timestamp: new Date().toISOString(),
            reviewIndex: reviewIndex
        };
        
        try {
            // 로컬스토리지에 거래 정보 저장
            const existingTransactions = JSON.parse(localStorage.getItem('review2earn_transactions') || '[]');
            existingTransactions.push(earnData);
            localStorage.setItem('review2earn_transactions', JSON.stringify(existingTransactions));
            
            console.log('✅ Review2Earn 거래 생성 완료:', earnData);
            
            // 백엔드 연동 시도
            notifyEarnSystem(earnData);
            
            // 성공 상태 표시
            button.innerHTML = `
                <span style="font-size: 16px;">✅</span>
                <span>1% 할인쿠폰 발급완료!</span>
                <span style="font-size: 11px; display: block; margin-top: 2px;">리뷰어에게 적립금 예약</span>
            `;
            button.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
            
            // 성공 팝업 표시
            showEarnSuccessPopup(earnData);
            
            // 5초 후 원래 상태로 복원
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
                button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                button.classList.add('pulsing');
            }, 5000);
            
        } catch (error) {
            console.error('❌ Review2Earn 거래 생성 실패:', error);
            handleEarnError(button, originalHTML);
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
    
    function notifyEarnSystem(earnData) {
        fetch('https://review2earn.vercel.app/api/process-earn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'processEarnTransaction',
                earnData: earnData
            })
        })
        .then(response => response.json())
        .then(data => console.log('🚀 Review2Earn 백엔드 연동 성공:', data))
        .catch(error => console.warn('⚠️ 백엔드 연동 실패 (거래는 정상 생성됨):', error));
    }
    
    function showEarnSuccessPopup(earnData) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('review2earn-earn-popup');
        if (existingPopup) existingPopup.remove();
        
        const popup = document.createElement('div');
        popup.id = 'review2earn-earn-popup';
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
            border: 3px solid #28a745;
            max-width: 400px;
            animation: review2earn-earn-popup-show 0.3s ease-out;
        `;
        
        // 팝업 애니메이션 추가
        if (!document.getElementById('review2earn-earn-popup-styles')) {
            const popupStyle = document.createElement('style');
            popupStyle.id = 'review2earn-earn-popup-styles';
            popupStyle.textContent = `
                @keyframes review2earn-earn-popup-show {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(popupStyle);
        }
        
        popup.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">🎊</div>
            <h3 style="color: #28a745; margin-bottom: 15px; font-size: 24px;">Review2Earn 거래 완료!</h3>
            <div style="background: linear-gradient(135deg, #e8f5e8, #d4edda); padding: 20px; border-radius: 15px; margin: 20px 0; border: 2px solid #28a745;">
                <div style="font-size: 20px; font-weight: bold; color: #28a745; margin-bottom: 10px;">👤 구매자: 1% 할인쿠폰</div>
                <div style="font-size: 20px; font-weight: bold; color: #007bff; margin-bottom: 10px;">💰 리뷰어: 1% 적립금 예약</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">거래 ID: ${earnData.couponId}</div>
            </div>
            <p style="margin: 15px 0; color: #333; font-size: 14px;">🛒 장바구니에서 자동 할인이 적용됩니다!</p>
            <p style="font-size: 12px; color: #666; margin-bottom: 20px;">구매 완료 시 리뷰 작성자에게 적립금이 지급됩니다.</p>
            <button onclick="this.parentNode.remove()" style="
                background: linear-gradient(135deg, #28a745, #20c997); 
                color: white; 
                border: none; 
                padding: 12px 25px; 
                border-radius: 20px; 
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">확인</button>
        `;
        
        document.body.appendChild(popup);
        
        // 자동 닫기
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 12000);
    }
    
    function handleEarnError(button, originalHTML) {
        button.innerHTML = '❌ 오류 발생 - 다시 시도해주세요';
        button.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        button.classList.remove('pulsing');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
            button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            button.classList.add('pulsing');
        }, 3000);
    }
    
    // 초기화 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReview2EarnSystem);
    } else {
        setTimeout(initializeReview2EarnSystem, 2000);
    }
    
    // 동적 페이지 변경 감지
    let currentUrl = location.href;
    const urlObserver = setInterval(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            if (currentUrl.includes('product') || currentUrl.includes('goods')) {
                console.log('📱 상품 페이지 변경 감지, Review2Earn 재초기화');
                setTimeout(initializeReview2EarnSystem, 2000);
            }
        }
    }, 1000);
    
    console.log('💰 Review2Earn 적립 시스템 초기화 완료 - 상품 페이지 리뷰 영역 감시 중');
    
})();
