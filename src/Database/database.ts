import { ModelFactory, SimpleORM } from "../../SimpleORM";

export const orm = new SimpleORM("caisseroute.db");
export const modelFactory = new ModelFactory(orm);
