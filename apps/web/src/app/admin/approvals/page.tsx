"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type PendingPickup = {
  id: string;
  physicianName: string;
  startTime: string;
  endTime: string;
  type: string;
  scheduleName: string;
};

type Swap = {
  id: string;
  physicianAName: string;
  physicianBName: string;
  shiftAStart: string;
  shiftAEnd: string;
  shiftBStart: string;
  shiftBEnd: string;
  status: string;
};

export default function AdminApprovalsPage() {
  const [pickups, setPickups] = useState<PendingPickup[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch("/api/pickups/pending").then((r) => r.json()),
      fetch("/api/swaps").then((r) => r.json()),
    ]).then(([pickupData, swapData]) => {
      setPickups(pickupData.pendingPickups || []);
      setSwaps((swapData.swaps || []).filter((s: Swap) => s.status === "pending"));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handlePickupApproval = async (id: string, approved: boolean) => {
    const res = await fetch(`/api/pickups/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (!res.ok) alert("Failed");
    else load();
  };

  const handleSwapApproval = async (id: string, approved: boolean) => {
    const res = await fetch(`/api/swaps/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (!res.ok) alert("Failed");
    else load();
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Approvals</h1>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Pending Pickups</h2>
        {pickups.length === 0 ? (
          <p className="text-slate-500">No pending pickup requests</p>
        ) : (
          <div className="space-y-4">
            {pickups.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-800">{p.physicianName}</p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(p.startTime), "MMM d, h:mm a")} – {format(new Date(p.endTime), "h:mm a")} · {p.type} · {p.scheduleName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePickupApproval(p.id, true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handlePickupApproval(p.id, false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-800 mb-4">Pending Swaps</h2>
        {swaps.length === 0 ? (
          <p className="text-slate-500">No pending swap requests</p>
        ) : (
          <div className="space-y-4">
            {swaps.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {s.physicianAName} ↔ {s.physicianBName}
                  </p>
                  <p className="text-sm text-slate-500">
                    A: {format(new Date(s.shiftAStart), "MMM d, h:mm")} – {format(new Date(s.shiftAEnd), "h:mm")}
                  </p>
                  <p className="text-sm text-slate-500">
                    B: {format(new Date(s.shiftBStart), "MMM d, h:mm")} – {format(new Date(s.shiftBEnd), "h:mm")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSwapApproval(s.id, true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleSwapApproval(s.id, false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
