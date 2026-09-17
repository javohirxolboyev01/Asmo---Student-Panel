// src/lib/pwa.ts
import { registerSW } from "virtual:pwa-register";
import { toast } from "./toast";

export const initPWA = () => {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast.info("Yangi versiya mavjud. Yangilash uchun sahifani qayta yuklang.", {
        onClick: () => updateSW(true),
        autoClose: false,
      });
    },
    onOfflineReady() {
      toast.success("Ilova oflayn rejimda ishlashga tayyor.");
    },
  });
};
