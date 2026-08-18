import { cn } from "../../utils/cn";

export const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-2xl overflow-hidden",
        "transition-all duration-300 hover:shadow-md",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-100/50", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-800", className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
};
