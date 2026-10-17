const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'contracts', 'out', 'CircleFactory.sol', 'CircleFactory.json');
const outPath = path.join(__dirname, 'frontend', 'src', 'contracts', 'bytecode.ts');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const bytecode = data.bytecode.object;

fs.writeFileSync(
  outPath,
  `export const CIRCLE_FACTORY_BYTECODE = '${bytecode}' as \`0x\${string}\`;\n`
);

console.log('Successfully extracted CircleFactory bytecode to frontend/src/contracts/bytecode.ts');
