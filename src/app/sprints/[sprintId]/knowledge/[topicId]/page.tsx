import { notFound } from "next/navigation";
import { getSprint, sprints } from "@/content/registry";
import { KnowledgePage } from "@/components/knowledge/KnowledgePage";

export function generateStaticParams() {
  return sprints.flatMap((s) => (s.knowledge ?? []).map((k) => ({ sprintId: s.id, topicId: k.id })));
}

export default async function TopicPage({ params }: { params: Promise<{ sprintId: string; topicId: string }> }) {
  const { sprintId, topicId } = await params;
  const sprint = getSprint(sprintId);
  if (!sprint?.knowledge?.some((k) => k.id === topicId)) notFound();
  return <KnowledgePage sprintId={sprintId} topicId={topicId} />;
}
