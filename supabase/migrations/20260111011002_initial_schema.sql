
  create table "public"."products" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" character varying(255) not null,
    "description" text,
    "price" numeric(10,2) not null default 0,
    "stock" integer default 0,
    "user_id" uuid,
    "is_public" boolean default true,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."products" enable row level security;


  create table "public"."user_verifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "verification_type" character varying(20) not null,
    "target" character varying(255) not null,
    "otp_code" character varying(10) not null,
    "is_verified" boolean default false,
    "attempts" integer default 0,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone not null,
    "verified_at" timestamp with time zone,
    "ip_address" inet,
    "user_agent" text
      );


alter table "public"."user_verifications" enable row level security;


  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" character varying(255) not null,
    "nickname" character varying(100),
    "phone" character varying(20),
    "avatar" text,
    "bio" text,
    "email_verified" boolean default false,
    "phone_verified" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC);

CREATE INDEX idx_products_is_public ON public.products USING btree (is_public) WHERE (is_public = true);

CREATE INDEX idx_products_user_id ON public.products USING btree (user_id);

CREATE INDEX idx_user_verifications_expires ON public.user_verifications USING btree (expires_at);

CREATE INDEX idx_user_verifications_target ON public.user_verifications USING btree (target);

CREATE INDEX idx_user_verifications_type ON public.user_verifications USING btree (verification_type);

CREATE INDEX idx_user_verifications_user_id ON public.user_verifications USING btree (user_id);

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_email_verified ON public.users USING btree (email_verified);

CREATE INDEX idx_users_phone ON public.users USING btree (phone);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX user_verifications_pkey ON public.user_verifications USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."user_verifications" add constraint "user_verifications_pkey" PRIMARY KEY using index "user_verifications_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."products" add constraint "products_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."products" validate constraint "products_user_id_fkey";

alter table "public"."user_verifications" add constraint "user_verifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_verifications" validate constraint "user_verifications_user_id_fkey";

alter table "public"."user_verifications" add constraint "valid_verification_type" CHECK (((verification_type)::text = ANY ((ARRAY['email'::character varying, 'phone'::character varying, 'password_reset'::character varying])::text[]))) not valid;

alter table "public"."user_verifications" validate constraint "valid_verification_type";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "valid_email" CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)) not valid;

alter table "public"."users" validate constraint "valid_email";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE email = p_email);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_otp_verification(p_user_id uuid, p_verification_type character varying, p_target character varying, p_otp_code character varying, p_expires_minutes integer DEFAULT 5)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_verification_id UUID;
BEGIN
  -- 清理过期的验证记录
  DELETE FROM user_verifications 
  WHERE user_id = p_user_id 
    AND verification_type = p_verification_type
    AND target = p_target
    AND expires_at < NOW();
  
  -- 创建新的验证记录
  INSERT INTO user_verifications (
    user_id,
    verification_type,
    target,
    otp_code,
    expires_at
  ) VALUES (
    p_user_id,
    p_verification_type,
    p_target,
    p_otp_code,
    NOW() + (p_expires_minutes || ' minutes')::INTERVAL
  ) RETURNING id INTO v_verification_id;
  
  RETURN v_verification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_verification_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
    -- 根据验证类型更新 users 表
    IF NEW.verification_type = 'email' THEN
      UPDATE users 
      SET email_verified = TRUE,
          updated_at = NOW()
      WHERE id = NEW.user_id 
        AND email = NEW.target;
        
    ELSIF NEW.verification_type = 'phone' THEN
      UPDATE users 
      SET phone_verified = TRUE,
          updated_at = NOW()
      WHERE id = NEW.user_id 
        AND phone = NEW.target;
    END IF;
    
    -- 设置验证完成时间
    NEW.verified_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_otp_code(p_user_id uuid, p_verification_type character varying, p_target character varying, p_otp_code character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_verification_record user_verifications%ROWTYPE;
BEGIN
  -- 查找有效的验证记录
  SELECT * INTO v_verification_record
  FROM user_verifications
  WHERE user_id = p_user_id
    AND verification_type = p_verification_type
    AND target = p_target
    AND otp_code = p_otp_code
    AND is_verified = FALSE
    AND expires_at > NOW()
    AND attempts < 3  -- 最多尝试3次
  FOR UPDATE;  -- 锁定记录防止并发更新
  
  IF NOT FOUND THEN
    -- 记录尝试失败
    UPDATE user_verifications
    SET attempts = attempts + 1
    WHERE user_id = p_user_id
      AND verification_type = p_verification_type
      AND target = p_target
      AND expires_at > NOW();
    
    RETURN FALSE;
  END IF;
  
  -- 标记为已验证
  UPDATE user_verifications
  SET is_verified = TRUE,
      verified_at = NOW()
  WHERE id = v_verification_record.id;
  
  RETURN TRUE;
END;
$function$
;

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "postgres";

grant insert on table "public"."products" to "postgres";

grant references on table "public"."products" to "postgres";

grant select on table "public"."products" to "postgres";

grant trigger on table "public"."products" to "postgres";

grant truncate on table "public"."products" to "postgres";

grant update on table "public"."products" to "postgres";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."user_verifications" to "anon";

grant insert on table "public"."user_verifications" to "anon";

grant references on table "public"."user_verifications" to "anon";

grant select on table "public"."user_verifications" to "anon";

grant trigger on table "public"."user_verifications" to "anon";

grant truncate on table "public"."user_verifications" to "anon";

grant update on table "public"."user_verifications" to "anon";

grant delete on table "public"."user_verifications" to "authenticated";

grant insert on table "public"."user_verifications" to "authenticated";

grant references on table "public"."user_verifications" to "authenticated";

grant select on table "public"."user_verifications" to "authenticated";

grant trigger on table "public"."user_verifications" to "authenticated";

grant truncate on table "public"."user_verifications" to "authenticated";

grant update on table "public"."user_verifications" to "authenticated";

grant delete on table "public"."user_verifications" to "postgres";

grant insert on table "public"."user_verifications" to "postgres";

grant references on table "public"."user_verifications" to "postgres";

grant select on table "public"."user_verifications" to "postgres";

grant trigger on table "public"."user_verifications" to "postgres";

grant truncate on table "public"."user_verifications" to "postgres";

grant update on table "public"."user_verifications" to "postgres";

grant delete on table "public"."user_verifications" to "service_role";

grant insert on table "public"."user_verifications" to "service_role";

grant references on table "public"."user_verifications" to "service_role";

grant select on table "public"."user_verifications" to "service_role";

grant trigger on table "public"."user_verifications" to "service_role";

grant truncate on table "public"."user_verifications" to "service_role";

grant update on table "public"."user_verifications" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "postgres";

grant insert on table "public"."users" to "postgres";

grant references on table "public"."users" to "postgres";

grant select on table "public"."users" to "postgres";

grant trigger on table "public"."users" to "postgres";

grant truncate on table "public"."users" to "postgres";

grant update on table "public"."users" to "postgres";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "products_manage_own"
  on "public"."products"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "products_select_public"
  on "public"."products"
  as permissive
  for select
  to public
using ((is_public = true));



  create policy "verifications_insert_own"
  on "public"."user_verifications"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "verifications_select_own"
  on "public"."user_verifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "verifications_update_own"
  on "public"."user_verifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "users_select_email_check"
  on "public"."users"
  as permissive
  for select
  to public
using (true);



  create policy "users_select_own"
  on "public"."users"
  as permissive
  for all
  to public
using ((auth.uid() = id));


CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_verification_status BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.update_user_verification_status();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


