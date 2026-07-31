export * from "./database";
export * from "./collections";
export * from "./produits";
export * from "./users";
export * from "./mouvements";
export * from "./sessions";

import { orm } from "./database";
import { Collections } from "./collections";
import { Produits } from "./produits";
import { Users } from "./users";
import { Mouvements } from "./mouvements";
import { Sessions } from "./sessions";

async function ajouterColonneSiAbsente(sql: string) {
  try {
    await orm.run(sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("duplicate column name")) {
      throw error;
    }
  }
}

export async function initDatabase() {
  await Collections.createTable();
  await Users.createTable();
  await Produits.createTable();
  await Mouvements.createTable();
  await Sessions.createTable();

  await ajouterColonneSiAbsente("ALTER TABLE mouvements ADD COLUMN session_id INTEGER");
  await ajouterColonneSiAbsente("ALTER TABLE sessions ADD COLUMN total_commandes INTEGER");
  await ajouterColonneSiAbsente("ALTER TABLE sessions ADD COLUMN montant_total INTEGER");
}
