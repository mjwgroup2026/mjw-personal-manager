
-- Set existing users to approved so they don't get locked out
UPDATE public.profiles SET access_status = 'approved' WHERE access_status = 'pending';
