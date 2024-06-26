// lib/line.ts
import { Client, middleware, MiddlewareConfig, ClientConfig } from '@line/bot-sdk';

const channelAccessToken = process.env.NEXT_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
  throw new Error('Missing channel access token or channel secret');
}

const middlewareConfig: MiddlewareConfig = {
  channelAccessToken,
  channelSecret: channelSecret as string,
};

const clientConfig: ClientConfig = {
  channelAccessToken: channelAccessToken as string,
  channelSecret
};

const client = new Client(clientConfig);
const lineMiddleware = middleware(middlewareConfig);

export { client, lineMiddleware };
