"use client";

import { useParams } from "next/navigation";
import { TeacherLive } from "@/components/live/TeacherLive";

export default function LiveSessionPage() {
  const { username } = useParams<{ username: string }>();
  return <TeacherLive username={decodeURIComponent(username)} />;
}
