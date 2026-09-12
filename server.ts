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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Helper function to handle retries with exponential backoff for AI calls.
 * Specifically targets 429 (Rate Limit) errors.
 */
async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 8, initialDelay = 5000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn(i);
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.toLowerCase().includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        // Log the error more clearly for debugging
        const delay = initialDelay * Math.pow(1.5, i); // Slightly slower growth but higher initial
        console.warn(`[AI] Rate limit hit (${error.message}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
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

  // API Routes
  app.post('/api/research', async (req, res) => {
    const { query, depth } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    try {
      console.log(`[Research] Starting AI Agent for: "${query}"`);
      
      const prompt = `Conduct a ${depth || 'standard'} research on the following topic: "${query}". 
      Provide a comprehensive markdown report with:
      1. Executive Summary
      2. Key Findings
      3. Detailed Analysis
      4. Sources & Citations
      5. Conclusion
      
      Format the response beautifully in Markdown.`;

      const interaction = await withRetry((attempt) => {
        // Multi-stage strategy:
        // Attempt 0-1: Primary model + Search
        // Attempt 2-3: Lite model + Search
        // Attempt 4+: Lite model NO Search (to save quota/tokens)
        
        let model = "gemini-3.8-flash";
        const useSearch = attempt < 4;
        
        if (attempt >= 2) model = "gemini-3.1-flash-lite";
        
        console.log(`[Research] Attempt ${attempt + 1} using model: ${model} (Search: ${useSearch ? 'ON' : 'OFF'})`);
        
        return ai.interactions.create({
          model,
          input: prompt,
          tools: useSearch ? [{ type: 'google_search' }] : []
        });
      });

      const report = interaction.output_text || 'No report generated.';
      console.log('[Research] AI Agent completed.');
      
      res.json({ success: true, report });

    } catch (error: any) {
      console.error('[Research] Error:', error.message);
      const isQuota = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? 'Rate limit exceeded' : 'Research failed', 
        message: isQuota ? 'ظرفیت استفاده از هوش مصنوعی تکمیل شده است. لطفا چند دقیقه صبر کنید و دوباره تلاش کنید.' : error.message 
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
      
      If the answer isn't in the report, mention it but provide general insight based on your knowledge.`;

      const interaction = await withRetry((attempt) => {
        let model = "gemini-3.8-flash";
        if (attempt >= 2) model = "gemini-3.1-flash-lite";
        
        console.log(`[Chat] Attempt ${attempt + 1} using model: ${model}`);

        const chat = ai.chats.create({
          model,
          config: { systemInstruction }
        });
        return chat.sendMessage(message);
      });

      res.json({ reply: interaction.text });

    } catch (error: any) {
      console.error('[Chat] Error:', error.message);
      const isQuota = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? 'Rate limit exceeded' : 'Chat failed', 
        message: isQuota ? 'هوش مصنوعی فعلاً مشغول است. لطفاً چند لحظه دیگر دوباره پیام دهید.' : error.message 
      });
    }
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

