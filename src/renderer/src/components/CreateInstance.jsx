import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const LOADERS = [
  { value: 'vanilla', label: '⚡ Vainilla',  desc: 'Sin mods' },
  { value: 'forge',   label: '🔨 Forge',     desc: 'Mods Forge / FML' },
  { value: 'fabric',  label: '🧵 Fabric',    desc: 'Mods Fabric modernos' },
  { value: 'quilt',   label: '🧶 Quilt',     desc: 'Fork de Fabric' },
];

const ICONOS = ['🎮','⚔️','🏰','🌍','🌊','🔥','❄️','🌿','⛏️','🏹','🛡️','🐉','🦅','💎','🏺','🧙'];

export default function CreateInstance({ onClose, onCreate, versions }) {
  const [name,    setName]    = useState('');
  const [version, setVersion] = useState('1.21.4');
  const [loader,  setLoader]  = useState('vanilla');
  const [icon,    setIcon]    = useState('🎮');
  const [filter,  setFilter]  = useState('release');
  const [creating, setCreating] = useState(false);

  const filtered = (versions || []).filter(v => {
    if (filter === 'release')  return v.type === 'release';
    if (filter === 'snapshot') return v.type === 'snapshot';
    return true;
  }).slice(0, 100);

  async function handle() {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate({ name: name.trim(), version, loader, icon });
    setCreating(false);
    onClose();
  }

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal slide-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>Nueva instancia</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', borderRadius: 7, padding: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}>
            <X size={18} />
          </button>
        </div>

        {/* Icono picker */}
        <div style={{ marginBottom: 18 }}>
          <label>Icono</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ICONOS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 38, height: 38, border: icon === ic ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 9, background: icon === ic ? 'rgba(124,92,252,0.15)' : 'var(--bg)',
                cursor: 'pointer', fontSize: 18, transition: 'all 0.15s',
              }}>{ic}</button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 14 }}>
          <label>Nombre *</label>
          <input placeholder="Mi instancia..." value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()} autoFocus maxLength={40} />
        </div>

        {/* Versión */}
        <div style={{ marginBottom: 14 }}>
          <label>Versión de Minecraft</label>
          <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
            {[['release','Estable'],['snapshot','Preview'],['todas','Todas']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                flex: 1, padding: '5px 6px', fontSize: 11, borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600,
                background: filter === v ? 'rgba(124,92,252,0.2)' : 'var(--bg)',
                color: filter === v ? 'var(--accent-light)' : 'var(--text2)',
              }}>{l}</button>
            ))}
          </div>
          <select value={version} onChange={e => setVersion(e.target.value)}>
            {filtered.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
          </select>
        </div>

        {/* Loader */}
        <div style={{ marginBottom: 22 }}>
          <label>Cargador de mods</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {LOADERS.map(l => (
              <button key={l.value} onClick={() => setLoader(l.value)} style={{
                padding: '10px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'left', border: 'none',
                background: loader === l.value ? 'rgba(124,92,252,0.18)' : 'var(--bg)',
                outline: loader === l.value ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: loader === l.value ? 'var(--accent-light)' : 'var(--text)', marginBottom: 2 }}>{l.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handle} disabled={!name.trim() || creating}>
            <Plus size={15} /> {creating ? 'Creando...' : 'Crear instancia'}
          </button>
        </div>
      </div>
    </div>
  );
}
