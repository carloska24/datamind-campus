import { identity } from "../data/identity";

const universityLogo = "/course-art/brand/unisenai.png";

/** Shared identity for the campus shell and account entry. */
export default function CourseBrand() {
  return (
    <span className="course-brand">
      <span className="institution-marks">
        <img
          className="senai-mark"
          src={identity.senaiLogo}
          alt="SENAI"
          width="114"
          height="30"
        />
        <img
          className="unisenai-mark"
          src={
            universityLogo.startsWith("data:")
              ? universityLogo
              : `.${universityLogo}`
          }
          alt="uniSENAI — Inovação no Ensino Superior para a Indústria"
          width="260"
          height="50"
        />
      </span>
      <span className="course-brand-name">{identity.name}</span>
      <span className="course-brand-subtitle">{identity.subtitle}</span>
    </span>
  );
}
