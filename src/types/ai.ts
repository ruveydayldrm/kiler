// AI asistanı yanıt sözleşmesi — sunucu ile istemci arasında paylaşılır.
import type { DietKey, MealKey } from "@/lib/constants";

export type ChatIntent =
  | "greeting"
  | "recipe_lookup"
  | "not_found"
  | "ingredient_search"
  | "pantry"
  | "filter_search"
  | "substitution"
  | "scale"
  | "plan"
  | "shopping"
  | "pairing"
  | "veganize"
  | "no_oven"
  | "medical"
  | "recipe_info"
  | "general";

export interface ChatRecipeCard {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  coverColor: string;
  categoryName: string;
  totalMinutes: number;
  calories: number | null;
  servings: number;
  diets: DietKey[];
  matchPercent?: number;
  matched?: number;
  required?: number;
  missing?: { slug: string; name: string }[];
}

export type ChatAction =
  | { kind: "confirm"; type: "add-missing"; label: string; payload: { recipeId: string; servings?: number } }
  | { kind: "confirm"; type: "add-items"; label: string; payload: { items: { ingredientSlug: string; name: string; quantity?: number | null; unit?: string | null }[] } }
  | { kind: "confirm"; type: "add-to-plan"; label: string; payload: { recipeId: string; meal?: MealKey; day?: number } }
  | {
      kind: "confirm";
      type: "save-plan";
      label: string;
      payload: { weekStart: string; entries: { day: number; meal: MealKey; recipeId: string; servings: number }[] };
    }
  | { kind: "link"; type: "open"; label: string; payload: { href: string } };

export interface PlanPreview {
  weekStart: string;
  days: { day: number; calories: number; meals: { meal: MealKey; recipeId: string; title: string; calories: number | null }[] }[];
  notes: string[];
}

export interface ChatResponse {
  message: string;
  recipes: ChatRecipeCard[];
  missingIngredients: { slug: string; name: string }[];
  actions: ChatAction[];
  /** Genel öneri / tıbbi uyarı / gizlenen tarif bilgisi gibi alt not */
  notice?: string;
  plan?: PlanPreview;
  /** Ölçeklenmiş malzeme listesi gibi yapılandırılmış ek içerik */
  list?: { title: string; items: string[] };
  intent: ChatIntent;
  mode: "openai" | "demo";
}

export interface ChatMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload?: ChatResponse | AdminChatResponse;
  createdAt: number;
}

// ----------------------------------------------------------------- Admin

export type AdminProposal =
  | { kind: "feature-recipe"; recipeId: string; featured: boolean; label: string }
  | { kind: "publish-recipe"; recipeId: string; published: boolean; label: string }
  | { kind: "recompute-nutrition"; recipeId: string; label: string }
  | { kind: "hide-review"; reviewId: string; label: string };

export interface AdminChatResponse {
  message: string;
  table?: { columns: string[]; rows: (string | number)[][] };
  recipes?: { id: string; slug: string; title: string }[];
  proposals?: AdminProposal[];
  report?: string;
  mode: "openai" | "demo";
}
