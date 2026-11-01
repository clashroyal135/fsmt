"""Export the two public award tabs into site data. Run from the project root."""

import json
from pathlib import Path

import numpy

# The available system openpyxl expects these NumPy aliases.
numpy.float = float
numpy.int = int
numpy.bool = bool

import openpyxl  # noqa: E402


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "SCORES FSMT Fall 2026.xlsx"
TARGET = ROOT / "dist" / "awards-2026.js"


def clean(value):
    if value is None:
        return ""
    return str(value).strip().replace("�", "’")


book = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)

individual = []
group = None
for row in book["Individual Awards"].values:
    if not row:
        continue
    first = clean(row[0])
    if "Grade | Top 10" in first:
        group = {"grade": first[0], "winners": []}
        individual.append(group)
    elif first.endswith(("st", "nd", "rd", "th")) and group:
        # The Grade 5 students listed sixth and seventh share sixth place.
        display_place = "Tied for 6th" if group["grade"] == "5" and first in ("6th", "7th") else first
        group["winners"].append({
            "place": display_place,
            "name": clean(row[1]),
            "school": clean(row[2]),
        })

teams = []
division = None
team = None
for row in book["Team Awards"].values:
    if not row:
        continue
    first = clean(row[0])
    if "Division | Top" in first:
        division = {"name": first.split(" | ")[0], "description": "", "winners": []}
        teams.append(division)
    elif first.startswith("The ") and division:
        division["description"] = first
    elif first.endswith("Place") and division:
        team = {"place": first, "name": clean(row[1]), "members": []}
        division["winners"].append(team)
    if team and len(row) >= 5 and clean(row[2]) and clean(row[2]) != "Student Name":
        team["members"].append({
            "name": clean(row[2]),
            "grade": clean(row[3]),
            "school": clean(row[4]),
        })

assert [len(group["winners"]) for group in individual] == [10, 10, 10]
assert [len(division["winners"]) for division in teams] == [10, 3]
assert all(len(team["members"]) == 4 for division in teams for team in division["winners"])

data = {"individual": individual, "teams": teams}
TARGET.write_text(
    "// Generated from the Team Awards and Individual Awards workbook tabs.\n"
    + "export const awards2026 = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {TARGET}: {len(individual)} grades, {sum(len(d['winners']) for d in teams)} teams")
