'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return '사용자가 카페24 연동을 거부했습니다.';
      case 'invalid_request':
        return '잘못된 요청입니다.';
      case 'invalid_client':
        return '클라이언트 정보가 올바르지 않습니다.';
      case 'invalid_grant':
        return '인증 코드가 유효하지 않습니다.';
      case 'unsupported_response_type':
        return '지원되지 않는 응답 타입입니다.';
      case 'invalid_scope':
        return '요청한 권한이 유효하지 않습니다.';
      case 'state_mismatch':
        return '보안 검증에 실패했습니다. 다시 시도해주세요.';
      case 'missing_parameters':
        return '필수 파라미터가 누락되었습니다.';
      case 'missing_mall_id':
        return '쇼핑몰 ID 정보가 누락되었습니다.';
      case 'callback_failed':
        return '인증 콜백 처리 중 오류가 발생했습니다.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              인증 오류
            </h1>

            <p className="text-gray-600 mb-6">
              {getErrorMessage(error)}
            </p>

            {error && (
              <div className="bg-gray-100 rounded p-3 mb-6">
                <p className="text-sm text-gray-500">
                  오류 코드: <code className="font-mono">{error}</code>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                홈으로 돌아가기
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            문제가 계속 발생하면{' '}
            <a href="mailto:support@review2earn.com" className="text-blue-600 hover:text-blue-500">
              고객지원팀
            </a>
            으로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
