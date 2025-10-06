// 카페24 ScriptTags API 구현
import { Cafe24OAuth } from './cafe24-oauth';

export class Cafe24ScriptTags {
  private oauth: Cafe24OAuth;

  constructor() {
    this.oauth = new Cafe24OAuth();
  }

  // 스크립트 태그 생성
  async createScriptTag(mallId: string, accessToken: string) {
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const scriptData = {
      request: {
        shop_no: 1,
        src: 'https://review2earn.vercel.app/scripts/review-button.js',
        display_location: 'REVIEWWRITE',
        skin_no: 101,
        integrity: '' // SHA-384 해시값 추가 예정
      }
    };

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
      return result;
    } catch (error) {
      console.error('ScriptTags API Error:', error);
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
      console.error('ScriptTags GET Error:', error);
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

      return await response.json();
    } catch (error) {
      console.error('ScriptTags DELETE Error:', error);
      throw error;
    }
  }

  // 스크립트 태그 수정
  async updateScriptTag(mallId: string, accessToken: string, scriptNo: number, updateData: any) {
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${scriptNo}`;
    
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
      return result;
    } catch (error) {
      console.error('ScriptTags UPDATE Error:', error);
      throw error;
    }
  }
}
