import Tooltip from "@/components/ui/textfield/tooltip";

export interface TextLabelProps {
  id: string;
  children: React.ReactNode;

  className?: string;
  isRequired?: boolean;
  tooltipContent?: React.ReactNode;
}

export default function TextLabel ({ id, children, className, isRequired, tooltipContent }: TextLabelProps) {
  return (
    <label
      htmlFor={id}
      className={`
        text-base
        font-medium
        text-[#d3d3d3]
        flex
        items-center
        ${className ?? ""}
    `}
    >
      {children}
      {isRequired && <span className="text-red-500">*</span>}
      {tooltipContent &&
        <div className="ml-1">
          <Tooltip>
            {tooltipContent}
          </Tooltip>
        </div>
      }
    </label>
  );
}
