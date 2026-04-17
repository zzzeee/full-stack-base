#!/usr/bin/env node
/**
 * 最小「生成约定」示例：不传参时打印标准 feature 目录说明。
 * 后续可接 Plop / Hygen，把模板写入 web/src/features/<name>/ 。
 *
 * 用法: node scripts/scaffold-feature.mjs <feature-name>
 */
const name = process.argv[2]

if (!name) {
    console.log(`
用法: node scripts/scaffold-feature.mjs <feature-name>

建议目录（与 docs/architecture/web.md 一致）:
  web/src/features/<name>/
    components/
    services/
    types/
    index.ts          # 可选：统一导出

页面仅做路由与组合，业务 UI 放在 features/<name>/components 。
`)
    process.exit(0)
}

const slug = String(name).replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()
console.log(`下一步: 在 web/src/features/${slug}/ 下按上述结构新建文件，并在 app/ 中增加路由页面。`)
