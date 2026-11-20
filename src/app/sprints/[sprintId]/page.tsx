import { notFound } from "next/navigation";
import { getSprint, sprints } from "@/content/registry";
import { SprintBoard } from "@/components/SprintBoard";

export function generateStaticParams() {
  return sprints.map((s) => ({ sprintId: s.id }));
}

export default async function SprintPage({ params }: { params: Promise<{ sprintId: string }> }) {
  const { sprintId } = await params;
  if (!getSprint(sprintId)) notFound();
  return <SprintBoard sprintId={sprintId} />;
}
