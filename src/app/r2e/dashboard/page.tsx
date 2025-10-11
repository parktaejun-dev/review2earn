'use client'

import { useState } from 'react'

interface R2ETransaction {
  id: string
  type: string
  amount: number
  description: string
  earnedAt: Date
  status: string
}

export default function R2EDashboard() {
  const [transactions, setTransactions] = useState<R2ETransaction[]>([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    setTimeout(() => {
      setTransactions([
        {
          id: '1',
          type: 'REVIEW_EARN',
          amount: 1000,
          description: '리뷰 작성 적립금',
          earnedAt: new Date(),
          status: 'COMPLETED'
        }
      ])
      setLoading(false)
    }, 1000)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">R2E Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">최근 거래 내역</h2>
        
        {transactions.length === 0 ? (
          <p className="text-gray-500">거래 내역이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.earnedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      +₩{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{tx.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
