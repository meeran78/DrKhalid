"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Shift = {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  physicianName: string;
  physicianId: string;
};

type Swap = {
  id: string;
  shiftAId: string;
  shiftBId: string;
  physicianAName: string;
  physicianBName: string;
  status: string;
};

export default function PhysicianSwapsPage() {
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShiftA, setSelectedShiftA] = useState<string | null>(null);
  const [selectedShiftB, setSelectedShiftB] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/shifts").then((r) => r.json()),
      fetch("/api/shifts?scope=all").then((r) => r.json()),
      fetch("/api/swaps").then((r) => r.json()),
    ]).then(([myData, allData, swapData]) => {
      setMyShifts(myData.shifts || []);
      setAllShifts(allData.shifts || []);
      setSwaps(swapData.swaps || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleRequestSwap = async () => {
    if (!selectedShiftA || !selectedShiftB) {
      alert("Select your shift and the shift to swap with");
      return;
    }
    const shiftB = allShifts.find((s) => s.id === selectedShiftB);
    if (!shiftB?.physicianId) {
      alert("Invalid shift selection");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftAId: selectedShiftA,
          shiftBId: selectedShiftB,
          physicianBId: shiftB.physicianId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      alert("Swap requested. Pending admin approval.");
      setSelectedShiftA(null);
      setSelectedShiftB(null);
      const swapData = await fetch("/api/swaps").then((r) => r.json());
      setSwaps(swapData.swaps || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />;
  }

  const otherShifts = allShifts.filter(
    (s) => s.physicianId && !myShifts.some((m) => m.id === s.id)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Swap Shifts</h1>
      <p className="text-slate-600 mb-6">
        Select your shift and another physician&apos;s shift to request a swap. Admin approval required.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="font-medium text-slate-800 mb-4">Your shift</h2>
          <div className="space-y-2">
            {myShifts.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShiftA(selectedShiftA === s.id ? null : s.id)}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedShiftA === s.id ? "border-slate-800 bg-slate-50" : "border-slate-200"
                }`}
              >
                <p className="font-medium">{format(new Date(s.startTime), "MMM d, h:mm a")} – {format(new Date(s.endTime), "h:mm a")}</p>
                <p className="text-sm text-slate-500">{s.type}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-medium text-slate-800 mb-4">Swap with</h2>
          <div className="space-y-2">
            {otherShifts.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShiftB(selectedShiftB === s.id ? null : s.id)}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedShiftB === s.id ? "border-slate-800 bg-slate-50" : "border-slate-200"
                }`}
              >
                <p className="font-medium">{s.physicianName}</p>
                <p className="text-sm text-slate-500">
                  {format(new Date(s.startTime), "MMM d, h:mm a")} – {format(new Date(s.endTime), "h:mm a")} · {s.type}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleRequestSwap}
        disabled={!selectedShiftA || !selectedShiftB || submitting}
        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Request Swap"}
      </button>

      <section className="mt-10">
        <h2 className="font-medium text-slate-800 mb-4">Your swap requests</h2>
        {swaps.length === 0 ? (
          <p className="text-slate-500">No swap requests</p>
        ) : (
          <div className="space-y-2">
            {swaps.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
              >
                <p className="font-medium">
                  {s.physicianAName} ↔ {s.physicianBName}
                </p>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    s.status === "approved" ? "bg-green-100 text-green-800" :
                    s.status === "rejected" ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
