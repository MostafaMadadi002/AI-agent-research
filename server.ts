import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import firebaseConfig from './firebase-applet-config.json';

dotenv.config();

// Fix for CJS/ESM compatibility
let currentDirname = process.cwd();
try {
  if (typeof fileURLToPath === 'function' && import.meta.url) {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  // Fallback to __dirname in CJS if it exists
  if (typeof __dirname !== 'undefined') {
    currentDirname = __dirname;
  }
}
const finalDirname = currentDirname;

// Initialize Firebase Admin
// We keep it for future use, but primary state management moves to frontend
// to avoid IAM PERMISSION_DENIED errors on the server.
if (!getApps().length) {
  try {
    initializeApp(); 
    console.log('[Backend] Firebase Admin initialized.');
  } catch (err: any) {
    console.error('[Backend] Firebase Admin Init Error:', err.message);
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy-key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Helper function to handle retries with exponential backoff for AI calls.
 */
async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 5, initialDelay = 5000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing. Please add it to your Secrets.');
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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post('/api/research', async (req, res) => {
    const { query, depth } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    try {
      console.log(`[Research] Starting AI Agent for: "${query}" (Depth: ${depth})`);
      
      const prompt = `Conduct a comprehensive ${depth || 'standard'} research on the following topic: "${query}". 
      Provide a detailed markdown report with:
      - Executive Summary
      - Key Findings
      - Detailed Analysis
      - Future Outlook
      - Sources & Citations
      
      Format the response beautifully in Markdown. Be thorough and professional.`;

      const interaction = await withRetry(async (attempt) => {
        // Using the correct Interactions API pattern for @google/genai
        const modelName = "gemini-3.8-flash";
        console.log(`[Research] Attempt ${attempt + 1} | Model: ${modelName}`);

        return await ai.interactions.create({
          model: modelName,
          input: prompt,
          tools: [{ type: 'google_search' }]
        });
      });

      const report = interaction.output_text || 'No report generated.';
      console.log('[Research] AI Agent completed.');
      
      return res.json({ success: true, report });

    } catch (error: any) {
      console.error('[Research] Error:', error.message);
      const errorMsg = error.message?.toLowerCase() || '';
      const isQuota = errorMsg.includes('429') || errorMsg.includes('quota');
      
      return res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? 'Rate limit exceeded' : 'Research failed', 
        message: isQuota 
          ? 'ظرفیت رایگان هوش مصنوعی تکمیل است. لطفاً کمی صبر کنید یا از کلید شخصی استفاده کنید.' 
          : error.message 
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const { message, report } = req.body;

    if (!message || !report) {
      return res.status(400).json({ error: 'Missing message or report' });
    }

    try {
      console.log(`[Chat] Generating response...`);
      
      const systemInstruction = `You are a professional research assistant. 
      Answer questions based on this research report:
      
      ${report}
      
      If the answer isn't in the report, use your general knowledge but clarify it's an extension of the report.`;

      const interaction = await withRetry(async (attempt) => {
        const modelName = "gemini-3.1-flash-lite";
        console.log(`[Chat] Attempt ${attempt + 1} | Model: ${modelName}`);

        return await ai.interactions.create({
          model: modelName,
          input: message,
          system_instruction: systemInstruction
        });
      });

      return res.json({ reply: interaction.output_text });

    } catch (error: any) {
      console.error('[Chat] Error:', error.message);
      const errorMsg = error.message?.toLowerCase() || '';
      const isQuota = errorMsg.includes('429') || errorMsg.includes('quota');
      return res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? 'Rate limit exceeded' : 'Chat failed', 
        message: isQuota ? 'ظرفیت چت تکمیل است. لطفا بعدا تلاش کنید.' : error.message 
      });
    }
  });

  // Global error handler for API routes to prevent HTML error pages
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('[API Global Error]:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'یک خطای داخلی در سرور رخ داد. لطفاً دوباره تلاش کنید.' 
    });
  });

  // Vite Middleware
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
    console.log(`[Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal Start Error:', err);
});

