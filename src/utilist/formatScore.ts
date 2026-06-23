// src/utils/formatScore.ts
export const formatScore = (score: number, maxScore: number = 100): string => {
  return `${score}/${maxScore}`;
};

export const getScoreColor = (
  score: number,
  maxScore: number = 100,
): string => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-yellow-600";
  if (percentage > 0) return "text-red-600";
  return "text-gray-400";
};
