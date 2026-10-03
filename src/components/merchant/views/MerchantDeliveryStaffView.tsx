import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Bike,
  Plus,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';
import { ShopMember } from '../../../types';

export const MerchantDeliveryStaffView: React.FC = () => {
  const {
    shopOwnerShop,
    shopOwnerOrders,
    shopMembers,
    addShopDeliveryStaff,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'SCOOTER' | 'EV' | 'CYCLE'>('BIKE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter delivery staff members belonging to this shop from real-time Firestore
  const staffList = useMemo(() => {
    const list = shopMembers.filter(
      (m) =>
        m.role === 'DELIVERY_STAFF' &&
        (m.shopId === shopOwnerShop?.id || (shopOwnerShop?.id === 'demo-shop-shree-krishna' && m.email === 'delivery@dailymart.com'))
    );
    if (list.length === 0 && shopOwnerShop?.id === 'demo-shop-shree-krishna') {
      return [
        {
          id: 'demo_user_delivery_demo-shop-shree-krishna',
          shopId: 'demo-shop-shree-krishna',
          userId: 'demo_user_delivery',
          name: 'Sunil Kumar (Delivery Partner)',
          phone: '+91 99000 00003',
          email: 'delivery@dailymart.com',
          role: 'DELIVERY_STAFF' as const,
          vehicleType: 'BIKE' as const,
          status: 'ACTIVE' as const,
          permissions: [],
        },
      ];
    }
    return list;
  }, [shopMembers, shopOwnerShop]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Please fill in staff name, phone, and login email.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const ok = await addShopDeliveryStaff({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        vehicleType,
      });

      if (!ok) {
        throw new Error('Failed to register delivery partner. Please try again.');
      }

      setIsAddModalOpen(false);
      setName('');
      setPhone('+91 ');
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error registering delivery staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight">
            Delivery Staff Fleet
          </h2>
          <p className="text-xs text-stone-500">
            Create and manage delivery riders dedicated to {shopOwnerShop?.name}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Partner</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {staffList.map((staff) => {
          // Count active deliveries assigned to this staff
          const assignedCount = shopOwnerOrders.filter(
            (o) =>
              (o.deliveryStaffId === staff.userId || o.deliveryStaffName === staff.name) &&
              ['ASSIGNED_TO_DELIVERY', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
          ).length;

          return (
            <div
              key={staff.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900">{staff.name}</h3>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {staff.vehicleType || 'Bike'} · Dedicated Fleet
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 rounded-xl p-2.5">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{staff.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{staff.email}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">Live Delivery Tasks:</span>
                <span className="font-extrabold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                  {assignedCount} active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Delivery Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-xs text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Add Delivery Partner
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Account will be tied to {shopOwnerShop?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Partner Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Mobile / WhatsApp Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 99000 00003"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="delivery@dailymart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Delivery staff will log in with this email on the standard DailyMart login screen.
                </p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                >
                  <option value="BIKE">Motorcycle / Bike</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="EV">Electric 2-Wheeler (EV)</option>
                  <option value="CYCLE">Bicycle</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
