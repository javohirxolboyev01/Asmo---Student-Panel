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
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-4 border-[#2D6BFF] border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="mt-4 text-gray-500 text-sm">{text}</p>}
    </div>
  );
};
