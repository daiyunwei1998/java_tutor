import { AccountInfo } from "@/components/admin/AccountInfo";

export default async function AdminAccountPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <AccountInfo username={decodeURIComponent(username)} />;
}
