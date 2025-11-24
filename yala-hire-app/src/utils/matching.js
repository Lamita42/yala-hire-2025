export function computeMatchPercentage(userSkillsCSV, jobSkillsCSV) {
  // Convert comma-separated string -> clean lowercase array
  const userSkills = userSkillsCSV
    ? userSkillsCSV.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const jobSkills = jobSkillsCSV
    ? jobSkillsCSV.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];

  // ❗ If job has NO skills defined → match = 0%
  if (jobSkills.length === 0) return 0;

  const setUser = new Set(userSkills);
  const setJob = new Set(jobSkills);

  // Intersection count
  const intersection = jobSkills.filter(skill => setUser.has(skill));

  const score = (intersection.length / jobSkills.length) * 100;
  return score;
}
