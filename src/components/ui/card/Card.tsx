export interface CardProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Card ({ className, children }: Readonly<CardProps>) {
  return (
    <div
      style={{ boxShadow: "-2px -2px 2px rgba(255,255,255,0.7), 2px 2px 2px rgba(174,174,192,0.4)" }}
      className={`
        bg-[#e8edf2]
        rounded-2xl
        ${className ?? ""}
      `}
    >
      { children }
    </div>
  );
}
