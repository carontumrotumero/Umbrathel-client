import { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

export default function UpdateBanner() {
  const [state, setState] = useState(null); // null | 'available' | 'downloading' | 'ready' | 'error'
  const [info,  setInfo]  = useState(null);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    window.aurora?.onUpdaterAvailable((v) => { setState('available'); setInfo(v); });
    window.aurora?.onUpdaterProgress((p) => { setState('downloading'); setProgress(Math.round(p.percent)); });
    window.aurora?.onUpdaterDownloaded((v) => { setState('ready'); setInfo(v); });
    window.aurora?.onUpdaterError(() => setState('error'));
  }, []);

  if (!state || dismissed) return null;

  const colors = {
    available:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    downloading: { bg: 'rgba(124,92,252,0.12)', border: 'rgba(124,92,252,0.3)', text: 'var(--accent-light)' },
    ready:       { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80' },
    error:       { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)', text: 'var(--danger)' },
  }[state];

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: '12px 16px', maxWidth: 320,
      display: 'flex', flexDirection: 'column', gap: 8,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {state === 'downloading'
          ? <RefreshCw size={14} color={colors.text} className="spin" />
          : <Download size={14} color={colors.text} />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: colors.text }}>
          {state === 'available'   && `Nueva versión: ${info?.version}`}
          {state === 'downloading' && `Descargando... ${progress}%`}
          {state === 'ready'       && `v${info?.version} lista para instalar`}
          {state === 'error'       && 'Error al actualizar'}
        </span>
        <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
          <X size={12} />
        </button>
      </div>

      {state === 'downloading' && (
        <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: colors.text, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      )}

      {state === 'ready' && (
        <button className="btn btn-primary" onClick={() => window.aurora?.updaterInstall()}
          style={{ fontSize: 12, padding: '6px 12px', background: '#22c55e' }}>
          Reiniciar e instalar
        </button>
      )}

      {state === 'available' && (
        <p style={{ fontSize: 11, color: 'var(--text2)', margin: 0 }}>
          Descargando en segundo plano...
        </p>
      )}
    </div>
  );
}
