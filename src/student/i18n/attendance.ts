// Attendance page (calendar + records list).
import type { StudentDict } from "./index";

const dict: StudentDict = {
  uz: {
    "space.attendance.months":
      "Yanvar,Fevral,Mart,Aprel,May,Iyun,Iyul,Avgust,Sentyabr,Oktyabr,Noyabr,Dekabr",
    "space.attendance.todayCell": "BUGUN",
    "space.attendance.restCell": "DAM",
    "space.attendance.prevMonth": "Oldingi oy",
    "space.attendance.nextMonth": "Keyingi oy",
    "space.attendance.prevWeek": "Oldingi hafta",
    "space.attendance.nextWeek": "Keyingi hafta",
    "space.attendance.backToToday": "Bugunga qaytish",
    "space.attendance.dayLessons": "Shu kungi darslar",
    "space.attendance.noRecords": "Hali davomat yo'q",
    "space.attendance.noRecordsHint": "Darsga kelganingda shu yerda belgilanadi.",
  },
  ru: {
    "space.attendance.months":
      "Январь,Февраль,Март,Апрель,Май,Июнь,Июль,Август,Сентябрь,Октябрь,Ноябрь,Декабрь",
    "space.attendance.todayCell": "Сегодня",
    "space.attendance.restCell": "Вых.",
    "space.attendance.prevMonth": "Предыдущий месяц",
    "space.attendance.nextMonth": "Следующий месяц",
    "space.attendance.prevWeek": "Предыдущая неделя",
    "space.attendance.nextWeek": "Следующая неделя",
    "space.attendance.backToToday": "К сегодняшнему дню",
    "space.attendance.dayLessons": "Уроки в этот день",
    "space.attendance.noRecords": "Посещаемости пока нет",
    "space.attendance.noRecordsHint": "Когда придёшь на урок, отметка появится здесь.",
  },
  en: {
    "space.attendance.months":
      "January,February,March,April,May,June,July,August,September,October,November,December",
    "space.attendance.todayCell": "TODAY",
    "space.attendance.restCell": "OFF",
    "space.attendance.prevMonth": "Previous month",
    "space.attendance.nextMonth": "Next month",
    "space.attendance.prevWeek": "Previous week",
    "space.attendance.nextWeek": "Next week",
    "space.attendance.backToToday": "Back to today",
    "space.attendance.dayLessons": "Lessons on this day",
    "space.attendance.noRecords": "No attendance yet",
    "space.attendance.noRecordsHint": "Your lessons will be marked here once you attend.",
  },
};

export default dict;
