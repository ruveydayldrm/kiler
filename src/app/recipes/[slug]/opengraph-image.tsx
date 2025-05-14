import { ImageResponse } from "next/og";
import { getRecipeDetail } from "@/lib/recipes";

export const alt = "Kiler tarifi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Tarif görseli olsun olmasın tutarlı bir paylaşım kartı: renkli tipografik kapak. */
export default async function RecipeOg({ params }: { params: Promise<{ slug: string }> }) {
  const recipe = await getRecipeDetail((await params).slug);
  const title = recipe?.title ?? "Kiler";
  const color = recipe?.coverColor ?? "#3F5B3A";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FBF7F0", padding: 48 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: 40, background: color, padding: 64, color: "#FFFDF9" }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", opacity: 0.85 }}>{recipe?.category.name ?? "Tarif"}</div>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.02 }}>{title}</div>
          <div style={{ display: "flex", gap: 36, fontSize: 32 }}>
            {recipe && <span>{recipe.totalMinutes} dk</span>}
            {recipe?.calories != null && <span>{Math.round(recipe.calories)} kcal</span>}
            <span style={{ marginLeft: "auto", fontWeight: 700 }}>Kiler.</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
