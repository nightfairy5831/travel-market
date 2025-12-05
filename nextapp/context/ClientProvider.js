"use client";

import { createContext, useContext } from "react";

const UserContext = createContext(null);

export function ClientProvider({ user, profile, children }) {
  return (
    <UserContext.Provider value={{ user, profile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
