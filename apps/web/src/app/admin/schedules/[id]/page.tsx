"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

type Shift = {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  location: string | null;
  physicianName: string | null;
  physicianId: string | null;
};

type Physician = {
  id: string;
  name: string;
  email: string | null;
};

type Schedule = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/schedules").then((r) => r.json()),
      fetch(`/api/shifts?scheduleId=${id}`).then((r) => r.json()),
      fetch("/api/physicians").then((r) => r.json()),
    ]).then(([schedData, shiftData, physData]) => {
      const s = (schedData.schedules || []).find((x: Schedule) => x.id === id);
      setSchedule(s || null);
      setShifts(shiftData.shifts || []);
      setPhysicians(physData.physicians || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAddShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const physicianId = fd.get("physicianId") as string || null;
    const startTime = fd.get("startTime") as string;
    const endTime = fd.get("endTime") as string;
    const type = fd.get("type") as string || "call";
    const location = fd.get("location") as string || null;
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: id,
          physicianId: physicianId || null,
          startTime,
          endTime,
          type,
          location,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      const data = await fetch(`/api/shifts?scheduleId=${id}`).then((r) => r.json());
      setShifts(data.shifts || []);
      form.reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const handlePublish = async () => {
    if (!confirm("Publish this schedule? Physicians will be able to see it."))
      return;
    try {
      const res = await fetch(`/api/schedules/${id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      if (schedule) setSchedule({ ...schedule, status: "published" });
    } catch {
      alert("Failed to publish");
    }
  };

  if (loading || !schedule) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />;
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
            Back to Schedules
          </Link>
          <h1 className="text-2xl font-semibold text-slate-800">{schedule.name}</h1>
          <p className="text-slate-500">
            {format(new Date(schedule.startDate), "MMM d")} –{" "}
            {format(new Date(schedule.endDate), "MMM d, yyyy")}
          </p>
        </div>
        {schedule.status === "draft" && (
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Publish
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-medium text-slate-800 mb-4">Add Shift</h2>
          <form onSubmit={handleAddShift} className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Physician</label>
              <select
                name="physicianId"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {physicians.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select name="type" className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="call">Call</option>
                <option value="clinic">Clinic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
              <input
                type="text"
                name="location"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              Add Shift
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-medium text-slate-800 mb-4">Shifts</h2>
          <div className="space-y-2">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex justify-between items-center p-4 bg-white rounded-lg border border-slate-200"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {shift.physicianName || "Unassigned"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(shift.startTime), "MMM d, h:mm a")} –{" "}
                    {format(new Date(shift.endTime), "h:mm a")} · {shift.type}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this shift?")) return;
                    await fetch(`/api/shifts/${shift.id}`, { method: "DELETE" });
                    setShifts((s) => s.filter((x) => x.id !== shift.id));
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
