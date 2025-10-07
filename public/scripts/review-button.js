/**
 * 리뷰투언(Review2Earn) - 카페24 리뷰 작성란 버튼 삽입 스크립트
 * 
 * 비즈니스 모델:
 * - 리뷰 작성자(A): 자신의 리뷰를 보고 구매한 신규 구매자(B)의 구매액 1%를 적립금으로 지급
 * - 신규 구매자(B): A가 작성한 리뷰와 연동된 1% 할인 쿠폰 자동 발급
 * - 쇼핑몰 운영자: 실제 구매 발생 시에만 총 2.5% 비용 (작성자 1% + 구매자 1% + 플랫폼 0.5%)
 */

(function() {
    'use strict';
    
    // 리뷰투언 설정
    const REVIEW2EARN_CONFIG = {
        serverUrl: 'https://review2earn.vercel.app',
        apiEndpoint: '/api/review/register',
        buttonText: '🎁 리뷰 등록하고 수익받기',
        buttonColor: '#667eea',
        buttonHoverColor: '#764ba2',
        version: '2.0.0'
    };

    console.log(`🎯 리뷰투언 v${REVIEW2EARN_CONFIG.version} 로딩 시작`);

    // DOM 로드 완료 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReview2EarnButton);
    } else {
        initReview2EarnButton();
    }

    function initReview2EarnButton() {
        console.log('🔍 리뷰투언: 리뷰 작성 폼 검색 중...');
        
        // 리뷰 작성 폼 찾기
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
            'form[name="BoardWriteForm"]',
            'form[name="ReviewForm"]',
            'form.review-write-form',
            'form#reviewWriteForm',
            '.review-form form',
            '[class*="review"] form',
            'form:has(textarea[name*="content"])',
        ];
        
        for (const selector of selectors) {
            try {
                const form = document.querySelector(selector);
                if (form) {
                    console.log(`✅ 폼 발견: ${selector}`);
                    return form;
                }
            } catch (e) {
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
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;

        // 제목 추가
        const title = document.createElement('div');
        title.textContent = '💰 리뷰투언으로 수익 창출하기';
        title.style.cssText = `
            font-size: 20px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // 설명 추가
        const description = document.createElement('div');
        description.innerHTML = `
            <div style="font-size: 14px; color: rgba(255, 255, 255, 0.95); margin-bottom: 8px;">
                ✅ 리뷰를 보고 구매한 사람이 있으면 <strong>구매액의 1%를 적립금</strong>으로 지급!
            </div>
            <div style="font-size: 13px; color: rgba(255, 255, 255, 0.85); margin-bottom: 15px;">
                ✅ 구매자도 1% 할인 쿠폰 자동 발급 (쇼핑몰 부담 2.5%)
            </div>
        `;

        // 메인 버튼 생성
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'review2earn-button';
        button.textContent = REVIEW2EARN_CONFIG.buttonText;
        button.style.cssText = `
            background: white;
            color: #667eea;
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.background = '#f0f0f0';
            this.style.transform = 'translateY(-2px) scale(1.05)';
            this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
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
        
        console.log('🎯 리뷰투언: 버튼 클릭됨');
        
        // 버튼 비활성화 및 로딩 상태
        button.disabled = true;
        button.textContent = '⏳ 등록 중...';
        button.style.opacity = '0.7';

        // 리뷰 데이터 수집
        const reviewData = collectReviewData();
        
        // 유효성 검사
        if (!reviewData.content || reviewData.content.length < 10) {
            alert('❌ 리뷰를 10자 이상 작성해주세요!');
            resetButton(button);
            return;
        }

        console.log('📝 수집된 리뷰 데이터:', reviewData);

        // 서버에 요청 전송
        sendReviewDataToServer(reviewData)
            .then(response => {
                console.log('✅ 서버 응답:', response);
                
                if (response.success) {
                    showSuccessMessage(response);
                } else {
                    throw new Error(response.message || '처리 중 오류가 발생했습니다');
                }
            })
            .catch(error => {
                console.error('❌ 리뷰투언 오류:', error);
                alert(`❌ ${error.message}\n\n잠시 후 다시 시도해주세요.`);
            })
            .finally(() => {
                resetButton(button);
            });
    }

    function collectReviewData() {
        const form = document.querySelector('form[name="BoardWriteForm"], form[name="ReviewForm"], .review-form form');
        
        const data = {
            content: getFormValue(form, ['content', 'review_content', 'board_content']),
            rating: getFormValue(form, ['rating', 'score', 'star_rating']) || '5',
            productId: getProductIdFromUrl(),
            productName: document.querySelector('h1, .product-name')?.textContent?.trim() || 'Unknown',
            userId: getUserId(),
            mallId: getMallId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        console.log('📋 리뷰 데이터 수집 완료:', data);
        return data;
    }

    function getFormValue(form, fieldNames) {
        if (!form) return '';
        
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
               getCookie('member_id') ||
               'anonymous';
    }

    function getMallId() {
        // dhdshop.cafe24.com → dhdshop
        const hostname = window.location.hostname;
        return hostname.split('.')[0];
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    async function sendReviewDataToServer(reviewData) {
        try {
            console.log(`🚀 서버 요청: ${REVIEW2EARN_CONFIG.serverUrl}${REVIEW2EARN_CONFIG.apiEndpoint}`);
            
            const response = await fetch(`${REVIEW2EARN_CONFIG.serverUrl}${REVIEW2EARN_CONFIG.apiEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            });
            
            if (!response.ok) {
                throw new Error(`서버 오류 (${response.status})`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ 서버 연결 실패:', error);
            throw new Error('서버 연결에 실패했습니다');
        }
    }

    function showSuccessMessage(response) {
        const reviewId = response.reviewId || 'R2E-' + Date.now();
        
        const message = `
🎉 리뷰투언 등록 완료!

✅ 리뷰 ID: ${reviewId}
✅ 이제 이 리뷰를 보고 구매한 사람이 있으면
   구매액의 1%를 적립금으로 받게 됩니다!

💰 예시: 100,000원 구매 시 → 1,000원 적립금
💳 구매자도 1% 할인 쿠폰 자동 발급!

📊 마이페이지에서 수익 확인 가능
        `.trim();
        
        alert(message);
        
        // 성공 표시
        const container = document.querySelector('.review2earn-container');
        if (container) {
            container.style.background = 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)';
            container.querySelector('div').textContent = '✅ 리뷰투언 등록 완료!';
        }
        
        console.log('✅ 성공 메시지 표시 완료');
    }

    function resetButton(button) {
        button.disabled = false;
        button.textContent = REVIEW2EARN_CONFIG.buttonText;
        button.style.opacity = '1';
    }

    // 전역 스코프에 디버깅 함수 추가
    window.Review2Earn = {
        version: REVIEW2EARN_CONFIG.version,
        reinit: initReview2EarnButton,
        config: REVIEW2EARN_CONFIG,
        testCollectData: () => {
            const form = findReviewForm();
            return collectReviewData();
        }
    };

    console.log(`✅ 리뷰투언 v${REVIEW2EARN_CONFIG.version} 로딩 완료`);
})();
