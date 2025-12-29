import "./globals.css";
// import { AuthProvider } from "../context/AuthContext";
import * as Sentry from "@sentry/nextjs";
import Providers from "./providers/tancstack";
import Header from "@/components/common/Header";
import { getUserAndProfile } from "@/libs/getUserData";
import { ClientProvider } from "@/context/ClientProvider";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import { ErrorProvider } from "@/context/ErrorContext";
import ToastProvider from "@/components/Error/ErrorMessage";

export const metadata = {
  title: "AidHandy App",
  description: "Professional Next.js app with Supabase email OTP login",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  // ✅ Server-side fetch for initial SSR render
  const { user, profile } = await getUserAndProfile();
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="description" content={metadata.description} />
        <meta name="viewport" content={metadata.viewport} />
        <title>{metadata.title}</title>
      </head>
      <body className="antialiased bg-gray-50 text-gray-900">
        {/* ✅ Header gets server-side profile directly */}
        <HeaderWrapper profile={profile} />
        <Providers>
          {/* ✅ Make data globally available to all client components */}

          <ClientProvider user={user} profile={profile}>
            <ErrorProvider>
              <ToastProvider />
              <Sentry.ErrorBoundary
                fallback={
                  <p>Something went wrong. Our team has been notified.</p>
                }
              >
                {/* <AuthProvider> */}
                {/* <Header /> */}
                {children}
                {/* </AuthProvider> */}
              </Sentry.ErrorBoundary>
            </ErrorProvider>
          </ClientProvider>
        </Providers>
      </body>
    </html>
  );
}
