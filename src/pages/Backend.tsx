import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { seedMenu } from '../lib/seed';
import { format } from 'date-fns';

export default function Backend() {
  const { user, isAdmin, loading, logOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(skip => ({ id: skip.id, ...skip.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const updateStatus = async (orderId: string, status: string, userId: string) => {
    try {
      if (status === 'cancelled') {
         const snap = await getDocs(query(collection(db, 'orders')));
         const found = snap.docs.find(d => d.id === orderId);
         if (!found) return;
         await updateDoc(doc(db, 'orders', orderId), { 
           status, 
           updatedAt: serverTimestamp(),
           userId: found.data().userId
         });
      } else {
        await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp(), userId });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedMenu();
      alert('Menu seeded successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to seed');
    }
    setSeeding(false);
  };

  if (loading) return <div className="p-8 text-center bg-stone-50 min-h-screen pt-24 font-mono text-stone-500">Checking auth...</div>;
  if (!user || !isAdmin) return <div className="p-8 text-center min-h-screen bg-stone-50 pt-24 font-mono text-stone-500">Unauthorized. Admins only.</div>;

  return (
    <div className="min-h-screen bg-stone-50/50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-stone-200">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Orders Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 disabled:opacity-50 text-sm font-medium"
            >
              {seeding ? 'Seeding...' : 'Seed Menu'}
            </button>
            <button
              onClick={logOut}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 text-sm font-medium"
            >
              Log Out
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="text-xs uppercase bg-stone-50/50 text-stone-500 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-stone-400">{order.id.slice(-6)}</td>
                    <td className="px-6 py-4 font-medium text-stone-700">{order.customerName}</td>
                    <td className="px-6 py-4">
                      <ul className="space-y-1">
                        {order.items?.map((item: any, idx: number) => (
                          <li key={idx} className="text-xs flex gap-2">
                            <span className="font-semibold text-stone-700">{item.quantity}x</span>
                            <span>{item.name} ({item.portion})</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 font-mono text-stone-700">${order.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full 
                        ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                        ${order.status === 'preparing' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${order.status === 'cancelled' ? 'bg-stone-100 text-stone-600' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'HH:mm') : '...'}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value, order.userId)}
                        className="text-xs bg-stone-50 border border-stone-200 rounded p-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-stone-400 italic">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
