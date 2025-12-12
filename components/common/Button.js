const Button = ({ children, onClick, type = "button", className }) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-block rounded-lg px-4 py-2 font-semibold shadow-md ${className} }`}
  >
    {children}
  </button>
);
export default Button;
