// app/api/webhook/route.ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { lineWebhookController } from '../../backend/controllers/lineWebhookController';

// Honoアプリケーションの作成
const app = new Hono();

// LINEのWebhookエンドポイントを設定
app.post('/api/webhook', lineWebhookController.handleWebhook);

// Vercelでのハンドリング
export const POST = handle(app);