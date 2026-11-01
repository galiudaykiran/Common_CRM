import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  Play,
  CheckCheck,
  Ban,
  UtensilsCrossed,
  Layers,
  Sparkles,
  Search,
  Trash2,
  Users,
  Phone,
  User,
  ShoppingBag,
} from 'lucide-react';
import {
  diningApi,
  DiningOrder,
  DiningOrderItem,
  DiningSession,
  DiningTable,
  MenuCategory,
  Dish,
} from '../../../api/diningApi';

export const DiningOrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'ORDERS' | 'KITCHEN_ITEMS'>('ORDERS');
  const [orders, setOrders] = useState<DiningOrder[]>([]);
  const [kitchenItems, setKitchenItems] = useState<DiningOrderItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<DiningSession[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>(''); // "session:{id}" or "table:{id}"
  const [newGuestCount, setNewGuestCount] = useState<number>(2);
  const [newCustomerName, setNewCustomerName] = useState<string>('Walk-in Guest');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');

  // Cart
  const [cartItems, setCartItems] = useState<
    Array<{
      dishId: number;
      dishName: string;
      unitPrice: number;
      variantName?: string;
      variantPrice?: number;
      quantity: number;
      specialInstructions?: string;
    }>
  >([]);

  // Menu filters inside modal
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');
  const [selectedDietFilter, setSelectedDietFilter] = useState<string>('ALL');

  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [ordersData, itemsData, sessionsData, tablesData, dishesData, categoriesData] = await Promise.all([
        diningApi.getActiveOrders(),
        diningApi.getKitchenItems(),
        diningApi.getActiveSessions(),
        diningApi.getTables(),
        diningApi.getDishes(),
        diningApi.getCategories(),
      ]);
      setOrders(ordersData || []);
      setKitchenItems(itemsData || []);
      setActiveSessions(sessionsData || []);
      setTables(tablesData || []);
      setDishes(dishesData || []);
      setCategories(categoriesData || []);
      return { tablesData: tablesData || [], sessionsData: sessionsData || [] };
    } catch (err) {
      console.error('Failed to load dining data', err);
      return { tablesData: [], sessionsData: [] };
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData().then((res) => {
      const targetParam = searchParams.get('target');
      const openParam = searchParams.get('openOrder');
      if (openParam === 'true' && targetParam) {
        handleOpenPlaceOrder(targetParam, res.tablesData, res.sessionsData);
      }
    });
    const interval = setInterval(() => loadData(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleOpenPlaceOrder = (
    preferredTarget?: string,
    currentTables = tables,
    currentSessions = activeSessions
  ) => {
    if (currentTables.length === 0) {
      alert('No dining tables found. Please create a table in the Floor Plan first.');
      return;
    }

    if (preferredTarget) {
      setSelectedTargetKey(preferredTarget);
    } else if (currentSessions.length > 0) {
      setSelectedTargetKey(`session:${currentSessions[0].id}`);
    } else {
      setSelectedTargetKey(`table:${currentTables[0].id}`);
      setNewGuestCount(currentTables[0].seatingCapacity || 2);
    }
    setIsOrderModalOpen(true);
  };

  const handleTargetKeyChange = (val: string) => {
    setSelectedTargetKey(val);
    if (val.startsWith('table:')) {
      const tableId = Number(val.replace('table:', ''));
      const table = tables.find((t) => t.id === tableId);
      if (table) {
        setNewGuestCount(table.seatingCapacity || 2);
      }
    }
  };

  // Status transition for item
  const handleUpdateItemStatus = async (itemId: number, nextStatus: string) => {
    try {
      await diningApi.updateOrderItemStatus(itemId, { status: nextStatus });
      showNotification(`Item marked as ${nextStatus}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating item status');
    }
  };

  // Add Item to Order Cart
  const handleAddDishToCart = (dish: Dish, variantName?: string, variantPrice?: number) => {
    const effectivePrice = variantPrice !== undefined ? variantPrice : Number(dish.basePrice);
    const existingIndex = cartItems.findIndex(
      (c) => c.dishId === dish.id && c.variantName === variantName
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          dishId: dish.id,
          dishName: dish.name,
          unitPrice: effectivePrice,
          variantName,
          variantPrice,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    setCartItems(updated);
  };

  // Quick 1-click starter dish helper
  const handleAddStarterDish = async (dishName: string, price: number, dietary: 'VEG' | 'NON_VEG') => {
    try {
      const created = await diningApi.createDish({
        name: dishName,
        basePrice: price,
        dietaryType: dietary,
        preparationTimeMinutes: 15,
        taxRate: 5,
        isFeatured: true,
        active: true,
        availabilityStatus: 'AVAILABLE',
      });
      setDishes((prev) => [...prev, created]);
      handleAddDishToCart(created);
      showNotification(`Added ${dishName} to menu & ticket!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create starter dish');
    }
  };

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetKey) {
      alert('Please select a dining table or seated session');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one dish to the ticket');
      return;
    }

    try {
      setSubmitting(true);
      let targetSessionId: number;

      if (selectedTargetKey.startsWith('table:')) {
        const tableId = Number(selectedTargetKey.replace('table:', ''));
        // Auto start session for this table
        const session = await diningApi.startSession({
          tableId,
          guestCount: Number(newGuestCount) || 2,
          customerName: newCustomerName.trim() || 'Walk-in Guest',
          customerPhone: newCustomerPhone.trim() || undefined,
          notes: orderNotes.trim() || undefined,
        });
        targetSessionId = session.id;
      } else {
        targetSessionId = Number(selectedTargetKey.replace('session:', ''));
      }

      // Fire order to kitchen
      const orderRes = await diningApi.placeOrder({
        sessionId: targetSessionId,
        notes: orderNotes.trim() || undefined,
        items: cartItems.map((c) => ({
          dishId: c.dishId,
          variantName: c.variantName,
          variantPrice: c.variantPrice,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions,
        })),
      });

      showNotification(`Order #${orderRes.orderNumber} successfully fired to kitchen!`);
      setIsOrderModalOpen(false);
      setCartItems([]);
      setOrderNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return { label: 'PLACED', bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' };
      case 'ACCEPTED':
        return { label: 'ACCEPTED', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' };
      case 'PREPARING':
        return { label: 'PREPARING', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
      case 'READY':
        return { label: 'READY TO SERVE', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'SERVED':
        return { label: 'SERVED', bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
      default:
        return { label: status, bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' };
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} /> {actionMessage}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Live Kitchen Display & Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Real-time multi-item ticket tracking with item-level status updates (Preparing, Ready, Served).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => handleOpenPlaceOrder()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Plus size={16} /> Place Dine-In Order
          </button>
        </div>
      </div>

      {/* View Switcher: Full Orders vs Kitchen Items Queue */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setViewMode('ORDERS')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: viewMode === 'ORDERS' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: viewMode === 'ORDERS' ? 'var(--accent-primary, #6366f1)' : 'var(--bg-secondary)',
            color: viewMode === 'ORDERS' ? '#fff' : 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Active Orders Tickets ({orders.length})
        </button>

        <button
          onClick={() => setViewMode('KITCHEN_ITEMS')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: viewMode === 'KITCHEN_ITEMS' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: viewMode === 'KITCHEN_ITEMS' ? 'var(--accent-primary, #6366f1)' : 'var(--bg-secondary)',
            color: viewMode === 'KITCHEN_ITEMS' ? '#fff' : 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Kitchen Items Queue ({kitchenItems.length})
        </button>
      </div>

      {/* VIEW: FULL ORDER TICKETS */}
      {viewMode === 'ORDERS' && (
        <div>
          {orders.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px dashed var(--border-subtle)',
                padding: '4rem 2rem',
                textAlign: 'center',
              }}
            >
              <ChefHat size={48} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No active kitchen tickets right now
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 1.25rem' }}>
                Orders placed from tables or servers will appear here in real-time.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Order Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            background: 'var(--accent-primary, #6366f1)',
                            color: '#fff',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                          }}
                        >
                          Table {order.tableNumber}
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {order.orderNumber}
                        </strong>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                        }}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Session: {order.sessionCode} • Placed {new Date(order.placedAt).toLocaleTimeString()}
                    </div>

                    {order.notes && (
                      <div
                        style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          borderLeft: '3px solid #f59e0b',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '0 4px 4px 0',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        Note: {order.notes}
                      </div>
                    )}

                    {/* Order Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {order.items.map((item) => {
                        const badge = getItemStatusBadge(item.status);
                        return (
                          <div
                            key={item.id}
                            style={{
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '0.65rem 0.8rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {item.quantity}x {item.dishName}
                                </strong>
                                {item.variantName && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                    ({item.variantName})
                                  </span>
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: badge.bg,
                                  color: badge.text,
                                }}
                              >
                                {badge.label}
                              </span>
                            </div>

                            {item.specialInstructions && (
                              <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginBottom: '0.35rem' }}>
                                Instructions: {item.specialInstructions}
                              </div>
                            )}

                            {/* Item Progression Buttons */}
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                              {item.status === 'PLACED' && (
                                <button
                                  onClick={() => handleUpdateItemStatus(item.id, 'PREPARING')}
                                  style={{
                                    flex: 1,
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#f59e0b',
                                    border: 'none',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ▶ Start Prep
                                </button>
                              )}

                              {item.status === 'PREPARING' && (
                                <button
                                  onClick={() => handleUpdateItemStatus(item.id, 'READY')}
                                  style={{
                                    flex: 1,
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    border: 'none',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✓ Mark Ready
                                </button>
                              )}

                              {item.status === 'READY' && (
                                <button
                                  onClick={() => handleUpdateItemStatus(item.id, 'SERVED')}
                                  style={{
                                    flex: 1,
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: '#818cf8',
                                    border: 'none',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✓ Mark Served
                                </button>
                              )}

                              {item.status !== 'SERVED' && item.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Cancel ${item.dishName}?`)) {
                                      handleUpdateItemStatus(item.id, 'CANCELLED');
                                    }
                                  }}
                                  style={{
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Total Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket Total:</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>
                      ₹{Number(order.orderTotal).toFixed(2)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: KITCHEN ITEMS QUEUE */}
      {viewMode === 'KITCHEN_ITEMS' && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 2fr 1fr 1fr 2fr',
              padding: '0.85rem 1.25rem',
              background: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            <div>Qty</div>
            <div>Dish Item</div>
            <div>Status</div>
            <div>Table</div>
            <div style={{ textAlign: 'right' }}>Kitchen Action</div>
          </div>

          {kitchenItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              All kitchen items are currently served! Clean counter.
            </div>
          ) : (
            kitchenItems.map((item) => {
              const badge = getItemStatusBadge(item.status);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 2fr 1fr 1fr 2fr',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {item.quantity}x
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {item.dishName}
                    </div>
                    {item.variantName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Variant: {item.variantName}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.text,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    Order #{item.orderId}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    {item.status === 'PLACED' && (
                      <button
                        onClick={() => handleUpdateItemStatus(item.id, 'PREPARING')}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Start Prep
                      </button>
                    )}

                    {item.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateItemStatus(item.id, 'READY')}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Mark Ready
                      </button>
                    )}

                    {item.status === 'READY' && (
                      <button
                        onClick={() => handleUpdateItemStatus(item.id, 'SERVED')}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#818cf8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- PLACE ORDER MODAL --- */}
      {isOrderModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '960px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UtensilsCrossed size={20} color="#10b981" /> Place New Dine-In Order
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Select an active session or an available table to auto-seat and dispatch tickets straight to the kitchen.
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder}>
              {/* Destination Table / Session Selector */}
              <div
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: selectedTargetKey.startsWith('table:') ? '1.5fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Dining Table Destination *
                    </label>
                    <select
                      value={selectedTargetKey}
                      onChange={(e) => handleTargetKeyChange(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      {activeSessions.length > 0 && (
                        <optgroup label="🟢 Active Seated Sessions">
                          {activeSessions.map((s) => (
                            <option key={`session:${s.id}`} value={`session:${s.id}`}>
                              Table {s.tableNumber} - {s.customerName || 'Walk-in'} (Active • {s.sessionCode})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="⚪ Available Tables (Will Auto-Seat)">
                        {tables
                          .filter((t) => !activeSessions.some((s) => s.tableId === t.id))
                          .map((t) => (
                            <option key={`table:${t.id}`} value={`table:${t.id}`}>
                              Table {t.tableNumber} - {t.areaName || 'General Section'} ({t.seatingCapacity} Seats • Available)
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {selectedTargetKey.startsWith('table:') && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Guest Count *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Users size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={newGuestCount}
                            onChange={(e) => setNewGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                            required
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Customer Name (Optional)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            placeholder="e.g. Nagaraju / Walk-in"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedTargetKey.startsWith('table:') && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Special Order Instructions / Rush
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rush ticket, serve drinks first"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>
                  )}
                </div>

                {selectedTargetKey.startsWith('table:') && (
                  <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Customer Phone (Optional)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.85rem 0.6rem 2.2rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Special Order Instructions / Rush
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Serve all dishes piping hot"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.85rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Two Column Layout: Menu Selector on Left, Cart Ticket on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Left: Menu Picker */}
                <div
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  {/* Search and Filters */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search menu dishes..."
                        value={dishSearchQuery}
                        onChange={(e) => setDishSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem 0.45rem 2rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                        }}
                      />
                    </div>

                    <select
                      value={selectedDietFilter}
                      onChange={(e) => setSelectedDietFilter(e.target.value)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="ALL">All Diets</option>
                      <option value="VEG">🟢 Veg</option>
                      <option value="NON_VEG">🔴 Non-Veg</option>
                    </select>
                  </div>

                  {/* Dishes Scroll Area */}
                  <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {dishes.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '1.5rem 1rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          border: '1px dashed var(--border-subtle)',
                        }}
                      >
                        <Sparkles size={24} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          No dishes created yet
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.85rem' }}>
                          Click a popular starter below to add it directly to this ticket & catalog:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleAddStarterDish('Chicken Biryani', 180, 'NON_VEG')}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Chicken Biryani (₹180)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddStarterDish('Veg Biryani', 140, 'VEG')}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Veg Biryani (₹140)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddStarterDish('Paneer Butter Masala', 160, 'VEG')}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Paneer Butter Masala (₹160)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddStarterDish('Butter Naan', 40, 'VEG')}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Butter Naan (₹40)
                          </button>
                        </div>
                      </div>
                    ) : (
                      dishes
                        .filter((d) => {
                          const matchesSearch = !dishSearchQuery.trim() || d.name.toLowerCase().includes(dishSearchQuery.toLowerCase());
                          const matchesDiet = selectedDietFilter === 'ALL' || d.dietaryType === selectedDietFilter;
                          return matchesSearch && matchesDiet;
                        })
                        .map((dish) => (
                          <div
                            key={dish.id}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: dish.dietaryType === 'VEG' ? '#10b981' : '#ef4444',
                                  }}
                                  title={dish.dietaryType}
                                />
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                  {dish.name}
                                </strong>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                                ₹{Number(dish.basePrice).toFixed(2)}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              {dish.variants && dish.variants.length > 0 ? (
                                dish.variants.map((v, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleAddDishToCart(dish, v.name, Number(v.price))}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      color: '#10b981',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    +{v.name} (₹{v.price})
                                  </button>
                                ))
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddDishToCart(dish)}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                                  }}
                                >
                                  + Add to Order
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Right: Cart Ticket Items */}
                <div
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Selected Ticket Items ({cartItems.length}):
                      </span>
                      {cartItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCartItems([])}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {cartItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <ShoppingBag size={32} style={{ opacity: 0.35, margin: '0 auto 0.5rem' }} />
                        <div>No items added to ticket yet.</div>
                        <span style={{ fontSize: '0.75rem' }}>Click items on the left to add dishes.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {cartItems.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '0.55rem 0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                  {item.dishName}
                                </strong>
                                {item.variantName && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                                    ({item.variantName})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                                ₹{(item.unitPrice * item.quantity).toFixed(2)}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(idx, item.quantity - 1)}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(idx, item.quantity + 1)}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                  }}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(idx)}
                                  title="Remove item"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    marginLeft: '2px',
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <input
                                type="text"
                                placeholder="Item instructions (e.g. less spicy)"
                                value={item.specialInstructions || ''}
                                onChange={(e) => {
                                  const updated = [...cartItems];
                                  updated[idx].specialInstructions = e.target.value;
                                  setCartItems(updated);
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '3px 6px',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '4px',
                                  background: 'var(--bg-primary)',
                                  color: 'var(--text-primary)',
                                  flex: 1,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cart Total */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      marginTop: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                      <span>Subtotal:</span>
                      <span>₹{cartItems.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>Est. GST (5%):</span>
                      <span>₹{(cartItems.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0) * 0.05).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Total Order:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>
                        ₹{(cartItems.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0) * 1.05).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  style={{
                    padding: '0.65rem 1.35rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  style={{
                    padding: '0.65rem 1.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: cartItems.length === 0 ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {submitting ? 'Firing Order...' : 'Fire Order to Kitchen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

