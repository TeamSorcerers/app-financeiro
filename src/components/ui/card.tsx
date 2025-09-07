export interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Card ({ children, className }: CardProps) {
  return (
    <div
      className={`
        border
        rounded-lg
        p-4
        shadow-md
        z-40
        ${className}
      `}
    >
      {children}
    </div>
  );
}
