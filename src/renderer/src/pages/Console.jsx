import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Download } from 'lucide-react';
import { useLauncher } from '../store/launcher';

function lineStyle(line) {
  if (/\[ERROR\]|exception|fatal|crash/i.test(line)) return '#f87171';
  if (/\[WARN\]/i.test(line))  return '#fbbf24';
  if (/✓|INFO\].*started|done/i.test(line)) return '#86efac';
  if (/▶|iniciando|loading/i.test(line))    return '#a78bfa';
  return 'var(--text2)';
}

export default function Console() {
  const { logs, clearLogs, gameRunning, launching } = useLauncher();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function copy() { navigator.clipboard.writeText(logs.join('\n')); }

  function exportLog() {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `aurora-log-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal size={17} color="var(--accent)" />
          <h2 style={{ fontWeight: 700, fontSize: 17 }}>Consola</h2>
          {(gameRunning || launching) && (
            <span className="badge badge-green">
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              En vivo
            </span>
          )}
          {logs.length > 0 && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{logs.length} líneas</span>}
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }} onClick={copy} disabled={!logs.length}><Copy size={13} /> Copiar</button>
          <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }} onClick={exportLog} disabled={!logs.length}><Download size={13} /> Exportar</button>
          <button className="btn btn-danger" style={{ padding: '7px 12px', fontSize: 12 }} onClick={clearLogs} disabled={!logs.length}><Trash2 size={13} /> Limpiar</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', background: '#070714', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, lineHeight: 1.75 }}>
        {logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text2)', gap: 12 }}>
            <Terminal size={32} opacity={0.25} />
            <p style={{ fontSize: 13 }}>{gameRunning ? 'Esperando salida del juego...' : 'Lanza una instancia para ver los registros'}</p>
          </div>
        ) : (
          logs.map((line, i) => (
            <div key={i} style={{ color: lineStyle(line), display: 'flex', gap: 12 }}>
              <span style={{ color: '#2d2b4a', userSelect: 'none', flexShrink: 0, width: 42, textAlign: 'right' }}>{i + 1}</span>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{line}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
