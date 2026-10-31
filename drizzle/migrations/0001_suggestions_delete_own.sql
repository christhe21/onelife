GRANT DELETE ON public.suggestions TO authenticated;

CREATE POLICY "Users can delete their own suggestions"
ON public.suggestions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);