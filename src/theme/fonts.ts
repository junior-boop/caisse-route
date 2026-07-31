import type { TextStyle } from "react-native";

export const InterFonts = {
  "Inter-Regular": require("../../assets/fonts/Inter_18pt-Regular.ttf"),
  "Inter-Medium": require("../../assets/fonts/Inter_18pt-Medium.ttf"),
  "Inter-SemiBold": require("../../assets/fonts/Inter_18pt-SemiBold.ttf"),
  "Inter-Bold": require("../../assets/fonts/Inter_18pt-Bold.ttf"),
  "Inter-Italic": require("../../assets/fonts/Inter_18pt-Italic.ttf"),
  "Inter-MediumItalic": require("../../assets/fonts/Inter_18pt-MediumItalic.ttf"),
  "Inter-SemiBoldItalic": require("../../assets/fonts/Inter_18pt-SemiBoldItalic.ttf"),
  "Inter-BoldItalic": require("../../assets/fonts/Inter_18pt-BoldItalic.ttf"),
};

const UPRIGHT = { 400: "Inter-Regular", 500: "Inter-Medium", 600: "Inter-SemiBold", 700: "Inter-Bold" } as const;
const ITALIC = { 400: "Inter-Italic", 500: "Inter-MediumItalic", 600: "Inter-SemiBoldItalic", 700: "Inter-BoldItalic" } as const;

const AVAILABLE = [400, 500, 600, 700] as const;

function toNumericWeight(weight: TextStyle["fontWeight"]): number {
  if (weight == null || weight === "normal") return 400;
  if (weight === "bold") return 700;
  const parsed = Number(weight);
  return Number.isFinite(parsed) ? parsed : 400;
}

export function interFontFamily(style?: Pick<TextStyle, "fontWeight" | "fontStyle">) {
  const target = toNumericWeight(style?.fontWeight);
  const weight = AVAILABLE.reduce((best, candidate) =>
    Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best,
  );
  return style?.fontStyle === "italic" ? ITALIC[weight] : UPRIGHT[weight];
}
