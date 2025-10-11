import { formatDate } from "@/lib/locale-utils";
// src/app/r2e/dashboard/page.tsx
'use client'

import { useState } from 'react'

// ✅ 타입 정의
interface R2ETransaction {
  id: string
  amount: number
  description: string
  earnedAt: string
}

interface R2EAccountData {
  id: string
  email: string
  totalPoints: number
  availablePoints: number
  recentTransactions: R2ETransaction[]
}

export default function R2EDashboard() {
  const [email, setEmail] = useState('')
  const [account, setAccount] = useState<R2EAccountData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAccount = async () => {
    if (!email) {
      setError('이메일을 입력해주세요')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/r2e/account?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      
      if (data.success) {
        setAccount(data.data)
      } else {
        setError(data.error || '계정을 찾을 수 없습니다')
        setAccount(null)
      }
    } catch (err) {
      console.error('Account load error:', err)
      setError('계정 조회 중 오류가 발생했습니다')
      setAccount(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadAccount()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">💰 내 적립금</h1>
        
        {/* 이메일 입력 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이메일로 조회
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
              disabled={loading}
            />
            <button
              onClick={loadAccount}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
          
          {/* 에러 메시지 */}
          {error && (
            <div className="mt-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* 계정 정보 */}
        {account && (
          <>
            {/* 잔액 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">잔액</h2>
              <div className="text-4xl font-bold text-green-600">
                {account.availablePoints.toLocaleString()}원
              </div>
              <p className="text-gray-500 mt-2">
                총 적립: {account.totalPoints.toLocaleString()}원
              </p>
            </div>

            {/* 최근 거래 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">최근 거래</h2>
              {account.recentTransactions && account.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {account.recentTransactions.map((tx) => (
                    <div key={tx.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(new Date(tx.earnedAt), {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className="text-green-600 font-bold whitespace-nowrap ml-4">
                          +{tx.amount.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  거래 내역이 없습니다
                </p>
              )}
            </div>
          </>
        )}

        {/* 초기 상태 (계정 조회 전) */}
        {!account && !loading && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600">이메일을 입력하고 적립금을 조회하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
