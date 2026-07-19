# OneLife / Goal Journey Vault TODO

## Features

### Rank & Progression System (Gamification Layer)

**Points System:**

- **Goal** (completed): **+100 points**
- **Milestone / Sub-Goal**: **+50 points**
- **Task**: **+10 points**
- **Sub-Task**: **+5 points**
- (Optional) Streaks, difficulty multipliers, completion bonuses

**Rank Tiers** (Military/Game inspired):

1. Recruit (0–499)
2. Private (500–1,999)
3. Corporal (2,000–4,999)
4. Sergeant (5,000–9,999)
5. Lieutenant (10k–19,999)
6. Captain (20k–34,999)
7. Major (35k–59,999)
8. Colonel (60k–99,999)
9. General (100k+)

**Phases:**

**Phase 1: Core Logic & Data Model**

- Define points awarding logic
- Add totalPoints, currentRank, rankProgress to user/goal models
- Create rank calculation utility

**Phase 2: Backend Integration**

- Hook points awarding on task/milestone/goal completion
- Persist points in DB / Lovable state
- Handle rank-up detection

**Phase 3: UI & Visuals**

- Rank card on dashboard/home
- Progress bars, badges, animations (confetti on rank-up)
- Display in goal/task details

**Phase 4: Polish & Enhancements**

- Notifications, streak bonuses, shareable ranks
- Leaderboard (future)
- Theming / dark mode support for ranks
