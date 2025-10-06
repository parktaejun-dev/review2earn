/**
 * 리뷰투언(Review2Earn) - 카페24 리뷰 작성란 버튼 삽입 스크립트
 * 리뷰 작성 시 쿠폰 발급 기능을 제공합니다.
 */

(function() {
    'use strict';
    
    // 리뷰투언 설정
    const REVIEW2EARN_CONFIG = {
        serverUrl: 'https://review2earn.vercel.app',
        buttonText: '💰 리뷰투언으로 수익받기',
        buttonColor: '#4CAF50',
        buttonHoverColor: '#45a049'
    };

    // DOM 로드 완료 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReview2EarnButton);
    } else {
        initReview2EarnButton();
    }

    function initReview2EarnButton() {
        console.log('🎯 리뷰투언: 스크립트 로딩 시작');
        
        // 리뷰 작성 폼 찾기 (multiple selectors)
        const reviewForm = findReviewForm();
        
        if (!reviewForm) {
            console.log('❌ 리뷰투언: 리뷰 작성 폼을 찾을 수 없습니다');
            return;
        }
        
        console.log('✅ 리뷰투언: 리뷰 작성 폼 발견');
        
        // 이미 버튼이 있는지 확인
        if (reviewForm.querySelector('.review2earn-button')) {
            console.log('⚠️ 리뷰투언: 버튼이 이미 존재합니다');
            return;
        }
        
        // 리뷰투언 버튼 생성 및 삽입
        createAndInsertButton(reviewForm);
    }

    function findReviewForm() {
        const selectors = [
            'form[name="BoardWriteForm"]',           // 기본 게시판 폼
            'form[name="ReviewForm"]',               // 리뷰 전용 폼
            'form.review-write-form',                // 클래스 기반
            'form#reviewWriteForm',                  // ID 기반
            '.review-form form',                     // 상위 클래스
            '[class*="review"] form',                // 부분 클래스 매치
            'form:has(textarea[name*="content"])',   // 텍스트영역이 있는 폼
        ];
        
        for (const selector of selectors) {
            try {
                const form = document.querySelector(selector);
                if (form) return form;
            } catch (e) {
                // CSS4 selector 지원하지 않는 경우 무시
                continue;
            }
        }
        
        return null;
    }

    function createAndInsertButton(reviewForm) {
        // 버튼 컨테이너 생성
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'review2earn-container';
        buttonContainer.style.cssText = `
            margin: 15px 0;
            padding: 15px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 8px;
            border: 2px solid #e1e8ed;
            text-align: center;
        `;

        // 제목 추가
        const title = document.createElement('div');
        title.textContent = '🎉 리뷰 작성하고 쿠폰받기!';
        title.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        `;

        // 설명 추가
        const description = document.createElement('div');
        description.textContent = '리뷰 작성 후 아래 버튼을 클릭하면 할인쿠폰을 받을 수 있어요!';
        description.style.cssText = `
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
        `;

        // 메인 버튼 생성
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'review2earn-button';
        button.textContent = REVIEW2EARN_CONFIG.buttonText;
        button.style.cssText = `
            background: ${REVIEW2EARN_CONFIG.buttonColor};
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.background = REVIEW2EARN_CONFIG.buttonHoverColor;
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.background = REVIEW2EARN_CONFIG.buttonColor;
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        // 버튼 클릭 이벤트
        button.addEventListener('click', handleButtonClick);

        // 요소들 조립
        buttonContainer.appendChild(title);
        buttonContainer.appendChild(description);
        buttonContainer.appendChild(button);

        // 폼에 삽입 (제출 버튼 위에)
        const submitButton = reviewForm.querySelector('input[type="submit"], button[type="submit"]');
        if (submitButton) {
            submitButton.parentNode.insertBefore(buttonContainer, submitButton);
        } else {
            reviewForm.appendChild(buttonContainer);
        }

        console.log('✅ 리뷰투언: 버튼 삽입 완료');
    }

    function handleButtonClick(event) {
        const button = event.target;
        
        // 버튼 비활성화 및 로딩 상태
        button.disabled = true;
        button.textContent = '⏳ 처리 중...';
        button.style.opacity = '0.7';

        // 리뷰 데이터 수집
        const reviewData = collectReviewData();
        
        if (!reviewData.content || reviewData.content.length < 10) {
            alert('리뷰를 10자 이상 작성해주세요!');
            resetButton(button);
            return;
        }

        // 서버에 요청 전송
        sendReviewDataToServer(reviewData)
            .then(response => {
                if (response.success) {
                    showSuccessMessage(response.coupon);
                } else {
                    throw new Error(response.message || '처리 중 오류가 발생했습니다');
                }
            })
            .catch(error => {
                console.error('리뷰투언 오류:', error);
                alert('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            })
            .finally(() => {
                resetButton(button);
            });
    }

    function collectReviewData() {
        const form = document.querySelector('form[name="BoardWriteForm"], form[name="ReviewForm"], .review-form form');
        
        return {
            content: getFormValue(form, ['content', 'review_content', 'board_content']),
            rating: getFormValue(form, ['rating', 'score', 'star_rating']),
            productId: getProductIdFromUrl(),
            userId: getUserId(),
            timestamp: new Date().toISOString()
        };
    }

    function getFormValue(form, fieldNames) {
        for (const fieldName of fieldNames) {
            const field = form.querySelector(`[name="${fieldName}"], [name*="${fieldName}"]`);
            if (field && field.value) {
                return field.value.trim();
            }
        }
        return '';
    }

    function getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('product_no') || 
               urlParams.get('product_id') || 
               document.querySelector('[name="product_no"]')?.value || 
               'unknown';
    }

    function getUserId() {
        return document.querySelector('[name="member_id"]')?.value || 
               document.querySelector('[name="user_id"]')?.value || 
               'anonymous';
    }

    async function sendReviewDataToServer(reviewData) {
        try {
            const response = await fetch(`${REVIEW2EARN_CONFIG.serverUrl}/api/review/reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            });
            
            return await response.json();
        } catch (error) {
            throw new Error('서버 연결에 실패했습니다');
        }
    }

    function showSuccessMessage(couponData) {
        const message = `🎉 축하합니다!\n\n할인쿠폰이 발급되었습니다:\n💰 ${couponData.discount_amount}원 할인\n🎫 쿠폰코드: ${couponData.coupon_code}\n\n마이페이지에서 확인하실 수 있습니다.`;
        
        alert(message);
        
        // 성공 표시 (선택사항)
        const container = document.querySelector('.review2earn-container');
        if (container) {
            container.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
            container.style.borderColor = '#28a745';
        }
    }

    function resetButton(button) {
        button.disabled = false;
        button.textContent = REVIEW2EARN_CONFIG.buttonText;
        button.style.opacity = '1';
    }

    // 전역 스코프에 디버깅 함수 추가 (개발용)
    window.Review2Earn = {
        version: '1.0.0',
        reinit: initReview2EarnButton,
        config: REVIEW2EARN_CONFIG
    };

    console.log('🎯 리뷰투언: 스크립트 로딩 완료 (v1.0.0)');
})();
