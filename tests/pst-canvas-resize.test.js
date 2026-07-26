import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(
    __dirname,
    '../pages/visualizers/persistent-segment-tree-visualizer/persistent-segment-tree-visualizer.js'
  ),
  'utf-8'
);

describe('PST Canvas Node Layout Freezes (Issue #3024)', () => {
  test('source code wraps resize layout update in requestAnimationFrame', () => {
    // Check that the resize listener exists
    expect(scriptCode).toMatch(/window\.addEventListener\('resize',\s*\(\)\s*=>/);

    // Check that requestAnimationFrame is used
    expect(scriptCode).toMatch(/requestAnimationFrame\(\(\)\s*=>/);
  });

  test('source code uses offsetWidth and offsetHeight for resize assignment', () => {
    // Check that canvas.width and height are assigned offsetWidth/offsetHeight
    expect(scriptCode).toContain('canvas.width = canvas.offsetWidth');
    expect(scriptCode).toContain('canvas.height = canvas.offsetHeight');
  });

  test('layoutTree and drawCanvasForVersion are called correctly within the frame', () => {
    // Look inside the requestAnimationFrame body for these calls
    const resizeIdx = scriptCode.indexOf("window.addEventListener('resize'");
    const block = scriptCode.slice(resizeIdx, resizeIdx + 400);
    expect(block).toContain('layoutTree(versions)');
    expect(block).toContain('drawCanvasForVersion(currentViewingVersion)');
  });
});
