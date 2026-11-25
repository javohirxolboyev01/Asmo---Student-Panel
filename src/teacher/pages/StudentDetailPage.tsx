// src/teacher/pages/StudentDetailPage.tsx
// Mock `student` view: centred hero with actions, 3 stats, groups/grades/attendance
// on the left, coin history and payments on the right.
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Mail, Pencil, Phone, Plus, Send, Trash2, X } from "lucide-react";
import {
  useStudentDetailQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from "@/hooks/queries/useStudents";
import { useGroupsQuery, useEnrollStudentMutation, useUnenrollStudentMutation } from "@/hooks/queries/useGroups";
import { useAddPaymentMutation } from "@/hooks/queries/usePayments";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Select } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import type { TeacherPayment } from "@/types/teacher";
import { Avatar, BackButton, EmptyBox, Skel, Tag, groupColor, type Tone } from "../components/ui";
import { GiveCoinSheet } from "../components/sheets";
import { TelegramLinkModal } from "../components/TelegramLinkModal";
import { StudentCodeCard } from "../components/StudentCodeCard";
import { humanDateTime, humanDay } from "@/lib/humanDate";
import { dueInputToIso, formatDue, todayInput } from "@/lib/dueDate";

const PAYMENT_STATUS: Record<TeacherPayment["status"], { key: string; tone: Tone }> = {
  paid: { key: "payments.statusPaid", tone: "ok" },
  pending: { key: "payments.statusPending", tone: "gd" },
  overdue: { key: "payments.statusOverdue", tone: "er" },
  cancelled: { key: "payments.statusCancelled", tone: "mu" },
};
const PAYMENT_TYPES = ["CASH", "CLICK", "PAYME", "BANK", "UZUM"];
const PAYMENT_TYPE_KEYS: Record<string, string> = { CASH: "payments.typeCash", BANK: "payments.typeBank" };
const EMPTY_PAYMENT = { amountNumber: "", paymentType: "CASH", status: "PENDING", description: "", dueDate: "" };
const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export const StudentDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: selectedStudent, isLoading, error, refetch } = useStudentDetailQuery(id);
  const updateStudent = useUpdateStudentMutation();
  const deleteStudent = useDeleteStudentMutation();
  const { data: groups = [] } = useGroupsQuery();
  const enrollStudent = useEnrollStudentMutation();
  const unenrollStudent = useUnenrollStudentMutation();
  const addPayment = useAddPaymentMutation();
  const { confirm, confirmModal } = useConfirm();

  const [isCoinOpen, setIsCoinOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [enrollGroupId, setEnrollGroupId] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", status: "ACTIVE" });

  useEffect(() => {
    if (!selectedStudent) return;
    setEditForm({
      firstName: selectedStudent.student.firstName,
      lastName: selectedStudent.student.lastName,
      phone: selectedStudent.student.phone ?? "",
      status: selectedStudent.student.status.toUpperCase(),
    });
  }, [selectedStudent]);

  const handleSaveStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !editForm.firstName || !editForm.lastName) return;
    try {
      await updateStudent.mutateAsync({
        id,
        payload: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone || null,
          status: editForm.status,
        },
      });
      setIsEditOpen(false);
      toast.success(t("us.people.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await confirm(t("us.people.deleteConfirm"), {
      title: t("common.deleteTitle"),
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteStudent.mutateAsync(id);
      toast.success(t("us.people.deleted"));
      navigate("/students", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !paymentForm.amountNumber) return;
    try {
      await addPayment.mutateAsync({
        studentId: id,
        payload: {
          amountNumber: Number(paymentForm.amountNumber),
          paymentType: paymentForm.paymentType,
          status: paymentForm.status,
          description: paymentForm.description || undefined,
          dueDate: paymentForm.status === "PAID" ? undefined : dueInputToIso(paymentForm.dueDate),
        },
      });
      setIsPaymentOpen(false);
      setPaymentForm(EMPTY_PAYMENT);
      toast.success(t("us.people.paymentAdded"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleEnroll = async () => {
    if (!id || !enrollGroupId) return;
    try {
      await enrollStudent.mutateAsync({ groupId: enrollGroupId, userId: id });
      setEnrollGroupId("");
      toast.success(t("us.people.enrolled"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleUnenroll = async (groupId: string) => {
    if (!id) return;
    const confirmed = await confirm(t("us.people.unenrollConfirm"), { tone: "danger" });
    if (!confirmed) return;
    try {
      await unenrollStudent.mutateAsync({ groupId, userId: id });
      toast.success(t("us.people.unenrolled"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (error && !selectedStudent) {
    return (
      <>
        <BackButton to="/students" />
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={getErrorMessage(error, t("common.error"))}
          action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
        />
      </>
    );
  }

  if (isLoading || !selectedStudent) {
    return (
      <div aria-busy="true">
        <Skel className="h-6 w-24 rounded-lg" />
        <Skel className="mt-4 h-[250px] rounded-[28px]" />
        <div className="u-stats3 mt-4">
          <Skel className="h-[76px] rounded-[18px]" />
          <Skel className="h-[76px] rounded-[18px]" />
          <Skel className="h-[76px] rounded-[18px]" />
        </div>
        <div className="u-two e u-sec">
          <Skel className="h-48" />
          <Skel className="h-48" />
        </div>
      </div>
    );
  }

  const { student, groups: studentGroups, attendance, coinTransactions, payments, submissions } = selectedStudent;
  const name = `${student.firstName} ${student.lastName}`.trim();
  const availableGroups = groups.filter((g) => !studentGroups.some((sg) => sg.id === g.id));
  const graded = submissions.filter((s) => s.status === "graded" && s.score !== null && s.maxScore > 0);
  const avgGrade = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + ((s.score ?? 0) / s.maxScore) * 100, 0) / graded.length)
    : null;
  const attPct = attendance.stats.total > 0 ? attendance.stats.percentage : null;

  return (
    <>
      <BackButton to="/students" />
      <section
        className="u-ghero grid justify-items-center gap-2 text-center"
        style={{ "--g": groupColor(student.id) } as CSSProperties}
      >
        <Avatar name={name} src={student.avatar} seed={student.id} size="xl" />
        <h1 className="break-words">{name}</h1>
        <div className="flex flex-wrap justify-center gap-1.5">
          {studentGroups.length ? (
            studentGroups.map((g) => (
              <span key={g.id} className="u-chip">
                {g.name}
              </span>
            ))
          ) : (
            <span className="u-chip">{t("us.people.noGroup")}</span>
          )}
          {student.status === "inactive" && <span className="u-chip">{t("students.inactive")}</span>}
        </div>
        {(student.email || student.phone) && (
          <p className="break-all text-sm opacity-90">
            {[student.phone, student.email].filter(Boolean).join(" · ")}
          </p>
        )}
        {/* Icon + caption, so every action says what it does. */}
        <div className="u-sd-acts mt-1.5 flex gap-3.5">
          {student.phone && (
            <a className="u-sd-act" href={`tel:${student.phone}`}>
              <span className="u-ib gl" aria-hidden="true">
                <Phone className="u-i m" strokeWidth={2} />
              </span>
              {t("us.people.actCall")}
            </a>
          )}
          {student.email && (
            <a className="u-sd-act" href={`mailto:${student.email}`}>
              <span className="u-ib gl" aria-hidden="true">
                <Mail className="u-i m" strokeWidth={2} />
              </span>
              {t("us.people.actEmail")}
            </a>
          )}
          <button type="button" className="u-sd-act" onClick={() => setIsTelegramOpen(true)}>
            <span className="u-ib gl" aria-hidden="true">
              <Send className="u-i m" strokeWidth={2} />
            </span>
            {t("us.tg.action")}
          </button>
          <button type="button" className="u-sd-act" onClick={() => setIsEditOpen(true)}>
            <span className="u-ib gl" aria-hidden="true">
              <Pencil className="u-i m" strokeWidth={2} />
            </span>
            {t("us.people.actEdit")}
          </button>
          <button type="button" className="u-sd-act" onClick={handleDelete} disabled={deleteStudent.isPending}>
            <span className="u-ib gl" aria-hidden="true">
              <Trash2 className="u-i m" strokeWidth={2} />
            </span>
            {t("us.people.actArchive")}
          </button>
        </div>
      </section>

      <div className="u-stats3 mt-4">
        <div>
          <b style={{ color: "var(--gdx)" }}>{student.coinBalance}</b>
          <span>{t("us.people.coin")}</span>
        </div>
        <div>
          <b>{attPct === null ? "—" : `${attPct}%`}</b>
          <span>{t("us.people.attendance")}</span>
        </div>
        <div>
          <b>{avgGrade === null ? "—" : avgGrade}</b>
          <span>{t("us.people.avgGrade")}</span>
        </div>
      </div>

      <div className="u-two e u-sec">
        <div className="u-stack">
          {/* Telegram login code — its own card above Groups */}
          <StudentCodeCard studentId={student.id} studentName={name} />

          {/* Groups */}
          <div className="u-card">
            <h2 className="mb-3">{t("us.people.group")}</h2>
            {studentGroups.length > 0 ? (
              <div className="u-stack mb-3 gap-2">
                {studentGroups.map((g) => (
                  <div key={g.id} className="u-row min-w-0">
                    <b className="g break-words">{g.name}</b>
                    <Link to={`/groups/${g.id}`} className="u-btn soft sm">
                      {t("us.people.open")}
                    </Link>
                    <button
                      type="button"
                      className="u-ib h-9 w-9"
                      aria-label={t("students.unenroll")}
                      title={t("students.unenroll")}
                      onClick={() => handleUnenroll(g.id)}
                      disabled={unenrollStudent.isPending}
                    >
                      <X className="u-i s" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="u-sub mb-3 mt-0">{t("us.people.notInGroup")}</p>
            )}
            {availableGroups.length > 0 && (
              <div className="flex gap-2.5">
                <Select
                  value={enrollGroupId}
                  onChange={(e) => setEnrollGroupId(e.target.value)}
                  containerClassName="min-w-0 flex-1"
                  aria-label={t("students.enrollGroup")}
                >
                  <option value="">{t("us.people.chooseGroup")}</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  className="u-btn"
                  onClick={handleEnroll}
                  disabled={!enrollGroupId || enrollStudent.isPending}
                >
                  {t("common.add")}
                </button>
              </div>
            )}
          </div>

          {/* Grades: every submission, graded ones with a score pill */}
          <div className="u-card">
            <h2 className="mb-3">{t("us.people.grades")}</h2>
            {submissions.length === 0 ? (
              <p className="u-sub m-0">{t("us.people.noGrades")}</p>
            ) : (
              <div className="u-stack gap-2">
                {submissions.map((s) => (
                  <div key={s.id} className="u-row min-w-0">
                    <div className="g">
                      <b className="truncate">{s.lessonTopic || s.homeworkTitle}</b>
                      <small className="block truncate">
                        {[s.lessonTopic && s.homeworkTitle !== s.lessonTopic ? s.homeworkTitle : null, humanDay(s.submittedAt, t)]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                    {s.status === "graded" ? (
                      <span className="u-coin flex-none px-[11px]">
                        {s.score ?? 0}/{s.maxScore}
                      </span>
                    ) : (
                      <Tag tone="mu" className="flex-none">
                        {t("us.people.checking")}
                      </Tag>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance history */}
          <div className="u-card">
            <div className="u-sech">
              <h2>{t("students.attendanceTitle")}</h2>
              {attPct !== null && (
                <Tag tone={attPct < 50 ? "er" : attPct < 80 ? "gd" : "ok"}>
                  {attendance.stats.present}/{attendance.stats.total}
                </Tag>
              )}
            </div>
            {attendance.records.length === 0 ? (
              <p className="u-sub m-0">{t("students.noAttendance")}</p>
            ) : (
              <div className="u-stack max-h-80 gap-2 overflow-y-auto">
                {attendance.records.map((r) => (
                  <div key={r.id} className="u-row min-w-0">
                    <div className="g">
                      <b className="truncate">{r.lessonTopic ?? t("students.lessonFallback")}</b>
                      <small>{humanDay(r.lessonDate ?? r.markedAt, t)}</small>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="u-stack">
          {/* Coin history */}
          <div className="u-card">
            <div className="u-sech">
              <h2>{t("students.coinsTitle")}</h2>
              <button type="button" className="u-btn sm" onClick={() => setIsCoinOpen(true)}>
                <Plus className="u-i s" strokeWidth={2} aria-hidden="true" />
                {t("students.awardCoins")}
              </button>
            </div>
            {coinTransactions.length === 0 ? (
              <p className="u-sub m-0">{t("students.noCoins")}</p>
            ) : (
              <div className="u-stack">
                {coinTransactions.map((tx) => (
                  <div key={tx.id} className="u-row min-w-0">
                    <Avatar name={name} src={student.avatar} seed={student.id} size="s" />
                    <div className="g">
                      <b className="break-words">{tx.reason}</b>
                      <small>{humanDateTime(tx.createdAt, t)}</small>
                    </div>
                    <b
                      className="flex-none font-fd text-[19px]"
                      style={{ color: tx.amount > 0 ? "var(--ok)" : "var(--er)" }}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount} <small className="text-[13px] font-bold">{t("unit.coin")}</small>
                    </b>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="u-card">
            <div className="u-sech">
              <h2>{t("students.paymentsTitle")}</h2>
              <button type="button" className="u-btn soft sm" onClick={() => setIsPaymentOpen(true)}>
                <Plus className="u-i s" strokeWidth={2} aria-hidden="true" />
                {t("us.people.payment")}
              </button>
            </div>
            {payments.length === 0 ? (
              <p className="u-sub m-0">{t("students.noPayments")}</p>
            ) : (
              <div className="u-stack">
                {payments.map((p) => {
                  const st = PAYMENT_STATUS[p.status] ?? PAYMENT_STATUS.pending;
                  const type = PAYMENT_TYPE_KEYS[p.paymentType?.toUpperCase()]
                    ? t(PAYMENT_TYPE_KEYS[p.paymentType.toUpperCase()])
                    : p.paymentType ? p.paymentType.charAt(0).toUpperCase() + p.paymentType.slice(1).toLowerCase() : "";
                  return (
                    <div key={p.id} className="u-row min-w-0">
                      <div className="g">
                        <b>{t("us.people.sum", { n: money(p.amountNumber) })}</b>
                        <small className="block break-words">
                          {[
                            p.description,
                            type,
                            p.paidAt ? humanDay(p.paidAt, t) : null,
                            p.dueDate && (p.status === "pending" || p.status === "overdue")
                              ? t("us.pay.due", { date: formatDue(p.dueDate) })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </div>
                      <Tag tone={st.tone} className="flex-none">
                        {t(st.key)}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <GiveCoinSheet open={isCoinOpen} onClose={() => setIsCoinOpen(false)} studentId={student.id} />
      <TelegramLinkModal
        studentId={student.id}
        studentName={name}
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={t("us.people.editStudent")}>
        <form className="grid gap-3.5" onSubmit={handleSaveStudent}>
          <Input
            label={t("students.firstName")}
            required
            value={editForm.firstName}
            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
          />
          <Input
            label={t("students.lastName")}
            required
            value={editForm.lastName}
            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
          />
          <Input
            label={t("students.phone")}
            type="tel"
            placeholder="+998"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Select
            label={t("students.status")}
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          >
            <option value="ACTIVE">{t("students.active")}</option>
            <option value="INACTIVE">{t("students.inactive")}</option>
          </Select>
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={updateStudent.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={t("students.addPayment")}>
        <form className="grid gap-3.5" onSubmit={handleAddPayment}>
          <Input
            label={t("us.people.sumLabel")}
            type="number"
            min={1}
            required
            autoFocus
            value={paymentForm.amountNumber}
            onChange={(e) => setPaymentForm({ ...paymentForm, amountNumber: e.target.value })}
          />
          <Select
            label={t("payments.paymentTypeLabel")}
            value={paymentForm.paymentType}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
          >
            {PAYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PAYMENT_TYPE_KEYS[type] ? t(PAYMENT_TYPE_KEYS[type]) : type}
              </option>
            ))}
          </Select>
          <Select
            label={t("payments.status")}
            value={paymentForm.status}
            onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
          >
            {(["pending", "paid", "overdue", "cancelled"] as const).map((status) => (
              <option key={status} value={status.toUpperCase()}>
                {t(PAYMENT_STATUS[status].key)}
              </option>
            ))}
          </Select>
          {paymentForm.status !== "PAID" && paymentForm.status !== "CANCELLED" && (
            <div className="grid gap-1.5">
              <Input
                label={t("us.pay.dueDate")}
                type="date"
                min={todayInput()}
                value={paymentForm.dueDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
              />
              <p className="text-[12.5px] font-semibold text-u-mu">{t("us.pay.dueHint")}</p>
            </div>
          )}
          <Input
            label={t("us.people.note")}
            value={paymentForm.description}
            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
          />
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={addPayment.isPending}>
              {t("students.addPayment")}
            </Button>
          </div>
        </form>
      </Modal>
      {confirmModal}
    </>
  );
};
