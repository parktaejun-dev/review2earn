// src/app/components/ScriptManager.tsx (완전 수정)
'use client';

import { useState, useEffect } from 'react';

interface ScriptStatus {
  success: boolean;
  installed: boolean;
  script?: {
    script_no: number;
    src: string;
    display_location?: string[];
  };
  totalScripts?: number;
  needsInstall?: boolean;
  error?: string;
  needsAuth?: boolean;
  mallId?: string;
}

interface ScriptManagerProps {
  mallId: string;
  autoCheck?: boolean;
}

export default function ScriptManager({ 
  mallId, 
  autoCheck = true 
}: ScriptManagerProps) {
  const [status, setStatus] = useState<ScriptStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoCheck && mallId) {
      checkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mallId, autoCheck]);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/scripttags/status?mall_id=${mallId}`);
      const data = await res.json();
      
      setStatus(data);
      
      if (!data.success && data.error) {
        setError(data.error);
      }
    } catch (err) {
      const message = '상태 확인 중 오류가 발생했습니다.';
      setError(message);
      console.error('❌ Status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const install = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/scripttags/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message || '✅ 설치 완료!');
        await checkStatus();
      } else {
        const errorMsg = data.error || '설치 실패';
        setError(errorMsg);
        alert(`❌ 설치 실패: ${errorMsg}`);
      }
    } catch (err) {
      const message = '설치 중 오류가 발생했습니다.';
      setError(message);
      alert(`❌ ${message}`);
      console.error('❌ Install error:', err);
    } finally {
      setLoading(false);
    }
  };

  const uninstall = async () => {
    const confirmMessage = `정말 삭제하시겠습니까?

Review2Earn 스크립트가 제거되며, 리뷰 작성 페이지에서 체크박스가 사라집니다.`;

    if (!confirm(confirmMessage)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/scripttags/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message || '✅ 삭제 완료!');
        await checkStatus();
      } else {
        const errorMsg = data.error || '삭제 실패';
        setError(errorMsg);
        alert(`❌ 삭제 실패: ${errorMsg}`);
      }
    } catch (err) {
      const message = '삭제 중 오류가 발생했습니다.';
      setError(message);
      alert(`❌ ${message}`);
      console.error('❌ Uninstall error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔧 스크립트 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review2Earn 스크립트를 자동으로 설치/관리합니다
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          Mall ID: {mallId}
        </div>
      </div>
      
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 border-2 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-blue-700 font-medium">처리 중...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-xl">❌</span>
              <div>
                <p className="text-red-800 font-semibold">오류 발생</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status && !loading && (
          <div className={`p-5 rounded-lg border-l-4 ${
            status.installed 
              ? 'bg-green-50 border-green-500' 
              : status.needsAuth
              ? 'bg-orange-50 border-orange-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">
                {status.installed ? '✅' : status.needsAuth ? '🔒' : '⚠️'}
              </span>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-bold text-lg">
                    {status.installed 
                      ? '스크립트 설치됨' 
                      : status.needsAuth
                      ? 'OAuth 인증 필요'
                      : '스크립트 미설치'}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    status.installed 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {status.installed ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {status.installed && status.script && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Script No:</span>
                      <span className="font-mono text-gray-800">{status.script.script_no}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">URL:</span>
                      <span className="font-mono text-gray-800 text-xs break-all">
                        {status.script.src}
                      </span>
                    </div>
                  </div>
                )}
                
                {status.needsAuth && (
                  <p className="mt-2 text-sm text-orange-700">
                    ℹ️ 먼저 카페24 OAuth 인증을 완료해주세요.
                  </p>
                )}
                
                {!status.installed && !status.needsAuth && (
                  <p className="mt-2 text-sm text-yellow-700">
                    💡 아래 &quot;설치&quot; 버튼을 클릭하여 스크립트를 자동으로 설치하세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md"
          >
            <span>📊</span>
            <span>{loading ? '확인 중...' : '상태 확인'}</span>
          </button>

          <button
            onClick={install}
            disabled={loading || status?.installed}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md"
          >
            <span>⚡</span>
            <span>{loading ? '설치 중...' : '설치'}</span>
          </button>

          <button
            onClick={uninstall}
            disabled={loading || !status?.installed}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md"
          >
            <span>🗑️</span>
            <span>{loading ? '삭제 중...' : '삭제'}</span>
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-2">📚 사용 방법</p>
          <ul className="text-xs text-gray-600 space-y-1 ml-4">
            <li>• <strong>상태 확인:</strong> 현재 스크립트 설치 상태를 조회합니다</li>
            <li>• <strong>설치:</strong> 리뷰 작성 페이지에 Review2Earn 체크박스를 자동으로 추가합니다</li>
            <li>• <strong>삭제:</strong> 설치된 스크립트를 제거합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
