import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Entity = Tables<"entities">;

interface EntityContextType {
  entities: Entity[];
  selectedEntity: Entity | null;
  setSelectedEntityId: (id: string) => void;
  loading: boolean;
  refetch: () => void;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export const EntityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntities = async () => {
    if (!user) {
      setEntities([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("entities").select("*").order("legal_name");
    const list = data ?? [];
    setEntities(list);
    if (!selectedEntityId && list.length > 0) {
      setSelectedEntityId(list[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, [user]);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? null;

  return (
    <EntityContext.Provider
      value={{ entities, selectedEntity, setSelectedEntityId, loading, refetch: fetchEntities }}
    >
      {children}
    </EntityContext.Provider>
  );
};

export const useEntity = () => {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
};
