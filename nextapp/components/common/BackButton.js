"use client";
import { useRouter } from "next/navigation";

export default function BackButton({
  text = "Back",
  className = "",
  onClick,
  path,
  selected,
  setSelectedPath,
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (selected && typeof setSelectedPath === "function") {
      setSelectedPath(null);
    } else if (path && selected === null) {
      router.push(path);
    } else {
      router.back();
    }
  };


  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 transition duration-200 cursor-pointer fixed top-4 left-4 ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {text}
    </button>
  );
}
