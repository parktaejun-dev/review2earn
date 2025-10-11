'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  mallId: string
  totalTransactions: number
  totalRevenue: number
  totalCommission: number
  activeMembers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const mallId = 'testshop'
        const response = await fetch(`/api/admin/${mallId}/stats`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Transactions</h3>
            <p className="text-3xl font-bold">{stats.totalTransactions}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Revenue</h3>
            <p className="text-3xl font-bold">₩{stats.totalRevenue.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Commission</h3>
            <p className="text-3xl font-bold">₩{stats.totalCommission.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Active Members</h3>
            <p className="text-3xl font-bold">{stats.activeMembers}</p>
          </div>
        </div>
      )}
    </div>
  )
}
