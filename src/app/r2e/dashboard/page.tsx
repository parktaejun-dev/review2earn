// src/app/r2e/dashboard/page.tsx (신규)
'use client'

import { useState, useEffect } from 'react'

export default function R2EDashboard() {
  const [email, setEmail] = useState('')
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadAccount = async () => {
    if (!email) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/r2e/account?email=${email}`)
      const data = await res.json()
      
      if (data.success) {
        setAccount(data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
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
              className="flex-1 px-4 py-2 border rounded-lg"
              placeholder="example@email.com"
            />
            <button
              onClick={loadAccount}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              조회
            </button>
          </div>
        </div>

        {/* 계정 정보 */}
        {account && (
          <>
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
              {account.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="border-b py-3">
                  <div className="flex justify-between">
                    <span>{tx.description}</span>
                    <span className="text-green-600 font-bold">
                      +{tx.amount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
