
export default function Card({className, children}) {
  return (
       <div
       className={` 
        bg-white border-[0.5px] border-[#0000001A] rounded-[14.01px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-8 w-full hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300
        ${className}
       `}
     >
      {children}
    </div>
  );
}