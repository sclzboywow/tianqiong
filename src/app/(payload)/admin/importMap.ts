import { CollectionCards } from "@payloadcms/next/rsc";
import ProjectOrchestrationNavLink from "@/payload/admin/ProjectOrchestrationNavLink";
import type { ImportMap } from "payload";

export const importMap: ImportMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards,
  "payload/admin/ProjectOrchestrationNavLink#default": ProjectOrchestrationNavLink,
};
