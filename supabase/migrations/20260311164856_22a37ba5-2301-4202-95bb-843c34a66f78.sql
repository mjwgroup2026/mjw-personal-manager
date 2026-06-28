
CREATE OR REPLACE FUNCTION public.auto_add_entity_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.entity_members (entity_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_entity_member ON public.entities;

CREATE TRIGGER trg_auto_add_entity_member
  AFTER INSERT ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_entity_member();
