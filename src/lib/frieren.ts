import { useAppData } from "@/lib/app-data";

export function useFrierenVocabulary() {
  const { settings } = useAppData();
  const isFrieren = settings?.themeColor === "frieren";

  return {
    isFrieren,
    goals: isFrieren ? "Quests" : "Goals",
    goal: isFrieren ? "Quest" : "Goal",
    milestones: isFrieren ? "Waypoints" : "Milestones",
    milestone: isFrieren ? "Waypoint" : "Milestone",
    tasks: isFrieren ? "Preparations" : "Tasks",
    task: isFrieren ? "Preparation" : "Task",
    progress: isFrieren ? "Journey" : "Progress",
    completedGoals: isFrieren ? "Memories" : "Completed goals",
    skills: isFrieren ? "Spellbook" : "Skills",
    skill: isFrieren ? "Spellbook" : "Skill",
    streaks: isFrieren ? "Days walked" : "Streaks",
    streak: isFrieren ? "Days walked" : "Streak",
  };
}

// Fallback for non-react contexts where we have access to settings directly
export function getFrierenVocabulary(isFrieren: boolean) {
  return {
    isFrieren,
    goals: isFrieren ? "Quests" : "Goals",
    goal: isFrieren ? "Quest" : "Goal",
    milestones: isFrieren ? "Waypoints" : "Milestones",
    milestone: isFrieren ? "Waypoint" : "Milestone",
    tasks: isFrieren ? "Preparations" : "Tasks",
    task: isFrieren ? "Preparation" : "Task",
    progress: isFrieren ? "Journey" : "Progress",
    completedGoals: isFrieren ? "Memories" : "Completed goals",
    skills: isFrieren ? "Spellbook" : "Skills",
    skill: isFrieren ? "Spellbook" : "Skill",
    streaks: isFrieren ? "Days walked" : "Streaks",
    streak: isFrieren ? "Days walked" : "Streak",
  };
}
