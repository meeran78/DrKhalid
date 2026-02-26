"use client";

import { useEffect, useState } from "react";

type Physician = {
  id: string;
  name: string;
  email: string | null;
  specialties: string[];
};

export default function AdminPhysiciansPage() {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/physicians")
      .then((r) => r.json())
      .then((data) => setPhysicians(data.physicians || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Physicians</h1>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Specialties</th>
            </tr>
          </thead>
          <tbody>
            {physicians.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.email || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {(p.specialties || []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Physicians are created when they sign up and choose the physician role during onboarding.
      </p>
    </div>
  );
}
