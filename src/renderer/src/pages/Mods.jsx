import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, ExternalLink, X, Package, TrendingUp, RefreshCw } from 'lucide-react';
import { useLauncher } from '../store/launcher';

const CATS = ['Rendimiento','Utilidades','Gráficos','Aventura','Magia','Tecnología','Decoración'];
const CAT_COLORS = { Rendimiento:'#f59e0b', Utilidades:'#a78bfa', Gráficos:'#06b6d4', Aventura:'#22c55e', Magia:'#ec4899', Tecnología:'#3b82f6', Decoración:'#f97316' };

// Pack local Avedore
const AVEDORE_MODS = [
  { name:'MineColonies',       desc:'Sistema completo de colonias NPC',       cat:'Aventura',     icon:'🏰' },
  { name:'Ice and Fire',       desc:'Dragones, sirenas y bestias mitológicas', cat:'Aventura',     icon:'🐉' },
  { name:'Epic Knights',       desc:'Armaduras y espadas medievales épicas',   cat:'Aventura',     icon:'⚔️' },
  { name:'Spartan Weaponry',   desc:'Arsenal completo de armas medievales',    cat:'Aventura',     icon:'🏹' },
  { name:'Small Ships',        desc:'Barcos navegables de varios tamaños',     cat:'Aventura',     icon:'⛵' },
  { name:"Xaero's Minimap",    desc:'Minimapa con waypoints y radar',          cat:'Utilidades',   icon:'🗺️' },
  { name:"Xaero's World Map",  desc:'Mapa del mundo completo explorable',      cat:'Utilidades',   icon:'🌍' },
  { name:'JEI',                desc:'Recetas y usos de items en el juego',     cat:'Utilidades',   icon:'📖' },
  { name:'Litematica',         desc:'Esquemas de construcción y placeholders', cat:'Utilidades',   icon:'📐' },
  { name:'Fantasy Furniture',  desc:'Muebles y decoración de estilo fantástico',cat:'Decoración',  icon:'🛋️' },
  { name:'BlockySiege',        desc:'Mecánicas de asedio: catapultas y muros', cat:'Aventura',     icon:'🏯' },
  { name:'TAC',                desc:'Armas de fuego y equipamiento moderno',   cat:'Aventura',     icon:'🔫' },
  { name:'GeckoLib',           desc:'Librería de animaciones avanzadas',       cat:'Utilidades',   icon:'🦎' },
  { name:'Cloth Config',       desc:'Sistema de configuración para mods',      cat:'Utilidades',   icon:'⚙️' },
  { name:'Architectury',       desc:'API multi-plataforma Fabric/Forge',       cat:'Utilidades',   icon:'🏗️' },
  { name:'Forgematica',        desc:'Puerto de Litematica para Forge',         cat:'Utilidades',   icon:'📏' },
].concat(Array.from({length: 8}, (_, i) => ({ name: `Librería ${i+1}`, desc: 'Dependencia del pack Avedore', cat: 'Utilidades', icon: '📦' })));

