import type { DatabaseRow } from "../../SimpleORM";
import { modelFactory } from "./database";

export interface User extends DatabaseRow {
  id: number;
  nom: string;
  created_at: string;
}

export const Users = modelFactory.createModel<User>("users", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  nom: "TEXT NOT NULL",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
});
