import { serve } from '@hono/node-server';
import { app } from './src/server';

const port = Number(process.env.PORT ?? 3000);
const server = serve({ port, fetch: (req) => app.fetch(req, new Request(req)) });
server.onListen(() => console.log(`AIVerse running on :${port}`));
