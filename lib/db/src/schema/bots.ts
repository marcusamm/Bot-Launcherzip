import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botStatusEnum = ["stopped", "launching", "running", "awaiting_auth", "error"] as const;
export type BotStatus = (typeof botStatusEnum)[number];

export const botsTable = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  accountIndex: integer("account_index").notNull(),
  gfnEmail: text("gfn_email"),
  gfnPassword: text("gfn_password"),
  serverName: text("server_name").default("Objective First"),
  browserProfilePath: text("browser_profile_path"),
  status: text("status").notNull().default("stopped"),
  authCode: text("auth_code"),
  authCodeRequestedAt: timestamp("auth_code_requested_at"),
  lastActivity: timestamp("last_activity"),
  errorMessage: text("error_message"),
});

export const insertBotSchema = createInsertSchema(botsTable).omit({ id: true });
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof botsTable.$inferSelect;
