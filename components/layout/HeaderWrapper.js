// components/layout/HeaderWrapper.js
"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/common/Header";

export default function HeaderWrapper({ profile }) {
  const pathname = usePathname();
  
  // Hide header on these routes
  const hideHeaderRoutes = ["/auth/login", "/auth/signup"];
  const shouldShowHeader = !hideHeaderRoutes.includes(pathname);

  if (!shouldShowHeader) {
    return null;
  }

  return <Header profile={profile} />;
}