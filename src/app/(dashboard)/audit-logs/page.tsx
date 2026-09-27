"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCode,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <span>System Audit Trail & Security Logs</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable, non-erasable record of all critical administrative, financial, and inventory actions
        </p>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Operator / Staff</th>
                <th className="py-3 px-4 font-semibold">Action Event</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold text-center">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {log.user?.fullName || "System Engine"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.user?.username || "root"}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.entity} <span className="font-mono text-slate-500 text-[10px]">({log.entityId.slice(0, 10)}...)</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 inline-flex items-center gap-1"
                        >
                          <FileCode className="w-3 h-3 text-emerald-400" />
                          <span>{isExpanded ? "Hide Diff" : "Inspect"}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 text-left p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1">
                            {log.oldValues && (
                              <div>
                                <span className="text-red-400 font-bold">Old State: </span>
                                <span>{log.oldValues}</span>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <span className="text-emerald-400 font-bold">New State: </span>
                                <span>{log.newValues}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
