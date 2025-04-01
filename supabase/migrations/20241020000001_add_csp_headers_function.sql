-- Create a function to add CSP headers to all responses
CREATE OR REPLACE FUNCTION add_csp_headers()
RETURNS TRIGGER AS $$
BEGIN
  -- Add Content Security Policy headers to all HTTP responses
  NEW.headers = jsonb_set(
    COALESCE(NEW.headers, '{}'::jsonb),
    '{Content-Security-Policy}',
    '"default-src \'self\'; script-src \'self\'; connect-src \'self\' https://*.supabase.co; img-src \'self\' data: https://*.supabase.co https://images.unsplash.com; style-src \'self\' \'unsafe-inline\'; frame-ancestors \'none\'"'::jsonb
  );
  
  -- Add additional security headers
  NEW.headers = jsonb_set(NEW.headers, '{X-Content-Type-Options}', '"nosniff"'::jsonb);
  NEW.headers = jsonb_set(NEW.headers, '{X-Frame-Options}', '"DENY"'::jsonb);
  NEW.headers = jsonb_set(NEW.headers, '{Referrer-Policy}', '"strict-origin-when-cross-origin"'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This function is created but not attached to any trigger.
-- It can be used as a reference for manually adding CSP headers to responses
-- or could be attached to a trigger if there's a table that stores HTTP responses.