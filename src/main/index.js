const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { autoUpdater } = require('electron-updater');

const isDev = process.argv.includes('--dev');
const ROOT_DIR = path.join(os.homedir(), '.aurora-launcher');
const INSTANCES_DIR = path.join(ROOT_DIR, 'instances');

let mainWindow;

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message);
  });
}

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 780,
    minWidth: 960, minHeight: 600,
    frame: false,
    backgroundColor: '#0b0b18',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  if (isDev) mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
}

app.whenReady().then(() => {
  [ROOT_DIR, INSTANCES_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
  createWindow();
  if (!isDev) {
    setupAutoUpdater();
    autoUpdater.checkForUpdatesAndNotify();
  }
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Controles ventana
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window:close',    () => mainWindow?.close());

// Auth Microsoft
ipcMain.handle('auth:login', async () => {
  try {
    const msmc = require('msmc');
    const AuthClass = msmc.Auth ?? msmc.default?.Auth;
    if (!AuthClass) throw new Error('msmc no encontrado');
    const manager = new AuthClass('select_account');
    const xbox    = await manager.launch('electron');
    if (!xbox) throw new Error('Login cancelado');
    const mc       = await xbox.getMinecraft();
    const mclcAuth = mc.mclc(true);
    return { success: true, profile: {
      id: mclcAuth.uuid, name: mclcAuth.name,
      accessToken: mclcAuth.access_token, mclcAuth, offline: false,
      avatar: `https://mc-heads.net/avatar/${mclcAuth.uuid}/36`,
    }};
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Java
ipcMain.handle('java:detect', () => require('./java').detectJavas());
ipcMain.handle('java:test', async (_, javaPath) => {
  try {
    const out = require('child_process').execSync(`"${javaPath}" -version 2>&1`, { timeout: 5000 }).toString();
    const m = out.match(/version "?(\d+)(?:\.(\d+))?/);
    if (m) {
      const major = parseInt(m[1]);
      return { ok: true, version: major === 1 ? parseInt(m[2]||'8') : major };
    }
    return { ok: false, error: 'Version no reconocida' };
  } catch (e) { return { ok: false, error: e.message }; }
});

// Instancias
ipcMain.handle('instances:list', () => {
  if (!fs.existsSync(INSTANCES_DIR)) return [];
  return fs.readdirSync(INSTANCES_DIR).map(id => {
    const cfg = path.join(INSTANCES_DIR, id, 'instance.json');
    if (!fs.existsSync(cfg)) return null;
    try { return JSON.parse(fs.readFileSync(cfg, 'utf8')); } catch { return null; }
  }).filter(Boolean).sort((a, b) => (b.lastPlayed||0) - (a.lastPlayed||0));
});

ipcMain.handle('instances:save', (_, instance) => {
  const dir = path.join(INSTANCES_DIR, instance.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  ['mods','resourcepacks','shaderpacks','saves','screenshots'].forEach(sub => {
    const p = path.join(dir, sub);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });
  fs.writeFileSync(path.join(dir, 'instance.json'), JSON.stringify(instance, null, 2));
  return { success: true };
});

ipcMain.handle('instances:delete', (_, id) => {
  if (id === 'avedore-smp') return { success: false, error: 'Esta instancia es oficial y no se puede eliminar.' };
  const dir = path.join(INSTANCES_DIR, id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  return { success: true };
});

ipcMain.handle('instances:openFolder', (_, id) => shell.openPath(path.join(INSTANCES_DIR, id)));

// Instalar mods Avedore
ipcMain.handle('mods:installAvedore', async (event, instanceId) => {
  const src = app.isPackaged
    ? path.join(process.resourcesPath, 'mods')
    : path.join(__dirname, '../../resources/mods');
  if (!fs.existsSync(src)) return { success: false, error: `Carpeta no encontrada: ${src}` };
  const jars = fs.readdirSync(src).filter(f => f.endsWith('.jar'));
  if (!jars.length) return { success: false, error: 'Sin archivos .jar' };
  const dest = path.join(INSTANCES_DIR, instanceId, 'mods');
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  let nuevos = 0;
  for (const j of jars) {
    const d = path.join(dest, j);
    if (!fs.existsSync(d)) { fs.copyFileSync(path.join(src, j), d); nuevos++; }
    event.sender.send('minecraft:log', `✓ ${j}`);
  }
  event.sender.send('minecraft:log', `\n✓ ${jars.length} mods listos (${nuevos} nuevos)`);
  return { success: true, total: jars.length, nuevos };
});

// Forge
// Resuelve la ruta a Java automáticamente (con descarga si es necesario)
async function resolveJava(preferredPath, mcVersion, log) {
  if (preferredPath?.trim()) return preferredPath.trim();
  const { recommendJava, detectJavas, getBundledJava, downloadJava } = require('./java');
  const recommended = recommendJava(mcVersion || '1.16.5');
  const plat = process.platform;
  const javaExe = plat === 'win32' ? 'java.exe' : 'java';

  // 1. JREs bundled de Minecraft
  let jreCandidates = [];
  if (plat === 'darwin') {
    const mcRuntime = path.join(os.homedir(), 'Library/Application Support/minecraft/runtime');
    if (recommended <= 8) {
      jreCandidates = [
        path.join(mcRuntime, 'jre-legacy/mac-os/jre.bundle/Contents/Home/bin/java'),
        path.join(mcRuntime, 'jre-legacy/mac-os-arm64/jre-legacy/jre.bundle/Contents/Home/bin/java'),
      ];
    } else if (recommended <= 17) {
      jreCandidates = [
        path.join(mcRuntime, 'java-runtime-gamma/mac-os-arm64/java-runtime-gamma/jre.bundle/Contents/Home/bin/java'),
        path.join(mcRuntime, 'java-runtime-gamma/mac-os/java-runtime-gamma/jre.bundle/Contents/Home/bin/java'),
        '/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home/bin/java',
      ];
    } else {
      jreCandidates = [
        path.join(mcRuntime, 'java-runtime-epsilon/mac-os-arm64/java-runtime-epsilon/jre.bundle/Contents/Home/bin/java'),
      ];
    }
  } else if (plat === 'win32') {
    const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const mcRuntime = path.join(appdata, '.minecraft', 'runtime');
    const winRt = recommended <= 8 ? ['jre-legacy'] : recommended <= 17 ? ['java-runtime-gamma', 'java-runtime-delta'] : ['java-runtime-epsilon'];
    for (const rt of winRt) {
      jreCandidates.push(path.join(mcRuntime, rt, 'windows-x64', rt, 'bin', 'java.exe'));
      jreCandidates.push(path.join(mcRuntime, rt, 'windows-x86', rt, 'bin', 'java.exe'));
    }
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    for (const base of [pf, pf86]) {
      for (const vendor of ['Java', 'Eclipse Adoptium', 'Microsoft', 'Amazon Corretto']) {
        const dir = path.join(base, vendor);
        if (fs.existsSync(dir)) {
          for (const sub of fs.readdirSync(dir)) {
            jreCandidates.push(path.join(dir, sub, 'bin', 'java.exe'));
          }
        }
      }
    }
  } else {
    const mcRuntime = path.join(os.homedir(), '.minecraft', 'runtime');
    const linuxRt = recommended <= 8 ? ['jre-legacy'] : recommended <= 17 ? ['java-runtime-gamma'] : ['java-runtime-epsilon'];
    for (const rt of linuxRt) {
      jreCandidates.push(path.join(mcRuntime, rt, 'linux', rt, 'bin', 'java'));
      jreCandidates.push(path.join(mcRuntime, rt, 'linux-arm64', rt, 'bin', 'java'));
    }
  }
  for (const c of jreCandidates) { if (fs.existsSync(c)) return c; }

  // 2. Escaneo del sistema
  const found = detectJavas();
  const match = found.find(j => j.version === recommended) || found.find(j => recommended <= 8 ? j.version <= 8 : j.version >= recommended);
  if (match) return match.path;

  // 3. JRE descargado previamente
  const bundled = getBundledJava();
  if (bundled) return bundled;

  // 4. Descargar automáticamente
  const downloaded = await downloadJava(log);
  if (downloaded) return downloaded;

  // 5. Último recurso
  return javaExe;
}

ipcMain.handle('forge:install', async (event, { mcVersion, javaPath, instanceId }) => {
  const { installForge, isForgeInstalled, getForgeVersionId } = require('./forge');
  const log = msg => event.sender.send('minecraft:log', msg);
  const root = instanceId ? path.join(INSTANCES_DIR, instanceId) : ROOT_DIR;
  if (isForgeInstalled(root, mcVersion)) {
    const vId = getForgeVersionId(mcVersion);
    log(`✓ Forge ya instalado: ${vId}`);
    return { success: true, versionId: vId };
  }
  try {
    const resolvedJava = await resolveJava(javaPath, mcVersion, log);
    log(`☕ Java: ${resolvedJava}`);
    const vId = await installForge(root, mcVersion, resolvedJava, log);
    return { success: true, versionId: vId };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('forge:isInstalled', (_, { mcVersion, instanceId }) => {
  const { isForgeInstalled } = require('./forge');
  const root = instanceId ? path.join(INSTANCES_DIR, instanceId) : ROOT_DIR;
  return isForgeInstalled(root, mcVersion);
});

// Lanzar Minecraft
ipcMain.handle('minecraft:launch', async (event, config) => {
  const { Client, Authenticator } = require('minecraft-launcher-core');
  const { getForgeVersionId } = require('./forge');
  const log = msg => event.sender.send('minecraft:log', String(msg));
  const launcher = new Client();
  const instanceRoot = config.instanceId ? path.join(INSTANCES_DIR, config.instanceId) : ROOT_DIR;

  let authorization;
  if (config.offline) {
    authorization = Authenticator.getAuth(config.username || 'AuroraPlayer');
  } else if (config.mclcAuth) {
    authorization = config.mclcAuth;
  } else {
    authorization = {
      access_token: config.accessToken, client_token: config.uuid||'aurora',
      uuid: config.uuid, name: config.name, user_properties: '{}', meta: { type: 'msa' },
    };
  }

  const versionOpts = { number: config.version, type: 'release' };
  if (config.loader === 'forge') {
    const fId = getForgeVersionId(config.version);
    if (!fId) return { success: false, error: `Forge no disponible para ${config.version}` };
    versionOpts.custom = fId;
  } else if (config.loader === 'fabric') {
    versionOpts.custom = `fabric-loader-0.16.9-${config.version}`;
  }

  // Auto-select Java: pick best Java for this MC version
  let javaPath = config.javaPath || undefined;
  if (!javaPath) {
    const { recommendJava } = require('./java');
    const recommended = recommendJava(config.version);
    const plat = process.platform;
    const javaExe = plat === 'win32' ? 'java.exe' : 'java';

    // Priority 1: Minecraft's bundled JREs — paths differ per platform
    let jreCandidates = [];
    if (plat === 'darwin') {
      const mcRuntime = path.join(os.homedir(), 'Library/Application Support/minecraft/runtime');
      if (recommended <= 8) {
        jreCandidates = [
          path.join(mcRuntime, 'jre-legacy/mac-os/jre.bundle/Contents/Home/bin/java'),
          path.join(mcRuntime, 'jre-legacy/mac-os/jre-legacy/jre.bundle/Contents/Home/bin/java'),
          path.join(mcRuntime, 'jre-legacy/mac-os-arm64/jre-legacy/jre.bundle/Contents/Home/bin/java'),
        ];
      } else if (recommended <= 17) {
        jreCandidates = [
          path.join(mcRuntime, 'java-runtime-gamma/mac-os-arm64/java-runtime-gamma/jre.bundle/Contents/Home/bin/java'),
          path.join(mcRuntime, 'java-runtime-gamma/mac-os/java-runtime-gamma/jre.bundle/Contents/Home/bin/java'),
          '/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home/bin/java',
        ];
      } else {
        jreCandidates = [
          path.join(mcRuntime, 'java-runtime-epsilon/mac-os-arm64/java-runtime-epsilon/jre.bundle/Contents/Home/bin/java'),
          '/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin/java',
        ];
      }
    } else if (plat === 'win32') {
      const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      const mcRuntime = path.join(appdata, '.minecraft', 'runtime');
      const winRt = recommended <= 8
        ? ['jre-legacy']
        : recommended <= 17
        ? ['java-runtime-gamma', 'java-runtime-delta']
        : ['java-runtime-epsilon'];
      for (const rt of winRt) {
        jreCandidates.push(path.join(mcRuntime, rt, 'windows-x64', rt, 'bin', 'java.exe'));
        jreCandidates.push(path.join(mcRuntime, rt, 'windows-x86', rt, 'bin', 'java.exe'));
      }
      // Common Windows Java install paths
      const pf = process.env.ProgramFiles || 'C:\\Program Files';
      const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      for (const base of [pf, pf86]) {
        for (const vendor of ['Java', 'Eclipse Adoptium', 'Microsoft', 'Amazon Corretto']) {
          const dir = path.join(base, vendor);
          if (fs.existsSync(dir)) {
            for (const sub of fs.readdirSync(dir)) {
              jreCandidates.push(path.join(dir, sub, 'bin', 'java.exe'));
            }
          }
        }
      }
    } else if (plat === 'linux') {
      const mcRuntime = path.join(os.homedir(), '.minecraft', 'runtime');
      const linuxRt = recommended <= 8 ? ['jre-legacy'] : recommended <= 17 ? ['java-runtime-gamma'] : ['java-runtime-epsilon'];
      for (const rt of linuxRt) {
        jreCandidates.push(path.join(mcRuntime, rt, 'linux', rt, 'bin', 'java'));
        jreCandidates.push(path.join(mcRuntime, rt, 'linux-arm64', rt, 'bin', 'java'));
      }
    }

    for (const candidate of jreCandidates) {
      if (fs.existsSync(candidate)) { javaPath = candidate; break; }
    }

    // Priority 2: detectJavas scan
    if (!javaPath) {
      const { detectJavas } = require('./java');
      const found = detectJavas();
      const match = found.find(j => j.version === recommended)
        || found.find(j => recommended <= 8 ? j.version <= 8 : j.version >= recommended);
      if (match) javaPath = match.path;
    }

    // Priority 3: JRE descargado previamente por el launcher
    if (!javaPath) {
      const { getBundledJava } = require('./java');
      javaPath = getBundledJava();
    }

    // Priority 4: descargar Java automáticamente
    if (!javaPath) {
      const { downloadJava } = require('./java');
      javaPath = await downloadJava(log);
    }

    // Priority 5: último recurso — 'java' en PATH
    if (!javaPath) javaPath = javaExe;

    if (javaPath) log(`☕ Java seleccionado: ${javaPath}`);
  }

  const opts = {
    authorization, root: instanceRoot, version: versionOpts,
    memory: { max: `${config.maxRam||2048}M`, min: `${Math.min(config.minRam||512, config.maxRam||2048)}M` },
    javaPath,
    overrides: { gameDirectory: instanceRoot },
  };
  if (config.jvmArgs?.trim()) opts.customArgs = config.jvmArgs.trim().split(/\s+/);

  // quickPlay 'legacy' = --server <host> --port <port> (opts.server está deprecado en MCLC v3)
  if (config.server) {
    const host = config.server.host;
    const port = String(config.server.port || 25565);
    opts.quickPlay = { type: 'legacy', identifier: `${host}:${port}` };
    log(`🌐 Conexión directa → ${host}:${port}`);
  }

  log(`▶ Minecraft ${config.version} [${config.loader||'vanilla'}]  dir: ${instanceRoot}`);

  launcher.on('debug',    log);
  launcher.on('data',     log);
  launcher.on('progress', p => event.sender.send('minecraft:progress', p));
  launcher.on('close',    c => {
    event.sender.send('minecraft:close', c);
    // Actualizar lastPlayed
    if (config.instanceId) {
      const cfgPath = path.join(INSTANCES_DIR, config.instanceId, 'instance.json');
      if (fs.existsSync(cfgPath)) {
        try {
          const inst = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
          inst.lastPlayed = Date.now();
          inst.playCount = (inst.playCount||0) + 1;
          fs.writeFileSync(cfgPath, JSON.stringify(inst, null, 2));
        } catch {}
      }
    }
  });

  try {
    await launcher.launch(opts);
    return { success: true };
  } catch (err) {
    log(`[ERROR] ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Instalar mod desde Modrinth
ipcMain.handle('modrinth:install', async (_, { projectId, instanceId, loader, version }) => {
  const axios = require('axios');
  try {
    const r = await axios.get(`https://api.modrinth.com/v2/project/${projectId}/version`, {
      params: { loaders: JSON.stringify([loader || 'forge']), game_versions: JSON.stringify([version]) },
      timeout: 10000,
    });
    const versions = r.data;
    if (!versions?.length) return { success: false, error: `Sin versiones compatibles para ${loader} ${version}` };
    const file = versions[0].files.find(f => f.primary) || versions[0].files[0];
    if (!file) return { success: false, error: 'No se encontró archivo descargable' };
    const dest = path.join(INSTANCES_DIR, instanceId, 'mods');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const filePath = path.join(dest, file.filename);
    if (fs.existsSync(filePath)) return { success: true, alreadyInstalled: true, filename: file.filename };
    const resp = await axios.get(file.url, { responseType: 'arraybuffer', timeout: 60000 });
    fs.writeFileSync(filePath, Buffer.from(resp.data));
    return { success: true, filename: file.filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Versiones Minecraft
ipcMain.handle('minecraft:versions', async () => {
  const axios = require('axios');
  try {
    const r = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json', { timeout: 8000 });
    return r.data.versions;
  } catch { return []; }
});

// Modrinth
ipcMain.handle('modrinth:search', async (_, { query, loader, version, limit=20, offset=0 }) => {
  const axios = require('axios');
  try {
    const facets = [['project_type:mod']];
    if (loader && loader !== 'vanilla') facets.push([`categories:${loader}`]);
    if (version) facets.push([`versions:${version}`]);
    const r = await axios.get('https://api.modrinth.com/v2/search', {
      params: { query, facets: JSON.stringify(facets), limit, offset, index: 'relevance' },
      timeout: 8000,
    });
    return { success: true, hits: r.data.hits, total: r.data.total_hits };
  } catch (err) {
    return { success: false, error: err.message, hits: [], total: 0 };
  }
});

// Sistema
ipcMain.handle('shell:pickImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar imagen de fondo',
    filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('system:info', () => ({
  totalRam: Math.floor(os.totalmem() / 1024 / 1024),
  platform: process.platform, arch: process.arch,
  rootDir: ROOT_DIR, instancesDir: INSTANCES_DIR,
}));
ipcMain.handle('shell:openPath', (_, p) => shell.openPath(p));
ipcMain.handle('shell:openRoot', () => shell.openPath(ROOT_DIR));
