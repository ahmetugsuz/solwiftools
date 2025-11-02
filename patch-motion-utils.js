const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'node_modules/motion-utils/dist/es/window-config.mjs');

const patchContent = `
export const MotionGlobalConfig = {};
export default MotionGlobalConfig;
`;

if (!fs.existsSync(filePath)) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, patchContent, 'utf8');
  console.log('✅ Patched motion-utils with MotionGlobalConfig');
} else {
  const current = fs.readFileSync(filePath, 'utf8');
  if (!current.includes('MotionGlobalConfig')) {
    fs.writeFileSync(filePath, patchContent, 'utf8');
    console.log('✅ Repatched motion-utils with MotionGlobalConfig');
  } else {
    console.log('ℹ️ motion-utils already patched');
  }
}
