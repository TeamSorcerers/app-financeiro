export interface DividerProps {className?: string;}
export default function Divider ({ className }: DividerProps) {
  return (
    <hr className={`border-t my-2 w-full ${className}`} />
  );
}
