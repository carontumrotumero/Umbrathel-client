import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Mods from './pages/Mods';
import Console from './pages/Console';
import Settings from './pages/Settings';
import Login from './pages/Login';
import CreateInstance from './components/CreateInstance';
import UpdateBanner from './components/UpdateBanner';
import { useLauncher } from './store/launcher';

function getBgStyle(bg) {
  if (!bg) return {};
  if (bg.type === 'solid') return { background: bg.color };
  if (bg.type === 'image' && bg.imageUrl) return {
    backgroundImage: `url("${bg.imageUrl}")`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  };
  // gradient (default)
  const { from, to, direction } = bg.gradient || {};
  return { background: `linear-gradient(${direction || '135deg'}, ${from || '#0b0b18'}, ${to || '#1a0a2e'})` };
}

export default function App() {
  const { accounts, activeAccountId, addInstance, instances, background } = useLauncher();
  const hasAccount = accounts.some(a => a.id === activeAccountId);
  const [showLogin,  setShowLogin]  = useState(!hasAccount);
  const [showCreate, setShowCreate] = useState(false);
  const [versions,   setVersions]   = useState([]);

  // Cargar versiones cuando se va a crear instancia
  async function openCreate() {
    if (!versions.length) {
      const v = await window.aurora?.versions();
      setVersions(v || []);
    }
    setShowCreate(true);
  }

  if (showLogin) {
    return <Login onDone={() => setShowLogin(false)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', ...getBgStyle(background) }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar onNewInstance={openCreate} />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/mods"    element={<Mods />} />
            <Route path="/consola" element={<Console />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/login"   element={<Login onDone={() => setShowLogin(false)} />} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <UpdateBanner />

      {showCreate && (
        <CreateInstance
          versions={versions}
          onClose={() => setShowCreate(false)}
          onCreate={async (inst) => {
            await addInstance(inst);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
