import {
  pgEnum,
  pgTable,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const linkEnum = pgEnum("link", ["Primary", "Secondary"]);

export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: varchar("phone_number", { length: 12 }),
  email: varchar("email", { length: 256 }),
  linkedId: integer("linked_id"),
  linkPrecedence: linkEnum("link_precedence").default("Primary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
});
