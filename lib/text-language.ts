import type { ReaderLanguage } from "@/types/book";

export type ReaderScript =
  | "latin"
  | "devanagari"
  | "malayalam"
  | "tamil"
  | "telugu"
  | "kannada"
  | "bengali"
  | "gujarati"
  | "gurmukhi"
  | "arabic"
  | "cjk"
  | "korean"
  | "cyrillic"
  | "thai";

interface LanguagePresentation {
  lang: string;
  direction: "ltr" | "rtl";
  script: ReaderScript;
}

const languagePresentations: Record<
  Exclude<ReaderLanguage, "auto">,
  LanguagePresentation
> = {
  en: { lang: "en", direction: "ltr", script: "latin" },
  hi: { lang: "hi", direction: "ltr", script: "devanagari" },
  ml: { lang: "ml", direction: "ltr", script: "malayalam" },
  ta: { lang: "ta", direction: "ltr", script: "tamil" },
  te: { lang: "te", direction: "ltr", script: "telugu" },
  kn: { lang: "kn", direction: "ltr", script: "kannada" },
  bn: { lang: "bn", direction: "ltr", script: "bengali" },
  gu: { lang: "gu", direction: "ltr", script: "gujarati" },
  pa: { lang: "pa", direction: "ltr", script: "gurmukhi" },
  ur: { lang: "ur", direction: "rtl", script: "arabic" },
  ar: { lang: "ar", direction: "rtl", script: "arabic" },
  zh: { lang: "zh", direction: "ltr", script: "cjk" },
  ja: { lang: "ja", direction: "ltr", script: "cjk" },
  ko: { lang: "ko", direction: "ltr", script: "korean" },
  es: { lang: "es", direction: "ltr", script: "latin" },
  fr: { lang: "fr", direction: "ltr", script: "latin" },
  de: { lang: "de", direction: "ltr", script: "latin" },
  pt: { lang: "pt", direction: "ltr", script: "latin" },
  ru: { lang: "ru", direction: "ltr", script: "cyrillic" },
};

const scriptPatterns: Array<{
  pattern: RegExp;
  presentation: LanguagePresentation;
}> = [
  {
    pattern: /\p{Script=Malayalam}/gu,
    presentation: languagePresentations.ml,
  },
  { pattern: /\p{Script=Tamil}/gu, presentation: languagePresentations.ta },
  { pattern: /\p{Script=Telugu}/gu, presentation: languagePresentations.te },
  { pattern: /\p{Script=Kannada}/gu, presentation: languagePresentations.kn },
  { pattern: /\p{Script=Bengali}/gu, presentation: languagePresentations.bn },
  { pattern: /\p{Script=Gujarati}/gu, presentation: languagePresentations.gu },
  { pattern: /\p{Script=Gurmukhi}/gu, presentation: languagePresentations.pa },
  {
    pattern: /\p{Script=Devanagari}/gu,
    presentation: languagePresentations.hi,
  },
  { pattern: /\p{Script=Arabic}/gu, presentation: languagePresentations.ar },
  { pattern: /\p{Script=Hebrew}/gu, presentation: {
    lang: "he",
    direction: "rtl",
    script: "arabic",
  } },
  { pattern: /\p{Script=Hangul}/gu, presentation: languagePresentations.ko },
  {
    pattern: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu,
    presentation: languagePresentations.zh,
  },
  { pattern: /\p{Script=Thai}/gu, presentation: {
    lang: "th",
    direction: "ltr",
    script: "thai",
  } },
  { pattern: /\p{Script=Cyrillic}/gu, presentation: languagePresentations.ru },
  { pattern: /\p{Script=Latin}/gu, presentation: languagePresentations.en },
];

export function getLanguagePresentation(
  text: string,
  language: ReaderLanguage,
): LanguagePresentation {
  if (language !== "auto") return languagePresentations[language];

  let best = languagePresentations.en;
  let highestCount = 0;

  for (const candidate of scriptPatterns) {
    const count = text.match(candidate.pattern)?.length || 0;
    if (count > highestCount) {
      best = candidate.presentation;
      highestCount = count;
    }
  }

  return best;
}
