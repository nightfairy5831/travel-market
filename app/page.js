"use client";
import { useEffect } from "react";
// import { supabase } from "@/libs/supabaseClient";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();


  // ! Eliminate this check because the traveller explore the website without authentication
  // useEffect(() => {

  //   const checkSessionAndRedirect = async () => {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();
      
  //     if (session?.user) {
  //       router.push("/dashboard");
  //     } else {
  //       router.push("/auth/login");
  //     }
  //   };

  //   checkSessionAndRedirect();

  //   const { data: listener } = supabase.auth.onAuthStateChange(
  //     (event, session) => {
  //       if (event === "SIGNED_IN" && session?.user) {
  //         router.push("/dashboard");
  //       } else if (event === "SIGNED_OUT") {
  //         router.push("/auth/login");
  //       }
  //     }
  //   );

  //   return () => listener.subscription.unsubscribe();
  // }, [router]);

// ! Redirecting all users to dashboard for now
  useEffect(()=> {
    router.push("/dashboard")
  },[router])
  return (
    <div>
      {/* Your home page content or loading state */}
    </div>
  );
}