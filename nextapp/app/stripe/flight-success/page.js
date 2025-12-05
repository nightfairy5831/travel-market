"use client";
import { Suspense } from "react";
import FlightSuccessClient from "./FlightSuccessClient";
export default function FlightSuccessPageWrapper() {
  return (
    <Suspense fallback={<div>Finalizing booking...</div>}>
      <FlightSuccessClient />
    </Suspense>
  );
}
