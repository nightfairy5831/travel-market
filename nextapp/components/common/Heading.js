const Heading = ({ title, subtitle, className}) => (
  <div className="text-center mb-8">
    <h2 className={className}>{title}</h2>
    {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
    
  </div>
);
export default Heading