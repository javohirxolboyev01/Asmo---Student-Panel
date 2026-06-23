// src/utils/statusColors.ts
export const statusColors = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
  excused: "bg-blue-100 text-blue-800",
  submitted: "bg-green-100 text-green-800",
  not_submitted: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
  graded: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  planned: "bg-gray-100 text-gray-800",
  homework: "bg-purple-100 text-purple-800",
  lesson: "bg-blue-100 text-blue-800",
  grade: "bg-green-100 text-green-800",
  system: "bg-gray-100 text-gray-800",
} as const;

export type StatusKey = keyof typeof statusColors;

export const getStatusColor = (status: string): string => {
  return statusColors[status as StatusKey] || "bg-gray-100 text-gray-800";
};
