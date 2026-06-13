/**
 * Detección automática de instalaciones de Java en el sistema.
 * Si no hay Java, lo descarga automáticamente desde Adoptium.
 */
const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Directorio donde el launcher guarda su propio JRE descargado
const BUNDLED_JRE_DIR = path.join(os.homedir(), '.aurora-launcher', 'jre');

/**
 * Descarga y extrae el JRE de Adoptium Temurin 8 para el SO actual.
 * Devuelve la ruta al ejecutable java, o null si falla.
 */
async function downloadJava(onLog) {
  const plat = process.platform;
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64';

  // URL de Adoptium API para Java 8 (Temurin)
  const apiUrl = `https://api.adoptium.net/v3/assets/latest/8/hotspot?architecture=${arch}&image_type=jre&os=${plat === 'win32' ? 'windows' : plat === 'darwin' ? 'mac' : 'linux'}&vendor=eclipse`;

  onLog('☕ Java no encontrado. Descargando JRE automáticamente...');

  try {
    const axios = require('axios');
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const asset = res.data[0];
    if (!asset) throw new Error('No se encontró JRE disponible');

    const downloadUrl = asset.binary.package.link;
    const fileName = asset.binary.package.name;
    const destFile = path.join(BUNDLED_JRE_DIR, fileName);

    if (!fs.existsSync(BUNDLED_JRE_DIR)) fs.mkdirSync(BUNDLED_JRE_DIR, { recursive: true });

    onLog(`☕ Descargando ${fileName}...`);
    const fileRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 300000 });
    fs.writeFileSync(destFile, Buffer.from(fileRes.data));
    onLog('☕ Extrayendo JRE...');

    // Extraer según formato
    const extractDir = path.join(BUNDLED_JRE_DIR, 'current');
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });

    if (fileName.endsWith('.zip')) {
      const { execSync } = require('child_process');
      if (plat === 'win32') {
        execSync(`powershell -command "Expand-Archive -Path '${destFile}' -DestinationPath '${extractDir}' -Force"`, { timeout: 60000 });
      } else {
        execSync(`unzip -q "${destFile}" -d "${extractDir}"`, { timeout: 60000 });
      }
    } else {
      execSync(`tar -xzf "${destFile}" -C "${extractDir}"`, { timeout: 60000 });
    }

    // Buscar el ejecutable java dentro de lo extraído
    const javaExe = plat === 'win32' ? 'java.exe' : 'java';
    const entries = fs.readdirSync(extractDir);
    for (const entry of entries) {
      const candidate = path.join(extractDir, entry, 'bin', javaExe);
      if (fs.existsSync(candidate)) {
        if (plat !== 'win32') execSync(`chmod +x "${candidate}"`);
        onLog(`✓ JRE instalado: ${candidate}`);
        return candidate;
      }
    }
    throw new Error('No se encontró java en el JRE extraído');
  } catch (err) {
    onLog(`[ERROR] No se pudo descargar Java: ${err.message}`);
    return null;
  }
}

/**
 * Devuelve la ruta al JRE descargado previamente, si existe.
 */
