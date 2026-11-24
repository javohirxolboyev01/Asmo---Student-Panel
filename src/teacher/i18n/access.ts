// Admin-only controls and incremental ("show more") lists.
import type { TeacherDict } from "./index";

const dict: TeacherDict = {
  uz: {
    "us.access.adminOnly": "Faqat admin o'zgartira oladi",
    "us.list.showMore": "Yana ko'rsatish ({{count}} ta qoldi)",
  },
  ru: {
    "us.access.adminOnly": "Изменять может только администратор",
    "us.list.showMore": "Показать ещё (осталось {{count}})",
  },
  en: {
    "us.access.adminOnly": "Only an admin can change this",
    "us.list.showMore": "Show more ({{count}} left)",
  },
};

export default dict;
