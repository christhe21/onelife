import re

with open('src/components/life/Today.tsx', 'r') as f:
    content = f.read()

replacement = """  const byGoal = new Map<string, Task[]>();
  for (const t of items) {
    const key = t.subGoalId ?? "__none__";
    if (!byGoal.has(key)) byGoal.set(key, []);
    byGoal.get(key)!.push(t);
  }

  const entries = Array.from(byGoal.entries()).sort(([a], [b]) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      {entries.map(([goalId, group]) => {
        const goal =
          goalId === "__none__" ? undefined : goals.find((g) => g.subGoals.some((sg) => sg.id === goalId));
        const subGoal = goal?.subGoals.find((sg) => sg.id === goalId);"""

buggy_section = """  const byGoal = new Map<string, Task[]>();
  for (const t of items) {
    const key = t.subGoalId ?? "__none__";
    if (!byGoal.has(key)) byGoal.set(key, []);
    byGoal.get(key)!.push(t);
  }

  const entries = Array.from(byGoal.entries()).sort(([a], [b]) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      {entries.map(([goalId, group]) => {
        const goal =
          goalId === "__none__" ? undefined : goals.find((g) => g.id === goalId);"""

content = content.replace(buggy_section, replacement)

# replace {goal?.title} with {goal?.title} - {subGoal?.title} if we want, but let's just use goal?.title
content = content.replace('                    {goal.title}', '                    {goal.title} - {subGoal?.title}')

with open('src/components/life/Today.tsx', 'w') as f:
    f.write(content)
