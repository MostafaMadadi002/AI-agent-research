import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'dev-robot-0h7sp'
  });
}

const firestore = getFirestore();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
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
    const { query, depth, researchId, userId } = req.body;

    if (!query || !researchId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Update status to in_progress
      await firestore.collection('researches').doc(researchId).update({
        status: 'in_progress',
        updatedAt: FieldValue.serverTimestamp()
      });

      const prompt = `Conduct a ${depth} research on the following topic: "${query}". 
      Provide a comprehensive markdown report with:
      1. Executive Summary
      2. Key Findings
      3. Detailed Analysis
      4. Sources & Citations
      5. Conclusion
      
      Be thorough and ensure all information is accurate and well-structured.`;

      // Use any to bypass type issues with 'tools' in this SDK version
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      } as any);

      const report = response.text || '';
      
      await firestore.collection('researches').doc(researchId).update({
        report,
        status: 'completed',
        summary: report.substring(0, 1000) + '...',
        updatedAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true, report });
    } catch (error) {
      console.error('Research Error:', error);
      await firestore.collection('researches').doc(researchId).update({
        status: 'failed',
        updatedAt: FieldValue.serverTimestamp()
      });
      res.status(500).json({ error: 'Research failed' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const { researchId, message, history } = req.body;

    try {
      const researchDoc = await firestore.collection('researches').doc(researchId).get();
      const researchData = researchDoc.data();

      if (!researchData) {
        return res.status(404).json({ error: 'Research not found' });
      }

      const systemInstruction = `You are an expert research assistant. 
      The user is asking questions about the following research report:
      
      ${researchData.report}
      
      Use the research findings to answer the user's questions accurately. 
      If the information is not in the report, use your general knowledge but clarify it wasn't in the original research.`;

      const chat = ai.chats.create({
        model: "gemini-3.8-flash",
        config: {
          systemInstruction
        }
      });

      const response = await chat.sendMessage(message);

      res.json({ reply: response.text });
    } catch (error) {
      console.error('Chat Error:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  // Vite Integration
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await vite.transformIndexHtml(url, '');
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
