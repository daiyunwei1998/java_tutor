import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/registry";
import { ProjectBoard } from "@/components/ProjectBoard";

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!getProject(projectId)) notFound();
  return <ProjectBoard projectId={projectId} />;
}