function getBundledJava() {
  const plat = process.platform;
  const javaExe = plat === 'win32' ? 'java.exe' : 'java';
  const extractDir = path.join(BUNDLED_JRE_DIR, 'current');
  if (!fs.existsSync(extractDir)) return null;
  try {
    for (const entry of fs.readdirSync(extractDir)) {
      const candidate = path.join(extractDir, entry, 'bin', javaExe);
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {}
  return null;
}

function runJavaVersion(javaExe) {
  try {
    const out = execFileSync(javaExe, ['-version'], { stderr: 'pipe', timeout: 5000 })
      .toString() + execSync(`"${javaExe}" -version 2>&1`, { timeout: 5000 }).toString();
    const match = out.match(/version "?(\d+)(?:\.(\d+))?/);
    if (match) {
      const major = parseInt(match[1]);
      // Java 1.8 → 8, Java 17 → 17
      return major === 1 ? parseInt(match[2] || '8') : major;
    }
  } catch {}
  return null;
}

function detectJavas() {
  const found = [];
  const platform = process.platform;

  const candidates = [
    'java',
    '/usr/bin/java',
    '/usr/local/bin/java',
  ];

  if (platform === 'darwin') {
    // Homebrew
    candidates.push('/opt/homebrew/opt/openjdk/bin/java');
    candidates.push('/opt/homebrew/opt/openjdk@17/bin/java');
    candidates.push('/opt/homebrew/opt/openjdk@21/bin/java');
    candidates.push('/opt/homebrew/opt/openjdk@8/bin/java');
    // /Library/Java
    try {
      const jvmDir = '/Library/Java/JavaVirtualMachines';
      if (fs.existsSync(jvmDir)) {
        for (const d of fs.readdirSync(jvmDir)) {
          candidates.push(path.join(jvmDir, d, 'Contents/Home/bin/java'));
        }
      }
    } catch {}
    // Minecraft bundled JREs (Java 8, 17, 21)
    const mcRuntime = path.join(os.homedir(), 'Library/Application Support/minecraft/runtime');
    const mcRuntimes = ['jre-legacy', 'java-runtime-gamma', 'java-runtime-delta', 'java-runtime-epsilon'];
    const mcArches = ['mac-os-arm64', 'mac-os'];
    for (const rt of mcRuntimes) {
      for (const arch of mcArches) {
        // Two possible layouts
        candidates.push(path.join(mcRuntime, rt, arch, 'jre.bundle/Contents/Home/bin/java'));
        candidates.push(path.join(mcRuntime, rt, arch, `${rt}/jre.bundle/Contents/Home/bin/java`));
      }
    }
    // JAVA_HOME
    if (process.env.JAVA_HOME) candidates.push(path.join(process.env.JAVA_HOME, 'bin/java'));
    // sdkman
    const sdkman = path.join(os.homedir(), '.sdkman/candidates/java/current/bin/java');
    if (fs.existsSync(sdkman)) candidates.push(sdkman);
  } else if (platform === 'linux') {
    candidates.push('/usr/lib/jvm/java-8-openjdk-amd64/bin/java');
    candidates.push('/usr/lib/jvm/java-17-openjdk-amd64/bin/java');
    candidates.push('/usr/lib/jvm/java-21-openjdk-amd64/bin/java');
    if (process.env.JAVA_HOME) candidates.push(path.join(process.env.JAVA_HOME, 'bin/java'));
  } else if (platform === 'win32') {
    const pfx86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const pf    = process.env['ProgramFiles']      || 'C:\\Program Files';
    const localapp = process.env.LOCALAPPDATA || '';
    for (const base of [pf, pfx86]) {
      for (const vendor of ['Java', 'Eclipse Adoptium', 'Microsoft', 'Amazon Corretto', 'Azul Systems\\Zulu']) {
        const dir = path.join(base, vendor);
        if (fs.existsSync(dir)) {
          for (const sub of fs.readdirSync(dir)) {
            candidates.push(path.join(dir, sub, 'bin', 'java.exe'));
          }
        }
      }
    }
    // Minecraft bundled JRE
    const minecraftJre = path.join(localapp, 'Packages\\Microsoft.4297127D64EC6_8wekyb3d8bbwe\\LocalCache\\Local\\runtime');
    if (fs.existsSync(minecraftJre)) {
      for (const sub of fs.readdirSync(minecraftJre)) {
        candidates.push(path.join(minecraftJre, sub, 'bin', 'java.exe'));
      }
    }
  }

  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (!fs.existsSync(candidate) && candidate !== 'java') continue;
    const version = runJavaVersion(candidate);
    if (version) {
      found.push({ path: candidate, version, recommended: version >= 17 });
    }
  }

  return found;
}

// Recomendar la mejor versión de Java para la versión de Minecraft
function recommendJava(mcVersion) {
  const [maj, min] = mcVersion.split('.').map(Number);
  if (min <= 16) return 8;   // 1.16.5 y anteriores → Java 8
  if (min <= 17) return 16;
  if (min <= 20) return 17;
  return 21;
}

module.exports = { detectJavas, recommendJava, downloadJava, getBundledJava };
