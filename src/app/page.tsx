// src/app/page.tsx - ESLint 에러 수정 + Mall ID 입력 추가
"use client";

import { useState, useEffect } from 'react';

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
  data?: unknown;
  scriptLocation?: string;
  nextStep?: string;
  error?: string;
  details?: unknown;
}

interface VerifyTokenResult {
  success: boolean;
  message?: string;
  timestamp?: string;
  results?: {
    productsApi: {
      status: number;
      ok: boolean;
      message: string;
    };
    scriptTagsApi: {
      status: number;
      ok: boolean;
      message: string;
      error?: string;
    };
  };
  conclusion?: string;
  error?: string;
}

export default function Home() {
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [scriptTagResult, setScriptTagResult] = useState<ScriptTagResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyTokenResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstallingScript, setIsInstallingScript] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mallIdInput, setMallIdInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const mallId = params.get('mall_id');
    const expiresIn = params.get('expires_in');
    
    if (accessToken) {
      console.log('✅ OAuth 토큰 감지 - localStorage에 저장');
      localStorage.setItem('cafe24_access_token', accessToken);
      if (refreshToken) localStorage.setItem('cafe24_refresh_token', refreshToken);
      if (mallId) localStorage.setItem('cafe24_mall_id', mallId);
      if (expiresIn) localStorage.setItem('cafe24_expires_in', expiresIn);
      
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }

    const savedMallId = localStorage.getItem('user_mall_id');
    if (savedMallId) {
      setMallIdInput(savedMallId);
    }
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const accessToken = localStorage.getItem('cafe24_access_token');
      const mallId = localStorage.getItem('cafe24_mall_id') || mallIdInput;

      const response = await fetch('/api/test-connection', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Mall-Id': mallId
        }
      });
      const data = await response.json();
      setConnectionResult(data);
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionResult({
        success: false,
        error: '연결 테스트 중 오류가 발생했습니다.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const testOAuth = () => {
    if (!mallIdInput.trim()) {
      alert('쇼핑몰 ID를 입력해주세요. (예: dhdshop)');
      return;
    }
    
    localStorage.setItem('user_mall_id', mallIdInput);
    window.location.href = `/api/oauth/authorize?mall_id=${mallIdInput}`;
  };

  const verifyToken = async () => {
    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const accessToken = localStorage.getItem('cafe24_access_token');
      const mallId = localStorage.getItem('cafe24_mall_id') || mallIdInput;

      if (!accessToken) {
        alert('먼저 OAuth 인증을 완료해주세요.');
        setIsVerifying(false);
        return;
      }

      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken, mallId })
      });

      const data = await response.json();
      setVerifyResult(data);
    } catch (error) {
      console.error('Token verification error:', error);
      setVerifyResult({
        success: false,
        error: '토큰 검증 중 오류가 발생했습니다.'
      });
    } finally {
      setIsVerifying(false);
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
      const accessToken = localStorage.getItem('cafe24_access_token');
      const mallId = localStorage.getItem('cafe24_mall_id') || mallIdInput;

      const response = await fetch('/api/scripttags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Mall-Id': mallId
        },
        body: JSON.stringify({
          mallId: mallId,
          accessToken: accessToken
        })
      });

      const data = await response.json();
      setScriptTagResult(data);
    } catch (error) {
      console.error('ScriptTag install error:', error);
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🎯 Review2Earn
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            카페24 리뷰 기반 할인 시스템 개발 도구
          </p>
          <p className="text-sm text-gray-500">
            Step 1: OAuth 인증 및 ScriptTags API 구현
          </p>
        </div>

        {/* Step 0: OAuth 인증 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">0</span>
            카페24 OAuth 인증
          </h2>
          
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              🔐 먼저 카페24 OAuth 인증을 완료해야 API를 사용할 수 있습니다.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="mallId" className="block text-sm font-medium text-gray-700 mb-2">
              쇼핑몰 ID (Mall ID)
            </label>
            <input
              type="text"
              id="mallId"
              value={mallIdInput}
              onChange={(e) => setMallIdInput(e.target.value)}
              placeholder="예: dhdshop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              카페24 쇼핑몰 주소에서 &ldquo;.cafe24.com&rdquo; 앞부분을 입력하세요.
              <br />
              예: dhdshop.cafe24.com → <strong>dhdshop</strong>
            </p>
          </div>

          <button
            onClick={testOAuth}
            className="px-6 py-3 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 transform hover:scale-105 transition-all duration-300"
          >
            🔗 카페24 연결 시작
          </button>
        </div>

        {/* Step 1: 카페24 연결 테스트 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
            카페24 API 연결 테스트
          </h2>
          
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 OAuth 인증 후 카페24 API 연결 상태를 확인합니다.
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
            {isConnecting ? '🔄 연결 중...' : '🔗 API 연결 확인'}
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

        {/* Step 1.5: Access Token 검증 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">
              1.5
            </span>
            Access Token 권한 검증
          </h2>
          
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-800">
              🔍 현재 토큰이 ScriptTags API 사용 권한을 가지고 있는지 확인합니다.
            </p>
          </div>

          <button
            onClick={verifyToken}
            disabled={isVerifying || !connectionResult?.success}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isVerifying || !connectionResult?.success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 transform hover:scale-105'
            }`}
          >
            {isVerifying ? '🔄 검증 중...' : '🔍 토큰 권한 검증'}
          </button>

          {verifyResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              verifyResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {verifyResult.results && (
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Products API:</span>
                    <span className={`ml-2 ${
                      verifyResult.results.productsApi.ok
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {verifyResult.results.productsApi.ok ? '✅' : '❌'}
                      {' '}{verifyResult.results.productsApi.message}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-semibold">ScriptTags API:</span>
                    <span className={`ml-2 ${
                      verifyResult.results.scriptTagsApi.ok
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {verifyResult.results.scriptTagsApi.ok ? '✅' : '❌'}
                      {' '}{verifyResult.results.scriptTagsApi.message}
                    </span>
                  </div>
                  
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-semibold text-gray-800">결론:</p>
                    <p className="text-sm mt-1">{verifyResult.conclusion}</p>
                  </div>
                </div>
              )}
              
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  상세 정보 보기
                </summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(verifyResult, null, 2)}
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
              🚀 이 단계는 카페24 쇼핑몰의 <strong>리뷰 작성 페이지</strong>에 &ldquo;할인 쿠폰 받기&rdquo; 버튼을 자동으로 삽입합니다.
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
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
            실제 테스트 방법
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">ScriptTag 설치 확인</h3>
                <p className="text-gray-600 text-sm">위의 Step 2에서 &ldquo;✅ 설치 성공!&rdquo; 메시지가 나타났는지 확인하세요.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">테스트 쇼핑몰 접속</h3>
                <p className="text-gray-600 text-sm mb-2">
                  카페24 쇼핑몰에 접속합니다:
                </p>
                <p className="text-xs text-gray-500">
                  예: https://[Mall ID].cafe24.com
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">리뷰 작성 페이지 이동</h3>
                <p className="text-gray-600 text-sm">
                  상품 페이지 → &ldquo;상품후기&rdquo; 또는 &ldquo;리뷰 쓰기&rdquo; 버튼 클릭 → 리뷰 작성 페이지로 이동
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">할인 버튼 확인</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                  <p className="text-orange-800 text-sm font-semibold">
                    🎁 &ldquo;할인 쿠폰 받기&rdquo; 버튼이 나타나야 합니다!
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
