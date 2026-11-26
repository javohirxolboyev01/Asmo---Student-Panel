// src/teacher/components/chat/ChatList.tsx — every student's account in one
// list (no separate "new chat"): students with messages first, newest on top,
// then everyone else A→Z. Search finds any student by name or phone. Rows are
// links on the phone page; in the laptop chat window `onOpen` opens the thread
// inside the window instead.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Search, Users } from "lucide-react";
import { useChatThreadsQuery, type ChatMessage } from "@/hooks/queries/useChat";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import { dayDiff, humanDay } from "@/lib/humanDate";
import { Avatar, EmptyBox, Skel } from "../ui";
import { chatPreview } from "./ChatMedia";
import "../../theme/chat-tg.css";

const pad = (n: number) => String(n).padStart(2, "0");

/** Today → "14:05", otherwise "Kecha" / "24-noyabr". */
const shortWhen = (iso: string, t: Parameters<typeof humanDay>[1]) => {
  const d = new Date(iso);
  return dayDiff(d) === 0 ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : humanDay(d, t);
};

interface Row {
  id: string;
  name: string;
  avatar: string | null;
  phone: string;
  groups: string;
  telegramLinked: boolean;
  last: ChatMessage | null;
  unread: number;
}

/** Media kinds read like Telegram's previews: the kind in the accent colour. */
const Preview = ({ m }: { m: ChatMessage }) => {
  const { t } = useTranslation();
  if (m.kind === "text") return <>{m.text}</>;
  const label = chatPreview({ kind: m.kind, text: "" }, t);
  return (
    <>
      <span className="tg-row-kind">{label}</span>
      {m.text && <>, {m.text}</>}
    </>
  );
};

const ChatRow = ({ row, onOpen }: { row: Row; onOpen?: (studentId: string) => void }) => {
  const { t } = useTranslation();
  const body = (
    <>
      <Avatar name={row.name} src={row.avatar} seed={row.id} className="tg-row-av" />
      <div className="tg-row-main">
        <div className="tg-row-top">
          <b>{row.name}</b>
          {row.last && (
            <small className="tg-row-time">
              {!row.last.fromStudent && (
                <svg className="tg-tick" viewBox="0 0 16 16" aria-label={t("us.chat.you")}>
                  <path d="M3 8.6l3.2 3.1L13 4.6" />
                </svg>
              )}
              {shortWhen(row.last.createdAt, t)}
            </small>
          )}
        </div>
        <div className="tg-row-bottom">
          <span className="tg-row-pv">
            {row.last ? <Preview m={row.last} /> : row.groups || t("us.chat.noMessages")}
          </span>
          {row.unread > 0 ? (
            <span className="tg-row-badge">{row.unread > 99 ? "99+" : row.unread}</span>
          ) : (
            !row.telegramLinked && <span className="tg-row-off">{t("us.chat.unlinkedTag")}</span>
          )}
        </div>
      </div>
    </>
  );
  return onOpen ? (
    <button type="button" className="tg-row" onClick={() => onOpen(row.id)}>
      {body}
    </button>
  ) : (
    <Link to={`/chat/${row.id}`} className="tg-row">
      {body}
    </Link>
  );
};

export const ChatList = ({ onOpen }: { onOpen?: (studentId: string) => void }) => {
  const { t } = useTranslation();
  const threadsQuery = useChatThreadsQuery();
  const studentsQuery = useStudentsQuery();
  const [query, setQuery] = useState("");

  const rows = useMemo<Row[]>(() => {
    const byId = new Map<string, Row>();
    for (const s of studentsQuery.data ?? [])
      byId.set(s.id, {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        avatar: s.avatar,
        phone: s.phone ?? "",
        groups: s.groups.map((g) => g.name).join(", "),
        telegramLinked: s.telegramLinked ?? true,
        last: null,
        unread: 0,
      });
    // Threads also cover students outside the active list (e.g. archived) that wrote.
    for (const th of threadsQuery.data ?? []) {
      const row = byId.get(th.student.id) ?? {
        id: th.student.id,
        name: `${th.student.firstName} ${th.student.lastName}`,
        avatar: th.student.avatar,
        phone: "",
        groups: "",
        telegramLinked: th.student.telegramLinked,
        last: null,
        unread: 0,
      };
      byId.set(th.student.id, { ...row, last: th.last, unread: th.unread, telegramLinked: th.student.telegramLinked });
    }
    return [...byId.values()].sort((a, b) => {
      if (a.last && b.last) return b.last.createdAt.localeCompare(a.last.createdAt);
      if (a.last || b.last) return a.last ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [studentsQuery.data, threadsQuery.data]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const digits = q.replace(/\D/g, "");
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.name.split(" ").reverse().join(" ").toLowerCase().includes(q) ||
        r.groups.toLowerCase().includes(q) ||
        (digits.length >= 3 && r.phone.replace(/\D/g, "").includes(digits)),
    );
  }, [rows, query]);

  const isLoading = threadsQuery.isLoading || studentsQuery.isLoading;
  const error = threadsQuery.error ?? studentsQuery.error;

  return (
    <div className="tg-chats">
      <label className="tg-search">
        <Search className="tg-ic s" strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          placeholder={t("us.chat.search")}
          aria-label={t("us.chat.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {isLoading ? (
        <div className="grid gap-1 p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skel key={i} className="h-[66px] rounded-[12px]" />
          ))}
        </div>
      ) : error ? (
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={getErrorMessage(error, t("common.error"))}
          action={
            <Button
              onClick={() => {
                void threadsQuery.refetch();
                void studentsQuery.refetch();
              }}
            >
              {t("common.retry")}
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyBox icon={Users} title={t("us.chat.noStudents")} />
      ) : (
        <div className="tg-rows">
          {shown.map((row) => (
            <ChatRow key={row.id} row={row} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
};
