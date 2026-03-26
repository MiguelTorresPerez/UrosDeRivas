import { useEffect, useState } from 'react';
import { SupabaseAdapter } from '../infrastructure/SupabaseAdapter';
import { SystemLog, Order, MarketItem } from '../domain/entities';
import { AdminGuard } from './AdminGuard';
import { useStore } from './store';
import { MarketItemModal } from './MarketItemModal';
import { Trash2, RefreshCw, ShoppingCart, Activity, Tag, Pencil, CheckCircle, Clock, XCircle } from 'lucide-react';
import './AdminPanel.css';

const adapter = new SupabaseAdapter();

export function AdminPanel() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'market'>('stats');
  
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Market Item Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MarketItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const data = await adapter.getLogs();
        setLogs(data);
      } else if (activeTab === 'orders' && user?.role === 'admin') {
        const data = await adapter.getOrders();
        setOrders(data);
      } else if (activeTab === 'market' && user?.role === 'admin') {
        const data = await adapter.getItems();
        setItems(data);
        await syncClupikProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const syncClupikProducts = async (dbItems: MarketItem[]) => {
    try {
      const res = await fetch('https://api.clupik.com/clubs/67/shop/products/public/home?limit=100');
      if (!res.ok) return;
      const data = await res.json();
      const clupikItems = data.value || [];
      
      let syncedCount = 0;
      for (const cItem of clupikItems) {
        // Prevent dupes by checking name or ID watermark
        const exists = dbItems.some(dbItem => dbItem.name === cItem.title || dbItem.description?.includes(`[Clupik ID: ${cItem.id}]`));
        
        if (!exists) {
          await adapter.createItem({
            name: cItem.title,
            price: (cItem.minPrice || 0) / 100,
            imageUrl: `https://api.clupik.com/clubs/67/shop/image/${cItem.id}?format=large`,
            description: `Producto Oficial.\n[Clupik ID: ${cItem.id}]`,
            sizes: []
          });
          syncedCount++;
        }
      }
      
      if (syncedCount > 0) {
        const freshData = await adapter.getItems();
        setItems(freshData);
      }
    } catch (e) {
      console.error('Error syncing Clupik products', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de forma permanente?')) return;
    try {
      await adapter.deleteLog(id);
      setLogs(logs.filter(log => log.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: Order['status']) => {
    try {
      await adapter.updateOrderStatus(id, newStatus);
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveItem = async (itemData: Omit<MarketItem, 'id'>) => {
    if (editItem) {
      await adapter.updateItem(editItem.id, itemData);
    } else {
      await adapter.createItem(itemData);
    }
    const data = await adapter.getItems();
    setItems(data);
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('¿Borrar producto de la tienda?')) return;
    try {
      await adapter.deleteItem(id);
      setItems(items.filter(i => i.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const renderStats = () => (
    <>
      <div className="admin-stats-summary">
        <div className="stat-card">
          <h3>Total de Registros</h3>
          <p className="stat-number">{logs.length}</p>
        </div>
        <div className="stat-card">
          <h3>Actividad 24h</h3>
          <p className="stat-number">{logs.filter(l => new Date(l.created_at).getTime() > Date.now() - 86400000).length}</p>
        </div>
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Usuario</th>
              <th>Detalles</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="table-empty">Cargando...</td></tr> : 
             logs.length === 0 ? <tr><td colSpan={5} className="table-empty">Sin actividad.</td></tr> :
             logs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString('es-ES')}</td>
                <td><span className="badge-action">{log.action_type}</span></td>
                <td className="monospace">{log.user_id?.substring(0,8) || 'Anon'}</td>
                <td><pre className="metadata-box">{log.metadata ? JSON.stringify(log.metadata) : '-'}</pre></td>
                <td>
                  <button onClick={() => handleDeleteLog(log.id)} className="btn-icon delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderOrders = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Comprador</th>
            <th>Email</th>
            <th>Producto (ID)</th>
            <th>Importe</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={7} className="table-empty">Cargando...</td></tr> : 
           orders.length === 0 ? <tr><td colSpan={7} className="table-empty">Sin pedidos registrados.</td></tr> :
           orders.map(order => (
            <tr key={order.id}>
              <td>{new Date(order.created_at).toLocaleString('es-ES')}</td>
              <td>{order.buyer_name}</td>
              <td className="monospace">{order.buyer_email}</td>
              <td className="monospace" title={order.item_id}>{order.item_id.substring(0, 8)}...</td>
              <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>€{order.amount}</td>
              <td>
                <span className={`status-badge ${order.status}`}>
                  {order.status === 'completed' ? <CheckCircle size={14} /> : order.status === 'processing' ? <RefreshCw size={14} className="spin" /> : order.status === 'cancelled' ? <XCircle size={14} /> : <Clock size={14} />}
                  {order.status}
                </span>
              </td>
              <td>
                <select 
                  className="status-dropdown" 
                  value={order.status} 
                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMarket = () => (
    <div className="admin-table-container">
      <div className="table-toolbar">
         <button className="btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>+ Nuevo Producto</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={5} className="table-empty">Cargando...</td></tr> : 
           items.length === 0 ? <tr><td colSpan={5} className="table-empty">Tienda vacía.</td></tr> :
           items.map(item => (
            <tr key={item.id}>
              <td><img src={item.imageUrl} alt={item.name} className="market-thumb" /></td>
              <td>{item.name}</td>
              <td>€{item.price}</td>
              <td className="description-cell">{item.description}</td>
              <td>
                <div className="admin-actions-cell">
                  <button className="btn-icon" title="Editar" onClick={() => { setEditItem(item); setModalOpen(true); }}><Pencil size={16} /></button>
                  <button className="btn-icon delete" title="Borrar" onClick={() => handleDeleteItem(item.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminGuard roles={['admin', 'coach']} fallback={<div className="page-padding"><h2>Acceso Denegado</h2></div>}>
      <div className="admin-panel animate-fade-in">
        <div className="admin-header">
          <h2>Panel de {user?.role === 'admin' ? 'Administrador' : 'Entrenador'}</h2>
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <Activity size={18} /> Estadísticas
          </button>
          {user?.role === 'admin' && (
            <>
              <button className={`tab-btn ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>
                <Tag size={18} /> Catálogo Tienda
              </button>
              <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                <ShoppingCart size={18} /> Pedidos Stripe
              </button>
            </>
          )}
        </div>

        <div className="admin-tab-content">
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'market' && renderMarket()}
        </div>
      </div>

      <MarketItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveItem}
        initial={editItem}
      />
    </AdminGuard>
  );
}
