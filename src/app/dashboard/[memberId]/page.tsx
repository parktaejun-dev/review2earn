'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface Stats {
  totalReviews: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  pendingReward: number;
  completedReward: number;
}

interface Review {
  id: number;
  referralCode: string;
  referralLink: string;
  productNo: number;
  clickCount: number;
  conversionCount: number;
  totalRevenue: number;
  createdAt: string;
}

interface Transaction {
  id: number;
  reviewId: number;
  referralCode: string;
  orderId: string;
  orderAmount: number;
  rewardAmount: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.memberId as string;
  const mallId = searchParams.get('mallId') || 'dhdshop';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, [memberId, mallId]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard/${memberId}?mallId=${mallId}`);
      const data = await res.json();

      if (data.success) {
        setStats(data.data.stats);
        setReviews(data.data.reviews);
        setTransactions(data.data.recentTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('추천 링크가 복사되었습니다!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Review2Earn 대시보드
          </h1>
          <p className="mt-2 text-sm text-gray-600">회원 ID: {memberId}</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="총 리뷰 수"
            value={stats?.totalReviews || 0}
            icon="📝"
            color="blue"
          />
          <StatCard
            title="총 클릭 수"
            value={stats?.totalClicks || 0}
            icon="👆"
            color="green"
          />
          <StatCard
            title="총 전환 수"
            value={stats?.totalConversions || 0}
            icon="🎯"
            color="purple"
          />
          <StatCard
            title="총 거래액"
            value={`₩${stats?.totalRevenue.toLocaleString() || 0}`}
            icon="💰"
            color="yellow"
          />
          <StatCard
            title="대기 중 보상"
            value={`₩${stats?.pendingReward.toLocaleString() || 0}`}
            icon="⏳"
            color="orange"
          />
          <StatCard
            title="완료된 보상"
            value={`₩${stats?.completedReward.toLocaleString() || 0}`}
            icon="✅"
            color="teal"
          />
        </div>

        {/* 내 리뷰 목록 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">내 리뷰 목록</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                아직 작성한 리뷰가 없습니다.
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          상품 #{review.productNo}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                          {review.referralCode}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        클릭: {review.clickCount} | 전환: {review.conversionCount}{' '}
                        | 수익: ₩{review.totalRevenue.toLocaleString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={review.referralLink}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                        />
                        <button
                          onClick={() => copyToClipboard(review.referralLink)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          복사
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    작성일: {new Date(review.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 최근 거래 내역 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">최근 거래 내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    추천 코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문 금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    보상 금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일시
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tx.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.referralCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₩{tx.orderAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₩{tx.rewardAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status === 'completed'
                            ? '완료'
                            : tx.status === 'pending'
                            ? '대기'
                            : '취소'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-lg p-3 text-2xl`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
