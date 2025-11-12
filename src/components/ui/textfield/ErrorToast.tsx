import { CircleAlert } from "lucide-react";
import Typography, { TypographyLevel } from "../Typography";

export interface ErrorToastProps { children?: React.ReactNode; }

export default function ErrorToast ({ children }: ErrorToastProps) {
  return (
    <div
      className={`
        mt-2
        px-4
        py-3
        rounded-2xl
        bg-[#ffd9d9]
        text-[#c92a2a]
        text-sm
        shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]
        border
        border-[#ffb3b3]/30
        flex flex-row items-center gap-2
      `}
    >
      <CircleAlert size={18} className="flex-shrink-0" />
      <Typography
        level={TypographyLevel.Body}
        className="text-[#c92a2a] font-raleway leading-snug"
      >
        {children}
      </Typography>
    </div>
  );
}
