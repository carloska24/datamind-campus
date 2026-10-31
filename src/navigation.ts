export type Page =
  | "catalog"
  | "progress"
  | "project"
  | "home"
  | "course"
  | "lesson"
  | "audio"
  | "kdd"
  | "labs"
  | "review"
  | "notes"
  | "resources";
export type CampusRoute = {
  page: Page;
  moduleId?: number;
  position?: number;
  courseId?: "aula02";
};
const slugs: Record<Page, string> = {
  catalog: "aulas",
  progress: "progresso",
  project: "projeto",
  home: "inicio",
  course: "trilha",
  lesson: "aula",
  audio: "audio",
  kdd: "kdd",
  labs: "laboratorios",
  review: "revisao",
  notes: "caderno",
  resources: "materiais",
};
const numbered = (value: string | undefined, max: number, fallback = 0) => {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value)) return null;
  const n = Number(value) - 1;
  return n < max ? n : null;
};

/** One-based addresses work on the local server and in ABRIR.html. */
export function parseRoute(
  hash: string,
  moduleCount: number,
  secondCourse = false,
): CampusRoute | null {
  if (!hash || hash === "#" || hash === "#/") return { page: "home" };
  if (hash.startsWith("#/aula02/") && !secondCourse) {
    const route = parseRoute("#/" + hash.slice(9), moduleCount, true);
    if (!route || route.courseId || route.page === "kdd") return null;
    return { ...route, courseId: "aula02" };
  }
  const parts = hash.replace(/^#\/?/, "").split("/");
  if (parts.at(-1) === "") parts.pop();
  const page = (Object.keys(slugs) as Page[]).find(
    (p) => slugs[p] === parts[0],
  );
  if (!page || (page === "project" && !secondCourse)) return null;
  if (page === "lesson" || page === "audio" || page === "review") {
    const moduleId = numbered(parts[1], moduleCount);
    if (
      moduleId === null ||
      (page !== "audio" && parts.length > 2) ||
      parts.length > 3
    )
      return null;
    if (page === "audio") {
      const position = numbered(parts[2], 4);
      return position === null ? null : { page, moduleId, position };
    }
    return { page, moduleId };
  }
  if (page === "kdd" || page === "labs" || page === "project") {
    const position = numbered(
      parts[1],
      page === "labs" ? (secondCourse ? 4 : 2) : 5,
    );
    return position === null || parts.length > 2 ? null : { page, position };
  }
  return parts.length === 1 ? { page } : null;
}

export function routeHash(route: CampusRoute) {
  let hash = `#/${route.courseId ? "aula02/" : ""}${slugs[route.page]}`;
  if (["lesson", "audio", "review"].includes(route.page))
    hash += `/${(route.moduleId ?? 0) + 1}`;
  if (
    route.page === "audio" ||
    route.page === "kdd" ||
    route.page === "labs" ||
    route.page === "project"
  )
    hash += `/${(route.position ?? 0) + 1}`;
  return hash;
}

export function isStudyRoute(route: CampusRoute) {
  return ["lesson", "audio", "kdd", "labs", "review", "project"].includes(
    route.page,
  );
}

/** Finishing the trail leads to revision, never silently back to module one. */
export function studyDestination(
  done: number[],
  last: CampusRoute | null,
  moduleCount: number,
): CampusRoute {
  const pending = Array.from({ length: moduleCount }, (_, i) => i).find(
    (id) => !done.includes(id),
  );
  if (pending === undefined) return { page: "review", moduleId: 0 };
  if (last && isStudyRoute(last)) return last;
  return { page: "lesson", moduleId: pending };
}