function ModdrinthCard({ mod, onInstall }) {
  const [state, setState] = useState('idle'); // idle | installing | done | error | exists
  const [msg,   setMsg]   = useState('');

  async function handleInstall() {
    setState('installing');
    setMsg('');
    const r = await onInstall(mod);
    if (r?.alreadyInstalled) { setState('exists'); setMsg('Ya instalado'); }
    else if (r?.success)     { setState('done');   setMsg(r.filename); }
    else                     { setState('error');  setMsg(r?.error || 'Error desconocido'); }
  }

  const btnColor = state === 'done' ? 'var(--success)' : state === 'error' ? 'var(--danger)' : state === 'exists' ? '#f59e0b' : 'var(--accent)';
  const btnLabel = state === 'installing' ? 'Descargando…' : state === 'done' ? '✓ Instalado' : state === 'exists' ? 'Ya instalado' : state === 'error' ? 'Error' : 'Instalar';

  return (
    <div className="card" style={{ borderRadius: 14, padding: 16, transition: 'all 0.15s',
      display: 'flex', flexDirection: 'column', gap: 10 }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(124,92,252,0.28)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {mod.icon_url
          ? <img src={mod.icon_url} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt="" />
          : <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124,92,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={20} color="var(--accent-light)" />
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{mod.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {mod.categories?.slice(0,2).map(c => (
              <span key={c} className="badge badge-purple" style={{ fontSize: 10 }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {mod.description}
      </p>
      {msg && (
        <div style={{ fontSize: 10, color: state === 'error' ? 'var(--danger)' : state === 'done' ? 'var(--success)' : '#f59e0b',
          background: state === 'error' ? 'rgba(239,68,68,0.08)' : state === 'done' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
          borderRadius: 6, padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {msg}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          ⬇ {mod.downloads?.toLocaleString() ?? '?'} descargas
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <a href={`https://modrinth.com/mod/${mod.slug}`} target="_blank" rel="noreferrer"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', padding: '6px 8px', borderRadius: 7, display: 'flex', alignItems: 'center' }}>
            <ExternalLink size={13} />
          </a>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: btnColor, opacity: state === 'installing' ? 0.7 : 1 }}
            onClick={state === 'idle' || state === 'error' ? handleInstall : undefined}
            disabled={state === 'installing' || state === 'done' || state === 'exists'}>
            <Download size={12} /> {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Mods() {
  const { instances, settings } = useLauncher();
  const [tab,      setTab]      = useState('avedore');
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(0);
  const [selInst,  setSelInst]  = useState(instances[0]?.id || '');
  const LIMIT = 18;

  const search = useCallback(async (q, p = 0) => {
    setLoading(true);
    const inst = instances.find(i => i.id === selInst);
    const r = await window.aurora?.modrinthSearch({
      query: q, loader: inst?.loader, version: inst?.version,
      limit: LIMIT, offset: p * LIMIT,
    });
    if (r?.success) {
      setResults(p === 0 ? r.hits : prev => [...prev, ...r.hits]);
      setTotal(r.total);
    }
    setLoading(false);
  }, [selInst, instances]);

  useEffect(() => {
    if (tab === 'modrinth') { setResults([]); setPage(0); search(query, 0); }
  }, [tab, selInst]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(0);
    search(query, 0);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    search(query, next);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Package size={18} color="var(--accent)" /> Mods
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['avedore','⚔️ Pack Avedore'],['modrinth','🌿 Modrinth']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '8px 18px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: tab === v ? 'var(--card)' : 'transparent',
              color: tab === v ? 'var(--text)' : 'var(--text2)',
              borderRadius: '8px 8px 0 0',
              borderBottom: tab === v ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: 22 }}>
        {tab === 'avedore' ? (
          <>
            {/* Header Avedore */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
              border: '1px solid rgba(245,158,11,0.28)', borderRadius: 14, padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>⚔️</span>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Pack Avedore SMP</h3>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                  24 mods preinstalados para Minecraft 1.16.5 Forge · play.avedore.eu:25574
                </p>
              </div>
              <span className="badge badge-yellow" style={{ marginLeft: 'auto', fontSize: 11 }}>
                {AVEDORE_MODS.length} mods
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {AVEDORE_MODS.map(mod => (
                <div key={mod.name} className="card" style={{ borderRadius: 12, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{mod.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{mod.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.desc}</div>
                  </div>
                  <span className="badge" style={{ fontSize: 10, background: `${CAT_COLORS[mod.cat]||'var(--accent)'}18`, color: CAT_COLORS[mod.cat]||'var(--accent-light)', flexShrink: 0 }}>
                    {mod.cat}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Selector instancia + búsqueda */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <select value={selInst} onChange={e => setSelInst(e.target.value)} style={{ width: 200, flexShrink: 0 }}>
                {instances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', pointerEvents: 'none' }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar mods en Modrinth..." style={{ paddingLeft: 34 }} />
                </div>
                <button className="btn btn-primary" type="submit" style={{ padding: '9px 16px' }}>
                  <Search size={14} /> Buscar
                </button>
              </form>
            </div>

            {loading && results.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'var(--text2)' }}>
                <RefreshCw size={16} className="spin" /> Buscando en Modrinth...
              </div>
            )}

            {results.length > 0 && (
              <>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
                  {total.toLocaleString()} resultados · mostrando {results.length}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {results.map(mod => (
                    <ModdrinthCard key={mod.project_id} mod={mod} onInstall={async (m) => {
                      const inst = instances.find(i => i.id === selInst);
                      return window.aurora?.modrinthInstall({
                        projectId: m.project_id,
                        instanceId: selInst,
                        loader: inst?.loader || 'forge',
                        version: inst?.version || '1.16.5',
                      });
                    }} />
                  ))}
                </div>
                {results.length < total && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button className="btn btn-ghost" onClick={loadMore} disabled={loading} style={{ padding: '10px 24px' }}>
                      {loading ? <><RefreshCw size={13} className="spin" /> Cargando...</> : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && results.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--text2)', gap: 10 }}>
                <TrendingUp size={36} opacity={0.3} />
                <p style={{ fontWeight: 600 }}>Busca mods de Modrinth</p>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>Filtrado automáticamente por versión y cargador de la instancia</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
