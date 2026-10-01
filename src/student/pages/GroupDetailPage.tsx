// src/student/pages/GroupDetailPage.tsx
import { useGroupDetailQuery } from "@/hooks/queries/useGroups";
import { useParams, useNavigate } from "react-router-dom";
import { Skeleton, SkeletonCardGrid } from "@/components/common/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import { GroupLessonList } from "@/components/Groups/GroupLessonList";

export const GroupDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGroupDetailQuery(id);
  const selectedGroup = data?.group;
  const lessons = data?.lessons ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-5">
        <Skeleton className="w-32 h-4" />
        <SkeletonCardGrid count={4} cols="grid-cols-1 lg:grid-cols-2" />
      </div>
    );
  }

  if (error || !selectedGroup) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error ? getErrorMessage(error, t("groupDetail.notFound")) : t("groupDetail.notFound")}</p>
        <Button onClick={() => navigate("/groups")} className="mt-4">
          {t("groupDetail.backToGroups")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* ── Lessons list ── */}
      <div>
        <GroupLessonList lessons={lessons} />
      </div>
    </div>
  );
};
