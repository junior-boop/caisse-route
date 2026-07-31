import type { DatabaseRow } from "../../SimpleORM";
import { modelFactory } from "./database";

export interface Collection extends DatabaseRow {
  id: number;
  name: string;
  created_at: string;
}

export const Collections = modelFactory.createModel<Collection>("collections", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  name: "TEXT NOT NULL",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
});
