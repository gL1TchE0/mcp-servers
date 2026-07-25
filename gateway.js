import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

// Helper function to spawn background MCP servers on internal ports
function startMCPServer(name, internalPort, command) {
  console.log(`🚀 Starting ${name} MCP server on internal port ${internalPort}...`);
  const process = spawn(
    'npx',
    ['-y', 'supergateway', '--port', internalPort.toString(), '--stdio', command],
    { shell: true, stdio: 'inherit' }
  );

  process.on('error', (err) => {
    console.error(`❌ Failed to start ${name}:`, err);
  });
}

// 1. Start internal Supergateways on isolated internal ports
startMCPServer('Slack', 3001, 'npx -y @modelcontextprotocol/server-slack');
startMCPServer('Gmail', 3002, 'npx -y @gongrzhe/server-gmail-autoauth-mcp');
// Want to add GitHub later? Just add 1 line here:
// startMCPServer('GitHub', 3003, 'npx -y @modelcontextprotocol/server-github');

// 2. Initialize Express Gateway Server
const app = express();

// Route /slack -> Internal Port 3001
app.use(
  '/slack',
  createProxyMiddleware({
    target: 'http://127.0.0.1:3001',
    changeOrigin: true,
    pathRewrite: { '^/slack': '' }
  })
);

// Route /gmail -> Internal Port 3002
app.use(
  '/gmail',
  createProxyMiddleware({
    target: 'http://127.0.0.1:3002',
    changeOrigin: true,
    pathRewrite: { '^/gmail': '' }
  })
);

// 3. Bind Express to Render's public PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🌐 Single MCP Gateway Hub live on public port ${PORT}`);
});