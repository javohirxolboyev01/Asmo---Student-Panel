// src/lib/quizParser.ts — turns pasted plain text (typed by hand or produced
// by ChatGPT & co. from QUIZ_AI_PROMPT) into test questions. Tolerant on
// purpose: AI output varies a little (bold markers, "Answer:" vs "Javob:",
// Cyrillic option letters), so all the usual shapes are accepted.
//
//   1. Savol matni?
//   A) Variant
//   B) Variant
//   C) Variant
//   D) Variant
//   Javob: B
//
// Instead of a "Javob:" line, the right option can be marked with a trailing *.
import type { QuizQuestionInput } from "@/types/quiz";

export const MAX_OPTIONS = 6;

export interface ParsedQuestion extends QuizQuestionInput {
  /** Problems with this question (i18n keys); empty = ready to add. */
  errors: string[];
}

const LATIN = "ABCDEF";
const CYRILLIC = "АБВГДЕ";
const letterIndex = (letter: string) => {
  const up = letter.toUpperCase();
  const i = LATIN.indexOf(up);
  return i >= 0 ? i : CYRILLIC.indexOf(up);
};
// Cyrillic letters that look Latin: "Ответ: В" typed on a Russian keyboard
// under Latin A) B) C) options means B, not the 3rd Cyrillic letter.
const LOOKALIKE: Record<string, string> = { А: "A", В: "B", С: "C", Е: "E" };
const label = (letter: string) => {
  const up = letter.toUpperCase();
  return LOOKALIKE[up] ?? up;
};

