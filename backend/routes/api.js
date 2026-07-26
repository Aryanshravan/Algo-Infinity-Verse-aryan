import express from 'express';
import {
  getCsrfToken,
  logError,
  executeCode,
  executeTracedCode,
} from '../controllers/apiController.js';
import { explainCode } from '../services/codeExplainer.service.js';

import sqlSimulatorRouter from './sqlSimulator.js';
import streaksHandler from '../../api/streaks.js';
import goalsHandler from '../../api/goals.js';

const router = express.Router();

router.get('/csrf-token', getCsrfToken);
router.post('/log-error', logError);
router.post('/execute', executeCode);
router.post('/execute/traced', executeTracedCode);
router.post('/explain-code', async (req, res) => {
  try {
    const { code, language } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required and must be a string' });
    }
    const result = await explainCode({ code, language });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.use('/sql', sqlSimulatorRouter);
router.all('/streaks', (req, res) => streaksHandler(req, res));
router.all('/goals', (req, res) => goalsHandler(req, res));

export default router;
