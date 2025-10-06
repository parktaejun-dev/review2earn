// src/app/page.tsx - ScriptTag 테스트 기능 추가
"use client";

import { useState } from 'react';

interface ConnectionResult {
  success: boolean;
  message?: string;
  mall_id?: string;
  api_version?: string;
  products_count?: number;
  token_status?: string;
  oauth_status?: string;
  accessToken?: string;
  error?: string;
}

interface ScriptTagResult {
  success: boolean;
  message?: string;
  data?: any;
  scriptLocation?: string;
  nextStep?: string;
  error?: string;
  details?: any;
}

export default function Home() {
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [scriptTagResult, setScriptTagResult] = useState<ScriptTagResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstallingScript, setIsInstallingScript] = useState(false);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setConnectionResult(data);
    } catch (error) {
      setConnectionResult({
        success: false,
        error: '연결 테스트 중 오류가 발생했습니다.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const installScriptTag = async () => {
    if (!connectionResult?.success) {
      alert('먼저 카페24 연결 테스트를 완료해주세요.');
      return;
    }

    setIsInstallingScript(true);
    setScriptTagResult(null);

    try {
      const response = await fetch('/api/scripttags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mallId: 'dhdshop',
          accessToken: connectionResult.accessToken
        })
      });

      const data = await response.json();
      setScriptTagResult(data);
    } catch (error) {
      setScriptTagResult({
        success: false,
        error: 'ScriptTag 설치 중 오류가 발생했습니다.'
      });
    } finally {
      setIsInstallingScript(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🎯 Review2Earn
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            카페24 리뷰 기반 할인 시스템 개발 도구
          </p>
          <p className="text-sm text-gray-500">
            Step 1: ScriptTags API 구현 및 테스트
          </p>
        </div>

        {/* Step 1: 카페24 연결 테스트 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
            카페24 API 연결 테스트
          </h2>
          
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 먼저 카페24 OAuth 연결 상태를 확인합니다. (dhdshop.cafe24.com)
            </p>
          </div>

          <button
            onClick={testConnection}
            disabled={isConnecting}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isConnecting 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 transform hover:scale-105'
            }`}
          >
            {isConnecting ? '🔄 연결 중...' : '🔗 카페24 연결 테스트'}
          </button>

          {connectionResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              connectionResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {connectionResult.success && (
                <div className="mb-3">
                  <span className="text-green-600 font-semibold">✅ 연결 성공!</span>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>쇼핑몰: {connectionResult.mall_id}</div>
                    <div>API 버전: {connectionResult.api_version}</div>
                    <div>상품 수: {connectionResult.products_count}개</div>
                  </div>
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">상세 정보 보기</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(connectionResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Step 2: ScriptTags API 설치 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
            리뷰 버튼 ScriptTag 설치
          </h2>
          
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              🚀 이 단계는 카페24 쇼핑몰의 <strong>리뷰 작성 페이지</strong>에 "할인 쿠폰 받기" 버튼을 자동으로 삽입합니다.
            </p>
          </div>

          <button
            onClick={installScriptTag}
            disabled={isInstallingScript || !connectionResult?.success}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isInstallingScript || !connectionResult?.success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 transform hover:scale-105'
            }`}
          >
            {isInstallingScript ? '⏳ 설치 중...' : '🚀 ScriptTag 설치하기'}
          </button>

          {scriptTagResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              scriptTagResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {scriptTagResult.success && (
                <div className="mb-3">
                  <span className="text-green-600 font-semibold">✅ 설치 성공!</span>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>적용 위치: {scriptTagResult.scriptLocation}</div>
                    <div className="text-blue-600 mt-2">{scriptTagResult.nextStep}</div>
                  </div>
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">상세 정보 보기</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(scriptTagResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Step 3: 테스트 가이드 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
            실제 테스트 방법
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">ScriptTag 설치 확인</h3>
                <p className="text-gray-600 text-sm">위의 Step 2에서 "✅ 설치 성공!" 메시지가 나타났는지 확인하세요.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">테스트 쇼핑몰 접속</h3>
                <p className="text-gray-600 text-sm mb-2">
                  아래 링크로 실제 카페24 쇼핑몰에 접속합니다:
                </p>
                <a 
                  href="https://dhdshop.cafe24.com" 
                  target="_blank" 
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  🔗 dhdshop.cafe24.com 열기
                </a>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">리뷰 작성 페이지 이동</h3>
                <p className="text-gray-600 text-sm">
                  상품 페이지 → "상품후기" 또는 "리뷰 쓰기" 버튼 클릭 → 리뷰 작성 페이지로 이동
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">할인 버튼 확인</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                  <p className="text-orange-800 text-sm font-semibold">
                    🎁 "할인 쿠폰 받기" 버튼이 나타나야 합니다!
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  버튼을 클릭하면 10-30% 할인 쿠폰이 발급되고, 팝업이 표시됩니다.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">🔧 문제 해결</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 버튼이 안 보인다면: 브라우저 콘솔(F12)에서 오류 확인</li>
                <li>• 스크립트 로딩 실패: 2-3초 기다린 후 페이지 새로고침</li>
                <li>• 쿠폰 생성 실패: 로컬스토리지 허용 여부 확인</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
