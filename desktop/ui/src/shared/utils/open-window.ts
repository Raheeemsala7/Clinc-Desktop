/**
 * فتح صفحة داخلية في نافذة مستقلة (Electron Window في التطبيق أو نافذة جديدة في المتصفح)
 */
export function openInNewWindow(urlOrPath: string) {
  if (typeof window === 'undefined') return;
  const electronApi = (window as any).electronAPI;
  if (electronApi && typeof electronApi.openNewWindow === 'function') {
    electronApi.openNewWindow(urlOrPath).catch(() => {
      window.open(urlOrPath, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    });
    return;
  }
  window.open(urlOrPath, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
}
