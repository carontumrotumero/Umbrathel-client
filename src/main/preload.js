const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aurora', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),
  login:    () => ipcRenderer.invoke('auth:login'),
  javaDetect: ()      => ipcRenderer.invoke('java:detect'),
  javaTest:   (p)     => ipcRenderer.invoke('java:test', p),
  instancesList:   ()   => ipcRenderer.invoke('instances:list'),
  instancesSave:   (i)  => ipcRenderer.invoke('instances:save', i),
  instancesDelete: (id) => ipcRenderer.invoke('instances:delete', id),
  instancesOpenFolder: (id) => ipcRenderer.invoke('instances:openFolder', id),
  installAvedore: (id) => ipcRenderer.invoke('mods:installAvedore', id),
  forgeInstall:     (o) => ipcRenderer.invoke('forge:install', o),
  forgeIsInstalled: (o) => ipcRenderer.invoke('forge:isInstalled', o),
  launch:   (c) => ipcRenderer.invoke('minecraft:launch', c),
  versions: ()  => ipcRenderer.invoke('minecraft:versions'),
  modrinthSearch:  (o) => ipcRenderer.invoke('modrinth:search', o),
  modrinthInstall: (o) => ipcRenderer.invoke('modrinth:install', o),
  onLog:      (cb) => ipcRenderer.on('minecraft:log',      (_, v) => cb(v)),
  onProgress: (cb) => ipcRenderer.on('minecraft:progress', (_, v) => cb(v)),
  onClose:    (cb) => ipcRenderer.on('minecraft:close',    (_, v) => cb(v)),
  removeListeners: () => {
    ipcRenderer.removeAllListeners('minecraft:log');
    ipcRenderer.removeAllListeners('minecraft:progress');
    ipcRenderer.removeAllListeners('minecraft:close');
  },
  updaterInstall:      () => ipcRenderer.invoke('updater:install'),
  onUpdaterAvailable:  (cb) => ipcRenderer.on('updater:available',  (_, v) => cb(v)),
  onUpdaterProgress:   (cb) => ipcRenderer.on('updater:progress',   (_, v) => cb(v)),
  onUpdaterDownloaded: (cb) => ipcRenderer.on('updater:downloaded', (_, v) => cb(v)),
  onUpdaterError:      (cb) => ipcRenderer.on('updater:error',      (_, v) => cb(v)),
  sysInfo:    () => ipcRenderer.invoke('system:info'),
  openPath:   (p) => ipcRenderer.invoke('shell:openPath', p),
  openRoot:   ()  => ipcRenderer.invoke('shell:openRoot'),
  pickImage:  ()  => ipcRenderer.invoke('shell:pickImage'),
});
