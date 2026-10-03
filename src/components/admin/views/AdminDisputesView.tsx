import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  AlertOctagon,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Plus,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Dispute } from '../../../types';

export const AdminDisputesView: React.FC = () => {
  const {
    disputes,
    resolveDispute,
    rejectDispute,
    createDispute,
    allOrders,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED' | 'REJECTED'>('ALL');

  // Selected dispute for resolution modal
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionType, setActionType] = useState<'RESOLVE' | 'REJECT' | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [resolutionText, setResolutionText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // New dispute modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');
  const [newIssueType, setNewIssueType] = useState<Dispute['issueType']>('WRONG_ITEM');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState<number>(100);

  const filtered = useMemo(() => {
    return disputes.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.disputeId.toLowerCase().includes(q) ||
        d.orderNumber.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.shopName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OPEN' && (d.status === 'OPEN' || d.status === 'UNDER_REVIEW')) ||
        d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchQuery, statusFilter]);

  const openCount = disputes.filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;

  const handleOpenAction = (d: Dispute, type: 'RESOLVE' | 'REJECT') => {
    setSelectedDispute(d);
    setActionType(type);
    setRefundAmount(d.amount || 0);
    setResolutionText('');
  };

  const handleExecuteAction = async () => {
    if (!selectedDispute || !actionType) return;
    setIsProcessing(true);

    if (actionType === 'RESOLVE') {
      await resolveDispute(
        selectedDispute.id,
        resolutionText || 'Dispute resolved in favor of customer with refund.',
        refundAmount
      );
    } else {
      await rejectDispute(
        selectedDispute.id,
        resolutionText || 'Dispute investigated and rejected.'
      );
    }

    setIsProcessing(false);
    setSelectedDispute(null);
    setActionType(null);
  };

  const handleCreateDispute = async () => {
    const order = allOrders.find(
      (o) => o.orderId === newOrderId || o.id === newOrderId
    );
    if (!order) return;

    setIsProcessing(true);
    await createDispute({
      orderId: order.id,
      orderNumber: order.orderId || order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      shopId: order.shopId,
      shopName: order.shopName,
      issueType: newIssueType,
      description: newDescription,
      amount: newAmount,
      status: 'OPEN',
    });
    setIsProcessing(false);
    setShowCreateModal(false);
    setNewDescription('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Order Disputes & Grievance Redressal
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Investigate customer complaints, quality issues, and issue refunds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {openCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
              ⚠️ {openCount} Open Dispute{openCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => {
              if (allOrders.length > 0) {
                setNewOrderId(allOrders[0].orderId || allOrders[0].id);
                setNewAmount(allOrders[0].totalAmount || 150);
              }
              setShowCreateModal(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>File Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs overflow-x-auto">
          {(
            [
              { id: 'ALL', label: `All (${disputes.length})` },
              { id: 'OPEN', label: `Open (${openCount})` },
              {
                id: 'RESOLVED',
                label: `Resolved (${
                  disputes.filter((d) => d.status === 'RESOLVED').length
                })`,
              },
              {
                id: 'REJECTED',
                label: `Rejected (${
                  disputes.filter((d) => d.status === 'REJECTED').length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
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
            placeholder="Search dispute or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Disputes Cards / Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-stone-700">
              No disputes found in this filter.
            </p>
            <p className="text-xs text-stone-400">
              All marketplace customer orders are fulfilling smoothly!
            </p>
          </div>
        ) : (
          filtered.map((d) => {
            const isOpen = d.status === 'OPEN' || d.status === 'UNDER_REVIEW';

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-stone-900">
                      {d.disputeId}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isOpen
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : d.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {d.status}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Issue: {d.issueType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-800 font-medium">
                    {d.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 pt-1">
                    <span>Order: #{d.orderNumber}</span>
                    <span>·</span>
                    <span>Customer: {d.customerName}</span>
                    <span>·</span>
                    <span>Store: {d.shopName}</span>
                    <span>·</span>
                    <span className="font-bold text-stone-700">
                      Claim: ₹{d.amount}
                    </span>
                  </div>

                  {d.resolution && (
                    <div className="mt-2 p-2 bg-stone-50 rounded-lg text-xs text-stone-600 border border-stone-100">
                      <span className="font-bold text-stone-800">Resolution: </span>
                      {d.resolution}
                      {d.refundAmount ? ` (Refunded: ₹${d.refundAmount})` : ''}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isOpen ? (
                    <>
                      <button
                        onClick={() => handleOpenAction(d, 'RESOLVE')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve & Refund</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(d, 'REJECT')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-stone-400 font-bold">
                      Settled
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve / Reject Modal */}
      {selectedDispute && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                {actionType === 'RESOLVE' ? 'Resolve Dispute' : 'Reject Grievance'}
              </h3>
              <button
                onClick={() => {
                  setSelectedDispute(null);
                  setActionType(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <p className="font-bold text-stone-900">
                  {selectedDispute.customerName} vs {selectedDispute.shopName}
                </p>
                <p className="text-stone-500">
                  Issue: {selectedDispute.issueType} · Claim ₹{selectedDispute.amount}
                </p>
              </div>

              {actionType === 'RESOLVE' && (
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Refund to Customer (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedDispute.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Explain findings and resolution..."
                  rows={2}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedDispute(null);
                  setActionType(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isProcessing || !resolutionText.trim()}
                className={`flex-1 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50 cursor-pointer shadow-xs ${
                  actionType === 'RESOLVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                File Customer Grievance
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Select Order
                </label>
                <select
                  value={newOrderId}
                  onChange={(e) => {
                    setNewOrderId(e.target.value);
                    const o = allOrders.find((ord) => ord.id === e.target.value);
                    if (o) setNewAmount(o.totalAmount);
                  }}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                >
                  {allOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.orderId || o.id.slice(0, 6)} - {o.customerName} (₹{o.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Issue Type
                </label>
                <select
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value as any)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                >
                  <option value="WRONG_ITEM">Wrong Item Received</option>
                  <option value="MISSING_ITEM">Missing Item</option>
                  <option value="DAMAGED_ITEM">Damaged or Expired Item</option>
                  <option value="NOT_DELIVERED">Order Not Delivered</option>
                  <option value="PAYMENT_ISSUE">Payment Discrepancy</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Claim Amount (₹)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Description *
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Details reported by the customer..."
                  rows={2}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDispute}
                disabled={isProcessing || !newDescription.trim()}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
