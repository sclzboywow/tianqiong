"use client";

import "./ProjectOrchestrationNavLink.scss";

const OPS_LINKS = [
  { href: "/ops/project-flow", label: "项目流程编排" },
  { href: "/ops/content-orchestration", label: "编排技术视图" },
] as const;

function navigateToOps(path: string) {
  const url = new URL(path, window.location.origin).href;
  window.location.assign(url);
}

export default function ProjectOrchestrationNavLink() {
  return (
    <nav className="orchestration-nav" aria-label="内容编排">
      <p className="orchestration-nav__label">内容编排</p>
      {OPS_LINKS.map(({ href, label }) => (
        <a
          key={href}
          className="orchestration-nav__link"
          href={href}
          onClick={(event) => {
            event.preventDefault();
            navigateToOps(href);
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
