export function periodRangeForType(attendanceType, periodStart = 1) {
  const start = Number(periodStart) || 1;
  switch (attendanceType) {
    case "1_period":
      return { startPeriod: start, endPeriod: start };
    case "2_periods":
      return { startPeriod: start, endPeriod: Math.min(start + 1, 7) };
    case "half_day":
      return { startPeriod: 1, endPeriod: 4 };
    case "whole_day":
    default:
      return { startPeriod: 1, endPeriod: 7 };
  }
}

export function isClassIncharge(user) {
  return user.role === "faculty" && user.facultyType === "incharge";
}
