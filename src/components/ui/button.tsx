export interface ButtonProps {
  children: React.ReactNode;

  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];

  className?: string;
  isDisabled?: boolean;

  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Button ({ children, type, className, isDisabled, onClick }: ButtonProps) {
  return (
    <button
      type={type}
      className={`
        rounded-lg
        bg-[#4592D7]
        text-[#D3D3D3]
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
