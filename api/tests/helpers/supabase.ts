import { createClient } from "@supabase/supabase-js";
import config, { ValidateConfig } from "[@BASE]/config/index.ts";

const createSupabaseClient = () => {
    ValidateConfig();
    return createClient(config.supabase.url, config.supabase.anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            flowType: "pkce",
        },
        db: {
            schema: "public",
        },
        global: {
            headers: {
                "x-application-name": config.app.name,
                "x-app-version": config.app.version,
                "x-client-info": "hono-api",
            },
        },
    });
};

/** 调试用：读取最近一条 profile */
export const getLastProfileId = async () => {
    const supabaseClient = createSupabaseClient();
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    console.log("last profile id: ", data?.id);
    console.log("error: ", error);
    return data?.id ?? "";
};
