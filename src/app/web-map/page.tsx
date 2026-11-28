import { InfraMap } from "@/components/webmap/InfraMap";
import { MAP_NODES, type MapNodeId } from "@/content/webmap";

export const metadata = { title: "Web Map · How a web app works" };

export default async function WebMapPage({ searchParams }: { searchParams: Promise<{ node?: string }> }) {
  const { node } = await searchParams;
  const initial = MAP_NODES.some((n) => n.id === node) ? (node as MapNodeId) : undefined;
  return (
    <div className="page wm-page">
      <p className="muted small" style={{ margin: 0 }}>Software project · Web architecture</p>
      <h1>🗺️ How a web app works</h1>
      <p className="muted">
        Every web app is made of the same few parts. Press <strong>▶ Follow one request</strong> to watch a single click travel through all of them,
        then click any part to open its hands-on tutorials. The example is a volunteer-shift sign-up app.
      </p>
      <InfraMap initial={initial} />
    </div>
  );
}
