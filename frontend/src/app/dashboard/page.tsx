"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function DashboardRoot() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/login?redirect=/dashboard");
      } else if (session.user.role === "doctor") {
        router.push("/dashboard/doctor");
      } else {
        router.push("/dashboard/patient");
      }
    }
  }, [session, isPending, router]);

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1 bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      <p className="text-sm font-semibold text-slate-500">Loading dashboard workspace...</p>
    </div>
  );
}
