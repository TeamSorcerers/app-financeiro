import { CircleAlert } from "lucide-react";
import Typography, { TypographyLevel } from "../Typography";

export interface ErrorToastProps { children?: React.ReactNode; }

export default function ErrorToast ({ children }: ErrorToastProps) {
  return (
    <div
      className={`
        mt-2
        p-3
        rounded-xl
        bg-[#ffe6e6]
        text-red-600
        text-sm animate-slide-down
        shadow-[inset_3px_3px_6px_rgba(206,174,174,0.2),inset_-3px_-3px_6px_rgba(255,235,235,0.7)]
        border
        border-red-200
        flex flex-row items-center 
      `}
    >
      <CircleAlert/>
      <Typography
        level={TypographyLevel.Body}
        className="ml-2 text-red-600 font-raleway"
      >
        {children}
      </Typography>
    </div>
  );
}
