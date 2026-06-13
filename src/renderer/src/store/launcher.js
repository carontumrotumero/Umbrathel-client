import { create } from 'zustand';

const CFG_KEY = 'umbrathel_v1';

function genId() { return Math.random().toString(36).slice(2, 9); }

const AVEDORE_INSTANCE = {
  id: 'avedore-smp',
  name: 'Avedore SMP',
  icon: '⚔️',
  version: '1.16.5',
  loader: 'forge',
  loaderVersion: '36.2.42',
  server: { host: 'play.avedore.eu', port: 25574 },
  modsInstalled: false,
  lastPlayed: null,
  playCount: 0,
  pinned: true,
  locked: true,
  description: 'Servidor oficial con 24 mods — MineColonies, Ice & Fire, Epic Knights y más',
};

const defaults = {
  accounts: [],
  activeAccountId: null,
  settings: {
    maxRam: 2048,
    minRam: 512,
    javaPath: '',
    jvmArgs: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M -Dlog4j2.formatMsgNoLookups=true',
    fullscreen: false,
    resolution: { width: 1280, height: 720 },
    closeOnLaunch: false,
    showSnapshots: false,
  },
  background: {
    type: 'gradient', // 'gradient' | 'solid' | 'image'
    color: '#0b0b18',
    gradient: { from: '#0b0b18', to: '#1a0a2e', direction: '135deg' },
    imageUrl: '',
  },
};

function loadCfg() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...defaults, ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      background: { ...defaults.background, ...(parsed.background || {}),
        gradient: { ...defaults.background.gradient, ...(parsed.background?.gradient || {}) },
      },
    };
  } catch { return defaults; }
}

function saveCfg(state) {
  const { accounts, activeAccountId, settings, background } = state;
  localStorage.setItem(CFG_KEY, JSON.stringify({ accounts, activeAccountId, settings, background }));
}

export const useLauncher = create((set, get) => ({
  ...loadCfg(),

  // Instancias (se cargan desde el proceso principal al montar)
  instances: [AVEDORE_INSTANCE],

  // Estado de juego
  activeInstanceId: null,
  launching: false,
  progress: null,
  logs: [],
  gameRunning: false,

  // Getters
  get activeAccount() { return get().accounts.find(a => a.id === get().activeAccountId) ?? null; },

  // Accounts
  addAccount: (profile) => {
    set(s => {
      const exists = s.accounts.find(a => a.id === profile.id);
      const accounts = exists
        ? s.accounts.map(a => a.id === profile.id ? profile : a)
        : [...s.accounts, profile];
      const next = { accounts, activeAccountId: profile.id };
      saveCfg({ ...s, ...next });
      return next;
    });
  },
  removeAccount: (id) => {
    set(s => {
      const accounts = s.accounts.filter(a => a.id !== id);
      const activeAccountId = s.activeAccountId === id ? (accounts[0]?.id ?? null) : s.activeAccountId;
      const next = { accounts, activeAccountId };
      saveCfg({ ...s, ...next });
      return next;
    });
  },
  setActiveAccount: (id) => {
    set(s => { const next = { activeAccountId: id }; saveCfg({ ...s, ...next }); return next; });
  },

  // Instancias
  setInstances: (instances) => {
    set(() => {
      // Merge estado guardado de Avedore (modsInstalled, lastPlayed, playCount) con la plantilla bloqueada
      const diskAvedore = instances.find(i => i.id === 'avedore-smp');
      const avedore = diskAvedore
        ? { ...AVEDORE_INSTANCE, modsInstalled: diskAvedore.modsInstalled ?? false, lastPlayed: diskAvedore.lastPlayed ?? null, playCount: diskAvedore.playCount ?? 0 }
        : AVEDORE_INSTANCE;
      const others = instances.filter(i => i.id !== 'avedore-smp');
      return { instances: [avedore, ...others] };
    });
  },
  addInstance: async (instance) => {
    const full = { id: genId(), playCount: 0, lastPlayed: null, ...instance };
    await window.aurora?.instancesSave(full);
    set(s => ({ instances: [full, ...s.instances] }));
    return full;
  },
  updateInstance: async (id, patch) => {
    set(s => {
      const instances = s.instances.map(i => i.id === id ? { ...i, ...patch } : i);
      const updated = instances.find(i => i.id === id);
      if (updated) window.aurora?.instancesSave(updated);
      return { instances };
    });
  },
  deleteInstance: async (id) => {
    if (id === 'avedore-smp') return;
    await window.aurora?.instancesDelete(id);
    set(s => ({ instances: s.instances.filter(i => i.id !== id) }));
  },

  // Settings
  updateSettings: (patch) => {
    set(s => {
      const settings = { ...s.settings, ...patch };
      saveCfg({ ...s, settings });
      return { settings };
    });
  },

  // Background
  updateBackground: (patch) => {
    set(s => {
      const background = { ...s.background, ...patch,
        gradient: { ...s.background.gradient, ...(patch.gradient || {}) },
      };
      saveCfg({ ...s, background });
      return { background };
    });
  },

  // Game state
  setActiveInstance: (id) => set({ activeInstanceId: id }),
  setLaunching:      (v) => set({ launching: v }),
  setProgress:       (p) => set({ progress: p }),
  setGameRunning:    (v) => set({ gameRunning: v }),
  addLog:  (line) => set(s => ({ logs: [...s.logs.slice(-600), line] })),
  clearLogs: ()   => set({ logs: [] }),
}));
