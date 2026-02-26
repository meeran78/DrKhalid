"use client";

import { useEffect, useState } from "react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  differenceInMinutes,
} from "date-fns";

type Shift = {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  location: string | null;
  scheduleName: string;
};

type ViewMode = "list" | "calendar";
type CalendarRange = "day" | "week";

const HOUR_START = 6;
const HOUR_END = 22;
const SLOT_HEIGHT = 48;

function getShiftPosition(shift: Shift) {
  const start = parseISO(shift.startTime);
  const end = parseISO(shift.endTime);
  const dayStart = setMinutes(setHours(start, HOUR_START), 0);
  const topMinutes = Math.max(0, differenceInMinutes(start, dayStart));
  const durationMinutes = differenceInMinutes(end, start);
  return {
    top: (topMinutes / 60) * SLOT_HEIGHT,
    height: Math.max((durationMinutes / 60) * SLOT_HEIGHT, 24),
  };
}

export default function PhysicianSchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarRange, setCalendarRange] = useState<CalendarRange>("week");
  const [focusDate, setFocusDate] = useState(() => new Date());

  useEffect(() => {
    fetch("/api/shifts")
      .then((r) => r.json())
      .then((data) => setShifts(data.shifts || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDrop = async (shiftId: string) => {
    if (
      !confirm(
        "Drop this shift? It will become available for others to pick up."
      )
    )
      return;
    try {
      const res = await fetch("/api/open-shifts/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShifts((s) => s.filter((x) => x.id !== shiftId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const focusStart =
    calendarRange === "day"
      ? focusDate
      : startOfWeek(focusDate, { weekStartsOn: 0 });
  const focusEnd =
    calendarRange === "day"
      ? focusDate
      : endOfWeek(focusDate, { weekStartsOn: 0 });

  const days: Date[] = [];
  for (let d = new Date(focusStart); d <= focusEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const shiftsByDay = days.reduce<Record<string, Shift[]>>((acc, day) => {
    const key = format(day, "yyyy-MM-dd");
    acc[key] = shifts.filter((s) => {
      const start = parseISO(s.startTime);
      return isSameDay(start, day);
    });
    return acc;
  }, {});

  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i
  );

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">My Schedule</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "list"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "calendar"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Calendar
            </button>
          </div>

          {viewMode === "calendar" && (
            <>
              {/* Day/Week range */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setCalendarRange("day")}
                  className={`px-3 py-2 text-sm ${
                    calendarRange === "day"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setCalendarRange("week")}
                  className={`px-3 py-2 text-sm ${
                    calendarRange === "week"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Week
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setFocusDate(
                      calendarRange === "day"
                        ? subDays(focusDate, 1)
                        : subDays(focusDate, 7)
                    )
                  }
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setFocusDate(new Date())}
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Today
                </button>
                <button
                  onClick={() =>
                    setFocusDate(
                      calendarRange === "day"
                        ? addDays(focusDate, 1)
                        : addDays(focusDate, 7)
                    )
                  }
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="ml-2 text-sm font-medium text-slate-700 min-w-[160px]">
                  {calendarRange === "day"
                    ? format(focusDate, "EEEE, MMM d, yyyy")
                    : `${format(focusStart, "MMM d")} – ${format(focusEnd, "MMM d, yyyy")}`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {shifts.length === 0 ? (
        <p className="text-slate-500 py-8">No shifts assigned</p>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {format(new Date(shift.startTime), "EEEE, MMM d")}
                </p>
                <p className="text-sm text-slate-500">
                  {format(new Date(shift.startTime), "h:mm a")} –{" "}
                  {format(new Date(shift.endTime), "h:mm a")} · {shift.type}
                  {shift.location && ` · ${shift.location}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">{shift.scheduleName}</p>
              </div>
              <button
                onClick={() => handleDrop(shift.id)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                Drop Shift
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <div
              className="relative min-w-[600px]"
              style={{
                width: days.length <= 7 ? "100%" : "max-content",
              }}
            >
              {/* Grid: header + hour rows */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `56px repeat(${days.length}, minmax(140px, 1fr))`,
                }}
              >
                <div className="border-b border-r border-slate-200 bg-slate-50 p-2" />
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`border-b border-r border-slate-200 p-2 text-center text-sm font-medium ${
                      isSameDay(day, new Date()) ? "bg-blue-50 text-blue-800" : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {format(day, "EEE")}
                    <div className="text-xs font-normal text-slate-500">{format(day, "M/d")}</div>
                  </div>
                ))}
                {hours.map((hour) => (
                  <div key={`time-${hour}`} className="contents">
                    <div
                      className="border-r border-slate-200 text-right pr-2 pt-0.5 text-xs text-slate-500"
                      style={{ height: SLOT_HEIGHT }}
                    >
                      {format(setHours(new Date(), hour), "h a")}
                    </div>
                    {days.map((day) => (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={`border-r border-b border-slate-100 ${
                          isSameDay(day, new Date()) ? "bg-blue-50/30" : ""
                        }`}
                        style={{ height: SLOT_HEIGHT, minHeight: SLOT_HEIGHT }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Shift blocks overlay - positioned over day columns */}
              <div
                className="absolute grid pointer-events-none [&>*]:pointer-events-auto"
                style={{
                  top: 53,
                  left: 56,
                  right: 0,
                  bottom: 0,
                  gridTemplateColumns: `repeat(${days.length}, minmax(140px, 1fr))`,
                }}
              >
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayShifts = shiftsByDay[key] || [];
                  return (
                    <div
                      key={key}
                      className="relative min-w-0"
                      style={{ minHeight: (HOUR_END - HOUR_START + 1) * SLOT_HEIGHT }}
                    >
                      {dayShifts.map((shift) => {
                        const { top, height } = getShiftPosition(shift);
                        const isCall = shift.type === "call";
                        return (
                          <div
                            key={shift.id}
                            className={`absolute left-1 right-1 rounded overflow-hidden shadow-sm border cursor-pointer group ${
                              isCall
                                ? "bg-blue-100 border-blue-200 hover:bg-blue-200"
                                : "bg-emerald-100 border-emerald-200 hover:bg-emerald-200"
                            }`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            title={`${shift.type} · ${shift.scheduleName}${shift.location ? ` · ${shift.location}` : ""}`}
                          >
                            <div className="p-1.5 h-full overflow-hidden">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {format(parseISO(shift.startTime), "h:mm a")}
                              </p>
                              <p className="text-[10px] text-slate-600 truncate uppercase">
                                {shift.type}
                              </p>
                              {height > 40 && (
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {shift.scheduleName}
                                </p>
                              )}
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDrop(shift.id);
                                }}
                                className="p-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600"
                              >
                                Drop
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
