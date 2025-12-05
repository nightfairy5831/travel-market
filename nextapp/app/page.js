"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // Redirect ALL "/" traffic to "/dashboard"
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      Redirecting...
    </div>
  );
}
