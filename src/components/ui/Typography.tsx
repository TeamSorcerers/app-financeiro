export enum TypographyLevel {
  Header1,
  Header2,
  Header3,
  Body,
  Caption,
  Button,
}

export interface TypographyProps {
  level: TypographyLevel;
  className?: string;
  children: React.ReactNode;
}


export default function Typography ({
  level,
  className,
  children,
}: TypographyProps) {
  const defaultClassName = "text-[#4a4a4a]";

  return (
    {
      [TypographyLevel.Header1]: <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${defaultClassName} ${className ?? ""}`}>{children}</h1>,
      [TypographyLevel.Header2]: <h2 className={`text-3xl font-semibold ${defaultClassName} ${className ?? ""}`}>{children}</h2>,
      [TypographyLevel.Header3]: <h3 className={`text-2xl font-medium ${defaultClassName} ${className ?? ""}`}>{children}</h3>,
      [TypographyLevel.Body]: <p className={`text-base ${defaultClassName} ${className ?? ""}`}>{children}</p>,
      [TypographyLevel.Caption]: <span className={`text-sm text-gray-500 ${defaultClassName} ${className ?? ""}`}>{children}</span>,
      [TypographyLevel.Button]: <span className={`text-base font-medium ${defaultClassName} ${className ?? ""}`}>{children}</span>,
    }[level]
  );
}
