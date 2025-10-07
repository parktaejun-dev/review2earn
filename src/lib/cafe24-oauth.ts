// 카페24 OAuth 2.0 구현 (TypeScript)
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  mall_id: string;
}

export class Cafe24OAuth {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID!;
    this.clientSecret = process.env.CAFE24_CLIENT_SECRET!;
    this.baseUrl = process.env.NEXTAUTH_URL!;
    this.redirectUri = `${this.baseUrl}/api/oauth/callback`;
  }

  
  // 1단계: Authorization URL 생성
  getAuthUrl(mallId: string, state?: string): string {
  const authState = state || this.generateState();
  
  const authUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: this.clientId,
    redirect_uri: this.redirectUri,
    scope: [
      'mall.read_product',           // 상품 읽기
      'mall.read_order',             // 주문 읽기  
      'mall.read_community',         // 게시판 읽기
      'mall.write_community',        // 게시판 쓰기
      'mall.read_customer',          // 회원 읽기
      'mall.write_customer',         // 회원 쓰기 (적립금)
      'mall.read_promotion',         // 프로모션 읽기
      'mall.write_promotion',        // 프로모션 쓰기 (쿠폰)
      'mall.read_design',            // 디자인 읽기
      'mall.write_design',           // 디자인 쓰기 (스크립트)
      'mall.write_scripttag',  // ← 추가!

    ].join(','),
    state: authState
  });
  
  return `${authUrl}?${params.toString()}`;
}


  // 2단계: Authorization Code → Access Token
  async getAccessToken(mallId: string, code: string): Promise<TokenResponse> {
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${data.error_description || data.error}`);
      }
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope,
        mall_id: mallId
      };
    } catch (error) {
      console.error('OAuth token exchange error:', error);
      throw error;
    }
  }

  // 3단계: Refresh Token으로 Access Token 갱신
  async refreshAccessToken(mallId: string, refreshToken: string): Promise<TokenResponse> {
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
      }
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope,
        mall_id: mallId
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // CSRF 방지용 State 생성
  generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

