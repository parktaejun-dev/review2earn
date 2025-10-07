// src/lib/cafe24-oauth.ts
import crypto from 'crypto';

export class Cafe24OAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.CAFE24_CLIENT_ID!;
    this.clientSecret = process.env.CAFE24_CLIENT_SECRET!;
    this.redirectUri = process.env.CAFE24_REDIRECT_URI!;

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Cafe24 OAuth 환경변수가 설정되지 않았습니다.');
    }
  }

  generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  getAuthUrl(mallId: string, state: string): string {
    const scope = [
      'mall.read_product',
      'mall.read_order',
      'mall.read_community',
      'mall.write_community',
      'mall.read_customer',
      'mall.write_customer',
      'mall.read_promotion',
      'mall.write_promotion',
      'mall.read_design',
      'mall.write_design',
      'mall.read_application',
      'mall.write_application',
      'mall.write_scripttag',
    ].join(',');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scope,
      state: state
    });

    return `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(mallId: string, code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string[];
  }> {
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token request failed: ${error}`);
    }

    return await response.json();
  }

  async refreshAccessToken(mallId: string, refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return await response.json();
  }
}