const QUESTION = /^(?:(?:savol|question|вопрос)\s*)?\d{1,3}\s*[.)\]:-]\s*(.*)$/iu;
// Any letter, so a 7th option ("G) …") is reported as "too many" instead of
// silently starting a bogus question.
const OPTION = /^[-•]?\s*\(?([A-Za-zА-Яа-я])\s*[).:\]]\s*(.+)$/u;
const ANSWER =
  /^(?:to['’`ʻ‘]?g['’`ʻ‘]?ri\s+javob|javob|answer|correct\s+answer|correct|правильный\s+ответ|ответ)\s*[:\-–—]\s*\(?([A-Za-zА-Яа-я])(?![\p{L}\p{N}])/iu;
const CORRECT_MARK = /\s*(?:\*|✅|✔️?|✓|\((?:to['’`ʻ‘]?g['’`ʻ‘]?ri|correct|верно|правильно)\))\s*$/i;

/** Drop markdown emphasis/headings AI tools like to add (only paired markers, so "2**3" survives). */
const clean = (line: string) =>
  line
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => a ?? b)
    .replace(/^#+\s*/, "")
    .trim();

export function parseQuizText(text: string): ParsedQuestion[] {
  type Draft = { text: string; options: string[]; labels: string[]; marked: number; answer: string | null };
  const drafts: Draft[] = [];
  let current: Draft | null = null;
  const start = (questionText: string) => {
    current = { text: questionText, options: [], labels: [], marked: -1, answer: null };
    drafts.push(current);
  };

  for (const raw of text.split(/\r?\n/)) {
    let line = clean(raw);
    if (!line) continue;

    const answer = line.match(ANSWER);
    if (answer && current) {
      (current as Draft).answer = answer[1]!;
      continue;
    }

    // "*B) …" marks the right option; "* B) …" is just a markdown bullet.
    const starred = /^\*\S/.test(line);
    if (line.startsWith("*")) line = line.slice(1).trim();

    const option = line.match(OPTION);
    if (option && current) {
      const draft = current as Draft;
      let optionText = option[2]!.trim();
      const marked = starred || CORRECT_MARK.test(optionText);
      optionText = optionText.replace(CORRECT_MARK, "").trim();
      if (marked) draft.marked = draft.options.length;
      draft.options.push(optionText);
      draft.labels.push(label(option[1]!));
      continue;
    }

    const question = line.match(QUESTION);
    if (question) {
      start(question[1]!.trim());
      continue;
    }

    // Unnumbered line: more question text, or the next question once this one has options.
    if (!current || (current as Draft).options.length > 0) start(line);
    else (current as Draft).text = (current as Draft).text ? `${(current as Draft).text}\n${line}` : line;
  }

  return drafts.map((d) => {
    // "Javob: X" wins over a * mark; match it against the options' own labels.
    let correctIndex = d.marked;
    if (d.answer) {
      const byLabel = d.labels.indexOf(label(d.answer));
      correctIndex = byLabel >= 0 ? byLabel : letterIndex(d.answer);
    }
    const errors: string[] = [];
    if (!d.text.trim()) errors.push("quizzes.parse.noText");
    if (d.options.length < 2) errors.push("quizzes.parse.fewOptions");
    if (d.options.length > MAX_OPTIONS) errors.push("quizzes.parse.manyOptions");
    if (correctIndex < 0 || correctIndex >= d.options.length) errors.push("quizzes.parse.noAnswer");
    return { text: d.text, options: d.options, correctIndex, errors };
  });
}

export type QuizLang = "uz" | "ru" | "en";
export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";

export interface QuizAiRequest {
  /** What the questions are about (may be empty when `material` is given). */
  topic: string;
  /** Exactly how many questions to ask for. */
  count: number;
  /** Options per question, 2–MAX_OPTIONS. */
  optionCount: number;
  difficulty: QuizDifficulty;
  /** Language the questions themselves are written in. */
  lang: QuizLang;
  /** Optional lesson text or sample questions the AI must base the test on. */
  material?: string;
}

/** Longest material put into a prompt (AI chat links and inputs have limits). */
export const MAX_MATERIAL = 6000;

const PROMPT_TEXT = {
  uz: {
    role: "Sen tajribali o'qituvchisan.",
    task: (topic: string, n: number) =>
      topic ? `«${topic}» mavzusi bo'yicha AYNAN ${n} ta test savoli tuz.` : `AYNAN ${n} ta test savoli tuz.`,
    rules: "Talablar:",
    options: (n: number, last: string) => `Har bir savolda ${n} ta variant (A–${last}) bo'lsin, faqat bittasi to'g'ri.`,
    level: { easy: "Qiyinlik: oson.", medium: "Qiyinlik: o'rta.", hard: "Qiyinlik: qiyin.", mixed: "Qiyinlik: aralash (oson, o'rta va qiyin savollar)." },
    spread: "To'g'ri javoblar turli harflarda bo'lsin (hammasi A emas). Savollar takrorlanmasin.",
    material: "Savollarni FAQAT quyidagi materialga asoslanib tuz (bu dars matni yoki namuna savollar bo'lishi mumkin — namuna bo'lsa, uslubini saqla, lekin aynan ko'chirma):",
    format: "Javobni AYNAN quyidagi formatda yoz. Kirish so'zi, izoh, sarlavha yoki markdown (**, #) qo'shma:",
    q: "Savol matni?",
    o: "Variant",
    answer: "Javob",
    lang: "Savollar o'zbek tilida (lotin yozuvida) bo'lsin.",
  },
  ru: {
    role: "Ты опытный преподаватель.",
    task: (topic: string, n: number) =>
      topic ? `Составь РОВНО ${n} тестовых вопросов по теме «${topic}».` : `Составь РОВНО ${n} тестовых вопросов.`,
    rules: "Требования:",
    options: (n: number, last: string) => `В каждом вопросе ${n} вариантов (A–${last}), верный только один.`,
    level: { easy: "Сложность: лёгкая.", medium: "Сложность: средняя.", hard: "Сложность: высокая.", mixed: "Сложность: смешанная (лёгкие, средние и сложные вопросы)." },
    spread: "Правильные ответы должны быть под разными буквами (не все A). Вопросы не должны повторяться.",
    material: "Составляй вопросы ТОЛЬКО по материалу ниже (это может быть текст урока или примеры вопросов — если это примеры, сохрани их стиль, но не копируй):",
    format: "Ответ пиши СТРОГО в этом формате. Без вступления, пояснений, заголовков и markdown (**, #):",
    q: "Текст вопроса?",
    o: "Вариант",
    answer: "Ответ",
    lang: "Вопросы должны быть на русском языке.",
  },
  en: {
    role: "You are an experienced teacher.",
    task: (topic: string, n: number) =>
      topic ? `Write EXACTLY ${n} multiple-choice questions on "${topic}".` : `Write EXACTLY ${n} multiple-choice questions.`,
    rules: "Requirements:",
    options: (n: number, last: string) => `Each question has ${n} options (A–${last}) and exactly one correct answer.`,
    level: { easy: "Difficulty: easy.", medium: "Difficulty: medium.", hard: "Difficulty: hard.", mixed: "Difficulty: mixed (easy, medium and hard questions)." },
    spread: "Spread the correct answers across different letters (not all A). No repeated questions.",
    material: "Base the questions ONLY on the material below (lesson text or sample questions — if samples, keep their style but don't copy them):",
    format: "Reply in EXACTLY this format. No intro, notes, headings or markdown (**, #):",
    q: "Question text?",
    o: "Option",
    answer: "Answer",
    lang: "Write the questions in English.",
  },
} as const;

/**
 * The prompt the teacher sends to ChatGPT / Gemini / Claude. Everything the
 * teacher picked is spelled out, and the reply format is the one
 * parseQuizText reads ("Javob:" / "Ответ:" / "Answer:"), so the answer
 * pastes straight back in.
 */
export function buildQuizAiPrompt(req: QuizAiRequest): string {
  // Written in the questions' language, so the AI answers in it too.
  const p = PROMPT_TEXT[req.lang];
  const n = Math.min(Math.max(req.optionCount, 2), MAX_OPTIONS);
  const letters = LATIN.slice(0, n).split("");
  const material = (req.material ?? "").trim().slice(0, MAX_MATERIAL);
  const example = [`1. ${p.q}`, ...letters.map((l) => `${l}) ${p.o}`), `${p.answer}: ${letters[1]}`].join("\n");
  return [
    `${p.role} ${p.task(req.topic.trim(), req.count)}`,
    "",
    p.rules,
    `- ${p.options(n, letters[n - 1]!)}`,
    `- ${p.level[req.difficulty]}`,
    `- ${p.spread}`,
    `- ${p.lang}`,
    "",
    p.format,
    "",
    example,
    "",
    `2. ...`,
    ...(material ? ["", p.material, '"""', material, '"""'] : []),
  ].join("\n");
}
