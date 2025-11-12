export interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

export default function Label ({ htmlFor, children, className }: LabelProps) {
  return (
    <label
      className={`font-raleway font-medium text-md text-[#4a4a4a] mb-2 select-none ${className}`}
      htmlFor={htmlFor}
      tabIndex={-1}
    >
      {children}
    </label>
  );
}
