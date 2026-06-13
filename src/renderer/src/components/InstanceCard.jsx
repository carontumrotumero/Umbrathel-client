import React, { useState } from 'react';
import { Play, Folder, Trash2, Server, Clock, MoreVertical, Lock } from 'lucide-react';

const LOADER_COLORS = { forge: '#f59e0b', fabric: '#a78bfa', quilt: '#06b6d4', vanilla: '#22c55e' };
const LOADER_ICONS  = { forge: '🔨', fabric: '🧵', quilt: '🧶', vanilla: '⚡' };

function timeAgo(ts) {
  if (!ts) return null;
  const d = Date.now() - ts;
  if (d < 60000)  return 'Hace un momento';
  if (d < 3600000) return `Hace ${Math.floor(d/60000)}m`;
  if (d < 86400000) return `Hace ${Math.floor(d/3600000)}h`;
  return `Hace ${Math.floor(d/86400000)}d`;
}

export default function InstanceCard({ instance, onPlay, onDelete, onOpenFolder, isRunning }) {
  const [menu, setMenu] = useState(false);
  const lc = LOADER_COLORS[instance.loader] || '#a78bfa';

  return (
    <div className="card" style={{
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative',
      transition: 'all 0.18s', border: isRunning ? `1px solid ${lc}44` : '1px solid var(--border)',
      background: isRunning ? `rgba(${lc === '#f59e0b' ? '245,158,11' : '124,92,252'},0.06)` : 'var(--card)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>

      {/* Header con color */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${lc}, ${lc}88)` }} />

      <div style={{ padding: '16px 16px 14px' }}>
        {/* Icono + Nombre */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: `${lc}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0, border: `1px solid ${lc}30`,
          }}>
            {instance.icon || LOADER_ICONS[instance.loader] || '🎮'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {instance.name}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: `${lc}18`, color: lc, fontSize: 10 }}>
                {LOADER_ICONS[instance.loader]} {instance.loader}
              </span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>{instance.version}</span>
              {instance.server && <span className="badge badge-cyan" style={{ fontSize: 10 }}><Server size={9} /> Servidor</span>}
              {instance.locked && <span className="badge" style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text3)', fontSize: 10 }}><Lock size={9} /> Oficial</span>}
            </div>
          </div>
          {/* Menú */}
          <button onClick={e => { e.stopPropagation(); setMenu(!menu); }} style={{
            width: 28, height: 28, border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text3)', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}>
            <MoreVertical size={14} />
          </button>
        </div>

        {/* Descripción */}
        {instance.description && (
          <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {instance.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
            <Clock size={11} />
            {timeAgo(instance.lastPlayed) || 'Sin jugar'}
            {instance.playCount > 0 && <span>· {instance.playCount}x</span>}
          </div>
          {isRunning && (
            <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>● EN JUEGO</span>
          )}
        </div>
      </div>

      {/* Botón play */}
      <button onClick={() => onPlay(instance)} style={{
        width: '100%', padding: '11px', border: 'none',
        background: `linear-gradient(135deg, ${lc}22, ${lc}11)`,
        borderTop: `1px solid ${lc}22`,
        color: lc, cursor: 'pointer', fontWeight: 700, fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${lc}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${lc}22, ${lc}11)`; }}>
        <Play size={14} fill={lc} />
        {isRunning ? 'En ejecución' : instance.server ? 'Conectar al servidor' : 'Jugar'}
      </button>

      {/* Dropdown menú */}
      {menu && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: 44, right: 10, background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 10, padding: 6,
          zIndex: 10, minWidth: 160, boxShadow: 'var(--shadow)',
        }}>
          {[
            { icon: <Folder size={13} />, label: 'Abrir carpeta', action: () => { onOpenFolder(instance.id); setMenu(false); } },
            !instance.locked && { icon: <Trash2 size={13} />, label: 'Eliminar', action: () => { onDelete(instance.id); setMenu(false); }, danger: true },
          ].filter(Boolean).map(({ icon, label, action, danger }) => (
            <button key={label} onClick={action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', border: 'none', background: 'transparent',
              color: danger ? 'var(--danger)' : 'var(--text)', cursor: 'pointer',
              fontSize: 13, borderRadius: 7, transition: 'background 0.1s', textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {icon} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
