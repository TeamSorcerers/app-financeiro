"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

export interface TooltipProps {
  children: React.ReactNode;

  icon?: React.ReactNode;
  ariaLabel?: string;
}

export default function Tooltip ({ children, icon = <HelpCircle size={14} />, ariaLabel = "Ajuda" }: TooltipProps) {
  const [ isVisible, setIsVisible ] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ isVisible ]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        className="text-gray-500 hover:brightness-[120%] focus:outline-none ml-0.5"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {icon}
      </button>
      {isVisible &&
        <div
          role="tooltip"
          className="
            absolute
            z-30 p-2
            bg-[#3a7bbd4D]
            text-white
            text-sm
            rounded
            shadow-lg
            animate-fade-in
            left-0
            right-0
            mx-auto
            top-full
            mt-2
            min-w-[200px]
            max-w-[90vw]
            sm:left-6
            sm:top-0
            sm:translate-x-0
            sm:mt-0
            sm:min-w-72
            sm:max-w-72
            sm:mx-0"
        >
          {children}
        </div>
      }
    </div>
  );
}
