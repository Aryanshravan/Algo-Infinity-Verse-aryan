import fs from 'fs';
import path from 'path';

describe('Elixir Editor File and Structure Validation', () => {
  const elixirHtmlPath = path.join(process.cwd(), 'pages/editors/elixir-editor/elixir-editor.html');
  const elixirJsPath = path.join(process.cwd(), 'pages/editors/elixir-editor/elixir-editor.js');
  const elixirCssPath = path.join(process.cwd(), 'pages/editors/elixir-editor/elixir-editor.css');
  const editorsJsPath = path.join(process.cwd(), 'pages/editors/editors.js');
  const playgroundHtmlPath = path.join(process.cwd(), 'Playground/playground.html');
  const playgroundJsPath = path.join(process.cwd(), 'Playground/playground.js');
  const codePlaygroundHtmlPath = path.join(process.cwd(), 'code-playground.html');

  test('Elixir Editor files exist', () => {
    expect(fs.existsSync(elixirHtmlPath)).toBe(true);
    expect(fs.existsSync(elixirJsPath)).toBe(true);
    expect(fs.existsSync(elixirCssPath)).toBe(true);
  });

  test('elixir-editor.html includes essential UI components', () => {
    const html = fs.readFileSync(elixirHtmlPath, 'utf8');
    expect(html).toContain('exActiveFileName');
    expect(html).toContain('exExampleSelect');
    expect(html).toContain('.ex');
  });

  test('elixir-editor.js defines required examples and syntax highlighter', () => {
    const js = fs.readFileSync(elixirJsPath, 'utf8');
    expect(js).toContain('ELIXIR_EXAMPLES');
    expect(js).toContain('hello');
    expect(js).toContain('variables');
    expect(js).toContain('recursion');
    expect(js).toContain('concurrency');
    expect(js).toContain('structs');
    expect(js).toContain('highlightElixir');
    expect(js).toContain('executeElixir');
  });

  test('editors.js includes Elixir Editor registration', () => {
    const js = fs.readFileSync(editorsJsPath, 'utf8');
    expect(js).toContain('Elixir Editor');
    expect(js).toContain('/pages/editors/elixir-editor/elixir-editor.html');
  });

  test('Playground/playground.html and playground.js include elixir support', () => {
    const html = fs.readFileSync(playgroundHtmlPath, 'utf8');
    const js = fs.readFileSync(playgroundJsPath, 'utf8');
    expect(html).toContain('value="elixir"');
    expect(js).toContain('runElixir');
    expect(js).toContain('ace/mode/elixir');
  });

  test('code-playground.html includes elixir support', () => {
    const html = fs.readFileSync(codePlaygroundHtmlPath, 'utf8');
    expect(html).toContain('value="elixir"');
    expect(html).toContain('elixir:');
  });
});
