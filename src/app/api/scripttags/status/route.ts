// ScriptTags 상태 확인 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24ScriptTags } from '@/lib/cafe24-scripttags';

interface ScriptTag {
  src?: string;
  script_no?: number;
}

interface ScriptTagsResponse {
  scripttags?: ScriptTag[];
}

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('cafe24_access_token')?.value;
        const mallId = request.cookies.get('cafe24_mall_id')?.value;

        if (!accessToken || !mallId) {
            return NextResponse.json({
                success: false,
                message: '카페24 인증이 필요합니다'
            }, { status: 401 });
        }

        const scriptTags = new Cafe24ScriptTags();
        
        const existingScripts: ScriptTagsResponse = await scriptTags.getScriptTags(mallId, accessToken);
        
        const reviewScript = existingScripts.scripttags?.find(
            (script) => script.src?.includes('review-button.js')
        );

        const installed = !!reviewScript;

        return NextResponse.json({
            success: true,
            installed,
            message: installed 
                ? '리뷰투언 스크립트가 설치되어 있습니다'
                : '리뷰투언 스크립트가 설치되어 있지 않습니다',
            scriptInfo: reviewScript || null
        });

    } catch (error) {
        console.error('ScriptTags status check error:', error);
        
        return NextResponse.json({
            success: false,
            message: '스크립트 상태 확인 중 오류가 발생했습니다'
        }, { status: 500 });
    }
}
