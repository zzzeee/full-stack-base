-- 展会 LOGO（URL 或存储路径）

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.events.logo_url IS '展会 LOGO 图片 URL';
