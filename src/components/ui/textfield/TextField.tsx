import { HTMLInputTypeAttribute } from "react";
import ErrorToast from "./ErrorToast";
import Label from "./TextLabel";

export interface TextFieldClassNames {
  container?: string;
  input?: string;
  label?: string;
}

export interface TextFieldProps {
  id: string;
  type: HTMLInputTypeAttribute;
  label: string;
  placeholder?: string;
  classNames?: TextFieldClassNames;
  error?: string;

  ref?: React.Ref<HTMLInputElement>;

  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export default function TextField ({
  id,
  type,
  label,
  placeholder,
  classNames,
  error,
  ref,
  value,
  onChange,
  onBlur,
}: TextFieldProps) {
  return (
    <div
      className={`flex flex-col mb-4 ${classNames?.container}`}
    >
      <Label htmlFor={id} className={classNames?.label}>{label}</Label>
      <input
        id={id}
        name={id}
        type={type}
        aria-label={label}
        placeholder={placeholder}
        className={`
          p-4
          h-12
          rounded-2xl
          font-raleway
          outline-none
          bg-[#e8edf2]
          text-[#4a4a4a]
          [box-shadow:inset_-10px_-10px_10px_rgba(255,255,255,0.7),inset_10px_10px_10px_rgba(174,174,192,0.2)]
          input-transition
          focus:bg-[#f0f4f8]
          transition-shadow
          duration-200
        `}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        ref={ref}
      />
      {
        error &&
        <ErrorToast>
          {error}
        </ErrorToast>
      }
    </div>
  );
}
