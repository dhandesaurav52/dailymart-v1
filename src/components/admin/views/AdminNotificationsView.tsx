import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Bell,
  Search,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Store,
  Layers,
} from 'lucide-react';

export const AdminNotificationsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.resourceType.toLowerCase().includes(q);

    const matchesType = filterType === 'ALL' || log.resourceType === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            System Activity & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Immutable security audit trail of all administrator actions and events
          </p>
        </div>

        <div className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200">
          Total: {auditLogs.length} Events Logged
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'All Events' },
              { id: 'SHOP', label: 'Shops' },
              { id: 'ORDER', label: 'Orders' },
              { id: 'PAYMENT', label: 'Payments' },
              { id: 'DISPUTE', label: 'Disputes' },
              { id: 'SETTINGS', label: 'Settings' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            No audit events found. Actions taken by administrators will appear here.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-stone-50/70 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {log.resourceType}
                    </span>
                  </div>

                  <p className="text-stone-700 font-medium">{log.details}</p>

                  <div className="flex items-center gap-2 text-[10px] text-stone-400">
                    <span>Admin: {log.adminEmail}</span>
                    <span>·</span>
                    <span>Role: {log.adminRole}</span>
                    <span>·</span>
                    <span>Target ID: {log.resourceId}</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 shrink-0 text-right">
                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                  <div>
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
