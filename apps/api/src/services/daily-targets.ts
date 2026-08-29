import {
  adminMutationResponseSchema,
  dailyTargetsResponseSchema,
  type DailyTargets,
  type DailyTargetsResponse,
} from "@boccone/contracts";
import { dailyTargets, eq, type Database, user } from "@boccone/db";

import { AppError } from "../errors";

const EMPTY_TARGETS: DailyTargets = {
  calories: null,
  proteinGrams: null,
  carbohydratesGrams: null,
  fatGrams: null,
};

export async function getDailyTargets(db: Database, userId: string): Promise<DailyTargetsResponse> {
  const [row] = await db.select().from(dailyTargets).where(eq(dailyTargets.userId, userId));
  return toResponse(row);
}

export async function updateDailyTargets(
  db: Database,
  userId: string,
  targets: DailyTargets,
): Promise<DailyTargetsResponse> {
  const [row] = await db
    .insert(dailyTargets)
    .values({ userId, ...targets })
    .onConflictDoUpdate({
      target: dailyTargets.userId,
      set: { ...targets, updatedAt: new Date() },
    })
    .returning();

  return toResponse(row);
}

export async function getAdminUserDailyTargets(
  db: Database,
  userId: string,
): Promise<DailyTargetsResponse> {
  await assertUserExists(db, userId);
  return getDailyTargets(db, userId);
}

export async function updateAdminUserDailyTargets(
  db: Database,
  userId: string,
  targets: DailyTargets,
): Promise<DailyTargetsResponse> {
  await assertUserExists(db, userId);
  return updateDailyTargets(db, userId, targets);
}

export async function removeAdminUserDailyTargets(
  db: Database,
  userId: string,
): Promise<{ success: true }> {
  await assertUserExists(db, userId);
  await db.delete(dailyTargets).where(eq(dailyTargets.userId, userId));
  return adminMutationResponseSchema.parse({ success: true });
}

async function assertUserExists(db: Database, userId: string): Promise<void> {
  const [account] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!account) throw new AppError("not_found", "User not found");
}

function toResponse(row: typeof dailyTargets.$inferSelect | undefined): DailyTargetsResponse {
  return dailyTargetsResponseSchema.parse({
    targets: row
      ? {
          calories: row.calories,
          proteinGrams: row.proteinGrams,
          carbohydratesGrams: row.carbohydratesGrams,
          fatGrams: row.fatGrams,
        }
      : EMPTY_TARGETS,
  });
}
