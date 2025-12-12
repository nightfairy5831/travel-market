'use client'
export const setErrorsWithAutoDismiss = (errs, setErrors,  timeout = 3000) => {
  setErrors(errs);
  
  // Auto-dismiss all errors after specified timeout
  Object.keys(errs).forEach(errorKey => {
    setTimeout(() => {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }, timeout);
  });
};