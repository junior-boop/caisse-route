import type { DatabaseRow } from "../../SimpleORM";
import { modelFactory } from "./database";

export interface Session extends DatabaseRow {
  id: number;
  date: string;
  fermee: number;
  fermee_at: string | null;
  total_commandes: number | null;
  montant_total: number | null;
  created_at: string;
}

export const Sessions = modelFactory.createModel<Session>("sessions", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  date: "TEXT NOT NULL",
  fermee: "INTEGER NOT NULL",
  fermee_at: "DATETIME",
  total_commandes: "INTEGER",
  montant_total: "INTEGER",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
});
