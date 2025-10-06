// ScriptTags 제거 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24ScriptTags } from '@/lib/cafe24-scripttags';

interface ScriptTag {
  src?: string;
  script_no?: number;
}

interface ScriptTagsResponse {
  scripttags?: ScriptTag[];
}

export async function DELETE(request: NextRequest) {
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

        if (!reviewScript || !reviewScript.script_no) {
            return NextResponse.json({
                success: true,
                message: '제거할 리뷰투언 스크립트가 없습니다',
                status: 'not_installed'
            });
        }

        await scriptTags.deleteScriptTag(mallId, accessToken, reviewScript.script_no);

        return NextResponse.json({
            success: true,
            message: '리뷰투언 스크립트가 성공적으로 제거되었습니다',
            status: 'removed'
        });

    } catch (error) {
        console.error('ScriptTags DELETE error:', error);
        
        return NextResponse.json({
            success: false,
            message: '스크립트 제거 중 오류가 발생했습니다'
        }, { status: 500 });
    }
}
