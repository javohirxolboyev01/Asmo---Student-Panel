// src/services/lessonService.ts
import api from "./api";

export const lessonService = {
  getLesson: async (id: string) => {
    const response = await api.get("/lessons.json");
    return response.data;
  },
  submitHomework: async (
    homeworkId: string,
    data: { content: string; file?: File },
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, message: "Topshirildi!" };
  },
};
