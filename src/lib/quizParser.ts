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

/** Prompt the teacher copies into ChatGPT / Gemini; its answer pastes straight back in. */
export const quizAiPrompt = (lang: "uz" | "ru" | "en") =>
  ({
    uz: `«[MAVZU]» mavzusi bo'yicha [10] ta test savoli tuz. Har bir savolda 4 ta variant bo'lsin, faqat bittasi to'g'ri. Javobni aynan quyidagi formatda yoz, boshqa hech narsa qo'shma:

1. Savol matni?
A) Variant
B) Variant
C) Variant
D) Variant
Javob: B`,
    ru: `Составь [10] тестовых вопросов по теме «[ТЕМА]». В каждом вопросе 4 варианта, верный только один. Ответ пиши строго в этом формате, ничего больше не добавляй:

1. Текст вопроса?
A) Вариант
B) Вариант
C) Вариант
D) Вариант
Javob: B`,
    en: `Write [10] multiple-choice questions on "[TOPIC]". Each question has 4 options and exactly one correct answer. Reply in exactly this format and add nothing else:

1. Question text?
A) Option
B) Option
C) Option
D) Option
Javob: B`,
  })[lang];
