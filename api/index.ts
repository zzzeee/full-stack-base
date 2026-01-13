// index.ts
import { validateConfig, config } from './src/config/index.ts';
import app from './src/app.ts';

// ✅ 启动时先验证配置
validateConfig();

const port = config.app.port;

console.log(`🚀 Server running at http://localhost:${port}`);
console.log(`📦 Environment: ${config.app.environment}`);

Deno.serve({ port }, app.fetch);