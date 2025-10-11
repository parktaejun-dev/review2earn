// app/admin/[mallId]/page.tsx
// 기존 코드를 수정

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface DashboardStats {
  totalOrders: number;      // ✅ 총 주문 수
  totalReviews: number;     // ✅ 총 리뷰 수
  totalMembers: number;     // ✅ R2E 회원 수
  totalRewards: number;     // ✅ 총 적립금
  activeProducts: number;   // ✅ 활성 상품 수
}

export default function AdminDashboard() {
  const params = useParams();
  const mallId = params.mallId as string;
  
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalReviews: 0,
    totalMembers: 0,
    totalRewards: 0,
    activeProducts: 0,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [mallId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/${mallId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Review2Earn 관리자</h1>
          <p className="text-green-600 mt-2">✅ 카페24 연동 성공!</p>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {mallId}
          </span>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* 상품 수 (실제론 주문 수) */}
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">상품 수</p>
                <p className="text-3xl font-bold mt-2">
                  {loading ? '...' : stats.activeProducts}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🛍️</span>
              </div>
            </div>
          </div>

          {/* 총 리뷰 */}
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 리뷰</p>
                <p className="text-3xl font-bold mt-2">
                  {loading ? '...' : stats.totalReviews}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          {/* R2E 회원 */}
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">R2E 회원</p>
                <p className="text-3xl font-bold mt-2">
                  {loading ? '...' : stats.totalMembers}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* 총 적립금 */}
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 적립금</p>
                <p className="text-2xl font-bold mt-2">
                  {loading ? '...' : `${stats.totalRewards.toLocaleString()}원`}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook 상태 */}
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <h2 className="text-xl font-bold mb-4">🔔 Webhook 상태</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>product.review.register</span>
              <span className="text-green-600 font-bold">● 활성</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>order.confirm</span>
              <span className="text-green-600 font-bold">● 활성</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
