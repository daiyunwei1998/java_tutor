import { notFound } from "next/navigation";
import { WebTopicPage } from "@/components/webmap/WebTopicPage";
import { getWebTopic, WEB_TOPICS } from "@/content/webmap";

export function generateStaticParams() {
  return WEB_TOPICS.map((t) => ({ topicId: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  return { title: getWebTopic(topicId)?.title ?? "Web Map" };
}

export default async function Page({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  if (!getWebTopic(topicId)) notFound();
  return <WebTopicPage topicId={topicId} />;
}
