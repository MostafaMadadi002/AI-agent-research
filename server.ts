import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Fix for CJS/ESM compatibility
let currentDirname = process.cwd();
try {
  if (typeof fileURLToPath === 'function' && import.meta.url) {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  if (typeof __dirname !== 'undefined') {
    currentDirname = __dirname;
  }
}
const finalDirname = currentDirname;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy-key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 5, initialDelay = 5000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy-key') {
        throw new Error('GEMINI_API_KEY is missing. Please add it to your Secrets in Settings.');
      }
      return await fn(i);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || '';
      const isRateLimit = errorMsg.includes('429') || error.status === 429 || errorMsg.includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i); 
        console.warn(`[AI] Quota hit. Attempt ${i + 1} failed. Retrying in ${Math.round(delay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  console.log('[Server] Initializing API routes...');

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Research API
  app.post('/api/research', async (req, res) => {
    const { query, depth } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
      console.log(`[Research] Request received: "${query}"`);
      const prompt = `Conduct a comprehensive ${depth || 'standard'} research on the following topic: "${query}". 
      Provide a detailed markdown report with Executive Summary, Key Findings, Detailed Analysis, and Sources.
      Format the response beautifully in Markdown.`;

      const interaction = await withRetry(async (attempt) => {
        return await ai.interactions.create({
          model: "gemini-3.8-flash",
          input: prompt,
          tools: [{ type: 'google_search' }]
        });
      });

      return res.json({ success: true, report: interaction.output_text || 'No report generated.' });
    } catch (error: any) {
      console.error('[Research] Error:', error.message);
      const isQuota = error.message?.toLowerCase().includes('quota') || error.message?.includes('429');
      return res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? 'Rate limit' : 'Failed', 
        message: isQuota ? 'ظرفیت هوش مصنوعی تکمیل است.' : error.message 
      });
    }
  });

  // 3. Chat API
  app.post('/api/chat', async (req, res) => {
    const { message, report } = req.body;
    if (!message || !report) return res.status(400).json({ error: 'Missing data' });

    try {
      const interaction = await withRetry(async () => {
        return await ai.interactions.create({
          model: "gemini-3.1-flash-lite",
          input: message,
          system_instruction: `Answer based on this report: ${report}`
        });
      });
      return res.json({ reply: interaction.output_text });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 4. Vite/Static Middleware (MUST BE LAST)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Critical start error:', err);
});

