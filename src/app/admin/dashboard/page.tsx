import { formatDate } from "@/lib/locale-utils";
// src/app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  mallId: string
  products_count: number
  total_reviews: number
  total_r2e_accounts: number
  total_r2e_points: number
  pending_withdrawals: number
  recent_transactions: Array<{
    id: string
    amount: number
    type: string
    status: string
    earnedAt: string
  }>
}

export default function Dashboard() {
  const [mallId, setMallId] = useState<string>('')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [webhookLoading, setWebhookLoading] = useState<boolean>(false)
  const [webhookMessage, setWebhookMessage] = useState<string>('')

  useEffect(() => {
    const savedMallId = localStorage.getItem('user_mall_id')
    const isAlreadyConnected = localStorage.getItem('is_connected')
    
    if (savedMallId && isAlreadyConnected === 'true') {
      setMallId(savedMallId)
      setIsConnected(true)
      document.cookie = `cafe24_mall_id=${savedMallId}; path=/; max-age=86400`
      loadDashboardStats(savedMallId)
    } else {
      const cookieMallId = document.cookie
        .split('; ')
        .find(row => row.startsWith('cafe24_mall_id='))
        ?.split('=')[1]
      
      if (cookieMallId) {
        setMallId(cookieMallId)
        setIsConnected(true)
        localStorage.setItem('user_mall_id', cookieMallId)
        localStorage.setItem('is_connected', 'true')
        loadDashboardStats(cookieMallId)
      }
    }
  }, [])

  const loadDashboardStats = async (mallId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stats?mall_id=${mallId}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const registerWebhooks = async () => {
    if (!mallId) return

    try {
      setWebhookLoading(true)
      setWebhookMessage('')

      const response = await fetch('/api/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId }),
      })

      const result = await response.json()

      if (result.success) {
        setWebhookMessage('✅ Webhook 등록 성공!')
        // 3초 후 메시지 제거
        setTimeout(() => setWebhookMessage(''), 3000)
      } else {
        setWebhookMessage(`❌ Webhook 등록 실패: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Webhook registration error:', error)
      setWebhookMessage('❌ Webhook 등록 중 오류가 발생했습니다')
    } finally {
      setWebhookLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    document.cookie.split(";").forEach(c => {
      document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    })
    window.location.href = '/'
  }

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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 Review2Earn 관리자
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
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">✅ 카페24 연동 성공!</h3>
              </div>
            </div>
            
            {/* Webhook 등록 버튼 */}
            <button
              onClick={registerWebhooks}
              disabled={webhookLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {webhookLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  등록 중...
                </>
              ) : (
                <>
                  🔔 Webhook 등록
                </>
              )}
            </button>
          </div>
          
          {/* Webhook 메시지 */}
          {webhookMessage && (
            <div className="mt-2 text-sm">
              {webhookMessage}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터 로딩 중...</p>
          </div>
        ) : (
          <>
            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon="🛍️"
                title="상품 수"
                value={stats?.products_count || 0}
                color="blue"
              />
              <StatCard
                icon="📝"
                title="총 리뷰"
                value={stats?.total_reviews || 0}
                color="green"
              />
              <StatCard
                icon="👥"
                title="R2E 회원"
                value={stats?.total_r2e_accounts || 0}
                color="purple"
              />
              <StatCard
                icon="💰"
                title="총 적립금"
                value={`${(stats?.total_r2e_points || 0).toLocaleString()}원`}
                color="yellow"
              />
            </div>

            {/* R2E 통계 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 최근 거래 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  💸 최근 R2E 거래
                </h2>
                {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium text-gray-700">
                            {tx.type === 'REFERRAL_REWARD' ? '추천 보상' : tx.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(tx.earnedAt).formatDate()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +{tx.amount.toLocaleString()}원
                          </p>
                          <p className="text-xs text-gray-500">{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">거래 내역이 없습니다</p>
                )}
              </div>

              {/* 출금 대기 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  🏦 출금 현황
                </h2>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-orange-500">
                    {stats?.pending_withdrawals || 0}
                  </div>
                  <p className="text-gray-600 mt-2">대기 중인 출금 요청</p>
                </div>
              </div>
            </div>

            {/* Webhook 상태 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                🔔 Webhook 상태
              </h2>
              <div className="space-y-2">
                <WebhookStatus name="product.review.register" active={true} />
                <WebhookStatus name="order.confirm" active={true} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// 통계 카드 컴포넌트
function StatCard({ icon, title, value, color }: {
  icon: string
  title: string
  value: string | number
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 ${colorClasses[color]} rounded-full flex items-center justify-center text-2xl`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// Webhook 상태 컴포넌트
function WebhookStatus({ name, active }: { name: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span className="text-gray-700 font-medium">{name}</span>
      <div className="flex items-center">
        <span className={`w-3 h-3 rounded-full mr-2 ${active ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className={`text-sm ${active ? 'text-green-600' : 'text-red-600'}`}>
          {active ? '활성' : '비활성'}
        </span>
      </div>
    </div>
  )
}
