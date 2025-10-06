'use client';

import { useState, useEffect } from 'react';
import { clientConfig, validateClientConfig } from '@/lib/config';

export default function Home() {
  const [mallId, setMallId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [configValid, setConfigValid] = useState<boolean>(false);

  useEffect(() => {
    const isValid = validateClientConfig();
    setConfigValid(isValid);
  }, []);

  const handleOAuthLogin = () => {
    if (!mallId.trim()) {
      alert('쇼핑몰 ID를 입력해주세요');
      return;
    }

    if (!configValid) {
      alert('환경변수가 올바르게 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const clientId = clientConfig.cafe24ClientId;
      
      if (!clientId) {
        throw new Error('NEXT_PUBLIC_CAFE24_CLIENT_ID is not configured');
      }

      console.log('🎯 Client ID from config:', clientId);
      console.log('🎯 Mall ID:', mallId.trim());
      console.log('🎯 Base URL:', clientConfig.baseUrl);

      const baseUrl = `https://${mallId.trim()}.cafe24api.com/api/v2/oauth/authorize`;
      const redirectUri = `${clientConfig.baseUrl}/api/oauth/callback`;
      const state = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 최소 권한 스코프로 수정
      const scopes = [
        'mall.read_product',
        'mall.read_category',
        'mall.read_order'
      ];

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        state,
        redirect_uri: redirectUri,
        scope: scopes.join(',')
      });
      
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('🎯 Generated OAuth URL:', authUrl);
      console.log('🎯 Redirect URI:', redirectUri);
      console.log('🎯 State:', state);
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('OAuth connection error:', error);
      alert(`OAuth 연결 중 오류가 발생했습니다:\n${(error as Error).message}`);
      setIsLoading(false);
    }
  };

  const handleQuickConnect = () => {
    if (!configValid) {
      alert('환경변수가 올바르게 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      const clientId = clientConfig.cafe24ClientId;
      const quickMallId = 'dhdshop';
      
      if (!clientId) {
        throw new Error('NEXT_PUBLIC_CAFE24_CLIENT_ID is not configured');
      }

      console.log('🎯 Quick Connect - Client ID:', clientId);
      console.log('🎯 Quick Connect - Mall ID:', quickMallId);
      console.log('🎯 Quick Connect - Base URL:', clientConfig.baseUrl);

      const baseUrl = `https://${quickMallId}.cafe24api.com/api/v2/oauth/authorize`;
      const redirectUri = `${clientConfig.baseUrl}/api/oauth/callback`;
      const state = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 최소 권한 스코프로 수정
      const scopes = [
        'mall.read_product',
        'mall.read_category',
        'mall.read_order'
      ];

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        state,
        redirect_uri: redirectUri,
        scope: scopes.join(',')
      });
      
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('🎯 Quick Connect - Generated OAuth URL:', authUrl);
      console.log('🎯 Quick Connect - Redirect URI:', redirectUri);
      console.log('🎯 Quick Connect - State:', state);
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Quick Connect OAuth error:', error);
      alert(`dhdshop 연동 중 오류가 발생했습니다:\n${(error as Error).message}`);
      setIsLoading(false);
    }
  };

  const handleApiTest = async () => {
    setIsLoading(true);
    setTestResult('API 테스트 중...');
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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
          
          {!configValid && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">❌ 환경변수 설정 필요</h3>
                  <div className="mt-2 text-sm">
                    <p>NEXT_PUBLIC_CAFE24_CLIENT_ID 환경변수가 설정되지 않았습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">카페24 연동 테스트</h2>
            
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
                  disabled={isLoading || !configValid}
                />
                <button
                  onClick={handleOAuthLogin}
                  disabled={isLoading || !configValid}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '연동 중...' : '카페24 연동하기'}
                </button>
              </div>
              
              <div className="mt-3">
                <button
                  onClick={handleQuickConnect}
                  disabled={isLoading || !configValid}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  🚀 dhdshop 바로 연동 (최소 권한)
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleApiTest}
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '테스트 중...' : 'API 연결 테스트'}
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Client ID: {configValid ? '✅ 설정됨' : '❌ 미설정'}</p>
              <p>Base URL: {clientConfig.baseUrl || 'undefined'}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
            </div>
            
            {testResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">테스트 결과:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-left text-sm overflow-x-auto max-h-96">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
          
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
