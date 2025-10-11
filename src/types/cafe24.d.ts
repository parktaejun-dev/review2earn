// src/types/cafe24.d.ts
// Cafe24 Webhook 이벤트 타입 정의

export interface Cafe24WebhookEvent {
  event_no: number
  resource: {
    mall_id: string
  }
  event: string
  data: unknown
}

export interface ReviewCreatedWebhook extends Cafe24WebhookEvent {
  event: 'board.product.created'
  data: {
    board_no: number
    product_no: number
    member_id: string
    writer: string
    content: string
    rating: number
    created_date: string
  }
}

export interface OrderConfirmWebhook extends Cafe24WebhookEvent {
  event: 'order.confirmed'
  data: {
    order_id: string
    product_no: number
    order_amount: number
    confirmed_date: string
  }
}

// Cafe24 API 응답 타입
export interface Cafe24Customer {
  customer: {
    member_id: string
    email: string
    name: string
    phone: string
    created_date: string
  }
}

export interface Cafe24AccessToken {
  access_token: string
  expires_at: string
  refresh_token: string
  refresh_token_expires_at: string
  client_id: string
  mall_id: string
  user_id: string
  scopes: string[]
}
