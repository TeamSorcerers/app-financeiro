import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps {
  children: React.ReactNode;

  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];

  className?: string;
  isDisabled?: boolean;

  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Button ({ children, type, className, isDisabled, onClick }: ButtonProps) {
  return (
    <button
      type={type}
      className={`
        rounded-md
        bg-[#4592D7]
        cursor-pointer
        ${className}
      `}
      disabled={isDisabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
