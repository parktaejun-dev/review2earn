// src/app/page.tsx
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
  removedCount?: number;
  totalFound?: number;
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
  const [uninstallResult, setUninstallResult] = useState<ScriptTagResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyTokenResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstallingScript, setIsInstallingScript] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mallIdInput, setMallIdInput] = useState('');

  useEffect(() => {
    // 1. OAuth callback 처리
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const mallIdParam = urlParams.get('mall_id');
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      alert(`OAuth 실패: ${urlParams.get('message') || '알 수 없는 오류'}`);
      window.history.replaceState({}, '', '/');
      return;
    }
    
    if (oauthSuccess === 'true' && mallIdParam) {
      setMallIdInput(mallIdParam);
      localStorage.setItem('user_mall_id', mallIdParam);
      localStorage.setItem('cafe24_mall_id', mallIdParam);
      
      window.history.replaceState({}, '', '/');
      
      setTimeout(() => {
        testConnection();
      }, 500);
      
      return;
    }

    // 2. 기존 OAuth 토큰 처리
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const mallId = urlParams.get('mall_id');
    const expiresIn = urlParams.get('expires_in');
    
    if (accessToken) {
      console.log('✅ OAuth 토큰 감지 - localStorage에 저장');
      localStorage.setItem('cafe24_access_token', accessToken);
      if (refreshToken) localStorage.setItem('cafe24_refresh_token', refreshToken);
      if (mallId) {
        localStorage.setItem('cafe24_mall_id', mallId);
        localStorage.setItem('user_mall_id', mallId);
      }
      if (expiresIn) localStorage.setItem('cafe24_expires_in', expiresIn);
      
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }

    // 3. 저장된 mallId 불러오기
    const savedMallId = localStorage.getItem('user_mall_id');
    if (savedMallId) {
      setMallIdInput(savedMallId);
    }
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const mallId = mallIdInput || localStorage.getItem('cafe24_mall_id');
      const response = await fetch(`/api/test-connection?mall_id=${mallId}`);
      
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

  async function handleConnect() {
    if (!mallIdInput.trim()) {
      alert('쇼핑몰 ID를 입력하세요 (예: dhdshop)');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      localStorage.setItem('user_mall_id', mallIdInput);
      
      const response = await fetch('/api/oauth/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId: mallIdInput })
      });

      const data = await response.json();

      if (data.authUrl) {
        sessionStorage.setItem('oauth_state', data.state);
        window.location.href = data.authUrl;
      } else {
        console.error('OAuth URL 생성 실패:', data);
        alert(`OAuth URL 생성에 실패했습니다: ${data.error || '알 수 없는 오류'}`);
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('OAuth 시작 실패:', error);
      alert('OAuth 시작에 실패했습니다. API Route가 생성되었는지 확인하세요.');
      setIsConnecting(false);
    }
  }

  const verifyToken = async () => {
    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const mallId = mallIdInput || localStorage.getItem('cafe24_mall_id');

      if (!mallId) {
        alert('Mall ID를 입력하세요.');
        setIsVerifying(false);
        return;
      }

      const response = await fetch('/api/oauth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mallId })
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
      const mallId = mallIdInput || localStorage.getItem('cafe24_mall_id');

      const response = await fetch('/api/scripttags/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mallId: mallId,
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

  const uninstallScriptTag = async () => {
    if (!connectionResult?.success) {
      alert('먼저 카페24 연결 테스트를 완료해주세요.');
      return;
    }

    setIsUninstalling(true);
    setUninstallResult(null);

    try {
      const accessToken = localStorage.getItem('cafe24_access_token');
      const mallId = mallIdInput || localStorage.getItem('cafe24_mall_id');

      const response = await fetch('/api/scripttags/uninstall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
          'X-Mall-Id': mallId || ''
        },
        body: JSON.stringify({
          mallId: mallId,
          accessToken: accessToken
        })
      });

      const data = await response.json();
      setUninstallResult(data);
    } catch (error) {
      console.error('ScriptTag uninstall error:', error);
      setUninstallResult({
        success: false,
        error: 'ScriptTag 제거 중 오류가 발생했습니다.'
      });
    } finally {
      setIsUninstalling(false);
    }
  };

  // ✅ 새로 추가: ScriptTag 목록 확인 함수
  const listScriptTags = async () => {
    try {
      const mallId = mallIdInput || localStorage.getItem('cafe24_mall_id');
      
      if (!mallId) {
        alert('Mall ID를 입력하세요.');
        return;
      }

      const res = await fetch(`/api/scripttags/list?mallId=${mallId}`);
      const data = await res.json();
      console.log('📋 현재 ScriptTags:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('ScriptTag list error:', error);
      alert('ScriptTag 목록 조회 중 오류가 발생했습니다.');
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
            카페24 리뷰 기반 추천 구매 보상 시스템
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
            onClick={handleConnect}
            disabled={isConnecting || !mallIdInput.trim()}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isConnecting || !mallIdInput.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600 transform hover:scale-105'
            }`}
          >
            {isConnecting ? '🔄 연결 중...' : '🔗 카페24 연결 시작'}
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

        {/* Step 2: ScriptTags API 설치/제거 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
            Review2Earn 스크립트 설치/제거
          </h2>
          
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              🚀 이 단계는 카페24 쇼핑몰의 <strong>리뷰 작성 페이지</strong>에 Review2Earn 참여 동의 기능을 자동으로 삽입 또는 제거합니다.
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              ℹ️ 설치 후 리뷰 작성자는 Review2Earn에 참여할 수 있으며, 참여 시 추천 링크를 받게 됩니다.
            </p>
          </div>

          {/* ✅ 버튼 3개 */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={installScriptTag}
              disabled={isInstallingScript || !connectionResult?.success}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                isInstallingScript || !connectionResult?.success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 transform hover:scale-105'
              }`}>
              {isInstallingScript ? '🔄 설치 중...' : '📦 ScriptTag 설치'}
            </button>

            <button
              onClick={uninstallScriptTag}
              disabled={isUninstalling || !connectionResult?.success}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                isUninstalling || !connectionResult?.success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 transform hover:scale-105'
              }`}
            >
              {isUninstalling ? '🔄 제거 중...' : '🗑️ ScriptTag 제거'}
            </button>

            {/* ✅ 새로 추가된 버튼 */}
            <button
              onClick={listScriptTags}
              disabled={!connectionResult?.success}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                !connectionResult?.success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 transform hover:scale-105'
              }`}
            >
              📋 ScriptTag 목록 확인
            </button>
          </div>

          {scriptTagResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              scriptTagResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="mb-2">
                <span className={`font-semibold ${
                  scriptTagResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {scriptTagResult.success ? '✅ 설치 성공!' : '❌ 설치 실패'}
                </span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">상세 정보 보기</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(scriptTagResult, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {uninstallResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              uninstallResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="mb-2">
                <span className={`font-semibold ${
                  uninstallResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {uninstallResult.success ? '✅ 제거 성공!' : '❌ 제거 실패'}
                </span>
                {uninstallResult.removedCount !== undefined && (
                  <div className="text-sm text-gray-600 mt-1">
                    제거된 ScriptTag: {uninstallResult.removedCount}개
                  </div>
                )}
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">상세 정보 보기</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(uninstallResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Step 3: 테스트 가이드 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
            동작 확인 방법
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
                <h3 className="font-semibold text-gray-800 mb-2">쇼핑몰 리뷰 페이지 접속</h3>
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
                  상품 페이지 → &ldquo;리뷰 쓰기&rdquo; 버튼 클릭 → 리뷰 작성 페이지로 이동
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Review2Earn 참여 옵션 확인</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <p className="text-green-800 text-sm font-semibold">
                    ✅ &ldquo;Review2Earn에 참여하시겠습니까?&rdquo; 체크박스가 나타나야 합니다!
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  체크 후 리뷰를 제출하면 추천 링크가 생성되고, 이 링크로 다른 사용자가 구매하면 리뷰 작성자는 적립금을 받습니다.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">🔧 문제 해결</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 옵션이 안 보인다면: 브라우저 콘솔(F12)에서 오류 확인</li>
                <li>• 스크립트 로딩 실패: 2-3초 기다린 후 페이지 새로고침</li>
                <li>• 동의 API 실패: 네트워크 탭에서 /api/consent 확인</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">📊 전체 플로우</h4>
              <ol className="text-sm text-gray-600 space-y-2">
                <li><strong>1. 리뷰 작성자(A):</strong> 리뷰 작성 + Review2Earn 참여 동의</li>
                <li><strong>2. 시스템:</strong> 추천 링크 생성 (예: /product/100?ref=R2E...)</li>
                <li><strong>3. 공유:</strong> 작성자(A)가 SNS/블로그에 추천 링크 공유</li>
                <li><strong>4. 구매자(B):</strong> 추천 링크 클릭 → 상품 구매</li>
                <li><strong>5. 보상:</strong> 작성자(A)에게 구매 금액의 1% 적립금 지급</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
