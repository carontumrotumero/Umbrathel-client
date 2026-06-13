import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Package, Terminal, Settings, Plus, LogOut, ChevronDown } from 'lucide-react';
import { useLauncher } from '../store/launcher';

const LINKS = [
  { to: '/',        icon: <LayoutGrid size={17} />, label: 'Instancias' },
  { to: '/mods',    icon: <Package size={17} />,    label: 'Mods'       },
  { to: '/consola', icon: <Terminal size={17} />,   label: 'Consola'    },
  { to: '/ajustes', icon: <Settings size={17} />,   label: 'Ajustes'    },
];

function NavBtn({ to, icon, label }) {
  return (
    <NavLink to={to} end={to==='/'} title={label}
      style={({ isActive }) => ({
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 12, textDecoration: 'none', transition: 'all 0.15s',
        background: isActive ? 'rgba(124,92,252,0.22)' : 'transparent',
        color: isActive ? '#fff' : 'var(--text2)',
        border: isActive ? '1px solid rgba(124,92,252,0.35)' : '1px solid transparent',
      })}
      onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) {
        e.currentTarget.style.background = 'rgba(124,92,252,0.1)'; e.currentTarget.style.color = 'var(--accent-light)'; }}}
      onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) {
        e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}}
    >{icon}</NavLink>
  );
}

export default function Sidebar({ onNewInstance }) {
  const { accounts, activeAccountId, setActiveAccount, removeAccount } = useLauncher();
  const activeAcc = accounts.find(a => a.id === activeAccountId);
  const navigate  = useNavigate();

  return (
    <nav style={{
      width: 66, background: 'rgba(11,11,24,0.98)', borderRight: '1px solid var(--border2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 0 12px', gap: 4, flexShrink: 0,
    }}>
      {/* Nueva instancia */}
      <button title="Nueva instancia" onClick={onNewInstance} style={{
        width: 44, height: 44, border: '1px dashed var(--border)', borderRadius: 12,
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)', transition: 'all 0.15s', marginBottom: 4,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent-light)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)'; }}>
        <Plus size={18} />
      </button>

      <div style={{ width: 32, height: 1, background: 'var(--border2)', margin: '2px 0 4px' }} />

      {LINKS.map(l => <NavBtn key={l.to} {...l} />)}

      <div style={{ flex: 1 }} />

      {/* Avatar cuenta activa */}
      {activeAcc ? (
        <div style={{ position: 'relative' }}>
          <button title={activeAcc.name} onClick={() => navigate('/ajustes?tab=cuentas')}
            style={{ width: 38, height: 38, borderRadius: 10, border: '2px solid var(--border)', background: 'transparent', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
            {activeAcc.avatar
              ? <img src={activeAcc.avatar} style={{ width: '100%', height: '100%' }} alt={activeAcc.name} />
              : <div style={{ width: '100%', height: '100%', background: 'rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent-light)' }}>
                  {activeAcc.name[0].toUpperCase()}
                </div>
            }
          </button>
        </div>
      ) : (
        <button title="Iniciar sesión" onClick={() => navigate('/login')} style={{
          width: 38, height: 38, borderRadius: 10, border: '1px dashed var(--border)',
          background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--text3)', fontSize: 18,
        }}>?</button>
      )}
    </nav>
  );
}
