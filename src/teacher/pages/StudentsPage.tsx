// src/teacher/pages/StudentsPage.tsx
// Mock `students` view: header + "+ Talaba", name search, group chips, student cards.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus, Search, Trash2, Users } from "lucide-react";
import {
  useStudentsQuery,
  useCreateStudentMutation,
  useDeleteStudentMutation,
} from "@/hooks/queries/useStudents";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { Modal } from "@/components/common/Modal";
import { Button, Input } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/lib/utils";
import { Avatar, CoinTag, EmptyBox, PageHeader, Skel, Tag } from "../components/ui";

const NO_GROUP = "__none__";
const EMPTY_FORM = { email: "", password: "", firstName: "", lastName: "", phone: "" };

export const StudentsPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchQuery.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // All students (for the total) + the server-side search result (same query when the search is empty).
  const { data: allStudents = [] } = useStudentsQuery();
  const {
    data: found = [],
    isLoading,
    error,
    refetch,
  } = useStudentsQuery(search ? { search } : undefined);
  const { data: groups = [] } = useGroupsQuery();
  const createStudent = useCreateStudentMutation();
  const deleteStudent = useDeleteStudentMutation();
  const { confirm, confirmModal } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const students = useMemo(
    () =>
      found.filter((s) =>
        filter === "all" ? true : filter === NO_GROUP ? s.groups.length === 0 : s.groups.some((g) => g.id === filter),
      ),
    [found, filter],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setFormError(t("us.fillRequired"));
      return;
    }
    try {
      await createStudent.mutateAsync({ ...form, phone: form.phone || undefined });
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      toast.success(t("us.people.added"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(t("us.people.deleteConfirm"), {
      title: t("common.deleteTitle"),
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteStudent.mutateAsync(id);
      toast.success(t("us.people.deleted"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const filters: [string, string][] = [
    ["all", t("us.people.all")],
    ...groups.map((g) => [g.id, g.name] as [string, string]),
    [NO_GROUP, t("us.people.noGroup")],
  ];

  return (
    <>
      <PageHeader
        title={t("students.title")}
        subtitle={t("us.people.total", { n: allStudents.length || found.length })}
        right={
          <button type="button" className="u-btn" onClick={openCreate}>
            <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
            {t("us.people.student")}
          </button>
        }
      />

      <div>
        <Input
          type="search"
          leftIcon={<Search className="u-i" strokeWidth={2} aria-hidden="true" />}
          placeholder={t("us.people.search")}
          aria-label={t("us.people.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="u-chips sc my-3.5" role="tablist">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={cn("u-chip", filter === value && "sel")}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={getErrorMessage(error, t("common.error"))}
          action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
        />
      ) : isLoading && found.length === 0 ? (
        <div className="u-cols c3 u-stack" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skel key={i} className="h-[84px]" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyBox
          tone="mu"
          icon={Users}
          title={t("us.people.notFound")}
          text={t("us.people.notFoundHint")}
        />
      ) : (
        <div className="u-cols c3 u-stack">
          {students.map((s) => {
            const name = `${s.firstName} ${s.lastName}`.trim();
            return (
              <div key={s.id} className="u-les min-w-0">
                <Link to={`/students/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={name} src={s.avatar} seed={s.id} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[17px]">{name}</b>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {s.groups.length ? (
                        s.groups.map((g) => (
                          <Tag key={g.id} tone="pr" className="max-w-full truncate">
                            {g.name}
                          </Tag>
                        ))
                      ) : (
                        <Tag tone="gd">{t("us.people.noGroup")}</Tag>
                      )}
                      {s.status === "inactive" && <Tag tone="mu">{t("students.inactive")}</Tag>}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <CoinTag n={s.coinBalance} />
                      <small className="text-[13.5px] font-semibold text-u-mu whitespace-nowrap">
                        {s.groups.length ? t("us.people.attPct", { n: s.attendancePercentage }) : "—"}
                      </small>
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="u-ib"
                  aria-label={t("common.delete")}
                  onClick={() => handleDelete(s.id)}
                  disabled={deleteStudent.isPending}
                >
                  <Trash2 className="u-i s" strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("us.people.newStudent")}>
        <form className="grid gap-3.5" onSubmit={handleCreate}>
          <Input
            label={t("students.firstName")}
            required
            autoFocus
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label={t("students.lastName")}
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            label={t("students.phone")}
            type="tel"
            placeholder="+998"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label={t("students.email")}
            type="email"
            required
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label={t("students.password")}
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {formError && <p className="text-[13px] font-bold text-u-er">{formError}</p>}
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={createStudent.isPending}>
              {t("students.addStudent")}
            </Button>
          </div>
        </form>
      </Modal>
      {confirmModal}
    </>
  );
};
