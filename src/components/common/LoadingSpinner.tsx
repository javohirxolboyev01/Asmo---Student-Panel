// src/components/Common/LoadingSpinner.tsx
export const LoadingSpinner = ({
  size = "md",
  text = "",
}: {
  size?: "sm" | "md" | "lg";
  text?: string;
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8" role="status" aria-live="polite">
      <div className={`${sizeClasses[size]} u-spin`} aria-hidden="true" />
      {text && <p className="mt-4 text-[15px] font-semibold text-u-mu">{text}</p>}
    </div>
  );
};
