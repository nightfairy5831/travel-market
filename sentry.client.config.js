// sentry.client.config.js
"use client";

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NEXT_PUBLIC_ENV === "production" ? 0.2 : 1.0,
  environment: process.env.NEXT_PUBLIC_ENV,
});

export default Sentry;
