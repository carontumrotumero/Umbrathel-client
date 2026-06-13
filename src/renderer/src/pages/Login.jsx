import React, { useState } from 'react';
import { Zap, LogIn, User, Plus } from 'lucide-react';
import { useLauncher } from '../store/launcher';

export default function Login({ onDone }) {
  const { addAccount, accounts, activeAccountId, setActiveAccount } = useLauncher();
  const [tab,      setTab]      = useState('microsoft');
  const [username, setUsername] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleMicrosoft() {
    setLoading(true); setError('');
    const r = await window.aurora?.login();
    if (r?.success) { addAccount(r.profile); onDone?.(); }
    else setError(r?.error || 'Error al conectar con Microsoft.');
    setLoading(false);
  }

  function handleOffline() {
    const name = username.trim();
    if (name.length < 3) { setError('Mínimo 3 caracteres.'); return; }
    const profile = { id: 'offline_' + name, name, offline: true, avatar: null };
    addAccount(profile);
    onDone?.();
  }

  const hasAccounts = accounts.length > 0;

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 25%, rgba(124,92,252,0.12) 0%, transparent 65%), var(--bg)' }}>

      <div className="glass slide-up" style={{ width: 420, borderRadius: 22, padding: 38, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 30 }}>
          <div className="pulse" style={{ width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(124,92,252,0.25), rgba(91,63,212,0.15))',
            border: '1px solid rgba(124,92,252,0.35)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px' }}>
            <Zap size={26} color="var(--accent-light)" fill="var(--accent-light)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5 }}>Umbrathel Client</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Tu cliente de Minecraft en español</p>
        </div>

        {/* Cuentas existentes */}
        {hasAccounts && (
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>CUENTAS GUARDADAS</p>
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => { setActiveAccount(acc.id); onDone?.(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 10, border: activeAccountId === acc.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: activeAccountId === acc.id ? 'rgba(124,92,252,0.12)' : 'var(--bg)',
                  cursor: 'pointer', marginBottom: 6, transition: 'all 0.15s' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,252,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {acc.avatar ? <img src={acc.avatar} style={{ width: '100%', height: '100%' }} alt="" />
                    : <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{acc.name[0].toUpperCase()}</span>}
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{acc.offline ? 'Sin cuenta' : 'Microsoft'}</div>
                </div>
                {activeAccountId === acc.id && <span className="badge badge-green" style={{ fontSize: 10 }}>Activa</span>}
              </button>
            ))}
            <div style={{ textAlign: 'center', margin: '12px 0 4px' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>— o añade otra cuenta —</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
          {[['microsoft','🔑 Microsoft'],['offline','👤 Sin cuenta']].map(([v, l]) => (
            <button key={v} onClick={() => { setTab(v); setError(''); }} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: tab === v ? 'rgba(124,92,252,0.22)' : 'transparent',
              color: tab === v ? 'var(--accent-light)' : 'var(--text2)', transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>

        {tab === 'microsoft' ? (
          <div>
            <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 18, lineHeight: 1.6 }}>
              Inicia sesión con Microsoft para acceder al multijugador oficial y ver tu skin.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: 14 }}
              onClick={handleMicrosoft} disabled={loading}>
              <LogIn size={16} />
              {loading ? 'Conectando con Microsoft...' : 'Iniciar sesión con Microsoft'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
              Solo para servidores en modo offline. No tendrás acceso al multijugador oficial.
            </p>
            <div style={{ marginBottom: 14 }}>
              <label>Nombre de jugador</label>
              <input placeholder="AuroraPlayer" value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOffline()}
                maxLength={16} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: 14 }}
              onClick={handleOffline}>
              <User size={16} /> Entrar sin cuenta
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 9,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--danger)', fontSize: 12 }}>{error}</div>
        )}

        <p style={{ marginTop: 22, fontSize: 11, color: 'var(--text3)' }}>
          Umbrathel Client · Proyecto open source · No oficial de Mojang/Microsoft
        </p>
      </div>
    </div>
  );
}
