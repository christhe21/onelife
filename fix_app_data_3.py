import re

with open('src/lib/app-data.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""        id: uid(),
        subGoalId: t.subGoalId ? (subGoalIdMap.get(t.subGoalId) ?? undefined) : undefined,
        subtasks: t.subtasks.map((s) => ({ ...s, id: uid() })),""",
"""        ...t,
        id: uid(),
        subGoalId: t.subGoalId ? (subGoalIdMap.get(t.subGoalId) ?? undefined) : undefined,
        subtasks: t.subtasks.map((s) => ({ ...s, id: uid() })),"""
)
# Make sure we don't duplicate ...t,
content = content.replace('...t,\n        ...t,', '...t,')

with open('src/lib/app-data.tsx', 'w') as f:
    f.write(content)
