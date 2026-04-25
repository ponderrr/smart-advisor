-- =============================================================
-- RENAME MFA FACTOR
-- =============================================================
-- The MFA friendly_name lives on auth.mfa_factors, which isn't
-- exposed via PostgREST. This SECURITY DEFINER function lets the
-- owning user update their own factor's friendly_name without
-- granting broader access to the auth schema.

CREATE OR REPLACE FUNCTION public.rename_mfa_factor(
  p_factor_id UUID,
  p_new_name  TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_trimmed TEXT := NULLIF(TRIM(COALESCE(p_new_name, '')), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF v_trimmed IS NULL THEN
    RAISE EXCEPTION 'Name cannot be empty' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_trimmed) > 64 THEN
    RAISE EXCEPTION 'Name is too long' USING ERRCODE = '22023';
  END IF;

  UPDATE auth.mfa_factors
     SET friendly_name = v_trimmed,
         updated_at    = NOW()
   WHERE id = p_factor_id
     AND user_id = v_user_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.rename_mfa_factor(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_mfa_factor(UUID, TEXT) TO authenticated;
