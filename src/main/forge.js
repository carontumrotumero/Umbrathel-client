const path = require('path');
const fs = require('fs');

const FORGE_VERSIONS = {
  '1.8.9':  '11.15.1.2318',
  '1.12.2': '14.23.5.2860',
  '1.16.5': '36.2.42',
  '1.18.2': '40.2.21',
  '1.19.2': '43.3.13',
  '1.19.4': '45.3.15',
  '1.20.1': '47.3.12',
  '1.20.4': '49.1.0',
};

function getForgeVersion(mcVersion) {
  return FORGE_VERSIONS[mcVersion] || null;
}

function getForgeVersionId(mcVersion) {
  const fv = getForgeVersion(mcVersion);
  if (!fv) return null;
  return `${mcVersion}-forge-${fv}`;
}

function isForgeInstalled(rootDir, mcVersion) {
  const vId = getForgeVersionId(mcVersion);
  if (!vId) return false;
  const jsonPath = path.join(rootDir, 'versions', vId, `${vId}.json`);
  return fs.existsSync(jsonPath);
}

async function installVanilla(rootDir, mcVersion, onLog) {
  const { getVersionList, installVersion, installDependencies, resolveVersion } = require('@xmcl/installer');
  onLog?.(`Buscando versión vanilla ${mcVersion}...`);

  const vDir = path.join(rootDir, 'versions', mcVersion, `${mcVersion}.json`);
  if (!fs.existsSync(vDir)) {
    const list = await getVersionList();
    const versionInfo = list.versions.find(v => v.id === mcVersion);
    if (!versionInfo) throw new Error(`Versión ${mcVersion} no encontrada en Mojang`);
    onLog?.(`Descargando vanilla ${mcVersion}...`);
    await installVersion(versionInfo, rootDir);
    onLog?.(`✓ Vanilla ${mcVersion} descargado`);
  } else {
    onLog?.(`✓ Vanilla ${mcVersion} ya existe`);
  }
}

async function installForge(rootDir, mcVersion, javaPath, onLog) {
  const forgeVer = getForgeVersion(mcVersion);
  if (!forgeVer) {
    throw new Error(`No hay versión de Forge para Minecraft ${mcVersion}. Soportadas: ${Object.keys(FORGE_VERSIONS).join(', ')}`);
  }

  const versionId = getForgeVersionId(mcVersion);
  onLog?.(`Instalando Forge ${forgeVer} para Minecraft ${mcVersion}...`);

  // Primero instalar vanilla (necesario tanto para @xmcl como para el JAR installer)
  try {
    await installVanilla(rootDir, mcVersion, onLog);
  } catch (e) {
    onLog?.(`Aviso al instalar vanilla: ${e.message}`);
  }

  // Usar el JAR installer oficial de Forge (más fiable que @xmcl)
  return await installForgeViaJar(rootDir, mcVersion, forgeVer, javaPath, onLog);
}

async function installForgeViaJar(rootDir, mcVersion, forgeVer, javaPath, onLog) {
  const { spawn } = require('child_process');
  const axios = require('axios');
  const fsp = fs.promises;

  const versionId = `${mcVersion}-forge-${forgeVer}`;
  const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVer}/forge-${mcVersion}-${forgeVer}-installer.jar`;
  const installerPath = path.join(rootDir, `forge-installer-${mcVersion}-${forgeVer}.jar`);

  if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });

  // Forge JAR installer requires launcher_profiles.json to exist
  const profilesPath = path.join(rootDir, 'launcher_profiles.json');
  if (!fs.existsSync(profilesPath)) {
    fs.writeFileSync(profilesPath, JSON.stringify({
      profiles: { Aurora: { name: 'Aurora', type: 'latest-release' } },
      selectedProfile: 'Aurora',
      clientToken: 'aurora-launcher-token',
    }, null, 2));
  }

  if (!fs.existsSync(installerPath)) {
    onLog?.(`Descargando instalador Forge desde Maven...`);
    const res = await axios.get(installerUrl, { responseType: 'arraybuffer', timeout: 60000 });
    await fsp.writeFile(installerPath, Buffer.from(res.data));
    onLog?.(`✓ Instalador descargado`);
  }

  onLog?.(`Ejecutando instalador Forge (puede tardar 2-3 minutos)...`);

  return new Promise((resolve, reject) => {
    const proc = spawn(javaPath || 'java', [
      '-jar', installerPath,
      '--installClient', rootDir,
    ], {
      cwd: rootDir,
      env: { ...process.env, JAVA_OPTS: '-Djava.net.preferIPv4Stack=true' },
    });

    proc.stdout.on('data', d => onLog?.(d.toString().trim()));
    proc.stderr.on('data', d => onLog?.(d.toString().trim()));

    proc.on('close', code => {
      const vJson = path.join(rootDir, 'versions', versionId, `${versionId}.json`);
      if (fs.existsSync(vJson)) {
        onLog?.(`✓ Forge instalado: ${versionId}`);
        resolve(versionId);
      } else {
        reject(new Error(`Forge installer terminó con código ${code} pero no se generó el archivo de versión. Verifica que Java 8 esté instalado.`));
      }
    });

    proc.on('error', err => reject(new Error(`No se pudo ejecutar Java: ${err.message}`)));
  });
}

module.exports = { installForge, isForgeInstalled, getForgeVersionId, getForgeVersion, FORGE_VERSIONS };
