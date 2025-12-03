-- Supabase function to increment assessment count
-- This is a helper function (optional - we're using direct update in code)

CREATE OR REPLACE FUNCTION increment_assessment_count(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET assessment_count = assessment_count + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

