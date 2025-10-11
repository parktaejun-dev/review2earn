(function() {
    'use strict';
    
    console.log('%c🎯 Review2Earn v4.0 로드됨', 'background: #28a745; color: white; padding: 5px 10px; border-radius: 5px;');
    
    // 중복 실행 방지
    if (window.review2earnLoaded) {
        console.log('⚠️ 이미 로드됨');
        return;
    }
    window.review2earnLoaded = true;
    
    // ============================================
    // 설정
    // ============================================
    const CONFIG = {
        retryAttempts: 5,
        retryDelay: 1000,
        debug: true,
        apiEndpoint: window.location.origin + '/api/webhooks/review',
    };
    
    function log(...args) {
        if (CONFIG.debug) {
            console.log('%c[R2E]', 'color: #28a745; font-weight: bold;', ...args);
        }
    }
    
    // ============================================
    // 리뷰 영역 찾기 (강화된 로직)
    // ============================================
    function findReviewArea() {
        log('🔍 리뷰 영역 탐색 중...');
        
        // 1️⃣ 가장 일반적인 카페24 리뷰 구조
        const selectors = [
            // 상품 상세 페이지 리뷰
            '.xans-product-review',
            '.xans-board-list',
            '.prdReview',
            '#prdReview',
            
            // 게시판 스타일
            '.boardList',
            '.board_list',
            '.review-list',
            
            // 테이블 형태
            'table.xans-board-list',
            '.xans-board-listheader + table',
            
            // 일반 컨테이너
            '[class*="review"]',
            '[id*="review"]',
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 50) {
                log('✅ 리뷰 영역 발견:', selector, element);
                return element;
            }
        }
        
        // 2️⃣ 텍스트 기반 검색 (fallback)
        const allElements = document.querySelectorAll('div, section, table');
        for (const el of allElements) {
            const text = el.textContent;
            if (text.includes('리뷰') && text.length > 100 && text.length < 10000) {
                log('✅ 리뷰 영역 발견 (텍스트 기반):', el);
                return el;
            }
        }
        
        log('❌ 리뷰 영역을 찾을 수 없음');
        return null;
    }
    
    // ============================================
    // 리뷰 항목 찾기
    // ============================================
    function getReviewItems(container) {
        log('📦 리뷰 항목 추출 중...');
        
        // 테이블 형태
        const tableRows = container.querySelectorAll('tr');
        if (tableRows.length > 0) {
            const validRows = Array.from(tableRows).filter(row => {
                const text = row.textContent.trim();
                return text.length > 20 && !row.querySelector('th');
            });
            
            if (validRows.length > 0) {
                log('✅ 테이블 리뷰 항목:', validRows.length);
                return validRows;
            }
        }
        
        // div/li 형태
        const divItems = container.querySelectorAll('.review-item, .board-item, [class*="item"]');
        if (divItems.length > 0) {
            log('✅ DIV 리뷰 항목:', divItems.length);
            return Array.from(divItems);
        }
        
        log('⚠️ 리뷰 항목을 찾을 수 없음');
        return [];
    }
    
    // ============================================
    // 버튼 생성
    // ============================================
    function createButton(reviewIndex) {
        const btn = document.createElement('button');
        btn.className = 'r2e-earn-btn';
        btn.dataset.reviewId = reviewIndex;
        btn.type = 'button';
        
        btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">👍</span>
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 14px;">도움됨+1%할인</div>
                    <div style="font-size: 11px; opacity: 0.9;">리뷰어 적립금</div>
                </div>
            </div>
        `;
        
        btn.style.cssText = `
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 10px 16px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
            margin: 8px;
            min-width: 140px;
        `;
        
        btn.addEventListener('click', (e) => handleClick(e, reviewIndex));
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
        });
        
        return btn;
    }
    
    // ============================================
    // 버튼 삽입
    // ============================================
    function insertButton(reviewItem, button) {
        log('📌 버튼 삽입 중...', reviewItem);
        
        // 이미 버튼이 있는지 확인
        if (reviewItem.querySelector('.r2e-earn-btn')) {
            log('⚠️ 버튼이 이미 존재함');
            return false;
        }
        
        // 삽입 위치 찾기
        const targets = [
            reviewItem.querySelector('td:last-child'),
            reviewItem.querySelector('.content'),
            reviewItem.querySelector('[class*="action"]'),
            reviewItem,
        ];
        
        for (const target of targets) {
            if (target) {
                target.appendChild(button);
                log('✅ 버튼 삽입 성공');
                return true;
            }
        }
        
        return false;
    }
    
    // ============================================
    // 클릭 핸들러
    // ============================================
    async function handleClick(event, reviewIndex) {
        event.preventDefault();
        const btn = event.currentTarget;
        const originalHTML = btn.innerHTML;
        
        log('💰 클릭됨:', reviewIndex);
        
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> 처리 중...';
        btn.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
        
        try {
            // 로컬 저장 (백업)
            const transaction = {
                type: 'review_earn',
                reviewId: `review_${Date.now()}_${reviewIndex}`,
                timestamp: new Date().toISOString(),
                mallId: extractMallId(),
            };
            
            saveTransaction(transaction);
            
            // 성공 표시
            btn.innerHTML = '<span>✅</span> 완료!';
            btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            
            showSuccessPopup();
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 5000);
            
        } catch (error) {
            log('❌ 오류:', error);
            btn.innerHTML = '<span>❌</span> 오류';
            btn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            }, 3000);
        }
    }
    
    // ============================================
    // 보조 함수들
    // ============================================
    function extractMallId() {
        try {
            return window.location.hostname.split('.')[0];
        } catch {
            return 'unknown';
        }
    }
    
    function saveTransaction(data) {
        try {
            const key = 'r2e_transactions';
            const stored = JSON.parse(localStorage.getItem(key) || '[]');
            stored.push(data);
            localStorage.setItem(key, JSON.stringify(stored));
            log('💾 저장됨:', data);
        } catch (error) {
            log('⚠️ 저장 실패:', error);
        }
    }
    
    function showSuccessPopup() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 30px; border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); z-index: 999999;
            text-align: center; border: 3px solid #28a745; animation: fadeIn 0.3s;
        `;
        
        popup.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">🎊</div>
            <h3 style="color: #28a745; margin-bottom: 15px;">Review2Earn 완료!</h3>
            <p style="margin: 15px 0; color: #333;">👤 1% 할인쿠폰 발급</p>
            <p style="margin: 15px 0; color: #333;">💰 리뷰어 1% 적립금 예약</p>
            <button onclick="this.parentElement.remove()" style="
                background: #28a745; color: white; border: none;
                padding: 12px 24px; border-radius: 8px; cursor: pointer;
                font-weight: bold; margin-top: 15px;
            ">확인</button>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 10000);
    }
    
    // ============================================
    // 초기화 (재시도 로직)
    // ============================================
    let attempt = 0;
    function initialize() {
        attempt++;
        log(`🚀 초기화 시도 ${attempt}/${CONFIG.retryAttempts}`);
        
        const reviewArea = findReviewArea();
        if (!reviewArea) {
            if (attempt < CONFIG.retryAttempts) {
                log(`⏳ ${CONFIG.retryDelay}ms 후 재시도...`);
                setTimeout(initialize, CONFIG.retryDelay);
            } else {
                log('❌ 최대 재시도 횟수 초과. 리뷰 영역을 찾을 수 없음.');
            }
            return;
        }
        
        const items = getReviewItems(reviewArea);
        if (items.length === 0) {
            log('⚠️ 리뷰 항목 없음');
            return;
        }
        
        let successCount = 0;
        items.forEach((item, index) => {
            const button = createButton(index);
            if (insertButton(item, button)) {
                successCount++;
            }
        });
        
        log(`✅ ${successCount}/${items.length}개 버튼 추가 완료`);
    }
    
    // CSS 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
    } else {
        setTimeout(initialize, 500);
    }
    
    log('💚 Review2Earn 시스템 준비 완료');
})();
