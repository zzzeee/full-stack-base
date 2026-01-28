// index.ts
import { 
  // setAppConfig, 
  // setSupabaseConfig, 
  // setAuthConfig, 
  setBaseDir,
  ValidateConfig, 
  default as config,
} from "[@BASE]/config/index.ts";
import { dirname, fromFileUrl } from "@std/path";

// API项目根目录
const basePath = Deno.env.get("APP_BASE_PATH") || dirname(fromFileUrl(import.meta.url)) || Deno.cwd();

setBaseDir(basePath);

// ✅ 启动时先验证配置
ValidateConfig();

const port = config.app.port;

console.log(`🚀 Server running at http://localhost:${port}`);
console.log(`📦 Environment: ${config.app.environment}`);

// 注意：使用动态 import，确保 APP_BASE_DIR + config 先设置完成
const { default: app } = await import("[@BASE]/app.ts");
Deno.serve({ port }, app.fetch);