// src/app/test-widget/page.tsx
'use client';

import Script from 'next/script';

export default function TestWidgetPage() {
  return (
    <>
      {/* Widget 스크립트 로드 */}
      <Script 
        src={`/widget.js?v=${Date.now()}`}  // 캐시 무효화
        strategy="afterInteractive" 
      />

      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '800px',
        margin: '50px auto',
        padding: '20px',
        background: '#f5f5f5',
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{ marginBottom: '30px' }}>📝 리뷰 작성 (테스트)</h1>
          
          <form name="boardWriteForm" onSubmit={(e) => {
            e.preventDefault();
            alert('테스트용 폼입니다!');
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                리뷰 내용
              </label>
              <textarea
                name="content"
                placeholder="상품 리뷰를 작성해주세요..."
                style={{
                  width: '100%',
                  height: '150px',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            
            <button
              type="submit"
              style={{
                marginTop: '20px',
                background: '#4CAF50',
                color: 'white',
                padding: '12px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              리뷰 등록
            </button>
          </form>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
        }}>
          <h2 style={{ marginBottom: '15px' }}>🧪 테스트 가이드</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>✅ 페이지 로드 시 &quot;💰 R2E 참여하고 수익 받기&quot; 버튼이 폼 위에 표시됩니다.</li>
            <li>✅ 버튼을 클릭하면 레퍼럴 코드 입력 모달이 나타납니다.</li>
            <li>✅ 코드를 입력하면 localStorage에 저장됩니다.</li>
            <li>✅ URL에 <code>?r2e=R2E-XXXXXXXXXXXX</code>를 추가하면 자동으로 감지됩니다.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
