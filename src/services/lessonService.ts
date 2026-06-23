// src/services/lessonService.ts
import api from "./api";

export const lessonService = {
  getLesson: async () => {
    const response = await api.get("/lessons.json");
    return response.data;
  },
  submitHomework: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, message: "Topshirildi!" };
  },
};
