import { useState, useEffect } from 'react';
import { Download, RefreshCw, X, ArrowUpCircle } from 'lucide-react';

export default function UpdateBanner() {
  const [state,    setState]    = useState(null); // null | 'ask' | 'downloading' | 'ready' | 'error'
  const [info,     setInfo]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismiss] = useState(false);

  useEffect(() => {
    window.aurora?.onUpdaterAvailable((v)  => { setState('ask'); setInfo(v); });
    window.aurora?.onUpdaterProgress((p)   => { setState('downloading'); setProgress(Math.round(p.percent)); });
    window.aurora?.onUpdaterDownloaded((v) => { setState('ready'); setInfo(v); });
    window.aurora?.onUpdaterError(()       => setState('error'));
  }, []);

  if (!state || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 42, right: 12, zIndex: 9999,
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px', width: 300,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ArrowUpCircle size={16} color="var(--accent-light)" />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>
          {state === 'ask'         && `Nueva versión disponible`}
          {state === 'downloading' && `Descargando actualización...`}
          {state === 'ready'       && `Lista para instalar`}
          {state === 'error'       && `Error al actualizar`}
        </span>
        <button onClick={() => setDismiss(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
          <X size={12} />
        </button>
      </div>

      {/* Versión */}
      {info?.version && (
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
          {state === 'ask'   && `v${info.version} ya está disponible. ¿Quieres actualizar?`}
          {state === 'ready' && `v${info.version} descargada. Reinicia para aplicar.`}
        </div>
      )}

      {/* Barra de progreso */}
      {state === 'downloading' && (
        <>
          <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'right' }}>{progress}%</div>
        </>
      )}

      {/* Botones */}
      {state === 'ask' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setDismiss(true)}
            style={{ flex: 1, fontSize: 12, padding: '7px 0' }}>
            Ahora no
          </button>
          <button className="btn btn-primary" onClick={() => { setState('downloading'); window.aurora?.updaterDownload(); }}
            style={{ flex: 1, fontSize: 12, padding: '7px 0' }}>
            <Download size={12} /> Actualizar
          </button>
        </div>
      )}

      {state === 'ready' && (
        <button className="btn btn-primary" onClick={() => window.aurora?.updaterInstall()}
          style={{ fontSize: 12, padding: '8px 0', background: '#22c55e' }}>
          Reiniciar e instalar
        </button>
      )}

      {state === 'error' && (
        <div style={{ fontSize: 11, color: 'var(--danger)' }}>No se pudo descargar la actualización.</div>
      )}
    </div>
  );
}
