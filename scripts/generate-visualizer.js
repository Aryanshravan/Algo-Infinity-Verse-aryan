const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const VISUALIZERS_DIR = path.join(__dirname, '../pages/visualizers');
const VISUALIZERS_JS = path.join(VISUALIZERS_DIR, 'visualizers.js');

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function run() {
  console.log('--- Visualizer Generator ---');
  const name = await ask('Visualizer Name (e.g. Merge Sort): ');
  if (!name) {
    console.error('Name is required!');
    process.exit(1);
  }

  const category = await ask('Category (e.g. Sorting & Searching): ');
  const desc = await ask('Description: ');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newDir = path.join(VISUALIZERS_DIR, slug);
  if (fs.existsSync(newDir)) {
    console.error(`Directory already exists: ${newDir}`);
    process.exit(1);
  }

  fs.mkdirSync(newDir, { recursive: true });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="${slug}.css">
</head>
<body>
  <h1>${name}</h1>
  <script src="${slug}.js"></script>
</body>
</html>`;

  const cssContent = `/* ${name} Styles */\n`;
  const jsContent = `/* ${name} Logic */\nconsole.log('${name} initialized');\n`;

  fs.writeFileSync(path.join(newDir, `${slug}.html`), htmlContent);
  fs.writeFileSync(path.join(newDir, `${slug}.css`), cssContent);
  fs.writeFileSync(path.join(newDir, `${slug}.js`), jsContent);

  // Update visualizers.js
  let vizJs = fs.readFileSync(VISUALIZERS_JS, 'utf8');
  const insertIndex = vizJs.indexOf('];');
  
  if (insertIndex === -1) {
    console.error('Could not find end of visualizers array in visualizers.js');
    process.exit(1);
  }

  const newEntry = `  {
    name: '${name.replace(/'/g, "\\'")}',
    path: '/pages/visualizers/${slug}/${slug}.html',
    category: '${category.replace(/'/g, "\\'") || 'Data Structures'}',
    icon: 'fa-cube',
    desc: '${desc.replace(/'/g, "\\'")}',
  },
`;

  vizJs = vizJs.slice(0, insertIndex) + newEntry + vizJs.slice(insertIndex);
  fs.writeFileSync(VISUALIZERS_JS, vizJs);

  console.log(`\nSuccessfully created ${name}!`);
  rl.close();
}

run();
