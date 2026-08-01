const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, '..', 'pages', 'visualizers');

const replacements = {
    '#1e293b': 'var(--panel-bg)',
    '#334155': 'var(--panel-border)',
    '#0f172a': 'var(--panel-bg-dark)',
    '#cbd5e1': 'var(--panel-text)',
    '#64748b': 'var(--panel-text-muted)',
    '#0b1121': 'var(--panel-card-bg)',
};

let filesModified = 0;
let occurrencesReplaced = 0;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.css') || file.endsWith('.html') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

function migrate() {
    console.log(`Scanning directory: ${directory}`);
    const files = walk(directory);
    console.log(`Found ${files.length} files to scan.`);

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        // Create a regex for each hex code, ensuring case-insensitivity
        Object.keys(replacements).forEach(hex => {
            const regex = new RegExp(hex, 'gi');
            const matches = content.match(regex);
            if (matches) {
                occurrencesReplaced += matches.length;
                content = content.replace(regex, replacements[hex]);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            filesModified++;
            console.log(`Updated: ${path.relative(directory, file)}`);
        }
    });

    console.log(`\nMigration Complete!`);
    console.log(`- Files modified: ${filesModified}`);
    console.log(`- Total replacements: ${occurrencesReplaced}`);
}

migrate();
