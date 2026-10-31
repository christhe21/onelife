CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  text text NOT NULL,
  source text NOT NULL DEFAULT 'app',
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users add own suggestions" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND length(text) BETWEEN 1 AND 4000);
CREATE POLICY "Users read own suggestions" ON public.suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);