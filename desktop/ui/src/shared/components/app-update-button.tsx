'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

export function AppUpdateButton() {
  const { tr } = useAppLocale();
  const [isElectron, setIsElectron] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'downloading' | 'ready'>('idle');
  const [newVersion, setNewVersion] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      setIsElectron(true);
      const api = (window as any).electronAPI;

      if (api.getAppVersion) {
        api.getAppVersion().then((v: string) => setCurrentVersion(v)).catch(() => {});
      }

      if (api.onUpdateAvailable) {
        api.onUpdateAvailable((info: any) => {
          setStatus('downloading');
          if (info?.version) setNewVersion(info.version);
        });
      }

      if (api.onUpdateProgress) {
        api.onUpdateProgress((pct: number) => {
          setStatus('downloading');
          setDownloadProgress(pct);
        });
      }

      if (api.onUpdateDownloaded) {
        api.onUpdateDownloaded((info: any) => {
          setStatus('ready');
          if (info?.version) setNewVersion(info.version);
        });
      }
    }
  }, []);

  const handleCheck = async () => {
    if (!isElectron) return;
    const api = (window as any).electronAPI;
    if (!api?.checkForUpdates) return;

    setStatus('checking');
    try {
      const res = await api.checkForUpdates();
      if (res?.status === 'success' && res?.updateInfo) {
        // If an update is found, wait for download events
        setNewVersion(res.updateInfo.version || '');
      } else {
        setStatus('up-to-date');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch {
      setStatus('idle');
    }
  };

  const handleInstall = () => {
    if (!isElectron) return;
    const api = (window as any).electronAPI;
    if (api?.installUpdateNow) {
      api.installUpdateNow();
    }
  };

  if (!isElectron) return null;

  if (status === 'ready') {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 animate-pulse transition-all cursor-pointer"
        title={tr('اضغط لإعادة تشغيل البرنامج وتثبيت التحديث الجديد الآن', 'Click to restart the app and install the new update now')}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{tr(`تحديث جديد جاهز ${newVersion ? `(v${newVersion})` : ''} - اضغط للتطبيق 🚀`, `Update ready ${newVersion ? `(v${newVersion})` : ''} - Click to install 🚀`)}</span>
      </button>
    );
  }

  if (status === 'downloading') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
        <Download className="w-3.5 h-3.5 animate-bounce text-amber-600" />
        <span>
          {tr(
            `جاري تنزيل التحديث ${newVersion ? `(v${newVersion})` : ''} ${downloadProgress > 0 ? `${downloadProgress}%` : ''}...`,
            `Downloading update ${newVersion ? `(v${newVersion})` : ''} ${downloadProgress > 0 ? `${downloadProgress}%` : ''}...`
          )}
        </span>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0B7B5E]" />
        <span>{tr('جاري فحص التحديثات...', 'Checking for updates...')}</span>
      </div>
    );
  }

  if (status === 'up-to-date') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>{tr(`أحدث إصدار ${currentVersion ? `(v${currentVersion})` : ''} ✅`, `Up to date ${currentVersion ? `(v${currentVersion})` : ''} ✅`)}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheck}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#0B7B5E] border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer"
      title={tr('فحص وجود تحديثات جديدة للبرنامج من الإنترنت', 'Check online for new application updates')}
    >
      <RefreshCw className="w-3 h-3 text-[#0B7B5E]" />
      <span>{tr('فحص التحديثات', 'Check Updates')}</span>
    </button>
  );
}
