import { sql } from "@/lib/db";

export async function hasShiftConflict(
  physicianId: string,
  startTime: string,
  endTime: string,
  excludeShiftId?: string
): Promise<boolean> {
  const rows = excludeShiftId
    ? await sql`
        SELECT 1 FROM shifts
        WHERE physician_id = ${physicianId}
          AND start_time < ${endTime}::timestamptz AND end_time > ${startTime}::timestamptz
          AND id != ${excludeShiftId}
        LIMIT 1
      `
    : await sql`
        SELECT 1 FROM shifts
        WHERE physician_id = ${physicianId}
          AND start_time < ${endTime}::timestamptz AND end_time > ${startTime}::timestamptz
        LIMIT 1
      `;
  return rows.length > 0;
}

export async function validatePickup(
  physicianId: string,
  shiftStartTime: string,
  shiftEndTime: string
): Promise<{ valid: boolean; error?: string }> {
  const conflict = await hasShiftConflict(physicianId, shiftStartTime, shiftEndTime);
  if (conflict) {
    return { valid: false, error: "Conflict: you have another shift at that time." };
  }
  return { valid: true };
}

export async function validateSwap(
  physicianAId: string,
  physicianBId: string,
  shiftAStart: string,
  shiftAEnd: string,
  shiftBStart: string,
  shiftBEnd: string
): Promise<{ valid: boolean; error?: string }> {
  const conflictA = await hasShiftConflict(physicianAId, shiftBStart, shiftBEnd);
  if (conflictA) {
    return {
      valid: false,
      error: "Physician A has another shift during Physician B's shift.",
    };
  }
  const conflictB = await hasShiftConflict(physicianBId, shiftAStart, shiftAEnd);
  if (conflictB) {
    return {
      valid: false,
      error: "Physician B has another shift during Physician A's shift.",
    };
  }
  return { valid: true };
}
