// src/types/mission.ts — daily gift / streak (backend: modules/missions).
// Missions are no longer shown; the server still sends the field.
export type MissionType = "SUBMIT_HOMEWORK" | "ATTEND_LESSON" | "GOOD_GRADE" | "PASS_QUIZ";

/** PENDING = condition not met yet, READY = claimable, CLAIMED = done today. */
export type MissionStatus = "PENDING" | "READY" | "CLAIMED";

export interface StudentMission {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  type: MissionType;
  target: number | null;
  coinReward: number;
  groupId: string | null;
  /** PASS_QUIZ: the test to open. */
  quizId: string | null;
  status: MissionStatus;
}

export interface MissionsToday {
  day: string;
  missions: StudentMission[];
  completed: number;
  total: number;
  streak: number;
  chest: { opened: boolean; reward: number | null };
}

export interface OpenChestResult {
  reward: number;
  rewards: number[];
  pick: number;
  balance: number;
  streak: number;
}
