import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Ban,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const AdminCustomersView: React.FC = () => {
  const { allOrders, usersList, updateCustomerStatus } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);

  // Derive unified customer database from Firestore orders and usersList
  const customers = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        phone: string;
        address: string;
        ordersCount: number;
        totalSpent: number;
        status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
        lastOrderDate: string;
      }
    > = {};

    // Populate from usersList first if available
    usersList
      .filter((u) => u.role === 'customer')
      .forEach((u) => {
        map[u.id] = {
          id: u.id,
          name: u.name || 'Customer',
          phone: u.phone || '+91 98765 43210',
          address: u.address || 'Bengaluru',
          ordersCount: 0,
          totalSpent: 0,
          status: u.status || 'ACTIVE',
          lastOrderDate: u.createdAt || new Date().toISOString(),
        };
      });

    // Aggregate orders
    allOrders.forEach((order) => {
      const cId = order.customerId || order.customerPhone || 'cust-1';
      if (!map[cId]) {
        map[cId] = {
          id: cId,
          name: order.customerName || 'Customer',
          phone: order.customerPhone || 'Phone',
          address: order.deliveryAddress || 'Bengaluru',
          ordersCount: 0,
          totalSpent: 0,
          status: 'ACTIVE',
          lastOrderDate: order.createdAt,
        };
      }
      map[cId].ordersCount += 1;
      if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'REJECTED') {
        map[cId].totalSpent += order.totalAmount || 0;
      }
      if (
        new Date(order.createdAt).getTime() >
        new Date(map[cId].lastOrderDate).getTime()
      ) {
        map[cId].lastOrderDate = order.createdAt;
      }
    });

    return Object.values(map);
  }, [allOrders, usersList]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        cust.address.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || cust.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  const handleToggleBlock = async (
    customerId: string,
    currentStatus: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'
  ) => {
    setIsProcessing(true);
    const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    await updateCustomerStatus(
      customerId,
      newStatus,
      newStatus === 'BLOCKED' ? 'Blocked by Admin' : 'Unblocked'
    );
    setIsProcessing(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Customer Directory & CRM
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            View registered shoppers, spending patterns, and account access
          </p>
        </div>

        <div className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200">
          Total: {customers.length} Shoppers
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
          {(
            [
              { id: 'ALL', label: 'All Shoppers' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'BLOCKED', label: 'Blocked' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
            placeholder="Search customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Delivery Address</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Total GMV</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isBlocked = cust.status === 'BLOCKED';

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-stone-900">
                          {cust.name}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          ID: {cust.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-700">
                        {cust.phone}
                      </td>

                      <td className="py-3.5 px-4 text-stone-600 truncate max-w-[200px]">
                        {cust.address}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-stone-800">
                        {cust.ordersCount} orders
                      </td>

                      <td className="py-3.5 px-4 font-black text-stone-900">
                        ₹{cust.totalSpent.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isBlocked
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleBlock(cust.id, cust.status)}
                          disabled={isProcessing}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                            isBlocked
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isBlocked ? 'Unblock' : 'Block User'}
                        </button>
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
};
