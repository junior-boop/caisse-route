import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { initDatabase } from "@/Database";
import { Collections, type Collection } from "@/Database/collections";
import { Produits, type Produit } from "@/Database/produits";
import { Users, type User } from "@/Database/users";
import { Mouvements, type Mouvement } from "@/Database/mouvements";
import { Sessions, type Session } from "@/Database/sessions";

export type CollectionAvecProduits = Collection & { produits: Produit[] };

function dateDuJour() {
  return new Date().toISOString().slice(0, 10);
}

const HEURE_FERMETURE_AUTO = { heures: 21, minutes: 30 };

function estApresHeureFermeture(date: Date) {
  const { heures, minutes } = HEURE_FERMETURE_AUTO;
  return date.getHours() > heures || (date.getHours() === heures && date.getMinutes() >= minutes);
}

function prochaineHeureFermeture(date: Date) {
  const prochaine = new Date(date);
  prochaine.setHours(HEURE_FERMETURE_AUTO.heures, HEURE_FERMETURE_AUTO.minutes, 0, 0);
  if (prochaine.getTime() <= date.getTime()) {
    prochaine.setDate(prochaine.getDate() + 1);
  }
  return prochaine;
}

type DatabaseContextValue = {
  ready: boolean;
  collections: CollectionAvecProduits[];
  produits: Produit[];
  users: User[];
  mouvements: Mouvement[];
  sessions: Session[];
  sessionDuJour: Session | null;
  creerCollection: (data: Partial<Collection>) => Promise<Collection>;
  creerProduit: (data: Partial<Produit>) => Promise<Produit>;
  modifierProduit: (id: number, data: Partial<Produit>) => Promise<void>;
  supprimerProduit: (id: number) => Promise<void>;
  creerMouvement: (data: Partial<Mouvement>) => Promise<Mouvement>;
  supprimerMouvement: (id: number) => Promise<void>;
  creerUser: (data: Partial<User>) => Promise<User>;
  fermerSessionDuJour: () => Promise<void>;
  creerNouvelleSession: () => Promise<void>;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [collections, setCollections] = useState<CollectionAvecProduits[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const rafraichirCollections = useCallback(async () => {
    const data = await Collections.findAll({
      include: { model: "produits", foreignKey: "collections_id", localKey: "id", as: "produits" },
      orderBy: { column: "name", direction: "ASC" },
    });
    setCollections(data as CollectionAvecProduits[]);
  }, []);

  const rafraichirProduits = useCallback(async () => {
    const data = await Produits.findAll({ orderBy: { column: "name", direction: "ASC" } });
    setProduits(data);
  }, []);

  const rafraichirUsers = useCallback(async () => {
    const data = await Users.findAll();
    setUsers(data);
  }, []);

  const rafraichirMouvements = useCallback(async () => {
    const data = await Mouvements.findAll({ orderBy: { column: "date_op", direction: "DESC" } });
    setMouvements(data);
  }, []);

  const rafraichirSessions = useCallback(async () => {
    const data = await Sessions.findAll({ orderBy: { column: "date", direction: "DESC" } });
    setSessions(data);
  }, []);

  useEffect(() => {
    initDatabase().then(async () => {
      await Promise.all([rafraichirCollections(), rafraichirProduits(), rafraichirUsers(), rafraichirMouvements(), rafraichirSessions()]);
      setReady(true);
    });
  }, [rafraichirCollections, rafraichirProduits, rafraichirUsers, rafraichirMouvements, rafraichirSessions]);

  const sessionDuJour = useMemo(() => {
    const sessionsDuJour = sessions.filter((s) => s.date === dateDuJour());
    if (sessionsDuJour.length === 0) return null;
    return sessionsDuJour.reduce((plusRecente, s) => (s.id > plusRecente.id ? s : plusRecente));
  }, [sessions]);

  const creerCollection = useCallback(async (data: Partial<Collection>) => {
    const collection = await Collections.create(data);
    await rafraichirCollections();
    return collection;
  }, [rafraichirCollections]);

  const creerProduit = useCallback(async (data: Partial<Produit>) => {
    const produit = await Produits.create(data);
    await Promise.all([rafraichirProduits(), rafraichirCollections()]);
    return produit;
  }, [rafraichirProduits, rafraichirCollections]);

  const modifierProduit = useCallback(async (id: number, data: Partial<Produit>) => {
    await Produits.update(id, data);
    await Promise.all([rafraichirProduits(), rafraichirCollections()]);
  }, [rafraichirProduits, rafraichirCollections]);

  const supprimerProduit = useCallback(async (id: number) => {
    await Produits.delete(id);
    await Promise.all([rafraichirProduits(), rafraichirCollections()]);
  }, [rafraichirProduits, rafraichirCollections]);

  const creerMouvement = useCallback(async (data: Partial<Mouvement>) => {
    if (!sessionDuJour) {
      throw new Error("Aucune session n'est ouverte, impossible d'ajouter un mouvement.");
    }
    if (sessionDuJour.fermee) {
      throw new Error("La session du jour est fermée, impossible d'ajouter un mouvement.");
    }
    const mouvement = await Mouvements.create({ ...data, session_id: sessionDuJour.id });
    await rafraichirMouvements();
    return mouvement;
  }, [sessionDuJour, rafraichirMouvements]);

  const supprimerMouvement = useCallback(async (id: number) => {
    const mouvement = mouvements.find((m) => m.id === id);
    if (!mouvement) return;
    const session = sessions.find((s) => s.id === mouvement.session_id);
    if (session?.fermee) {
      throw new Error("La session de ce mouvement est fermée, impossible de le supprimer.");
    }
    await Mouvements.delete(id);
    await rafraichirMouvements();
  }, [mouvements, sessions, rafraichirMouvements]);

  const creerUser = useCallback(async (data: Partial<User>) => {
    const user = await Users.create(data);
    await rafraichirUsers();
    return user;
  }, [rafraichirUsers]);

  const fermerSessionDuJour = useCallback(async () => {
    if (!sessionDuJour || sessionDuJour.fermee) return;
    const mouvementsSession = mouvements.filter((m) => m.session_id === sessionDuJour.id);
    const total_commandes = mouvementsSession.filter((m) => m.type === "dette").length;
    const montant_total = mouvementsSession.reduce((total, m) => total + m.montant * m.sens, 0);
    await Sessions.update(sessionDuJour.id, {
      fermee: 1,
      fermee_at: new Date().toISOString(),
      total_commandes,
      montant_total,
    });
    await rafraichirSessions();
  }, [sessionDuJour, mouvements, rafraichirSessions]);

  useEffect(() => {
    if (!sessionDuJour || sessionDuJour.fermee) return;

    function verifierFermeture() {
      if (estApresHeureFermeture(new Date())) {
        fermerSessionDuJour();
      }
    }

    verifierFermeture();

    const delai = prochaineHeureFermeture(new Date()).getTime() - Date.now();
    const timeout = setTimeout(verifierFermeture, delai);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") verifierFermeture();
    });

    return () => {
      clearTimeout(timeout);
      subscription.remove();
    };
  }, [sessionDuJour, fermerSessionDuJour]);

  const creerNouvelleSession = useCallback(async () => {
    await Sessions.create({ date: dateDuJour(), fermee: 0, fermee_at: null, total_commandes: null, montant_total: null });
    await rafraichirSessions();
  }, [rafraichirSessions]);

  return (
    <DatabaseContext.Provider
      value={{
        ready,
        collections,
        produits,
        users,
        mouvements,
        sessions,
        sessionDuJour,
        creerCollection,
        creerProduit,
        modifierProduit,
        supprimerProduit,
        creerMouvement,
        supprimerMouvement,
        creerUser,
        fermerSessionDuJour,
        creerNouvelleSession,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error("useDatabase must be used within a DatabaseProvider");
  return context;
}
