
-- =========================================================
-- 1) ORGANIZATIONS
-- =========================================================
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 2) SUBSCRIPTION PLANS
-- =========================================================
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  max_clients integer NOT NULL DEFAULT 0,
  max_diets_per_month integer NOT NULL DEFAULT 0,
  max_pdfs_per_month integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.subscription_plans
  (code, name, description, price_cents, max_clients, max_diets_per_month, max_pdfs_per_month, features, sort_order)
VALUES
  ('starter','Starter','Para nutricionistas começando',9900,20,40,40,
    '{"ai_chat":true,"pdf":true,"email":true,"whatsapp":false}'::jsonb,1),
  ('professional','Professional','Para profissionais ativos',19900,100,200,200,
    '{"ai_chat":true,"pdf":true,"email":true,"whatsapp":true}'::jsonb,2),
  ('clinic','Clinic','Para clínicas e equipes',49900,500,1000,1000,
    '{"ai_chat":true,"pdf":true,"email":true,"whatsapp":true,"multi_user":true}'::jsonb,3),
  ('enterprise','Enterprise','Personalizado para grandes clínicas',0,0,0,0,
    '{"ai_chat":true,"pdf":true,"email":true,"whatsapp":true,"multi_user":true,"sla":true,"custom":true}'::jsonb,4);

-- =========================================================
-- 3) SUBSCRIPTIONS
-- =========================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trialing',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  provider text,
  provider_subscription_id text,
  checkout_url text,
  payment_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_org ON public.subscriptions(organization_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4) USAGE COUNTERS
-- =========================================================
CREATE TABLE public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  active_clients integer NOT NULL DEFAULT 0,
  diets_generated integer NOT NULL DEFAULT 0,
  pdfs_generated integer NOT NULL DEFAULT 0,
  emails_sent integer NOT NULL DEFAULT 0,
  chat_messages integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_year, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_usage_updated BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 5) WEBHOOK LOGS
-- =========================================================
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'received',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 6) ADD organization_id COLUMNS
-- =========================================================
ALTER TABLE public.profiles          ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.diets             ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.questionnaires    ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.check_ins         ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages     ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.email_logs        ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.pdf_logs          ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.foods             ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.food_substitutions ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =========================================================
-- 7) HELPERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin'))
$$;

-- =========================================================
-- 8) BACKFILL
-- =========================================================
INSERT INTO public.organizations (name, slug, owner_user_id)
SELECT
  COALESCE(p.full_name, 'Organização'),
  'org-' || substr(ur.user_id::text, 1, 8) || '-' || floor(random()*100000)::text,
  ur.user_id
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role = 'nutricionista'
  AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_user_id = ur.user_id);

UPDATE public.profiles p SET organization_id = o.id
  FROM public.organizations o WHERE o.owner_user_id = p.id AND p.organization_id IS NULL;

UPDATE public.profiles p
SET organization_id = (
  SELECT pn.organization_id FROM public.diets d
  JOIN public.profiles pn ON pn.id = d.nutritionist_id
  WHERE d.client_id = p.id AND pn.organization_id IS NOT NULL LIMIT 1
)
WHERE p.organization_id IS NULL
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'cliente');

UPDATE public.diets d SET organization_id = pn.organization_id
  FROM public.profiles pn WHERE pn.id = d.nutritionist_id AND d.organization_id IS NULL;
UPDATE public.diets d SET organization_id = pc.organization_id
  FROM public.profiles pc WHERE pc.id = d.client_id AND d.organization_id IS NULL;
UPDATE public.questionnaires q SET organization_id = p.organization_id
  FROM public.profiles p WHERE p.id = q.client_id AND q.organization_id IS NULL;
UPDATE public.check_ins c SET organization_id = p.organization_id
  FROM public.profiles p WHERE p.id = c.client_id AND c.organization_id IS NULL;
UPDATE public.chat_messages c SET organization_id = p.organization_id
  FROM public.profiles p WHERE p.id = c.client_id AND c.organization_id IS NULL;
UPDATE public.email_logs e SET organization_id = p.organization_id
  FROM public.profiles p WHERE p.id = e.user_id AND e.organization_id IS NULL;
UPDATE public.pdf_logs l SET organization_id = d.organization_id
  FROM public.diets d WHERE d.id = l.diet_id AND l.organization_id IS NULL;

INSERT INTO public.subscriptions (organization_id, plan_id, status, provider)
SELECT o.id, p.id, 'active', 'manual'
FROM public.organizations o
CROSS JOIN public.subscription_plans p
WHERE p.code = 'starter'
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.organization_id = o.id);

-- =========================================================
-- 9) handle_new_user creates org for nutricionista
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cliente');
  _org_id uuid;
  _starter_plan uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  IF _role = 'nutricionista' THEN
    INSERT INTO public.organizations (name, slug, owner_user_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name','Organização'),
      'org-' || substr(NEW.id::text,1,8) || '-' || floor(random()*100000)::text,
      NEW.id
    ) RETURNING id INTO _org_id;

    UPDATE public.profiles SET organization_id = _org_id WHERE id = NEW.id;

    SELECT id INTO _starter_plan FROM public.subscription_plans WHERE code='starter' LIMIT 1;
    IF _starter_plan IS NOT NULL THEN
      INSERT INTO public.subscriptions (organization_id, plan_id, status, provider)
      VALUES (_org_id, _starter_plan, 'active', 'manual');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =========================================================
