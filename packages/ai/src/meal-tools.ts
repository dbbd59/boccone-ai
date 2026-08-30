import { toolDefinition, type AnyServerTool } from "@tanstack/ai";
import { z } from "zod";

export interface MealCatalogToolPortion {
  name: string;
  amount: number;
  unit: string;
  gramWeight: number;
  isDefault: boolean;
}

export interface MealCatalogToolFood {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  portions: MealCatalogToolPortion[];
}

export interface MealCatalogToolCallbacks {
  search: (input: {
    query: string;
    locale: "en" | "it";
    limit: number;
  }) => Promise<MealCatalogToolFood[]>;
  details: (input: { foodId: string }) => Promise<MealCatalogToolFood | null>;
  portions: (input: { foodId: string }) => Promise<MealCatalogToolPortion[]>;
}

const searchInput = z.object({
  query: z.string().trim().min(1).max(120),
  locale: z.enum(["en", "it"]),
  limit: z.number().int().min(1).max(8).default(5),
});

const foodOutput = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  portions: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      unit: z.string(),
      gramWeight: z.number(),
      isDefault: z.boolean(),
    }),
  ),
});

const foodIdInput = z.object({ foodId: z.string().trim().min(1).max(128) });
const portionsOutput = z.object({ portions: foodOutput.shape.portions });

/** Narrow, authenticated catalog capabilities. No arbitrary database tool. */
export function createMealCatalogTools(callbacks: MealCatalogToolCallbacks): AnyServerTool[] {
  const searchDefinition = toolDefinition({
    name: "search_food_catalog",
    description: "Search Boccone's approved food catalog for likely food matches.",
    inputSchema: searchInput,
    outputSchema: z.object({ foods: z.array(foodOutput) }),
  });
  const detailsDefinition = toolDefinition({
    name: "get_food_details",
    description: "Read one food's canonical name and known human portions from Boccone's catalog.",
    inputSchema: foodIdInput,
    outputSchema: z.object({ food: foodOutput.nullable() }),
  });
  const portionsDefinition = toolDefinition({
    name: "get_food_portions",
    description: "Read known human portions for one catalog food.",
    inputSchema: foodIdInput,
    outputSchema: portionsOutput,
  });

  return [
    searchDefinition.server(async (input) => ({
      foods: await callbacks.search({ ...input, limit: input.limit ?? 5 }),
    })),
    detailsDefinition.server(async (input) => ({ food: await callbacks.details(input) })),
    portionsDefinition.server(async (input) => ({ portions: await callbacks.portions(input) })),
  ];
}
