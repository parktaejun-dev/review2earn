import { CAFE24_CONFIG } from "@/lib/cafe24-config";
// src/lib/cafe24/client.ts
import { Cafe24Customer } from '@/types/cafe24'

export class Cafe24ApiClient {
  private baseUrl: string
  private accessToken: string

  constructor(mallId: string, accessToken: string) {
    this.baseUrl = `https://${mallId}.cafe24api.com/api/v2/admin`
    this.accessToken = accessToken
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Cafe24 API Error: ${response.status} - ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  // 고객 정보 조회 (이메일 가져오기용)
  async getCustomer(memberId: string): Promise<Cafe24Customer> {
    return this.request<Cafe24Customer>(`/customers/${memberId}`)
  }

  // 상품 정보 조회
  async getProduct(productNo: number) {
    return this.request(`/products/${productNo}`)
  }
}
