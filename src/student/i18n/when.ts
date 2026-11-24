// Human dates ("Bugun 14:00", "Kecha", "3 kun qoldi") used by lib/humanDate.ts
// in both panels. All dictionaries are merged into one, so teacher pages can use these too.
import type { StudentDict } from "./index";

const dict: StudentDict = {
  uz: {
    "notes.coins": "Coin balansingiz o'zgardi",
    "notes.graded": "Uy vazifangiz baholandi",
    "notes.submission": "Yangi uy vazifasi topshirildi",
    "notes.homework": "Yangi uy vazifasi berildi",
    "notes.unread": "Yangi",
    "when.today": "Bugun",
    "when.yesterday": "Kecha",
    "when.tomorrow": "Ertaga",
    "when.inDays": "{{n}} kundan keyin",
    "when.daysLeft": "{{n}} kun qoldi",
    "when.months": "yanvar,fevral,mart,aprel,may,iyun,iyul,avgust,sentabr,oktabr,noyabr,dekabr",
    "when.dayMonth": "{{d}}-{{month}}",
    "unit.coin": "coin",
    "unit.lessons": "dars",
  },
  ru: {
    "notes.coins": "Баланс коинов изменился",
    "notes.graded": "Домашнее задание оценено",
    "notes.submission": "Сдано новое домашнее задание",
    "notes.homework": "Задано новое домашнее задание",
    "notes.unread": "Новое",
    "when.today": "Сегодня",
    "when.yesterday": "Вчера",
    "when.tomorrow": "Завтра",
    "when.inDays": "через {{n}} дн.",
    "when.daysLeft": "осталось {{n}} дн.",
    "when.months": "января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря",
    "when.dayMonth": "{{d}} {{month}}",
    "unit.coin": "коинов",
    "unit.lessons": "уроков",
  },
  en: {
    "notes.coins": "Your coin balance changed",
    "notes.graded": "Your homework was graded",
    "notes.submission": "New homework submitted",
    "notes.homework": "New homework assigned",
    "notes.unread": "New",
    "when.today": "Today",
    "when.yesterday": "Yesterday",
    "when.tomorrow": "Tomorrow",
    "when.inDays": "in {{n}} days",
    "when.daysLeft": "{{n}} days left",
    "when.months": "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
    "when.dayMonth": "{{month}} {{d}}",
    "unit.coin": "coins",
    "unit.lessons": "lessons",
  },
};

export default dict;
