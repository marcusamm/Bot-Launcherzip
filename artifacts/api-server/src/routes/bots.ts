import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, botsTable } from "@workspace/db";
import {
  CreateBotBody,
  UpdateBotBody,
  UpdateBotParams,
  GetBotParams,
  GetBotResponse,
  DeleteBotParams,
  LaunchBotParams,
  LaunchBotResponse,
  StopBotParams,
  StopBotResponse,
  ListBotsResponse,
  UpdateBotResponse,
  LaunchAllBotsResponse,
  StopAllBotsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bots", async (_req, res): Promise<void> => {
  const bots = await db.select().from(botsTable).orderBy(botsTable.accountIndex);
  res.json(ListBotsResponse.parse(bots.map(serializeBot)));
});

router.post("/bots", async (req, res): Promise<void> => {
  const parsed = CreateBotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bot] = await db
    .insert(botsTable)
    .values({ ...parsed.data, status: "stopped" })
    .returning();

  res.status(201).json(GetBotResponse.parse(serializeBot(bot)));
});

router.post("/bots/launch-all", async (_req, res): Promise<void> => {
  const bots = await db.select().from(botsTable);
  const now = new Date();

  const updated = await db
    .update(botsTable)
    .set({ status: "running", lastActivity: now, errorMessage: null })
    .returning();

  res.json(
    LaunchAllBotsResponse.parse({
      affected: updated.length,
      bots: updated.map(serializeBot),
    })
  );
});

router.post("/bots/stop-all", async (_req, res): Promise<void> => {
  const updated = await db
    .update(botsTable)
    .set({ status: "stopped", lastActivity: new Date() })
    .returning();

  res.json(
    StopAllBotsResponse.parse({
      affected: updated.length,
      bots: updated.map(serializeBot),
    })
  );
});

router.get("/bots/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBotParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .select()
    .from(botsTable)
    .where(eq(botsTable.id, params.data.id));

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json(GetBotResponse.parse(serializeBot(bot)));
});

router.patch("/bots/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBotParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bot] = await db
    .update(botsTable)
    .set(parsed.data)
    .where(eq(botsTable.id, params.data.id))
    .returning();

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json(UpdateBotResponse.parse(serializeBot(bot)));
});

router.delete("/bots/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBotParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .delete(botsTable)
    .where(eq(botsTable.id, params.data.id))
    .returning();

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/bots/:id/launch", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LaunchBotParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .update(botsTable)
    .set({ status: "running", lastActivity: new Date(), errorMessage: null })
    .where(eq(botsTable.id, params.data.id))
    .returning();

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json(LaunchBotResponse.parse(serializeBot(bot)));
});

router.post("/bots/:id/stop", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = StopBotParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .update(botsTable)
    .set({ status: "stopped", lastActivity: new Date() })
    .where(eq(botsTable.id, params.data.id))
    .returning();

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json(StopBotResponse.parse(serializeBot(bot)));
});

function serializeBot(bot: typeof botsTable.$inferSelect) {
  return {
    id: bot.id,
    name: bot.name,
    accountIndex: bot.accountIndex,
    gfnEmail: bot.gfnEmail ?? null,
    gfnPassword: bot.gfnPassword ?? null,
    serverName: bot.serverName ?? null,
    browserProfilePath: bot.browserProfilePath ?? null,
    status: bot.status as "stopped" | "launching" | "running" | "awaiting_auth" | "error",
    authCode: bot.authCode ?? null,
    authCodeRequestedAt: bot.authCodeRequestedAt ? bot.authCodeRequestedAt.toISOString() : null,
    lastActivity: bot.lastActivity ? bot.lastActivity.toISOString() : null,
    errorMessage: bot.errorMessage ?? null,
  };
}

export default router;
