"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";

export default function TravellerSetup({ user, profile, role }) {
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    const setupTravellerFromLocalStorage = async () => {
      if (profile?.role === "traveller" && user && !isSettingUp) {
        setIsSettingUp(true);
        
        // Get data from localStorage
        const pendingData = localStorage.getItem('pendingTravellerData');
        if (pendingData) {
          try {
            const { firstName, lastName, email } = JSON.parse(pendingData);
            
            console.log("Found pending traveller data:", { firstName, lastName, email });

            // Check if traveller already exists
            const { data: existingTraveller } = await supabase
              .from("travellers")
              .select("id")
              .eq("user_id", user.id)
              .single();

            if (!existingTraveller && firstName && lastName) {
              console.log("Creating new traveller with data:", { firstName, lastName });
              
              const { error: travellerInsertError } = await supabase
                .from("travellers")
                .insert([
                  {
                    user_id: user.id,
                    first_name: firstName,
                    last_name: lastName,
                  },
                ]);

              if (travellerInsertError) {
                console.error("Error inserting traveller:", travellerInsertError);
              } else {
                console.log("Traveller added successfully from localStorage.");
                
                // Send verification email
                const { data: { session } } = await supabase.auth.getSession();
                await supabase.functions.invoke("send-traveller-verification-email", {
                  body: { user_id: user.id, email: user.email },
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                });

                // Clear localStorage after successful creation
                localStorage.removeItem('pendingTravellerData');
                console.log("Cleared pendingTravellerData from localStorage");
              }
            } else {
              // Clear localStorage if traveller already exists or no data
              localStorage.removeItem('pendingTravellerData');
            }
          } catch (error) {
            console.error("Error processing localStorage data:", error);
            localStorage.removeItem('pendingTravellerData');
          }
        }
        setIsSettingUp(false);
      }
    };

    setupTravellerFromLocalStorage();
  }, [user, profile, role, isSettingUp]);

  return null; // This component doesn't render anything
}