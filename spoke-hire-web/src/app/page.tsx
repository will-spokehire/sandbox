import { ProtectedRoute } from "~/app/_components/auth";
import { VehicleCatalogViewer } from "./vehicles/_components/VehicleCatalogViewer";

export default function Home() {
  return (
    <ProtectedRoute>
      <VehicleCatalogViewer />
    </ProtectedRoute>
  );
}
