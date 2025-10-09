// public/scripts/review-list-banner.js

(function() {
  'use strict';

  console.log('✅ Review2Earn 배너 스크립트 로드됨');

  // 페이지 로드 완료 대기
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // 리뷰 게시판 확인 (카페24 기본 구조)
    const isReviewBoard = 
      window.location.pathname.includes('/board/product/list') ||
      window.location.search.includes('board_no=4') ||
      document.querySelector('.xans-board-productlist') !== null;

    if (!isReviewBoard) {
      console.log('❌ Review2Earn: 리뷰 게시판이 아닙니다.');
      return;
    }

    console.log('✅ Review2Earn: 리뷰 게시판 감지됨');

    // 배너 삽입
    insertBanner();
  }

  function insertBanner() {
    // 배너가 이미 있는지 확인
    if (document.getElementById('r2e-banner')) {
      console.log('⚠️ Review2Earn: 배너가 이미 존재합니다.');
      return;
    }

    // 게시판 영역 찾기 (여러 선택자 시도)
    const boardArea = 
      document.querySelector('.xans-board-productlist') ||
      document.querySelector('.xans-board-list') ||
      document.querySelector('#boardList') ||
      document.querySelector('.board_list');

    if (!boardArea) {
      console.error('❌ Review2Earn: 게시판 영역을 찾을 수 없습니다.');
      return;
    }

    // 배너 HTML 생성
    const banner = document.createElement('div');
    banner.id = 'r2e-banner';
    banner.innerHTML = `
      <style>
        #r2e-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          margin: 0 0 30px 0;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        #r2e-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: rotate(45deg);
        }

        #r2e-banner-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        #r2e-banner h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        #r2e-banner p {
          margin: 0 0 20px 0;
          font-size: 16px;
          line-height: 1.6;
          opacity: 0.95;
        }

        #r2e-banner-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: white;
          color: #667eea;
          padding: 14px 30px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        #r2e-banner-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        #r2e-banner-icon {
          font-size: 24px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @media (max-width: 768px) {
          #r2e-banner {
            padding: 15px;
            margin: 0 0 20px 0;
          }

          #r2e-banner h3 {
            font-size: 18px;
          }

          #r2e-banner p {
            font-size: 14px;
          }

          #r2e-banner-cta {
            padding: 12px 20px;
            font-size: 14px;
          }
        }
      </style>

      <div id="r2e-banner-content">
        <h3>🎁 Review2Earn 리워드 프로그램</h3>
        <p>
          리뷰를 작성하고 추천 링크를 받으세요!<br>
          친구가 추천 링크로 구매하면 <strong>적립금</strong>을 드립니다
        </p>
        <a href="/board/product/write.html?board_no=4" id="r2e-banner-cta">
          <span id="r2e-banner-icon">✍️</span>
          <span>리뷰 작성하고 리워드 받기</span>
        </a>
      </div>
    `;

    // 배너 삽입 (게시판 영역 위)
    boardArea.parentNode.insertBefore(banner, boardArea);

    console.log('✅ Review2Earn: 배너 삽입 완료');

    // 클릭 이벤트 추적
    document.getElementById('r2e-banner-cta').addEventListener('click', function(e) {
      console.log('🎯 Review2Earn: 리뷰 작성 버튼 클릭');
      
      // Google Analytics 이벤트 (있는 경우)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          'event_category': 'Review2Earn',
          'event_label': 'Review List Banner',
        });
      }
    });
  }
})();
