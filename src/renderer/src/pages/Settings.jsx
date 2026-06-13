import React, { useEffect, useState } from 'react';
import { Settings as Ico, Save, FolderOpen, RefreshCw, CheckCircle, XCircle, Plus, Trash2, LogIn, User, Image } from 'lucide-react';
import { useLauncher } from '../store/launcher';
import { useSearchParams } from 'react-router-dom';

function Section({ title, emoji, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 7 }}>
        {emoji} {title}
      </h3>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
function Row({ label, hint, children }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500 }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{hint}</p>}
      </div>
      <div style={{ flex: 1, maxWidth: 340 }}>{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, background, updateBackground, accounts, activeAccountId, addAccount, removeAccount, setActiveAccount } = useLauncher();
  const [params] = useSearchParams();
  const [activeTab, setActiveTab]   = useState(params.get('tab') || 'general');
  const [saved,     setSaved]       = useState(false);
  const [sysInfo,   setSysInfo]     = useState(null);
  const [javas,     setJavas]       = useState([]);
  const [javaTest,  setJavaTest]    = useState(null); // { ok, version, error }
  const [testing,   setTesting]     = useState(false);
  const [detecting, setDetecting]   = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError,   setLoginError]   = useState('');
  const [offName,  setOffName]      = useState('');

  useEffect(() => {
    window.aurora?.sysInfo().then(setSysInfo);
  }, []);

  const maxAllowed = sysInfo ? Math.floor(sysInfo.totalRam * 0.8) : 8192;

  async function detectJava() {
    setDetecting(true);
    const found = await window.aurora?.javaDetect();
    setJavas(found || []);
    setDetecting(false);
  }

  async function testJava(p) {
    setTesting(true);
    const r = await window.aurora?.javaTest(p || settings.javaPath || 'java');
    setJavaTest(r);
    setTesting(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addMicrosoft() {
    setLoginLoading(true); setLoginError('');
    const r = await window.aurora?.login();
    if (r?.success) addAccount(r.profile);
    else setLoginError(r?.error || 'Error al iniciar sesión');
    setLoginLoading(false);
  }

  function addOffline() {
    if (offName.trim().length < 3) return;
    addAccount({ id: 'offline_' + offName.trim(), name: offName.trim(), offline: true, avatar: null });
    setOffName('');
  }

  const TABS = [
    { id: 'general',  label: '⚙️ General'   },
    { id: 'java',     label: '☕ Java'       },
    { id: 'cuentas',  label: '👤 Cuentas'   },
    { id: 'apariencia', label: '🎨 Apariencia' },
    { id: 'advanced', label: '🔧 Avanzado'  },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header + Tabs */}
      <div style={{ padding: '20px 28px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ico size={18} color="var(--accent)" /> Ajustes
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: activeTab === t.id ? 'var(--card)' : 'transparent',
              color: activeTab === t.id ? 'var(--text)' : 'var(--text2)',
              borderRadius: '8px 8px 0 0',
              borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '24px 28px 32px', maxWidth: 660 }}>

        {/* ── General ── */}
        {activeTab === 'general' && (
          <>
            <Section title="Memoria RAM" emoji="🧠">
              <Row label={`RAM máxima: ${settings.maxRam} MB`} hint={sysInfo ? `Máx. recomendado: ${maxAllowed} MB (80% del total)` : ''}>
                <input type="range" min={512} max={maxAllowed} step={256} value={settings.maxRam}
                  onChange={e => updateSettings({ maxRam: Number(e.target.value) })}
                  style={{ accentColor: 'var(--accent)', background: 'transparent', border: 'none', padding: 0 }} />
              </Row>
              <Row label={`RAM mínima: ${settings.minRam} MB`}>
                <input type="range" min={256} max={settings.maxRam} step={128} value={settings.minRam}
                  onChange={e => updateSettings({ minRam: Number(e.target.value) })}
                  style={{ accentColor: 'var(--accent)', background: 'transparent', border: 'none', padding: 0 }} />
              </Row>
            </Section>

            <Section title="Pantalla" emoji="🖥️">
              <Row label="Pantalla completa">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.fullscreen}
                    onChange={e => updateSettings({ fullscreen: e.target.checked })}
                    style={{ width: 'auto', accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{settings.fullscreen ? 'Activado' : 'Desactivado'}</span>
                </label>
              </Row>
              {!settings.fullscreen && (
                <Row label="Resolución">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" value={settings.resolution.width} style={{ width: 90 }}
                      onChange={e => updateSettings({ resolution: { ...settings.resolution, width: Number(e.target.value) } })} />
                    <span style={{ color: 'var(--text2)', flexShrink: 0 }}>×</span>
                    <input type="number" value={settings.resolution.height} style={{ width: 90 }}
                      onChange={e => updateSettings({ resolution: { ...settings.resolution, height: Number(e.target.value) } })} />
                  </div>
                </Row>
              )}
            </Section>

            <Section title="Comportamiento" emoji="🎮">
              <Row label="Cerrar launcher al jugar">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.closeOnLaunch}
                    onChange={e => updateSettings({ closeOnLaunch: e.target.checked })}
                    style={{ width: 'auto', accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{settings.closeOnLaunch ? 'Sí' : 'No'}</span>
                </label>
              </Row>
            </Section>

            <Section title="Archivos" emoji="📁">
              <Row label="Carpeta del launcher" hint={sysInfo?.rootDir}>
                <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}
                  onClick={() => window.aurora?.openRoot()}>
                  <FolderOpen size={13} /> Abrir
                </button>
              </Row>
            </Section>
          </>
        )}

        {/* ── Java ── */}
        {activeTab === 'java' && (
          <>
            <Section title="Instalación de Java" emoji="☕">
              <Row label="Ruta de Java" hint="Vacío = Java del sistema PATH">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={settings.javaPath} onChange={e => updateSettings({ javaPath: e.target.value })} placeholder="/usr/bin/java" />
                  <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '9px 12px' }}
                    onClick={() => testJava(settings.javaPath)} disabled={testing}>
                    {testing ? <RefreshCw size={13} className="spin" /> : 'Probar'}
                  </button>
                </div>
                {javaTest && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    {javaTest.ok
                      ? <><CheckCircle size={13} color="var(--success)" /><span style={{ color: 'var(--success)' }}>Java {javaTest.version} detectado</span></>
                      : <><XCircle size={13} color="var(--danger)" /><span style={{ color: 'var(--danger)' }}>{javaTest.error}</span></>
                    }
                  </div>
                )}
              </Row>
            </Section>

            <Section title="Detección automática" emoji="🔍">
              <div style={{ padding: '14px 18px' }}>
                <button className="btn btn-ghost" onClick={detectJava} disabled={detecting} style={{ marginBottom: 14 }}>
                  {detecting ? <><RefreshCw size={13} className="spin" /> Detectando...</> : '🔍 Detectar instalaciones de Java'}
                </button>
                {javas.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {javas.map((j, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: 'var(--bg)', borderRadius: 9, border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>{j.path}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>Java {j.version} {j.recommended && '· Recomendado'}</div>
                        </div>
                        <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}
                          onClick={() => updateSettings({ javaPath: j.path })}>
                          Usar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section title="Recomendaciones" emoji="💡">
              <div style={{ padding: '14px 18px' }}>
                {[['1.16.5', 'Java 8'],['1.17 – 1.17.1', 'Java 16'],['1.18 – 1.20', 'Java 17'],['1.21+', 'Java 21']].map(([v, j]) => (
                  <div key={v} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                    borderBottom: '1px solid var(--border2)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text2)' }}>Minecraft {v}</span>
                    <span style={{ fontWeight: 600 }}>{j}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── Cuentas ── */}
        {activeTab === 'cuentas' && (
          <>
            <Section title="Cuentas guardadas" emoji="👤">
              <div style={{ padding: '14px 18px' }}>
                {accounts.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>Sin cuentas. Añade una abajo.</p>
                )}
                {accounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    background: acc.id === activeAccountId ? 'rgba(124,92,252,0.1)' : 'var(--bg)',
                    borderRadius: 10, border: acc.id === activeAccountId ? '1px solid rgba(124,92,252,0.3)' : '1px solid var(--border)',
                    marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(124,92,252,0.2)', overflow: 'hidden', flexShrink: 0 }}>
                      {acc.avatar ? <img src={acc.avatar} style={{ width: '100%', height: '100%' }} alt="" />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-light)', fontSize: 15 }}>
                            {acc.name[0].toUpperCase()}
                          </div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{acc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{acc.offline ? 'Modo offline' : 'Microsoft'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {acc.id !== activeAccountId && (
                        <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}
                          onClick={() => setActiveAccount(acc.id)}>Activar</button>
                      )}
                      {acc.id === activeAccountId && <span className="badge badge-green" style={{ fontSize: 10 }}>Activa</span>}
                      <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => removeAccount(acc.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Añadir cuenta" emoji="➕">
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-primary" onClick={addMicrosoft} disabled={loginLoading} style={{ width: '100%', padding: '12px' }}>
                  <LogIn size={15} /> {loginLoading ? 'Conectando...' : 'Añadir cuenta Microsoft'}
                </button>
                {loginError && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{loginError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={offName} onChange={e => setOffName(e.target.value)} placeholder="Nombre offline..." maxLength={16} style={{ flex: 1 }} />
                  <button className="btn btn-ghost" onClick={addOffline} disabled={offName.trim().length < 3} style={{ flexShrink: 0 }}>
                    <User size={13} /> Sin cuenta
                  </button>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ── Apariencia ── */}
        {activeTab === 'apariencia' && (
          <>
            <Section title="Fondo del cliente" emoji="🎨">
              <Row label="Tipo de fondo">
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['gradient','Degradado'],['solid','Color sólido'],['image','Imagen PNG']].map(([v, l]) => (
                    <button key={v} onClick={() => updateBackground({ type: v })} style={{
                      padding: '7px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: background.type === v ? 'var(--accent)' : 'var(--bg)',
                      color: background.type === v ? '#fff' : 'var(--text2)',
                      transition: 'all 0.15s',
                    }}>{l}</button>
                  ))}
                </div>
              </Row>

              {background.type === 'solid' && (
                <Row label="Color de fondo">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={background.color}
                      onChange={e => updateBackground({ color: e.target.value })}
                      style={{ width: 48, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
                    <input value={background.color} onChange={e => updateBackground({ color: e.target.value })}
                      style={{ width: 120, fontFamily: 'monospace', fontSize: 13 }} maxLength={7} />
                  </div>
                </Row>
              )}

              {background.type === 'gradient' && (
                <>
                  <Row label="Color inicial">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="color" value={background.gradient.from}
                        onChange={e => updateBackground({ gradient: { from: e.target.value } })}
                        style={{ width: 48, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
                      <input value={background.gradient.from} onChange={e => updateBackground({ gradient: { from: e.target.value } })}
                        style={{ width: 120, fontFamily: 'monospace', fontSize: 13 }} maxLength={7} />
                    </div>
                  </Row>
                  <Row label="Color final">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="color" value={background.gradient.to}
                        onChange={e => updateBackground({ gradient: { to: e.target.value } })}
                        style={{ width: 48, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
                      <input value={background.gradient.to} onChange={e => updateBackground({ gradient: { to: e.target.value } })}
                        style={{ width: 120, fontFamily: 'monospace', fontSize: 13 }} maxLength={7} />
                    </div>
                  </Row>
                  <Row label="Dirección">
                    <select value={background.gradient.direction}
                      onChange={e => updateBackground({ gradient: { direction: e.target.value } })}
                      style={{ padding: '8px 12px', fontSize: 13 }}>
                      {[['135deg','↗ Diagonal'],['180deg','↓ Vertical'],['90deg','→ Horizontal'],['225deg','↙ Diagonal inverso']].map(([v,l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </Row>
                  <Row label="Vista previa">
                    <div style={{
                      height: 48, borderRadius: 10,
                      background: `linear-gradient(${background.gradient.direction}, ${background.gradient.from}, ${background.gradient.to})`,
                      border: '1px solid var(--border)',
                    }} />
                  </Row>
                </>
              )}

              {background.type === 'image' && (
                <>
                  <Row label="Imagen de fondo" hint="PNG, JPG o WEBP recomendado — al menos 1280×720">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: 12 }}
                        onClick={async () => {
                          const p = await window.aurora?.pickImage();
                          if (p) updateBackground({ imageUrl: `file://${p}` });
                        }}>
                        <Image size={13} /> Seleccionar imagen…
                      </button>
                      {background.imageUrl && (
                        <div style={{ position: 'relative' }}>
                          <img src={background.imageUrl} alt="preview"
                            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                          <button onClick={() => updateBackground({ imageUrl: '' })} style={{
                            position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)',
                            border: 'none', borderRadius: 6, color: '#fff', padding: '3px 8px', cursor: 'pointer', fontSize: 11,
                          }}>✕</button>
                        </div>
                      )}
                    </div>
                  </Row>
                </>
              )}
            </Section>
          </>
        )}

        {/* ── Avanzado ── */}
        {activeTab === 'advanced' && (
          <>
            <Section title="Argumentos JVM" emoji="⚡">
              <Row label="Argumentos adicionales" hint="Separados por espacio · Vacío = optimizaciones por defecto">
                <textarea value={settings.jvmArgs} onChange={e => updateSettings({ jvmArgs: e.target.value })}
                  placeholder="-XX:+UseG1GC -XX:MaxGCPauseMillis=50"
                  rows={3} style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
              </Row>
            </Section>
            <Section title="Información del sistema" emoji="💻">
              {sysInfo && (
                <>
                  <Row label="RAM total"><span style={{ fontWeight: 600 }}>{(sysInfo.totalRam/1024).toFixed(1)} GB</span></Row>
                  <Row label="Plataforma"><span style={{ fontWeight: 600 }}>{sysInfo.platform} · {sysInfo.arch}</span></Row>
                  <Row label="Directorio"><code style={{ fontSize: 11, color: 'var(--text2)' }}>{sysInfo.rootDir}</code></Row>
                </>
              )}
            </Section>
            <Section title="Peligroso" emoji="⚠️">
              <Row label="Restablecer ajustes">
                <button className="btn btn-danger" style={{ padding: '8px 14px', fontSize: 12 }}
                  onClick={() => { if(confirm('¿Restablecer todos los ajustes?')) { localStorage.clear(); location.reload(); } }}>
                  Restablecer todo
                </button>
              </Row>
            </Section>
          </>
        )}

        <button className="btn btn-primary" onClick={save} style={{ padding: '11px 24px' }}>
          <Save size={14} /> {saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
