import { redirect } from "next/navigation";
import { VehicleCreateForm } from "@/components/vehicle-create-form";
import { getSessionRole } from "@/lib/api-helpers";
import { isAllowed } from "@/lib/rbac";

export default async function AddVehiclePage() {
  const session = await getSessionRole();

  if (!session || !isAllowed("/vehicles/add", session.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <VehicleCreateForm />
    </div>
  );
}