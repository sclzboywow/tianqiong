import "./ProjectOrchestrationNavLink.scss";

export default function ProjectOrchestrationNavLink() {
  return (
    <nav className="orchestration-nav" aria-label="内容编排">
      <p className="orchestration-nav__label">内容编排</p>
      <a className="orchestration-nav__link" href="/ops/project-flow">
        项目流程编排
      </a>
      <a className="orchestration-nav__link" href="/ops/content-orchestration">
        编排技术视图
      </a>
    </nav>
  );
}
