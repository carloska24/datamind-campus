import { useEffect, useRef, useState } from "react";
import type { StudyState } from "./types";
import { routeHash, type CampusRoute } from "./navigation";

export type CampusUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  disabled: boolean;
  createdAt: string;
};
export type StudyRecord = StudyState & {
  lastActivity: string | null;
  revision: number;
  updatedAt: string | null;
};
export async function campusRequest<T>(
  url: string,
  body?: unknown,
  method = "POST",
  expectedUserId?: string,
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(expectedUserId ? { "X-Campus-User": expectedUserId } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(result.error || "Não foi possível concluir. Tente novamente."),
      { status: response.status },
    );
  return result as T;
}

// Serialize saves, including quick edits made while the preceding save is in flight.
// A revision conflict is surfaced instead of silently overwriting another device.
export function useStudySync(
  study: StudyState,
  activity: CampusRoute | null,
  initial: StudyRecord | undefined,
  userId?: string,
) {
  const snapshot = JSON.stringify({
    done: study.done,
    notes: study.notes,
    courses: study.courses ?? {},
    lastActivity: activity ? routeHash(activity) : null,
  });
  const revision = useRef(initial?.revision ?? 0);
  const persisted = useRef(
    initial
      ? JSON.stringify({
          done: initial.done,
          notes: initial.notes,
          courses: initial.courses ?? {},
          lastActivity: initial.lastActivity,
        })
      : "",
  );
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const running = useRef(false),
    mounted = useRef(true),
    blocked = useRef(false);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function save() {
    if (running.current || blocked.current || !initial) return;
    running.current = true;
    try {
      while (mounted.current && latest.current !== persisted.current) {
        const sending = latest.current;
        const result = await campusRequest<StudyRecord>(
          "/api/study",
          { ...JSON.parse(sending), revision: revision.current },
          "PUT",
          userId,
        );
        revision.current = result.revision;
        persisted.current = sending;
      }
      if (mounted.current) {
        setStatus("saved");
        setError("");
      }
    } catch (reason) {
      blocked.current = true;
      if (mounted.current) {
        setStatus("error");
        setError(
          reason instanceof Error
            ? reason.message
            : "Falha ao salvar. Exporte seu caderno para preservar as alterações.",
        );
        setConflict((reason as { status?: number }).status === 409);
      }
    } finally {
      running.current = false;
    }
  }
  useEffect(() => {
    if (!initial || snapshot === persisted.current || blocked.current) return;
    setStatus("saving");
    const timer = setTimeout(() => void save(), 500);
    return () => clearTimeout(timer);
  }, [snapshot, attempt]);
  useEffect(() => {
    if (!initial || status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [status, initial]);
  return {
    status,
    error,
    conflict,
    retry: () => {
      blocked.current = false;
      setAttempt((n) => n + 1);
    },
  };
}
