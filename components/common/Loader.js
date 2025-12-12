'use client';
export default function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-[#000000a4]">
      <div className="animate-spin rounded-full h-40 w-40 border-b-[12px] border-[#ff7a00] "></div>
    </div>  
  );
}