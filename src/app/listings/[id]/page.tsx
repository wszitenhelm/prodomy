import { getListingDetail } from "@/modules/listings/service";
import { notFound } from "next/navigation";

interface ListingDetailPageProps {
  readonly params: Promise<{
    id: string;
  }>;
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const listing = await getListingDetail(id);

  if (!listing) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="panel">
        <h1>Listing details placeholder</h1>
        <p>Listing ID: {listing.id}</p>
      </section>
    </main>
  );
}
