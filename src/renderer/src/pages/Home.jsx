import React, { useEffect, useRef, useState } from 'react';
import { Search, Play, AlertCircle, X, Terminal } from 'lucide-react';
import { useLauncher } from '../store/launcher';
import InstanceCard from '../components/InstanceCard';

const STEP_INFO = {
  idle:      { label: 'Jugar',              color: 'var(--accent)' },
  forge:     { label: 'Instalando Forge…',  color: '#f59e0b' },
  mods:      { label: 'Preparando mods…',   color: '#a78bfa' },
  launching: { label: 'Iniciando…',         color: 'var(--accent)' },
  running:   { label: 'En ejecución ✓',     color: 'var(--success)' },
};

// ── Modal de lanzamiento ──────────────────────────────────────────────────────
function LaunchModal({ instance, onClose, onLaunch, accounts, activeAccountId, settings, onModsInstalled }) {
  const [step,     setStep]    = useState('idle');
  const [logs,     setLogs]    = useState([]);
  const [error,    setError]   = useState('');
  const [progress, setProg]    = useState(null);
  const logRef = useRef(null);
  const account = accounts.find(a => a.id === activeAccountId);

  const addLog = (line) => setLogs(prev => [...prev.slice(-300), String(line)]);

  useEffect(() => {
    window.aurora?.removeListeners();
    window.aurora?.onProgress(setProg);
    window.aurora?.onLog(addLog);
    window.aurora?.onClose(code => {
      setStep('idle');
      onClose(true, code);
    });
    return () => window.aurora?.removeListeners();
  }, []);

  // Auto-scroll al final del log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  async function run() {
    setError(''); setLogs([]);

    // 1. Instalar Forge si es necesario
    if (instance.loader === 'forge') {
      const installed = await window.aurora?.forgeIsInstalled({ mcVersion: instance.version, instanceId: instance.id });
      if (!installed) {
        setStep('forge');
        addLog('▶ Instalando Forge ' + instance.version + '…');
        const r = await window.aurora?.forgeInstall({ mcVersion: instance.version, javaPath: settings.javaPath, instanceId: instance.id });
        if (!r?.success) { setError(r?.error || 'Error instalando Forge'); setStep('idle'); return; }
        addLog('✓ Forge instalado correctamente');
      } else {
        addLog('✓ Forge ya instalado');
      }
    }

    // 2. Copiar mods (siempre verificar — es instantáneo si ya existen)
    if (instance.id === 'avedore-smp') {
      setStep('mods');
      addLog('▶ Verificando mods del pack Avedore…');
      const r = await window.aurora?.installAvedore(instance.id);
      if (!r?.success) { setError(r?.error || 'Error preparando mods'); setStep('idle'); return; }
      addLog(`✓ ${r.total} mods listos (${r.nuevos} nuevos)`);
      if (r.nuevos > 0 || !instance.modsInstalled) onModsInstalled(instance.id);
    }

    // 3. Lanzar
    setStep('launching');
    addLog('▶ Iniciando Minecraft ' + instance.version + ' [' + (instance.loader || 'vanilla') + ']');
    if (instance.server) addLog('🌐 Conectando a ' + instance.server.host + ':' + instance.server.port);

    const launchCfg = {
      instanceId: instance.id,
      version:    instance.version,
      loader:     instance.loader,
      maxRam:     settings.maxRam,
      minRam:     settings.minRam,
      javaPath:   settings.javaPath || undefined,
      jvmArgs:    settings.jvmArgs || '',
      offline:    account?.offline ?? true,
      username:   account?.name || 'UmbrathelPlayer',
      uuid:       account?.id,
      accessToken: account?.accessToken,
      mclcAuth:   account?.mclcAuth ?? null,
      server:     instance.server ?? null,
    };

    const r = await window.aurora?.launch(launchCfg);
    if (!r?.success) {
      setError(r?.error || 'Error al lanzar. Revisa los logs abajo.');
      setStep('idle');
    } else {
      onLaunch(instance.id);
      setStep('running');
    }
  }

  const stepMeta = STEP_INFO[step] || STEP_INFO.idle;
  const busy = step !== 'idle' && step !== 'running';

  return (
    <div className="modal-overlay fade-in" onClick={() => step === 'idle' && onClose(false)}>
      <div className="modal slide-up" style={{ minWidth: 500, maxWidth: 560 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ fontSize: 34 }}>{instance.icon || '🎮'}</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: 17 }}>{instance.name}</h2>
            <p style={{ fontSize: 11, color: 'var(--text2)' }}>
              {instance.version} · {instance.loader}
              {instance.server && <span style={{ color: 'var(--cyan)' }}> · {instance.server.host}:{instance.server.port}</span>}
            </p>
          </div>
          <button onClick={() => !busy && onClose(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text2)', cursor: busy ? 'not-allowed' : 'pointer', borderRadius: 7, padding: 6, opacity: busy ? 0.4 : 1 }}>
            <X size={16} />
          </button>
        </div>

        {/* Cuenta + RAM en una fila */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div className="card" style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {account?.avatar
              ? <img src={account.avatar} style={{ width: 28, height: 28, borderRadius: 7 }} alt="" />
              : <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-light)', fontSize: 13 }}>
                  {(account?.name || 'U')[0].toUpperCase()}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account?.name || 'Sin cuenta'}</div>
              <div style={{ fontSize: 10, color: 'var(--text2)' }}>{account?.offline ? 'Sin cuenta' : 'Microsoft'}</div>
            </div>
            {account?.offline && <span className="badge badge-yellow" style={{ fontSize: 9 }}>Offline</span>}
          </div>
          <div className="card" style={{ padding: '10px 16px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 2 }}>RAM</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{settings.maxRam} MB</div>
          </div>
        </div>

        {/* Progress bar */}
        {progress && step !== 'running' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginBottom: 4 }}>
              <span>{progress.task}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress.total ? Math.round(progress.current / progress.total * 100) : 0}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Log en tiempo real — siempre visible cuando hay contenido */}
        {logs.length > 0 && (
          <div ref={logRef} style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: 9, padding: '10px 12px', marginBottom: 12,
            fontFamily: 'monospace', fontSize: 10.5, color: '#c9d1d9', lineHeight: 1.6,
            maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)',
          }}>
            {logs.map((l, i) => (
              <div key={i} style={{
                color: l.startsWith('✓') ? 'var(--success)' : l.startsWith('▶') ? 'var(--accent-light)' : l.startsWith('[ERROR]') ? 'var(--danger)' : '#c9d1d9',
              }}>{l}</div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', marginBottom: 12 }}>
            <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step === 'idle' && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onClose(false)}>Cancelar</button>
          )}
          <button className="btn btn-primary" style={{ flex: 2, padding: '12px', background: stepMeta.color, opacity: busy ? 0.85 : 1 }}
            onClick={step === 'idle' ? run : undefined}
            disabled={busy}>
            <Play size={15} fill="currentColor" />
            {stepMeta.label}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function Home({ showCreate }) {
  const {
    instances, setInstances, addInstance, updateInstance, deleteInstance,
    accounts, activeAccountId, settings,
    activeInstanceId, setActiveInstance,
    gameRunning, setGameRunning,
    addLog, clearLogs,
  } = useLauncher();

  const [search,     setSearch]     = useState('');
  const [launching,  setLaunching]  = useState(null); // instance siendo lanzada
  const [versions,   setVersions]   = useState([]);

  // Cargar instancias desde disco y versiones
  useEffect(() => {
    window.aurora?.instancesList().then(list => {
      if (list?.length) setInstances(list);
    });
    window.aurora?.versions().then(v => setVersions(v || []));
  }, []);

  const filtered = instances.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  function handlePlay(instance) {
    clearLogs();
    setLaunching(instance);
  }

  function handleLaunchSuccess(instanceId) {
    setActiveInstance(instanceId);
    setGameRunning(true);
  }

  function handleModsInstalled(instanceId) {
    updateInstance(instanceId, { modsInstalled: true });
  }

  function handleModalClose(wasRunning, exitCode) {
    if (!wasRunning) {
      setLaunching(null);
    } else {
      setLaunching(null);
      setActiveInstance(null);
      setGameRunning(false);
      addLog(`— Juego cerrado (código ${exitCode}) —`);
    }
  }

  function handleDelete(id) {
    if (id === 'avedore-smp') return;
    if (confirm('¿Eliminar esta instancia? Se borrarán todos sus archivos.')) {
      deleteInstance(id);
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barra búsqueda */}
      <div style={{ padding: '18px 24px 0', flexShrink: 0 }}>
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar instancias..." style={{ paddingLeft: 36 }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', padding: 2 }}><X size={13} /></button>}
        </div>
      </div>

      {/* Grid de instancias */}
      <div className="scroll" style={{ flex: 1, padding: '16px 24px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text2)', gap: 12 }}>
            <span style={{ fontSize: 48 }}>🎮</span>
            <p style={{ fontSize: 15, fontWeight: 600 }}>
              {search ? 'Sin resultados' : 'Crea tu primera instancia'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>
              {search ? 'Prueba con otro nombre' : 'Pulsa el botón + en la barra lateral'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {filtered.map(instance => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onPlay={handlePlay}
                onDelete={handleDelete}
                onOpenFolder={id => window.aurora?.instancesOpenFolder(id)}
                isRunning={activeInstanceId === instance.id && gameRunning}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de lanzamiento */}
      {launching && (
        <LaunchModal
          instance={launching}
          accounts={accounts}
          activeAccountId={activeAccountId}
          settings={settings}
          onClose={handleModalClose}
          onLaunch={handleLaunchSuccess}
          onModsInstalled={handleModsInstalled}
        />
      )}
    </div>
  );
}
