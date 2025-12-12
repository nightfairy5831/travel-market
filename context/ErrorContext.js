"use client";
import { createContext, useContext } from "react";
import toast from "react-hot-toast";

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const showError = (msg) => toast.error(msg);
   const showSuccess = (msg) => toast.success(msg);

  return (
    <ErrorContext.Provider value={{ showError , showSuccess }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);
