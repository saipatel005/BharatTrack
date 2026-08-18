import { cn } from "../../utils/cn";

export const Table = ({ className, children, ...props }) => {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full text-sm text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ className, children, ...props }) => {
  return (
    <thead className={cn("bg-gray-50/50 text-gray-500 border-b border-gray-100", className)} {...props}>
      {children}
    </thead>
  );
};

export const TableRow = ({ className, children, ...props }) => {
  return (
    <tr className={cn("border-b border-gray-100 hover:bg-gray-50/50 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
};

export const TableHead = ({ className, children, ...props }) => {
  return (
    <th className={cn("px-6 py-4 font-medium whitespace-nowrap", className)} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ className, children, ...props }) => {
  return (
    <td className={cn("px-6 py-4 whitespace-nowrap text-gray-700", className)} {...props}>
      {children}
    </td>
  );
};

export const TableBody = ({ className, children, ...props }) => {
  return (
    <tbody className={cn("bg-white", className)} {...props}>
      {children}
    </tbody>
  );
};
