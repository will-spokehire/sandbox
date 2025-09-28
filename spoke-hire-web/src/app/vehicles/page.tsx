import { VehicleCatalogViewer } from "./_components/VehicleCatalogViewer";

interface VehiclesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const params = await searchParams;
  return <VehicleCatalogViewer initialSearch={params.search as string} />;
}
