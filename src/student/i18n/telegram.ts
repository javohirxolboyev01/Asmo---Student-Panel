// Telegram Mini App: the sign-in gate inside Telegram and the login-page notice.
import type { StudentDict } from "./index";

const dict: StudentDict = {
  uz: {
    "tg.gateTitle": "Telegram orqali kirish",
    "tg.signingIn": "Kirilmoqda…",
    "tg.notLinked":
      "Bu Telegram hisobi hali ulanmagan. Ustozingizdan 8 belgili kod oling va uni shu botga yuboring. Keyin ilovani qayta oching.",
    "tg.failed": "Kirib bo'lmadi. Internetni tekshirib qayta urinib ko'ring.",
    "tg.signedOut": "Siz hisobdan chiqdingiz.",
    "tg.retry": "Qayta urinish",
    "tg.signIn": "Kirish",
    "tg.backToBot": "Botga qaytish",
    "tg.studentUseBot":
      "O'quvchilar ilovani faqat Telegram bot orqali ochadi. Ustozingiz bergan kodni botga yuboring va ilovani bot ichidan oching.",
    "tg.openBot": "Telegram botni ochish",
  },
  ru: {
    "tg.gateTitle": "Вход через Telegram",
    "tg.signingIn": "Входим…",
    "tg.notLinked":
      "Этот аккаунт Telegram ещё не привязан. Получите 8-значный код у преподавателя и отправьте его этому боту. Затем откройте приложение снова.",
    "tg.failed": "Не удалось войти. Проверьте интернет и попробуйте снова.",
    "tg.signedOut": "Вы вышли из аккаунта.",
    "tg.retry": "Повторить",
    "tg.signIn": "Войти",
    "tg.backToBot": "Вернуться в бот",
    "tg.studentUseBot":
      "Ученики открывают приложение только через Telegram-бота. Отправьте боту код от преподавателя и откройте приложение внутри бота.",
    "tg.openBot": "Открыть Telegram-бота",
  },
  en: {
    "tg.gateTitle": "Sign in with Telegram",
    "tg.signingIn": "Signing in…",
    "tg.notLinked":
      "This Telegram account isn't linked yet. Get an 8-character code from your teacher and send it to this bot, then open the app again.",
    "tg.failed": "Couldn't sign in. Check your connection and try again.",
    "tg.signedOut": "You've signed out.",
    "tg.retry": "Try again",
    "tg.signIn": "Sign in",
    "tg.backToBot": "Back to the bot",
    "tg.studentUseBot":
      "Students open the app only through the Telegram bot. Send the code from your teacher to the bot and open the app inside it.",
    "tg.openBot": "Open the Telegram bot",
  },
};

export default dict;
