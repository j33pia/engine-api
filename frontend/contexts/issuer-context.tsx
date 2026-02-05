"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";

export interface Issuer {
  id: string;
  name: string;
  cnpj: string;
  tradeName?: string;
  ie?: string;
  im?: string;
  crt?: number;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

// Representa "Todos os emissores"
export const ALL_ISSUERS: Issuer = {
  id: "ALL",
  name: "Todos os Emissores",
  cnpj: "",
};

interface IssuerContextType {
  issuers: Issuer[];
  selectedIssuer: Issuer | null;
  loading: boolean;
  selectIssuer: (issuer: Issuer) => void;
  selectAll: () => void;
  refreshIssuers: () => Promise<void>;
  addIssuer: (issuer: Issuer) => void;
  isAllSelected: boolean;
}

const IssuerContext = createContext<IssuerContextType | undefined>(undefined);

export function IssuerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<Issuer | null>(
    ALL_ISSUERS,
  );
  const [loading, setLoading] = useState(true);

  const fetchIssuers = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/companies", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const data = response.data as Issuer[];
      setIssuers(data);

      // Restaurar seleção do localStorage ou manter "Todos"
      const savedId = localStorage.getItem("selectedIssuerId");
      if (savedId && savedId !== "ALL") {
        const saved = data.find((i: Issuer) => i.id === savedId);
        if (saved) {
          setSelectedIssuer(saved);
        }
      }
      // Se não encontrou ou era ALL, mantém ALL_ISSUERS
    } catch (error) {
      console.error("Erro ao buscar emissores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchIssuers();
    }
  }, [session?.accessToken]);

  const selectIssuer = (issuer: Issuer) => {
    setSelectedIssuer(issuer);
    localStorage.setItem("selectedIssuerId", issuer.id);
  };

  const selectAll = () => {
    setSelectedIssuer(ALL_ISSUERS);
    localStorage.setItem("selectedIssuerId", "ALL");
  };

  const addIssuer = (issuer: Issuer) => {
    setIssuers((prev) => [...prev, issuer]);
    selectIssuer(issuer);
  };

  const refreshIssuers = async () => {
    await fetchIssuers();
  };

  const isAllSelected = selectedIssuer?.id === "ALL";

  return (
    <IssuerContext.Provider
      value={{
        issuers,
        selectedIssuer,
        loading,
        selectIssuer,
        selectAll,
        refreshIssuers,
        addIssuer,
        isAllSelected,
      }}
    >
      {children}
    </IssuerContext.Provider>
  );
}

export function useIssuer() {
  const context = useContext(IssuerContext);
  if (context === undefined) {
    throw new Error("useIssuer deve ser usado dentro de IssuerProvider");
  }
  return context;
}
