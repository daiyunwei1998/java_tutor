import { TicketGuide } from "@/components/admin/TicketGuide";

export const metadata = { title: "Ticket guide", robots: { index: false, follow: false } };

export default function AdminTicketsPage() {
  return <TicketGuide />;
}
