import {
  updateDailyTargets,
  type DailyTargets,
  type DailyTargetsResponse,
} from "@boccone/api-client";

export async function saveDailyTargets(targets: DailyTargets): Promise<DailyTargetsResponse> {
  const result = await updateDailyTargets({ body: targets });
  if (result.error || result.data === undefined) {
    throw new Error("Unable to save daily targets");
  }
  return result.data;
}
