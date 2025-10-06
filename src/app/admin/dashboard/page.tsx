'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [mallId, setMallId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [scriptStatus, setScriptStatus] = useState<'checking' | 'installed' | 'not_installed' | 'installing' | 'removing'>('checking');
  const [scriptMessage, setScriptMessage] = useState('');

  useEffect(() => {
    // 쿠키에서 mall_id 확인
    const cookieMallId = document.cookie
      .split('; ')
      .find(row => row.startsWith('cafe24_mall_id='))
      ?.split('=')[1];
    
    if (cookieMallId) {
      setMallId(cookieMallId);
      setIsConnected(true);
      checkScriptStatus();
    }
  }, []);

  // 스크립트 상태 확인
  const checkScriptStatus = async () => {
    try {
      const response = await fetch('/api/scripttags/status', {
        method: 'GET'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScriptStatus(result.installed ? 'installed' : 'not_installed');
        setScriptMessage(result.message);
      }
    } catch (error) {
      console.error('스크립트 상태 확인 오류:', error);
      setScriptStatus('not_installed');
    }
  };

  // API 테스트 함수
  const handleApiTest = async () => {
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST'
      });
      
      const result = await response.json();
      setApiTestResult(result);
    } catch (error) {
      console.error('API 테스트 오류:', error);
      setApiTestResult({
        success: false,
        message: 'API 테스트 중 오류가 발생했습니다'
      });
    }
  };

  // 스크립트 설치 함수
  const handleInstallScript = async () => {
    setScriptStatus('installing');
    setScriptMessage('스크립트를 설치하는 중입니다...');

    try {
      const response = await fetch('/api/scripttags/install', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScriptStatus('installed');
        setScriptMessage(result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('스크립트 설치 오류:', error);
      setScriptMessage('스크립트 설치 중 오류가 발생했습니다');
      setScriptStatus('not_installed');
    }
  };

  // 스크립트 제거 함수
  const handleRemoveScript = async () => {
    if (!confirm('리뷰투언 스크립트를 제거하시겠습니까?')) return;

    setScriptStatus('removing');
    setScriptMessage('스크립트를 제거하는 중입니다...');

    try {
      const response = await fetch('/api/scripttags/uninstall', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScriptStatus('not_installed');
        setScriptMessage(result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('스크립트 제거 오류:', error);
      setScriptMessage('스크립트 제거 중 오류가 발생했습니다');
    }
  };

  const handleLogout = () => {
    // 쿠키 삭제
    document.cookie = 'cafe24_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'cafe24_mall_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 홈페이지로 리다이렉트
    window.location.href = '/';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              🔐 인증이 필요합니다
            </h1>
            <p className="text-gray-600 mb-6">
              카페24 연동 후 이용할 수 있습니다.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 리뷰투언 관리자 대시보드
              </h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {mallId}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 연결 상태 */}
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">✅ 카페24 연동 성공!</h3>
              <div className="mt-2 text-sm">
                <p>쇼핑몰 {mallId}과 성공적으로 연결되었습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🛍️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">상품 수</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {apiTestResult?.products_count || '2'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🎫</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">발급된 쿠폰</dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">⭐</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">총 적립금 지급</dt>
                    <dd className="text-lg font-medium text-gray-900">0원</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스크립트 관리 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            🔧 리뷰투언 스크립트 관리
          </h2>
          
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              쇼핑몰 리뷰 작성란에 "리뷰투언으로 수익받기" 버튼을 추가합니다.
            </p>
            
            {scriptMessage && (
              <div className={`p-3 rounded mb-4 ${
                scriptStatus === 'installed' ? 'bg-green-100 text-green-800' :
                scriptStatus === 'not_installed' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {scriptMessage}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {scriptStatus === 'not_installed' && (
              <button
                onClick={handleInstallScript}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                📦 스크립트 설치
              </button>
            )}

            {scriptStatus === 'installed' && (
              <>
                <button
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium cursor-default"
                  disabled
                >
                  ✅ 설치 완료
                </button>
                <button
                  onClick={handleRemoveScript}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  🗑️ 스크립트 제거
                </button>
              </>
            )}

            {(scriptStatus === 'installing' || scriptStatus === 'removing') && (
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium cursor-default"
                disabled
              >
                ⏳ 처리 중...
              </button>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>💡 스크립트 설치 후 쇼핑몰의 상품 리뷰 작성 페이지에서 버튼을 확인할 수 있습니다.</p>
            <p>🔗 테스트 URL: <span className="font-mono">https://{mallId}.cafe24.com/board/product/write.html?board_no=4&product_no=12</span></p>
          </div>
        </div>

        {/* API 연결 테스트 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">API 연결 테스트</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleApiTest}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              API 테스트 실행
            </button>
          </div>

          {apiTestResult && (
            <div className={`p-4 rounded-lg ${
              apiTestResult.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
            }`}>
              <h3 className="font-bold mb-2">
                {apiTestResult.success ? '✅ 테스트 성공' : '❌ 테스트 실패'}
              </h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
