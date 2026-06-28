
-- Automatic audit logging trigger for transactions
CREATE OR REPLACE FUNCTION public.log_transaction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
    VALUES ('transactions', NEW.id, 'create', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, reason, user_id)
    VALUES ('transactions', NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), NEW.edit_reason, COALESCE(NEW.modified_by, NEW.created_by));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- Audit logging for entities
CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
    VALUES ('entities', NEW.id, 'create', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, user_id)
    VALUES ('entities', NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_entities
  AFTER INSERT OR UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();
