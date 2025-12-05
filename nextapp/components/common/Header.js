"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/libs/supabaseClient";
import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

export default function Header({ profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("seenProfileAlert");
    router.push("/auth/login");
    setIsMobileMenuOpen(false);
  };
  const handleAdminRedirect = () => {
    if (profile?.role === "admin") {
      router.push("/admin");
      setIsMobileMenuOpen(false);
    } else {
      alert("Access denied: Admins only");
    }
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

   const handleAuth = () => {
    router.push("/auth/login?role=traveller&type=signup");
  };
  return (
    <>
      <header className="!bg-blue-900 text-white">
        <div className="px-6 flex justify-between items-center h-20">
          <div>
            <p className="text-xl font-bold">AidHandy</p>
          </div>
          {!profile && (
            <div className="flex gap-2 mb-0">
              {/* <Link
              href="/"
              className="text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Home
            </Link> */}
            </div>
          )}
          {/* Agar user logged out hai to login button dikhe */}
          {!profile && (
            <> <div className="flex gap-2">
            <Link
              href="/auth/login"
              className="bg-white text-blue-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition duration-200"
            >
              Login
            </Link>
           
            <button
              onClick={handleAuth}
              className="bg-white text-blue-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition duration-200"
            >
              Signup
            </button>
          </div></>
         
        )}

          {profile && profile.status === "active" && (
            <div className="flex items-center justify-center space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-lg font-semibold transition duration-200 whitespace-nowrap ${
                  pathname === "/dashboard"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-white hover:bg-gray-800"
                }`}
              >
                Dashboard
              </Link>

              {["traveller", "companion"].includes(profile.type) && (
                <>
                  <Link
                    href="/dashboard/Booked-Flights"
                    className={`px-3 py-2 rounded-md text-lg font-semibold transition duration-200 whitespace-nowrap ${
                      pathname === "/dashboard/Booked-Flights"
                        ? "bg-red-100 text-red-700"
                        : "text-white hover:bg-gray-800"
                    }`}
                  >
                    Booked Flights
                  </Link>

                  <Link
                    href="/dashboard/FlightChecker"
                    className={`px-3 py-2 rounded-md text-lg font-semibold transition duration-200 whitespace-nowrap ${
                      pathname === "/dashboard/FlightChecker"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-white hover:bg-gray-800"
                    }`}
                  >
                    Flight Checker
                  </Link>
                </>
              )}
            </div>
          )}
          {profile && profile.status === "active" && (
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center space-x-3">
                <ProfileDropdown
                  email={profile?.email}
                  role={profile?.role}
                  onLogout={handleSignOut}
                />
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );

  // return (
  //   <>
  //     {profile === null && (
  //       <header className="  !bg-blue-900 text-white  ">
  //         <div className="px-6 flex justify-between items-center h-20">
  //           <div>
  //              <p className="text-xl font-bold">AidHandy</p>
  //           </div>
  //           <div className="flex gap-2 mb-0">
  //             <Link
  //               href="/"
  //               className="text-white font-semibold py-2 px-4 rounded-lg   transition duration-200"
  //             >
  //               Home
  //             </Link>

  //           </div>
  //           <div className="flex gap-2">
  //           <Link
  //             href="/auth/login"
  //             className="bg-white text-blue-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition duration-200"
  //           >
  //             Login
  //           </Link>

  //            </div>
  //         </div>
  //       </header>
  //     )}

  //     {profile && profile.status === "active" && (
  //       <header className="bg-white shadow-lg border-b border-gray-200">
  //         <div className="container-fluid mx-auto px-4 sm:px-6 lg:px-8">
  //           {/* Desktop Header */}
  //           <div className="hidden md:flex justify-between items-center h-16">
  //             <div className="min-w-[200px] lg:min-w-[309px] flex items-center"></div>

  //             <div className="flex items-center justify-center space-x-4">
  //               <Link
  //                 href="/dashboard"
  //                 className={`px-3 py-2 rounded-md text-lg font-semibold transition duration-200 whitespace-nowrap ${
  //                   pathname === "/dashboard"
  //                     ? "bg-indigo-100 text-indigo-700"
  //                     : "text-gray-700 hover:bg-gray-100"
  //                 }`}
  //               >
  //                 Dashboard
  //               </Link>

  //               {["traveller", "companion"].includes(profile.type) && (
  //                 <Link
  //                   href="/dashboard/Booked-Flights"
  //                   className={`px-3 py-2 rounded-md text-lg font-semibold transition duration-200 whitespace-nowrap ${
  //                     pathname === "/dashboard/Booked-Flights"
  //                       ? "bg-red-100 text-red-700"
  //                       : "text-gray-700 hover:bg-gray-100"
  //                   }`}
  //                 >
  //                   Booked Flights
  //                 </Link>
  //               )}

  //               {["traveller", "companion"].includes(profile.type) && (
  //                 <Link
  //                   href="/dashboard/FlightChecker"
  //                   className={`px-3 py-2 rounded-md text-lg font-semibold transition duration-200 whitespace-nowrap ${
  //                     pathname === "/dashboard/FlightChecker"
  //                       ? "bg-indigo-100 text-indigo-700"
  //                       : "text-gray-700 hover:bg-gray-100"
  //                   }`}
  //                 >
  //                   Flight Checker
  //                 </Link>
  //               )}
  //             </div>

  //             <div className="flex items-center space-x-3 min-w-[200px] lg:min-w-[309px] justify-end">
  //               {profile?.role === "admin" && (
  //                 <button
  //                   onClick={handleAdminRedirect}
  //                   className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
  //                 >
  //                   <svg
  //                     className="w-4 h-4 mr-2"
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth="2"
  //                       d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
  //                     />
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth="2"
  //                       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  //                     />
  //                   </svg>
  //                   Admin
  //                 </button>
  //               )}

  //               <div className="flex items-center space-x-3 min-w-[200px] lg:min-w-[309px] justify-end">
  //                 <ProfileDropdown
  //                   email={profile?.email}
  //                   role={profile?.role}
  //                   onLogout={handleSignOut}
  //                 />

  //                 {profile?.role === "admin" && (
  //                   <button
  //                     onClick={handleAdminRedirect}
  //                     className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
  //                   >
  //                     <svg
  //                       className="w-4 h-4 mr-2"
  //                       fill="none"
  //                       stroke="currentColor"
  //                       viewBox="0 0 24 24"
  //                     >
  //                       <path
  //                         strokeLinecap="round"
  //                         strokeLinejoin="round"
  //                         strokeWidth="2"
  //                         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
  //                       />
  //                       <path
  //                         strokeLinecap="round"
  //                         strokeLinejoin="round"
  //                         strokeWidth="2"
  //                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  //                       />
  //                     </svg>
  //                     Admin
  //                   </button>
  //                 )}
  //               </div>
  //             </div>
  //           </div>

  //           <div className="md:hidden flex justify-between items-center h-16">
  //             <div className="flex items-center">
  //               <span className="text-xl font-bold text-gray-800">Logo</span>
  //             </div>

  //             <button
  //               onClick={toggleMobileMenu}
  //               className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
  //             >
  //               <svg
  //                 className="h-6 w-6"
  //                 fill="none"
  //                 viewBox="0 0 24 24"
  //                 stroke="currentColor"
  //               >
  //                 {isMobileMenuOpen ? (
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M6 18L18 6M6 6l12 12"
  //                   />
  //                 ) : (
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M4 6h16M4 12h16M4 18h16"
  //                   />
  //                 )}
  //               </svg>
  //             </button>
  //           </div>

  //           {isMobileMenuOpen && (
  //             <div className="md:hidden bg-white border-t border-gray-200 py-4">
  //               <div className="space-y-2 px-2">
  //                 <Link
  //                   href="/dashboard"
  //                   onClick={() => setIsMobileMenuOpen(false)}
  //                   className={`block px-3 py-2 rounded-md text-lg font-semibold transition duration-200 ${
  //                     pathname === "/dashboard"
  //                       ? "bg-indigo-100 text-indigo-700"
  //                       : "text-gray-700 hover:bg-gray-100"
  //                   }`}
  //                 >
  //                   Dashboard
  //                 </Link>

  //                 {["traveller", "companion"].includes(profile.type) && (
  //                   <Link
  //                     href="/dashboard/Booked-Flights"
  //                     onClick={() => setIsMobileMenuOpen(false)}
  //                     className={`block px-3 py-2 rounded-md text-lg font-semibold transition duration-200 ${
  //                       pathname === "/dashboard/Booked-Flights"
  //                         ? "bg-indigo-100 text-indigo-700"
  //                         : "text-gray-700 hover:bg-gray-100"
  //                     }`}
  //                   >
  //                     Booked Flights
  //                   </Link>
  //                 )}

  //                 {["traveller", "companion"].includes(profile.type) && (
  //                   <Link
  //                     href="/dashboard/FlightChecker"
  //                     onClick={() => setIsMobileMenuOpen(false)}
  //                     className={`block px-3 py-2 rounded-md text-lg font-semibold transition duration-200 ${
  //                       pathname === "/dashboard/FlightChecker"
  //                         ? "bg-indigo-100 text-indigo-700"
  //                         : "text-gray-700 hover:bg-gray-100"
  //                     }`}
  //                   >
  //                     Flight Checker
  //                   </Link>
  //                 )}
  //                 <div className="flex items-center space-x-2 px-3 py-4 border-t border-gray-200 mt-4">
  //                   <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
  //                     <span className="text-indigo-600 text-sm font-semibold">
  //                       {profile?.email?.charAt(0).toUpperCase()}
  //                     </span>
  //                   </div>
  //                   <div className="text-sm">
  //                     <p className="font-medium text-gray-800">
  //                       {profile?.email}
  //                     </p>
  //                     <p className="text-gray-500 capitalize">
  //                       {profile?.role}
  //                     </p>
  //                   </div>
  //                 </div>
  //                 {profile?.role === "admin" && (
  //                   <button
  //                     onClick={handleAdminRedirect}
  //                     className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-start text-sm"
  //                   >
  //                     <svg
  //                       className="w-4 h-4 mr-2"
  //                       fill="none"
  //                       stroke="currentColor"
  //                       viewBox="0 0 24 24"
  //                     >
  //                       <path
  //                         strokeLinecap="round"
  //                         strokeLinejoin="round"
  //                         strokeWidth="2"
  //                         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
  //                       />
  //                       <path
  //                         strokeLinecap="round"
  //                         strokeLinejoin="round"
  //                         strokeWidth="2"
  //                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  //                       />
  //                     </svg>
  //                     Admin Dashboard
  //                   </button>
  //                 )}
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </header>
  //     )}

  //   </>
  // );
}
