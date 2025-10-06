'use client';

import { useState } from 'react';

export default function Home() {
  const [mallId, setMallId] = useState('dhdshop'); // 기본값 설정
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const handleOAuthLogin = () => {
    if (!mallId.trim()) {
      alert('쇼핑몰 ID를 입력해주세요');
      return;
    }
    
    setIsLoading(true);
    
    // ⭐ 수정: 카페24 OAuth URL로 직접 이동
    try {
      const clientId = process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID;
      
      if (!clientId) {
        alert('NEXT_PUBLIC_CAFE24_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        setIsLoading(false);
        return;
      }

      const baseUrl = `https://${mallId.trim()}.cafe24api.com/api/v2/oauth/authorize`;
      const redirectUri = `${window.location.origin}/api/oauth/callback`;
      const state = Math.random().toString(36);
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        state,
        redirect_uri: redirectUri,
        scope: 'mall.read_product,mall.read_category,mall.read_promotion,mall.write_promotion,mall.read_customer,mall.write_customer,mall.read_order,mall.read_community,mall.write_community,mall.read_design,mall.write_design'
      });
      
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('🎯 OAuth URL:', authUrl);
      console.log('🎯 Client ID:', clientId);
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('OAuth 연결 오류:', error);
      alert('OAuth 연결 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleApiTest = async () => {
    setIsLoading(true);
    setTestResult('API 테스트 중...');
    
    try {
      // ⭐ 수정: 올바른 API 경로
      const response = await fetch('/api/test-connection', {
        method: 'POST'
      });
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`API 테스트 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 리뷰투언 (Review2Earn)
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            리뷰 기반 추천 구매 시스템 - 리뷰어는 적립금을, 구매자는 할인을!
          </p>
          
          {/* OAuth 테스트 섹션 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">카페24 연동 테스트</h2>
            
            {/* Mall ID 입력 폼 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카페24 쇼핑몰 ID 입력:
              </label>
              <div className="flex gap-4 justify-center items-center">
                <input
                  type="text"
                  value={mallId}
                  onChange={(e) => setMallId(e.target.value)}
                  placeholder="예: dhdshop"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleOAuthLogin}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '연동 중...' : '카페24 연동하기'}
                </button>
              </div>
              
              {/* ⭐ 추가: 빠른 연동 버튼 */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    setMallId('dhdshop');
                    setTimeout(() => handleOAuthLogin(), 100);
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  🚀 dhdshop 바로 연동
                </button>
              </div>
            </div>
            
            {/* API 테스트 버튼 */}
            <div className="mt-4">
              <button
                onClick={handleApiTest}
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '테스트 중...' : 'API 연결 테스트'}
              </button>
            </div>
            
            {/* 환경변수 확인 */}
            <div className="mt-4 text-sm text-gray-500">
              <p>Client ID: {process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID ? '✅ 설정됨' : '❌ 미설정'}</p>
            </div>
            
            {/* 테스트 결과 표시 */}
            {testResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">테스트 결과:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-left text-sm overflow-x-auto max-h-96">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
          
          {/* 기능 설명 */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">💰 리뷰어 혜택</h3>
              <p className="text-gray-600">
                작성한 리뷰를 통해 다른 사람이 구매하면 구매액의 1% 적립금 획득
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">🎫 구매자 혜택</h3>
              <p className="text-gray-600">
                리뷰를 통해 구매하면 상품가격의 1% 할인 쿠폰 자동 발급
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">🔄 자동화 시스템</h3>
              <p className="text-gray-600">
                리뷰 작성 → 버튼 생성 → 구매 → 할인/적립 모든 과정 자동화
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
