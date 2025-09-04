"use client";

import TextLabel from "@/components/ui/textfield/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export interface TextFieldProps {
  name: string;
  type: React.HTMLInputTypeAttribute;

  label: React.ReactNode;
  tooltipContent?: React.ReactNode;
  errorContent?: React.ReactNode;

  isRequired?: boolean;
  isDisabled?: boolean;

  placeholder?: string;
  className?: string;

  ref?: React.Ref<HTMLInputElement>;

  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export default function TextField ({
  name,
  type,
  label,
  tooltipContent,
  errorContent,
  isRequired,
  isDisabled,
  placeholder,
  className,
  ref,
  value,
  onChange,
  onBlur,
}: TextFieldProps) {
  const [ isPasswordVisible, setIsPasswordVisible ] = useState(false);
  const isPasswordType = type === "password";

  return (
    <div className={`flex flex-col mb-4 relative ${className ?? ""}`}>
      <TextLabel id={name} isRequired={isRequired} tooltipContent={tooltipContent}>
        {label}
      </TextLabel>

      <div className="relative flex items-center">
        <input
          type={isPasswordType && isPasswordVisible ? "text" : type}
          id={name}
          name={name}
          className={`
            w-full
            p-2
            ${isPasswordType ? "pr-10" : "pr-3"}
            border
            rounded-md
            border-[#296BA6]
            text-[#d3d3d3]
            outline-none
            focus:ring-1
            focus:ring-[#296BA6]
            ${errorContent ? "border-red-400 outline-red-400" : ""}
          `}
          placeholder={placeholder}
          required={isRequired}
          disabled={isDisabled}
          aria-invalid={!!errorContent}
          aria-describedby={errorContent ? `${name}-error` : undefined}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
        />

        {
          isPasswordType &&
          <button
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="
                absolute
                right-3
                text-gray-500
                hover:text-gray-700
                focus:outline-none
            "
            tabIndex={-1}
            aria-label={isPasswordVisible ? "Ocultar senha" : "Exibir senha"}
            aria-pressed={isPasswordVisible}
            aria-disabled={isDisabled}
            disabled={isDisabled}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

        }
      </div>

      {
        errorContent &&
        <p className="mt-1 text-base text-red-400" id={`${name}-error`}>
          {errorContent}
        </p>

      }
    </div>
  );
}
