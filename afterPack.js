const { execSync } = require('child_process');
const path = require('path');

exports.default = async function(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  try {
    execSync(`codesign --remove-signature "${appPath}"`, { stdio: 'pipe' });
    console.log('  • removed ad-hoc signature from', appPath);
  } catch (e) {
    console.warn('  • could not remove signature:', e.message);
  }
};
