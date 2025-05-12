// /recipes URL parametreleri ↔ filtre nesnesi. İstemci (filtre paneli) ve sunucu (sayfa) paylaşır.
import { ALLERGEN_KEYS, DIET_KEYS, DIFFICULTY_KEYS, SORTS, type AllergenKey, type DietKey, type Difficulty, type SortKey } from "./constants";
import type { RecipeFilters } from "./matching";

export interface RecipeQuery extends RecipeFilters {
  sort: SortKey;
  page: number;
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const get = (p: Params, k: string) => {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  return (Array.isArray(v) ? v[0] : v) ?? undefined;
};
const list = (p: Params, k: string) =>
  (get(p, k) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,60}$/.test(s));
const num = (p: Params, k: string, min: number, max: number) => {
  const v = Number(get(p, k));
  return Number.isFinite(v) && v >= min && v <= max ? v : undefined;
};

export function parseRecipeQuery(p: Params): RecipeQuery {
  const sort = get(p, "sort");
  return {
    q: get(p, "q")?.slice(0, 200) || undefined,
    categories: list(p, "category"),
    cuisines: list(p, "cuisine"),
    maxMinutes: num(p, "maxMinutes", 1, 600),
    minMinutes: num(p, "minMinutes", 1, 600),
    difficulties: list(p, "difficulty").map((d) => d.toUpperCase()).filter((d): d is Difficulty => (DIFFICULTY_KEYS as readonly string[]).includes(d)),
    minCalories: num(p, "minCalories", 0, 5000),
    maxCalories: num(p, "maxCalories", 0, 5000),
    diets: list(p, "diet").filter((d): d is DietKey => (DIET_KEYS as readonly string[]).includes(d)),
    excludeAllergens: list(p, "noAllergen").filter((a): a is AllergenKey => (ALLERGEN_KEYS as readonly string[]).includes(a)),
    includeIngredients: list(p, "include"),
    excludeIngredients: list(p, "exclude"),
    minRating: num(p, "minRating", 1, 5),
    sort: SORTS.some((s) => s.key === sort) ? (sort as SortKey) : "recommended",
    page: num(p, "page", 1, 1000) ?? 1,
  };
}

export function serializeRecipeQuery(q: Partial<RecipeQuery>): string {
  const sp = new URLSearchParams();
  const set = (k: string, v: string | number | undefined | null) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  };
  const setList = (k: string, v?: string[]) => {
    if (v?.length) sp.set(k, v.join(","));
  };
  set("q", q.q);
  setList("category", q.categories);
  setList("cuisine", q.cuisines);
  set("maxMinutes", q.maxMinutes);
  set("minMinutes", q.minMinutes);
  setList("difficulty", q.difficulties?.map((d) => d.toLowerCase()));
  set("minCalories", q.minCalories);
  set("maxCalories", q.maxCalories);
  setList("diet", q.diets);
  setList("noAllergen", q.excludeAllergens);
  setList("include", q.includeIngredients);
  setList("exclude", q.excludeIngredients);
  set("minRating", q.minRating);
  if (q.sort && q.sort !== "recommended") sp.set("sort", q.sort);
  if (q.page && q.page > 1) sp.set("page", String(q.page));
  return sp.toString();
}

export const activeFilterCount = (q: RecipeQuery) =>
  (q.categories?.length ?? 0) +
  (q.cuisines?.length ?? 0) +
  (q.maxMinutes || q.minMinutes ? 1 : 0) +
  (q.difficulties?.length ?? 0) +
  (q.minCalories != null || q.maxCalories != null ? 1 : 0) +
  (q.diets?.length ?? 0) +
  (q.excludeAllergens?.length ?? 0) +
  (q.includeIngredients?.length ?? 0) +
  (q.excludeIngredients?.length ?? 0) +
  (q.minRating ? 1 : 0);
