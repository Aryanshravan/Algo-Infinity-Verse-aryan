import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import os from 'os';

if (!isMainThread) {
  (async () => {
    try {
      const { buffer, mimetype } = workerData;
      // The buffer passed through workerData needs to be reconstructed
      const buf = Buffer.from(buffer);

      if (mimetype.includes('pdf')) {
        const pdf = (await import('pdf-parse')).default;
        const data = await pdf(buf);
        parentPort.postMessage({ result: data.text });
      } else if (mimetype.includes('word')) {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer: buf });
        parentPort.postMessage({ result: result.value });
      } else {
        parentPort.postMessage({ error: 'Unsupported file' });
      }
    } catch (err) {
      parentPort.postMessage({ error: err.message });
    }
  })();
}

const MAX_CONCURRENT_WORKERS = Math.max(2, Math.min(4, os.cpus()?.length || 2));
let activeWorkers = 0;
const workerQueue = [];

function processNextWorkerTask() {
  if (activeWorkers >= MAX_CONCURRENT_WORKERS || workerQueue.length === 0) {
    return;
  }

  const { file, resolve, reject } = workerQueue.shift();
  activeWorkers++;

  let worker;
  let settled = false;

  const cleanup = () => {
    if (!settled) {
      settled = true;
      activeWorkers--;
      if (worker) {
        worker.terminate().catch(() => {});
      }
      processNextWorkerTask();
    }
  };

  try {
    worker = new Worker(fileURLToPath(import.meta.url), {
      workerData: {
        buffer: file.buffer,
        mimetype: file.mimetype,
      },
    });

    worker.on('message', (msg) => {
      if (msg.error) reject(new Error(msg.error));
      else resolve(msg.result);
      cleanup();
    });

    worker.on('error', (err) => {
      reject(err);
      cleanup();
    });

    worker.on('exit', (code) => {
      if (code !== 0 && !settled) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
      cleanup();
    });
  } catch (err) {
    reject(err);
    cleanup();
  }
}

export async function extractResumeText(file) {
  return new Promise((resolve, reject) => {
    workerQueue.push({ file, resolve, reject });
    processNextWorkerTask();
  });
}
