import type { DatabaseRow } from "../../SimpleORM";
import { modelFactory } from "./database";

export type TypeMouvement = "dette" | "paiement" | "correction";
export type SensMouvement = 1 | -1;

export interface Mouvement extends DatabaseRow {
  id: number;
  client_id: number;
  session_id: number | null;
  type: TypeMouvement;
  montant: number;
  sens: SensMouvement;
  libelle: string | null;
  date_op: string;
  created_at: string;
}

export const Mouvements = modelFactory.createModel<Mouvement>("mouvements", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  client_id: "INTEGER NOT NULL",
  session_id: "INTEGER",
  type: "TEXT NOT NULL",
  montant: "INTEGER NOT NULL",
  sens: "INTEGER NOT NULL",
  libelle: "TEXT",
  date_op: "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
});
