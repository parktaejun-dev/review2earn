'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  mall_id: string;
  connection_status: 'connected' | 'disconnected';
  api_test_result?: {
    success?: boolean;
    mall_id?: string;
    products_count?: number;
    message?: string;
    sample_data?: unknown;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/cafe24/test');
      const data = await response.json();
      
      if (response.ok) {
        setDashboardData({
          mall_id: data.mall_id,
          connection_status: 'connected',
          api_test_result: data
        });
      } else {
        setDashboardData({
          mall_id: '',
          connection_status: 'disconnected'
        });
      }
    } catch {
      setDashboardData({
        mall_id: '',
        connection_status: 'disconnected'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiTest = async () => {
    setIsLoading(true);
    setTestResult('API 테스트 중...');
    
    try {
      const response = await fetch('/api/cafe24/test');
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`API 테스트 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // 쿠키 삭제 및 홈으로 리다이렉트
    document.cookie = 'cafe24_access_token=; Max-Age=0; path=/';
    document.cookie = 'cafe24_mall_id=; Max-Age=0; path=/';
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🎯 리뷰투언 관리자 대시보드
              </h1>
              {dashboardData?.mall_id && (
                <span className="ml-4 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {dashboardData.mall_id}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardData?.connection_status === 'connected' ? (
          <>
            {/* 연결 상태 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    카페24 연동 성공!
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    쇼핑몰 {dashboardData.mall_id}와 성공적으로 연결되었습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 대시보드 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🛍️</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          상품 수
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.api_test_result?.products_count || 0}
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
                        <span className="text-white text-sm font-bold">💰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          발급된 쿠폰
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          0
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
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⭐</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          총 적립금 지급
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          0원
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* API 테스트 섹션 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  API 연결 테스트
                </h3>
                
                <button
                  onClick={handleApiTest}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '테스트 중...' : 'API 테스트 실행'}
                </button>

                {testResult && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">테스트 결과:</h4>
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      {testResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* 연결되지 않은 상태 */
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  카페24 연동이 필요합니다
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>카페24 쇼핑몰과 연동이 되어있지 않습니다.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/')}
                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md text-sm font-medium"
                  >
                    홈으로 가서 연동하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
