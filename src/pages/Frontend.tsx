import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { UserCircle, ShoppingBag, Plus, Minus, X, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../store';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Frontend() {
  const { user, signIn, isAdmin } = useAuth();
  const [categories, setCategories] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, getTotal } = useCartStore();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'menuItems'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const grouped = items.reduce((acc: any, item: any) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});
      setCategories(grouped);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    });
    return () => unsubscribe();
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      await signIn();
      return;
    }
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        userId: user.uid,
        customerName: user.displayName || user.email?.split('@')[0] || 'Guest',
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          portion: i.portion,
          price: i.price,
          quantity: i.quantity
        })),
        totalAmount: getTotal(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      clearCart();
      setIsCartOpen(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (error) {
      console.error(error);
      alert('Failed to place order.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans pb-32 selection:bg-stone-200">
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-[#FDFBF7] font-serif font-bold text-xl">茶</div>
             <h1 className="text-xl font-serif tracking-widest font-semibold text-stone-900">百年老舖</h1>
          </div>
          <div className="flex items-center gap-6">
             {user ? (
                <div className="flex items-center gap-2 text-sm text-stone-600 font-medium">
                  <UserCircle className="w-5 h-5 text-stone-400" />
                  <span>{user.displayName || user.email?.split('@')[0]}</span>
                </div>
             ) : (
                <button 
                  onClick={signIn}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Log In
                </button>
             )}
             <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors"
             >
                <ShoppingBag className="w-6 h-6" />
                {items.length > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-stone-900 text-[#FDFBF7] flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-[#FDFBF7]">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
             </button>
          </div>
        </div>
      </header>

      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 text-emerald-800 px-6 py-3 rounded-full shadow-lg border border-emerald-200 flex items-center gap-2 animate-in slide-in-from-top-10 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">Order placed successfully!</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
        {loading ? (
          <div className="text-center py-32 text-stone-400 font-mono text-sm animate-pulse">Loading menu formulations...</div>
        ) : (
          Object.entries(categories).map(([category, items]) => (
            <section key={category} className="space-y-10">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-serif font-medium tracking-wide text-stone-900 shrink-0">{category}</h2>
                 <div className="h-px w-full bg-stone-200 flex-1 rounded-full"></div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {items.map((item) => (
                   <div key={item.id} className="group relative bg-white p-6 rounded-2xl shadow-sm border border-stone-200/50 hover:shadow-md hover:border-stone-300 transition-all">
                     <div className="space-y-2">
                       <div className="flex justify-between items-start">
                         <h3 className="font-medium text-lg text-stone-800">{item.name}</h3>
                         {item.isRecommended && (
                           <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">Recommended</span>
                         )}
                       </div>
                       
                       <div className="flex gap-4 pt-4">
                         {item.priceM && (
                           <button 
                             onClick={() => addToCart({ menuItemId: item.id, name: item.name, portion: 'M', price: item.priceM, quantity: 1 })}
                             className="flex-1 flex flex-col items-center justify-center p-3 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-colors group/btn"
                           >
                              <span className="text-xs font-bold text-stone-400 group-hover/btn:text-stone-600 mb-1">M</span>
                              <span className="font-mono text-stone-900">${item.priceM}</span>
                           </button>
                         )}
                         {item.priceL && (
                           <button 
                             onClick={() => addToCart({ menuItemId: item.id, name: item.name, portion: 'L', price: item.priceL, quantity: 1 })}
                             className="flex-1 flex flex-col items-center justify-center p-3 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-colors group/btn"
                           >
                              <span className="text-xs font-bold text-stone-400 group-hover/btn:text-stone-600 mb-1">L</span>
                              <span className="font-mono text-stone-900">${item.priceL}</span>
                           </button>
                         )}
                         {item.priceSingle && (
                           <button 
                             onClick={() => addToCart({ menuItemId: item.id, name: item.name, portion: 'Single', price: item.priceSingle, quantity: 1 })}
                             className="flex-1 flex items-center justify-center p-3 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-colors group/btn"
                           >
                              <span className="font-mono text-stone-900">${item.priceSingle}</span>
                           </button>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </section>
          ))
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div 
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 transition-opacity" 
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-stone-200/50 animate-in slide-in-from-right-full duration-300">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="text-xl font-serif font-medium text-stone-900">Your Order</h2>
              <button 
                 onClick={() => setIsCartOpen(false)}
                 className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p className="font-medium text-sm relative text-center leading-relaxed">
                    Cart is empty. <br/> Feel free to add some tea!
                  </p>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((item, idx) => (
                    <li key={`${item.menuItemId}-${item.portion}-${idx}`} className="flex gap-4">
                       <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-stone-800">{item.name}</h4>
                          <div className="flex gap-3 text-xs text-stone-500 font-medium">
                            {item.portion !== 'Single' && <span>Size {item.portion}</span>}
                            <span>${item.price} each</span>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-3">
                             <div className="flex items-center bg-stone-100 rounded-lg p-1">
                               <button 
                                 onClick={() => updateQuantity(item.menuItemId, item.portion, -1)}
                                 className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-md transition-all shadow-sm"
                               >
                                 <Minus className="w-4 h-4" />
                               </button>
                               <span className="w-8 text-center font-mono text-sm font-medium">{item.quantity}</span>
                               <button 
                                 onClick={() => updateQuantity(item.menuItemId, item.portion, 1)}
                                 className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-md transition-all shadow-sm"
                               >
                                 <Plus className="w-4 h-4" />
                               </button>
                             </div>
                             <button 
                               onClick={() => removeFromCart(item.menuItemId, item.portion)}
                               className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 rounded"
                             >
                               Remove
                             </button>
                          </div>
                       </div>
                       <div className="font-mono text-stone-900 font-medium pt-1">
                         ${(item.price * item.quantity).toFixed(2)}
                       </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-stone-50 border-t border-stone-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-stone-600 font-medium">Total</span>
                  <span className="text-2xl font-serif font-semibold text-stone-900">${getTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-stone-900 text-white rounded-xl font-medium tracking-wide hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : user ? 'Checkout' : 'Log in to Checkout'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {user && isAdmin && (
        <div className="fixed bottom-6 right-6 z-40">
           <Link to="/admin" className="px-5 py-3 bg-stone-800 text-white shadow-xl hover:bg-stone-700 rounded-full font-medium text-sm transition-transform hover:-translate-y-1 flex items-center gap-2">
             Admin Dashboard
           </Link>
        </div>
      )}
    </div>
  );
}
