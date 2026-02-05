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
  city?: string;
  state?: string;
}

interface IssuerContextType {
  issuers: Issuer[];
  selectedIssuer: Issuer | null;
  loading: boolean;
  selectIssuer: (issuer: Issuer) => void;
  refreshIssuers: () => Promise<void>;
  addIssuer: (issuer: Issuer) => void;
}

const IssuerContext = createContext<IssuerContextType | undefined>(undefined);

export function IssuerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<Issuer | null>(null);
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

      // Restaurar seleção do localStorage ou selecionar primeiro
      const savedId = localStorage.getItem("selectedIssuerId");
      const saved = data.find((i: Issuer) => i.id === savedId);
      if (saved) {
        setSelectedIssuer(saved);
      } else if (data.length > 0) {
        setSelectedIssuer(data[0]);
        localStorage.setItem("selectedIssuerId", data[0].id);
      }
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

  const addIssuer = (issuer: Issuer) => {
    setIssuers((prev) => [...prev, issuer]);
    selectIssuer(issuer);
  };

  const refreshIssuers = async () => {
    await fetchIssuers();
  };

  return (
    <IssuerContext.Provider
      value={{
        issuers,
        selectedIssuer,
        loading,
        selectIssuer,
        refreshIssuers,
        addIssuer,
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
