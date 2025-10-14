
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS "public"."gamification"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    new_gamification_record "public"."gamification";
BEGIN
    -- Check if a gamification record already exists for the user
    SELECT *
    INTO new_gamification_record
    FROM "public"."gamification"
    WHERE "user_id" = auth.uid();

    -- If no record exists, create one
    IF new_gamification_record IS NULL THEN
        INSERT INTO "public"."gamification" ("user_id", "total_points", "level")
        VALUES (auth.uid(), 100, 1)
        RETURNING * INTO new_gamification_record;
    END IF;

    -- Return the gamification record
    RETURN new_gamification_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user_onboarding() TO "authenticated";
