import React from 'react';
import { Zap, Minus, Square, X } from 'lucide-react';
import { useLauncher } from '../store/launcher';

const BTN = ({ icon, onClick, danger }) => (
  <button className="no-drag" onClick={onClick} style={{
    width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 7, color: 'var(--text2)', transition: 'all 0.15s',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.18)' : 'rgba(124,92,252,0.15)'; e.currentTarget.style.color = danger ? '#ef4444' : '#fff'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}>
    {icon}
  </button>
);

export default function TitleBar() {
  const gameRunning = useLauncher(s => s.gameRunning);
  return (
    <div className="drag" style={{
      height: 42, background: 'rgba(11,11,24,0.98)', borderBottom: '1px solid var(--border2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', flexShrink: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={15} color="var(--accent)" fill="var(--accent)" />
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', color: 'var(--accent-light)' }}>
          UMBRATHEL CLIENT
        </span>
        {gameRunning && (
          <span className="badge badge-green" style={{ marginLeft: 8, fontSize: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            En juego
          </span>
        )}
      </div>
      <div className="no-drag" style={{ display: 'flex', gap: 2 }}>
        <BTN icon={<Minus size={11} />} onClick={() => window.aurora?.minimize()} />
        <BTN icon={<Square size={10} />} onClick={() => window.aurora?.maximize()} />
        <BTN icon={<X size={12} />} onClick={() => window.aurora?.close()} danger />
      </div>
    </div>
  );
}
