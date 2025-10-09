// src/app/page.tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [mallId, setMallId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  async function handleConnect() {
    if (!mallId.trim()) {
      alert('쇼핑몰 ID를 입력하세요 (예: dhdshop)');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      localStorage.setItem('user_mall_id', mallId);
      
      const response = await fetch('/api/oauth/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId })
      });

      const data = await response.json();

      if (data.authUrl) {
        sessionStorage.setItem('oauth_state', data.state);
        window.location.href = data.authUrl;
      } else {
        alert(`OAuth URL 생성 실패: ${data.error || '알 수 없는 오류'}`);
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('OAuth 시작 실패:', error);
      alert('OAuth 시작에 실패했습니다.');
      setIsConnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 Review2Earn
          </h1>
          <p className="text-gray-600">
            리뷰로 수익을 창출하는 스마트한 방법
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label 
              htmlFor="mallId" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              카페24 쇼핑몰 ID
            </label>
            <input
              type="text"
              id="mallId"
              value={mallId}
              onChange={(e) => setMallId(e.target.value)}
              placeholder="예: dhdshop"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              disabled={isConnecting}
            />
            <p className="text-xs text-gray-500 mt-1">
              쇼핑몰 주소에서 .cafe24.com 앞부분을 입력하세요
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !mallId.trim()}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isConnecting || !mallId.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105'
            }`}
          >
            {isConnecting ? '🔄 연결 중...' : '🚀 시작하기'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">작동 방식</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">1️⃣</span>
              리뷰 작성 시 자동으로 추천 링크 생성
            </li>
            <li className="flex items-start">
              <span className="mr-2">2️⃣</span>
              친구에게 링크 공유
            </li>
            <li className="flex items-start">
              <span className="mr-2">3️⃣</span>
              구매 발생 시 자동으로 적립금 지급!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
