import { describe, expect, test } from "bun:test";

import {
  foodPath,
  foodSubmissionPath,
  mealPath,
  parseAdminRoute,
  userMealPath,
  userPath,
} from "../src/lib/navigation";

describe("admin navigation", () => {
  test("parses resource and nested detail routes", () => {
    expect(parseAdminRoute("/")).toEqual({ kind: "overview" });
    expect(parseAdminRoute("/users/u-1/meals/m-1")).toEqual({
      kind: "user-meal",
      userId: "u-1",
      mealId: "m-1",
    });
    expect(parseAdminRoute("/meals/m-1")).toEqual({ kind: "meal", mealId: "m-1" });
    expect(parseAdminRoute("/foods/f-1")).toEqual({ kind: "food", foodId: "f-1" });
    expect(parseAdminRoute("/food-submissions/s-1")).toEqual({
      kind: "food-submission",
      submissionId: "s-1",
    });
  });

  test("round-trips encoded identifiers", () => {
    expect(userPath("user/1", "meals")).toBe("/users/user%2F1/meals");
    expect(userMealPath("user/1", "meal 1")).toBe("/users/user%2F1/meals/meal%201");
    expect(mealPath("meal/1")).toBe("/meals/meal%2F1");
    expect(foodPath("food/1")).toBe("/foods/food%2F1");
    expect(foodSubmissionPath("submission/1")).toBe("/food-submissions/submission%2F1");
    expect(parseAdminRoute("/users/user%2F1/meals/meal%201")).toEqual({
      kind: "user-meal",
      userId: "user/1",
      mealId: "meal 1",
    });
  });

  test("rejects unknown paths", () => {
    expect(parseAdminRoute("/users/u-1/unknown")).toEqual({ kind: "not-found" });
    expect(parseAdminRoute("/meals/m-1/extra")).toEqual({ kind: "not-found" });
  });

  test("parses analytics workspace routes", () => {
    expect(parseAdminRoute("/analytics")).toEqual({ kind: "analytics-overview" });
    expect(parseAdminRoute("/analytics/nutrition")).toEqual({ kind: "analytics-nutrition" });
    expect(parseAdminRoute("/analytics/foods")).toEqual({ kind: "analytics-foods" });
    expect(parseAdminRoute("/analytics/ai")).toEqual({ kind: "analytics-ai" });
  });
});
