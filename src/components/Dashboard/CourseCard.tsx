// src/components/Dashboard/CourseCard.tsx
import { Calendar, Users, Award } from "lucide-react";
import { formatDate, formatTime } from "@/utilist/formatData";

interface CourseCardProps {
  groupName: string;
  courseName: string;
  directionName: string;
  directionColor: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  nextLessonDate: string;
  teacherName: string;
}




export const CourseCard = ({
  groupName,
  courseName,
  directionName,
  directionColor,
  totalLessons,
  completedLessons,
  progress,
  nextLessonDate,
  teacherName,
}: CourseCardProps) => {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">
              {groupName}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: directionColor }}
            >
              {directionName}
            </span>
          </div>
          <h3 className="text-xl font-bold text-text-primary">{courseName}</h3>
        </div>
        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
          <Award className="w-6 h-6 text-primary-500" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-text-secondary">Progress</span>
            <span className="font-medium text-text-primary">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1.5">
            {completedLessons}/{totalLessons} dars tugallangan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar className="w-4 h-4" />
            <span>
              Keyingi dars: {formatDate(nextLessonDate)},{" "}
              {formatTime(nextLessonDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Users className="w-4 h-4" />
            <span>O'qituvchi: {teacherName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
