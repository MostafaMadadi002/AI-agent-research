import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyC4eUNLAG9iKkjSov_jcxqA_fvp3xeu0Ok',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/research', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: `Conduct a detailed research report on: "${query}". 
        Include: ## Summary, ## Key Points, ## Analysis, and ## Sources.
        Format in Markdown.`,
        tools: [{ type: 'google_search' }]
      });

      let fullOutput = "";
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          const textContent = step.content?.find(c => c.type === 'text');
          if (textContent && textContent.text) {
            fullOutput += textContent.text;
          }
        }
      }

      return res.json({ report: fullOutput || 'No report generated.' });
    } catch (error: any) {
      console.error('[API Error] Research:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const { message, report } = req.body;
    if (!message || !report) return res.status(400).json({ error: 'Missing data' });

    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.1-flash-lite",
        input: message,
        system_instruction: `Answer questions based on this report: ${report}`
      });
      
      let reply = "";
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          const textContent = step.content?.find(c => c.type === 'text');
          if (textContent && textContent.text) {
            reply += textContent.text;
          }
        }
      }
      return res.json({ reply });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
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
    console.log(`[Server] Running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Critical start error:', err);
});
