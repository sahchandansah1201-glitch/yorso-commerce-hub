-- Grant SELECT on public views to API roles so PostgREST can include them in
-- its schema cache. Без этих грантов PostgREST бесконечно отвечает PGRST002
-- "Could not query the database for the schema cache" для этих view.
GRANT SELECT ON public.offers_public TO anon, authenticated;
GRANT SELECT ON public.suppliers_public TO anon, authenticated;

-- Перезагружаем schema cache PostgREST, чтобы изменения применились без задержки.
NOTIFY pgrst, 'reload schema';