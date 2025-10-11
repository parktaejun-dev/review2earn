// 📂 src/lib/cafe24-scripttags.ts
// Review2Earn v6.0 - Cafe24 ScriptTags API 구현
// 환경변수 기반 동적 스크립트 URL

import { Cafe24OAuth } from './cafe24-oauth';

interface ScriptTagData {
  shop_no: number;
  src: string;
  display_location: string;
  skin_no: number;
  integrity: string;
}

export class Cafe24ScriptTags {
  private oauth: Cafe24OAuth;

  constructor() {
    this.oauth = new Cafe24OAuth();
  }

  // ✅ 동적 스크립트 URL 생성
  private getScriptUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app';
    return `${baseUrl}/scripts/review-button.js`;
  }

  // 스크립트 태그 생성
  async createScriptTag(mallId: string, accessToken: string) {
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const scriptUrl = this.getScriptUrl();  // ✅ 동적 URL
    
    const scriptData = {
      request: {
        shop_no: parseInt(process.env.DEFAULT_SHOP_NO || "1"),
        src: scriptUrl,  // ✅ 환경변수 사용
        display_location: 'REVIEWWRITE',
        skin_no: 101,
        integrity: ''
      }
    };

    console.log('🔗 ScriptTag URL:', scriptUrl);  // ✅ 로깅

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scriptData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'API 오류'}`);
      }

      const result = await response.json();
      console.log('✅ ScriptTag created:', result);
      return result;
    } catch (error) {
      console.error('❌ ScriptTags API Error:', error);
      throw error;
    }
  }

  // 기존 스크립트 태그 조회
  async getScriptTags(mallId: string, accessToken: string) {
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'API 오류'}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ ScriptTags GET Error:', error);
      throw error;
    }
  }

  // 스크립트 태그 삭제
  async deleteScriptTag(mallId: string, accessToken: string, scriptNo: number) {
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${scriptNo}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'API 오류'}`);
      }

      console.log('✅ ScriptTag deleted:', scriptNo);
      return await response.json();
    } catch (error) {
      console.error('❌ ScriptTags DELETE Error:', error);
      throw error;
    }
  }

  // 스크립트 태그 수정
  async updateScriptTag(mallId: string, accessToken: string, scriptNo: number, updateData: Partial<ScriptTagData>) {
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${scriptNo}`;
    
    // ✅ src가 포함된 경우 동적 URL로 대체
    if (updateData.src && !updateData.src.startsWith('http')) {
      updateData.src = this.getScriptUrl();
    }
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request: updateData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'API 오류'}`);
      }

      const result = await response.json();
      console.log('✅ ScriptTag updated:', scriptNo);
      return result;
    } catch (error) {
      console.error('❌ ScriptTags UPDATE Error:', error);
      throw error;
    }
  }
}