-- 10) RLS POLICIES — NEW TABLES
-- =========================================================
CREATE POLICY org_super_admin_all ON public.organizations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY org_member_select ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_organization_id(auth.uid()));
CREATE POLICY org_owner_update ON public.organizations FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY plans_public_read ON public.subscription_plans FOR SELECT TO anon, authenticated USING (status='active');
CREATE POLICY plans_admin_write ON public.subscription_plans FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY subs_super_admin_all ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY subs_member_select ON public.subscriptions FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY subs_owner_update ON public.subscriptions FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY usage_super_admin_all ON public.usage_counters FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY usage_member_select ON public.usage_counters FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY webhook_super_admin_select ON public.webhook_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- =========================================================
-- 11) UPDATE EXISTING POLICIES
-- =========================================================
DROP POLICY IF EXISTS profiles_select_by_nutri ON public.profiles;
CREATE POLICY profiles_select_org ON public.profiles FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR id = auth.uid()
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
         AND organization_id = public.get_user_organization_id(auth.uid()))
  );

DROP POLICY IF EXISTS diets_nutri_all ON public.diets;
DROP POLICY IF EXISTS diets_client_read_approved ON public.diets;
CREATE POLICY diets_super_admin_all ON public.diets FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY diets_nutri_org ON public.diets FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
         AND organization_id = public.get_user_organization_id(auth.uid()))
  WITH CHECK ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
              AND organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY diets_client_read ON public.diets FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS q_nutri_read ON public.questionnaires;
DROP POLICY IF EXISTS q_nutri_update ON public.questionnaires;
CREATE POLICY q_nutri_org ON public.questionnaires FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
        AND organization_id = public.get_user_organization_id(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid())
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
        AND organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS ci_nutri_read ON public.check_ins;
CREATE POLICY ci_nutri_org ON public.check_ins FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
        AND organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS chat_nutri_read ON public.chat_messages;
CREATE POLICY chat_nutri_org ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
        AND organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Clients see own email logs" ON public.email_logs;
CREATE POLICY email_logs_select ON public.email_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
        AND organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Client sees own pdf logs" ON public.pdf_logs;
CREATE POLICY pdf_logs_select ON public.pdf_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR client_id = auth.uid()
    OR ((public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
        AND organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Foods readable by authenticated" ON public.foods;
CREATE POLICY foods_read_scope ON public.foods FOR SELECT TO authenticated
  USING (organization_id IS NULL
    OR organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Subs readable by authenticated" ON public.food_substitutions;
CREATE POLICY food_subs_read_scope ON public.food_substitutions FOR SELECT TO authenticated
  USING (organization_id IS NULL
    OR organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_super_admin(auth.uid()));

-- =========================================================
-- 12) USAGE TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.bump_usage(_org uuid, _field text, _by int DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _y int := extract(year from now())::int;
  _m int := extract(month from now())::int;
BEGIN
  IF _org IS NULL THEN RETURN; END IF;
  INSERT INTO public.usage_counters (organization_id, period_year, period_month)
    VALUES (_org, _y, _m) ON CONFLICT (organization_id, period_year, period_month) DO NOTHING;
  EXECUTE format(
    'UPDATE public.usage_counters SET %I = %I + $1, updated_at = now() WHERE organization_id = $2 AND period_year = $3 AND period_month = $4',
    _field, _field
  ) USING _by, _org, _y, _m;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_bump_diet() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.bump_usage(NEW.organization_id,'diets_generated',1); RETURN NEW; END; $$;
CREATE TRIGGER usage_bump_diet AFTER INSERT ON public.diets
  FOR EACH ROW EXECUTE FUNCTION public.trg_bump_diet();

CREATE OR REPLACE FUNCTION public.trg_bump_pdf() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.bump_usage(NEW.organization_id,'pdfs_generated',1); RETURN NEW; END; $$;
CREATE TRIGGER usage_bump_pdf AFTER INSERT ON public.pdf_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_bump_pdf();

CREATE OR REPLACE FUNCTION public.trg_bump_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'sent' THEN PERFORM public.bump_usage(NEW.organization_id,'emails_sent',1); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER usage_bump_email AFTER INSERT ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_bump_email();

CREATE OR REPLACE FUNCTION public.trg_bump_chat() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.bump_usage(NEW.organization_id,'chat_messages',1); RETURN NEW; END; $$;
CREATE TRIGGER usage_bump_chat AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.trg_bump_chat();

-- =========================================================
-- 13) LIMIT CHECK
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_org_limit(_org uuid, _field text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _plan public.subscription_plans;
  _used int := 0;
  _limit int := 0;
  _y int := extract(year from now())::int;
  _m int := extract(month from now())::int;
BEGIN
  SELECT p.* INTO _plan
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE s.organization_id = _org AND s.status IN ('active','trialing')
    ORDER BY s.created_at DESC LIMIT 1;
  IF _plan IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','no_plan'); END IF;

  IF _field = 'clients' THEN
    SELECT count(*) INTO _used FROM public.profiles pr
      JOIN public.user_roles r ON r.user_id = pr.id
      WHERE pr.organization_id = _org AND r.role='cliente';
    _limit := _plan.max_clients;
  ELSIF _field = 'diets' THEN
    SELECT COALESCE(diets_generated,0) INTO _used FROM public.usage_counters
      WHERE organization_id=_org AND period_year=_y AND period_month=_m;
    _limit := _plan.max_diets_per_month;
  ELSIF _field = 'pdfs' THEN
    SELECT COALESCE(pdfs_generated,0) INTO _used FROM public.usage_counters
      WHERE organization_id=_org AND period_year=_y AND period_month=_m;
    _limit := _plan.max_pdfs_per_month;
  END IF;

  IF _limit = 0 THEN RETURN jsonb_build_object('allowed',true,'used',_used,'limit','unlimited'); END IF;
  RETURN jsonb_build_object('allowed', _used < _limit, 'used', _used, 'limit', _limit);
END;
$$;
