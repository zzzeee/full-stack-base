// scripts/generate-types.ts
/**
 * 从 Supabase 生成 TypeScript 类型
 * 使用方法：deno task gen:types
 * 保存文件: src/types/database.types.ts
 */
import { config } from '@config/index.ts';

function isLocalSupabase(url: string) {
    return url.includes('localhost') || url.includes('127.0.0.1');
}

async function generateTypes() {
    console.log('🔄 Generating Supabase types...');

    const isLocal = isLocalSupabase(config.supabase.url);

    const args: string[] = ['gen', 'types', 'typescript'];

    if (isLocal) {
        console.log('🧪 Using local Supabase');
        args.push('--local');
    } else {
        console.log('☁️ Using remote Supabase');

        const projectId =
            config.supabase.url.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

        if (!projectId) {
            console.error('❌ Could not extract project ID from SUPABASE_URL');
            Deno.exit(1);
        }

        args.push('--project-id', projectId);
    }

    const cmd = new Deno.Command('supabase', {
        args,
        stdout: 'piped',
        stderr: 'piped',
    });

    const { stdout, stderr, success } = await cmd.output();

    if (!success) {
        console.error('❌ Failed to generate types:');
        console.error(new TextDecoder().decode(stderr));
        Deno.exit(1);
    }

    const types = new TextDecoder().decode(stdout);
    await Deno.writeTextFile('src/types/database.types.ts', types);

    console.log('✅ Types generated successfully!');
}

if (import.meta.main) {
    generateTypes();
}
