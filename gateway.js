import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

function startMCPServer(name, internalPort, prefix, command) {
  console.log(`🚀 Starting ${name} MCP server on internal port ${internalPort}...`);
  const proc = spawn(
    'npx',
    [
      '-y',
      'supergateway',
      '--port', internalPort.toString(),
      '--ssePath', `${prefix}/sse`,
      '--messagePath', `${prefix}/message`,
      '--stdio', command
    ],
    { shell: true, stdio: 'inherit' }
  );

  proc.on('error', (err) => {
    console.error(`❌ Failed to start ${name}:`, err);
  });
}

// 1. Start internal Supergateways with explicit path prefixes
startMCPServer('Slack', 5001, '/slack', 'npx -y @modelcontextprotocol/server-slack');
startMCPServer('Gmail', 5002, '/gmail', 'npx -y @gongrzhe/server-gmail-autoauth-mcp');

const app = express();

// 2. Proxy requests straight through (NO pathRewrite needed)
app.use(
  '/slack',
  createProxyMiddleware({
    target: 'http://127.0.0.1:5001',
    changeOrigin: true
  })
);

app.use(
  '/gmail',
  createProxyMiddleware({
    target: 'http://127.0.0.1:5002',
    changeOrigin: true
  })
);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🌐 Single MCP Gateway Hub live on public port ${PORT}`);
});