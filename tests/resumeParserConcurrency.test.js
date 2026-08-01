import { extractResumeText } from '../backend/resume-analyzer/parser.js';

describe('Resume Parser Worker Pool Queue (#2958)', () => {
  test('rejects unsupported file mime types without spawning unhandled worker threads', async () => {
    const invalidFile = { buffer: Buffer.from('test'), mimetype: 'image/png' };
    await expect(extractResumeText(invalidFile)).rejects.toThrow('Unsupported file');
  });
});
