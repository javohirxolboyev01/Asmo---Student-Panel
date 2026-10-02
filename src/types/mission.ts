// src/types/mission.ts — daily missions / chest (backend: modules/missions).
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

export interface ClaimMissionResult {
  missionId: string;
  coins: number;
  balance: number;
  streak: number;
}

export interface OpenChestResult {
  reward: number;
  rewards: number[];
  pick: number;
  balance: number;
  streak: number;
}

/** Staff view of a mission. */
export interface Mission {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  type: MissionType;
  target: number | null;
  coinReward: number;
  groupId: string | null;
  groupName: string | null;
  quizId: string | null;
  quizTitle: string | null;
  isActive: boolean;
  createdAt: string;
  completedToday: number;
}

export interface MissionInput {
  title: string;
  description?: string | null;
  emoji: string;
  type: MissionType;
  target?: number | null;
  coinReward: number;
  groupId?: string | null;
  quizId?: string | null;
  isActive?: boolean;
}
