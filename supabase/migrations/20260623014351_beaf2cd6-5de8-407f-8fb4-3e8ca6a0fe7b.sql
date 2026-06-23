
CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_taco text UNIQUE,
  nome text NOT NULL,
  categoria text NOT NULL,
  porcao_referencia text NOT NULL DEFAULT '100g',
  calorias numeric(8,2) NOT NULL DEFAULT 0,
  proteinas numeric(8,2) NOT NULL DEFAULT 0,
  carboidratos numeric(8,2) NOT NULL DEFAULT 0,
  gorduras numeric(8,2) NOT NULL DEFAULT 0,
  fibras numeric(8,2) DEFAULT 0,
  sodio numeric(8,2) DEFAULT 0,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX foods_nome_idx ON public.foods USING gin (to_tsvector('simple', nome));
CREATE INDEX foods_categoria_idx ON public.foods(categoria);
CREATE INDEX foods_ativo_idx ON public.foods(ativo);

CREATE TABLE public.food_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  substitute_food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  equivalencia text NOT NULL DEFAULT '1:1',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(food_id, substitute_food_id),
  CHECK (food_id <> substitute_food_id)
);
CREATE INDEX food_substitutions_food_idx ON public.food_substitutions(food_id);

GRANT SELECT ON public.foods TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;

GRANT SELECT ON public.food_substitutions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.food_substitutions TO authenticated;
GRANT ALL ON public.food_substitutions TO service_role;

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Foods readable by authenticated" ON public.foods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Foods managed by staff insert" ON public.foods FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Foods managed by staff update" ON public.foods FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Foods managed by staff delete" ON public.foods FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Subs readable by authenticated" ON public.food_substitutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Subs managed by staff insert" ON public.food_substitutions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Subs managed by staff update" ON public.food_substitutions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Subs managed by staff delete" ON public.food_substitutions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER foods_set_updated_at BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
