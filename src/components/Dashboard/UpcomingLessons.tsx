// src/components/Dashboard/UpcomingLessons.tsx
import { Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface UpcomingLesson {
  id: string;
  time: string;
  groupName: string;
  topic: string;
}

interface UpcomingLessonsProps {
  lessons: UpcomingLesson[];
}

export const UpcomingLessons = ({ lessons }: UpcomingLessonsProps) => {
  if (lessons.length === 0) {
    return (
      <div className="card">
        <h4 className="font-medium text-text-primary mb-4">
          Tez oradagi darslar
        </h4>
        <p className="text-text-secondary text-sm">Yaqin vaqtda darslar yo'q</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h4 className="font-medium text-text-primary mb-4">
        Tez oradagi darslar
      </h4>
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lessons/${lesson.id}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {lesson.topic}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>{lesson.time}</span>
                  <span className="w-1 h-1 bg-text-secondary rounded-full" />
                  <span>{lesson.groupName}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-primary-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};
