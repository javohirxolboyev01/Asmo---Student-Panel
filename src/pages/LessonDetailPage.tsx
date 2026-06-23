// src/pages/LessonDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, Upload, Check } from "lucide-react";
import { lessonService } from "@/services/lessonService";

import { formatDate, formatDateTime } from "@/utilist//formatData";
import { isOverdue } from "@/utilist/calculateDeadline";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export const LessonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const lessonData = await lessonService.getLesson();
        setData(lessonData);
      } catch (err) {
        setError("Dars ma'lumotlarini yuklashda xatolik yuz berdi");
      } finally {
        setIsLoading(false);
      }
    };
    loadLesson();
  }, [id]);

  const handleSubmit = async () => {
    if (!data || !submissionContent.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await lessonService.submitHomework();
      setSubmitMessage({
        type: "success",
        text: "Uyga vazifa muvaffaqiyatli topshirildi!",
      });
      setSubmissionContent("");
      const refreshed = await lessonService.getLesson();
      setData(refreshed);
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text: "Topshirishda xatolik yuz berdi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || "Dars topilmadi"}</p>
        <button
          onClick={() => navigate("/groups")}
          className="btn-primary mt-4"
        >
          Guruhlarga qaytish
        </button>
      </div>
    );
  }

  const { lesson, homework, submission } = data;
  const overdue = isOverdue(homework.deadline);
  const canSubmit =
    homework.status === "active" &&
    !overdue &&
    (!submission || submission.status !== "graded");

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back */}
      <Link
        to={`/groups/${lesson.groupName.split("-")[0]}`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2D6BFF] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Guruhga qaytish</span>
      </Link>

      {/* Lesson Header */}
      <div className="card">
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                  Dars #{lesson.lessonOrder}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 bg-[#2D6BFF]/10 text-[#2D6BFF] rounded-full">
                  {lesson.groupName}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1A1D26]">
                {lesson.topic}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(lesson.lessonDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{lesson.teacherName}</span>
                </div>
              </div>
            </div>
            {submission && submission.status === "graded" && (
              <div className="bg-[#E8F5E9] px-4 py-2 rounded-2xl">
                <span className="text-lg font-bold text-[#2E7D32]">
                  {submission.score}
                </span>
                <span className="text-sm text-[#2E7D32]/70">
                  /{homework.maxScore}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Homework Card */}
      <div className="card">
        <div className="p-5 md:p-6">
          <h2 className="text-lg font-semibold text-[#1A1D26] mb-4">
            📝 Uyga vazifa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left - Homework Info */}
            <div>
              <h3 className="font-medium text-[#1A1D26] mb-2">
                {homework.title}
              </h3>
              <p className="text-gray-500 text-sm whitespace-pre-wrap leading-relaxed">
                {homework.description}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  Deadline: {formatDateTime(homework.deadline)}
                </span>
                {submission && submission.status === "graded" && (
                  <span className="text-[#2E7D32] font-medium">
                    ✅ Baholangan
                  </span>
                )}
              </div>
            </div>

            {/* Right - Score */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6 min-h-[120px]">
              {submission && submission.status === "graded" ? (
                <div className="text-center">
                  <span className="text-5xl font-bold text-[#2D6BFF]">
                    {submission.score}
                  </span>
                  <span className="text-gray-400 text-xl">
                    {" "}
                    / {homework.maxScore}
                  </span>
                  {submission.feedback && (
                    <p className="text-sm text-gray-500 mt-2 max-w-xs">
                      {submission.feedback}
                    </p>
                  )}
                </div>
              ) : submission && submission.status === "submitted" ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-500">Kutilmoqda</p>
                  <p className="text-sm text-gray-400">Tekshirilmoqda</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-4xl text-gray-300">0</span>
                  <span className="text-gray-300 text-xl">
                    {" "}
                    / {homework.maxScore}
                  </span>
                  <p className="text-sm text-gray-400 mt-2">
                    Hali topshirilmagan
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Deadline Alert */}
          {overdue && homework.status !== "closed" && (
            <div className="mt-4 bg-red-500 text-white p-4 rounded-2xl font-bold text-center">
              🔴 VAQTI TUGAGAN
            </div>
          )}

          {!overdue && homework.status === "active" && !submission && (
            <div className="mt-4 bg-[#FFF3E0] text-[#E65100] p-4 rounded-2xl font-medium text-center">
              ⚠️ 24 soat qoldi
            </div>
          )}

          {/* Submission */}
          {canSubmit && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-[#1A1D26] mb-3">
                Uyga vazifa topshirish
              </h3>
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Uyga vazifa matnini kiriting..."
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all min-h-[120px] text-sm"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button className="btn-outline flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  Fayl yuklash
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!submissionContent.trim() || isSubmitting}
                  className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Yuklanmoqda...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Topshirish
                    </>
                  )}
                </button>
              </div>
              {submitMessage && (
                <div
                  className={cn(
                    "mt-3 p-3 rounded-2xl text-sm",
                    submitMessage.type === "success"
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "bg-[#FFEBEE] text-[#C62828]",
                  )}
                >
                  {submitMessage.text}
                </div>
              )}
            </div>
          )}

          {submission && submission.status === "graded" && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-[#2E7D32]">
                ✅ Uyga vazifa baholandi. Ball: {submission.score}/
                {homework.maxScore}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
