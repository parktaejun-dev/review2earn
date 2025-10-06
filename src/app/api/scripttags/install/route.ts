// ScriptTags 설치 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24ScriptTags } from '@/lib/cafe24-scripttags';

export async function POST(request: NextRequest) {
    try {
        // 쿠키에서 인증 정보 추출
        const accessToken = request.cookies.get('cafe24_access_token')?.value;
        const mallId = request.cookies.get('cafe24_mall_id')?.value;

        if (!accessToken || !mallId) {
            return NextResponse.json({
                success: false,
                message: '카페24 인증이 필요합니다'
            }, { status: 401 });
        }

        // ScriptTags API 호출
        const scriptTags = new Cafe24ScriptTags();
        
        // 기존 스크립트 확인
        const existingScripts = await scriptTags.getScriptTags(mallId, accessToken);
        
        // 이미 설치된 스크립트가 있는지 확인
        const isAlreadyInstalled = existingScripts.scripttags?.some(
            (script: any) => script.src?.includes('review-button.js')
        );

        if (isAlreadyInstalled) {
            return NextResponse.json({
                success: true,
                message: '리뷰투언 스크립트가 이미 설치되어 있습니다',
                status: 'already_installed'
            });
        }

        // 새 스크립트 설치
        const result = await scriptTags.createScriptTag(mallId, accessToken);

        if (result.scripttag) {
            return NextResponse.json({
                success: true,
                message: '리뷰투언 스크립트가 성공적으로 설치되었습니다',
                status: 'newly_installed',
                scriptTag: result.scripttag
            });
        } else {
            throw new Error('스크립트 설치에 실패했습니다');
        }

    } catch (error) {
        console.error('ScriptTags API error:', error);
        
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : '스크립트 설치 중 오류가 발생했습니다'
        }, { status: 500 });
    }
}
