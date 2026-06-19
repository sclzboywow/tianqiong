import { canAccessOpsWorkspace } from "@/lib/opsDebugAccess";
import "./ProjectOrchestrationNavLink.scss";

export default async function ProjectOrchestrationNavLink() {
  if (!(await canAccessOpsWorkspace())) return null;

  return (
    <nav className="orchestration-nav" aria-label="内容编排">
      <p className="orchestration-nav__label">内容编排</p>
      <a className="orchestration-nav__link" href="/ops/content-orchestration">
        项目主线编排
      </a>
    </nav>
  );
}
