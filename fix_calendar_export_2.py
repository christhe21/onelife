import re

with open('src/lib/calendar-export.ts', 'r') as f:
    content = f.read()

replacement = """  const goalsTitleById: Record<string, string> = {};
  for (const g of goals) {
    for (const sg of g.subGoals) {
      goalsTitleById[sg.id] = g.title + " - " + sg.title;
    }
  }"""

buggy_section = """  const goalsTitleById: Record<string, string> = {};
  for (const g of goals) goalsTitleById[g.id] = g.title;"""

content = content.replace(buggy_section, replacement)

with open('src/lib/calendar-export.ts', 'w') as f:
    f.write(content)
