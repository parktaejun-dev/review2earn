// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [mallId, setMallId] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 쿠키 읽기 함수
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const oauthCompleted = getCookie('oauth_completed')
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const returnedMallId = params.get('mall_id')
    
    if (success === 'true' && returnedMallId && oauthCompleted === 'true') {
      // ✅ OAuth 성공 - 쿠키로 검증됨
      console.log('✅ OAuth verified with cookie for:', returnedMallId)
      
      setIsConnected(true)
      setShowSuccess(true)
      setMallId(returnedMallId)
      localStorage.setItem('user_mall_id', returnedMallId)
      localStorage.setItem('is_connected', 'true')
      
      // 쿠키 삭제 (한번만 사용)
      document.cookie = 'oauth_completed=; Max-Age=0; path=/'
      
      // URL 정리
      window.history.replaceState({}, '', '/')
    } else if (success === 'true' && returnedMallId && !oauthCompleted) {
      // ⚠️ 쿠키 없이 success 파라미터만 있음 - 무한루프 방지
      console.warn('⚠️ OAuth success without cookie - preventing loop')
      window.history.replaceState({}, '', '/')
    } else {
      // 저장된 연결 상태 확인
      const savedMallId = localStorage.getItem('user_mall_id')
      const isAlreadyConnected = localStorage.getItem('is_connected')
      
      if (savedMallId && isAlreadyConnected === 'true') {
        console.log('✅ Restored connection for:', savedMallId)
        setMallId(savedMallId)
        setIsConnected(true)
      } else if (savedMallId) {
        setMallId(savedMallId)
      }
    }
    
    setIsLoading(false)
  }, [])

  async function handleConnect() {
    if (!mallId.trim()) {
      alert('쇼핑몰 ID를 입력하세요 (예: dhdshop)')
      return
    }
    
    setIsConnecting(true)
    
    try {
      localStorage.setItem('user_mall_id', mallId)
      localStorage.removeItem('is_connected')
      
      const response = await fetch('/api/oauth/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId })
      })

      const data = await response.json()

      if (data.authUrl) {
        console.log('🔄 Redirecting to OAuth:', data.authUrl)
        window.location.href = data.authUrl
      } else {
        alert(`OAuth URL 생성 실패: ${data.error || '알 수 없는 오류'}`)
        setIsConnecting(false)
      }
    } catch (error) {
      console.error('OAuth 시작 실패:', error)
      alert('OAuth 시작에 실패했습니다.')
      setIsConnecting(false)
    }
  }

  function handleReconnect() {
    console.log('🔄 Resetting connection...')
    setIsConnected(false)
    setShowSuccess(false)
    localStorage.removeItem('user_mall_id')
    localStorage.removeItem('is_connected')
    document.cookie = 'oauth_completed=; Max-Age=0; path=/'
    setMallId('')
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-2xl font-semibold animate-pulse">Loading...</div>
      </div>
    )
  }

  // 연결 완료 화면
  if (isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">연결 완료!</h1>
            <p className="text-gray-600">
              <span className="font-semibold text-purple-600">{mallId}</span> 쇼핑몰이 Review2Earn에 연결되었습니다
            </p>
          </div>

          {showSuccess && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-medium">인증이 완료되었습니다!</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-800 mb-4 text-lg">✅ 다음 단계</h3>
              <ol className="space-y-3 text-purple-700">
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-purple-600">1.</span>
                  <span>리뷰가 작성되면 자동으로 추천 링크 생성</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-purple-600">2.</span>
                  <span>리뷰어는 대시보드에서 추천 링크 확인</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-purple-600">3.</span>
                  <span>구매 발생 시 자동으로 적립금 지급</span>
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/admin/dashboard"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition transform hover:scale-105 shadow-lg"
              >
                ⚙️ 관리자 페이지
              </a>
              <button
                onClick={handleReconnect}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition transform hover:scale-105 shadow-lg"
              >
                🔄 다른 쇼핑몰 연결
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 초기 연결 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            🎯 Review2Earn
          </h1>
          <p className="text-gray-600">리뷰로 수익을 창출하는 스마트한 방법</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="mallId" className="block text-sm font-medium text-gray-700 mb-2">
              카페24 쇼핑몰 ID
            </label>
            <input
              type="text"
              id="mallId"
              value={mallId}
              onChange={(e) => setMallId(e.target.value)}
              placeholder="예: dhdshop"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 placeholder-gray-400"
              disabled={isConnecting}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isConnecting && mallId.trim()) {
                  handleConnect()
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              쇼핑몰 주소에서 .cafe24.com 앞부분을 입력하세요
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !mallId.trim()}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg ${
              isConnecting || !mallId.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105'
            }`}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                연결 중...
              </span>
            ) : (
              '🚀 시작하기'
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 text-center">작동 방식</h3>
          <ul className="space-y-3">
            <li className="flex items-start bg-purple-50 p-3 rounded-lg">
              <span className="text-2xl mr-3">1️⃣</span>
              <div>
                <p className="font-medium text-gray-800">자동 링크 생성</p>
                <p className="text-sm text-gray-600">리뷰 작성 시 자동으로 추천 링크 생성</p>
              </div>
            </li>
            <li className="flex items-start bg-pink-50 p-3 rounded-lg">
              <span className="text-2xl mr-3">2️⃣</span>
              <div>
                <p className="font-medium text-gray-800">링크 공유</p>
                <p className="text-sm text-gray-600">친구에게 링크 공유 (SNS, 블로그 등)</p>
              </div>
            </li>
            <li className="flex items-start bg-red-50 p-3 rounded-lg">
              <span className="text-2xl mr-3">3️⃣</span>
              <div>
                <p className="font-medium text-gray-800">자동 적립</p>
                <p className="text-sm text-gray-600">구매 발생 시 자동으로 적립금 지급!</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
