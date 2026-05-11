-- ============================================================================
-- Admin access-event audit view.
--
-- The raw access_events table remains protected by RLS. This definer view gives
-- YORSO operators a read-only, joined audit surface for support and verification
-- without exposing it to buyers or suppliers. Non-admin users are filtered by
-- the has_role(auth.uid(), 'admin') predicate.
-- ============================================================================

DROP VIEW IF EXISTS public.access_events_admin;

CREATE VIEW public.access_events_admin
WITH (security_barrier = on) AS
SELECT
  e.id,
  e.event_type,
  e.created_at,
  e.actor_user_id,
  e.target_user_id,
  e.supplier_id,
  e.offer_id,
  e.grant_id,
  e.supplier_access_request_id,
  e.price_access_request_id,
  e.metadata,
  actor_profile.full_name AS actor_full_name,
  actor_profile.company_name AS actor_company_name,
  target_profile.full_name AS target_full_name,
  target_profile.company_name AS target_company_name,
  s.company_name AS supplier_company_name,
  s.country_code AS supplier_country_code,
  s.verification_status AS supplier_verification_status,
  o.product_name AS offer_product_name,
  o.origin_country_code AS offer_origin_country_code,
  supplier_request.status AS supplier_access_request_status,
  supplier_request.decided_at AS supplier_access_request_decided_at,
  price_request.status AS price_access_request_status,
  price_request.decided_at AS price_access_request_decided_at,
  g.scope AS grant_scope,
  g.starts_at AS grant_starts_at,
  g.expires_at AS grant_expires_at,
  g.revoked_at AS grant_revoked_at
FROM public.access_events e
LEFT JOIN public.profiles actor_profile
  ON actor_profile.user_id = e.actor_user_id
LEFT JOIN public.profiles target_profile
  ON target_profile.user_id = e.target_user_id
LEFT JOIN public.suppliers s
  ON s.id = e.supplier_id
LEFT JOIN public.offers o
  ON o.id = e.offer_id
LEFT JOIN public.supplier_access_requests supplier_request
  ON supplier_request.id = e.supplier_access_request_id
LEFT JOIN public.price_access_requests price_request
  ON price_request.id = e.price_access_request_id
LEFT JOIN public.access_grants g
  ON g.id = e.grant_id
WHERE public.has_role(auth.uid(), 'admin'::public.app_role);

GRANT SELECT ON public.access_events_admin TO authenticated;
REVOKE ALL ON public.access_events_admin FROM anon, public;

COMMENT ON VIEW public.access_events_admin IS
  'Read-only admin audit view for access_events with joined actor, target, supplier, offer, request and grant context. Non-admin users receive no rows.';

NOTIFY pgrst, 'reload schema';
