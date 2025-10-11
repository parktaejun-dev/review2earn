// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [mallId, setMallId] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // 🆕 초기 로딩 상태

  useEffect(() => {
    // URL 파라미터 체크
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const returnedMallId = params.get('mall_id')
    
    if (success === 'true' && returnedMallId) {
      // ✅ OAuth 성공
      console.log('✅ OAuth callback success')
      setIsConnected(true)
      setShowSuccess(true)
      setMallId(returnedMallId)
      localStorage.setItem('user_mall_id', returnedMallId)
      localStorage.setItem('is_connected', 'true') // 🆕
      
      // URL 정리 (강제)
      setTimeout(() => {
        window.history.replaceState({}, '', '/')
      }, 100)
    } else {
      // 저장된 연결 상태 확인
      const savedMallId = localStorage.getItem('user_mall_id')
      const wasConnected = localStorage.getItem('is_connected')
      
      if (savedMallId && wasConnected === 'true') {
        // 🆕 이미 연결됨 - OAuth 건너뛰기
        console.log('✅ Using saved connection:', savedMallId)
        setMallId(savedMallId)
        setIsConnected(true)
      } else if (savedMallId) {
        // mallId만 있음 - 입력칸에 채우기
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
      // 연결 상태 저장
      localStorage.setItem('user_mall_id', mallId)
      localStorage.removeItem('is_connected') // 🆕 연결 시작 전 제거
      
      // OAuth URL 요청
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
    // 🆕 완전 초기화
    setIsConnected(false)
    setShowSuccess(false)
    localStorage.removeItem('user_mall_id')
    localStorage.removeItem('is_connected')
    setMallId('')
    console.log('🔄 Connection reset')
  }

  // 🆕 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  // 연결 완료 화면 (이전과 동일)
  if (isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        {/* ... 이전 코드 동일 ... */}
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">연결 완료!</h1>
            <p className="text-gray-600">
              <span className="font-semibold text-purple-600">{mallId}</span> 쇼핑몰이 연결되었습니다
            </p>
          </div>

          {showSuccess && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium text-center">✅ 인증이 완료되었습니다!</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-4">✅ 다음 단계</h3>
              <ol className="space-y-2 text-blue-700">
                <li>1. 리뷰 작성 시 자동으로 추천 링크 생성</li>
                <li>2. 리뷰어는 대시보드에서 추천 링크 확인</li>
                <li>3. 구매 발생 시 자동으로 적립금 지급</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/admin/dashboard"
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition shadow-lg"
              >
                ⚙️ 관리자 페이지
              </a>
              <button
                onClick={handleReconnect}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition shadow-lg"
              >
                🔄 다른 쇼핑몰 연결
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 초기 연결 화면 (이전과 동일)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
      {/* ... 이전 코드 동일 ... */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎯 Review2Earn</h1>
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
              disabled={isConnecting}
              onKeyPress={(e) => e.key === 'Enter' && !isConnecting && mallId.trim() && handleConnect()}
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !mallId.trim()}
            className={`w-full py-4 rounded-lg font-semibold text-white ${
              isConnecting || !mallId.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {isConnecting ? '연결 중...' : '🚀 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
