import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  children?: React.ReactNode;
  isDisabled?: boolean;
  className?: string;
}

export default function Button ({ children, onClick, isDisabled, type, className }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
            rounded-2xl
            font-raleway
            font-medium
            cursor-pointer
            bg-[#e8edf2]
            text-[#4a4a4a]
            transition-all
            duration-300
            hover:scale-[1.02]
            active:scale-[0.98]
            active:bg-[#dfe5ec]
            outline-none
            [box-shadow:6px_6px_12px_rgba(174,174,192,0.2),-6px_-6px_12px_rgba(255,255,255,0.7)]
            input-transition
          focus:bg-[#f0f4f8]
            ${className ?? ""}
        `}
    >
      {children}
    </button>
  );
}
