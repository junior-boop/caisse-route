import type { DatabaseRow } from "../../SimpleORM";
import { modelFactory } from "./database";

export interface Produit extends DatabaseRow {
  id: number;
  collections_id: number;
  name: string;
  prix: number;
  created_at: string;
  updated_at: string;
}

export const Produits = modelFactory.createModel<Produit>("produits", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  collections_id: "INTEGER NOT NULL",
  name: "TEXT NOT NULL",
  prix: "REAL NOT NULL",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  updated_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
});
