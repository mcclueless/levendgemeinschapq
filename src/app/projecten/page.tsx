import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { getProjects } from "@/content/repository";
import { ProjectGrid } from "@/components/projects/project-card";
import { AdminListingNotice } from "@/components/admin/admin-listing-notice";

// Rendered per request (dynamic-content-listings): reads S3 live so a
// publish/edit/hide/delete shows on the next request, with no CDN-cache lag.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projecten",
  description: "Buurtinitiatieven en projecten van Goeddoen.",
};

export default async function ProjectsPage() {
  // Newest first, no sort/filter control (projects spec).
  const projects = await getProjects();

  return (
    <Container className="py-14">
      <AdminListingNotice />
      <Badge tone="brand">Projecten</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">Buurtinitiatieven</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Lopende en afgeronde projecten van bewoners en organisatoren in de buurt.
      </p>

      <div className="mt-10">
        <ProjectGrid projects={projects} />
      </div>
    </Container>
  );
}
