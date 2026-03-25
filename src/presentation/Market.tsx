import { useEffect } from 'react';
import { useStore } from './store';
import { AdminGuard } from './AdminGuard';
import { SupabaseAdapter } from '../infrastructure/SupabaseAdapter';
import './Market.css';

const adapter = new SupabaseAdapter();

export function Market() {
  const { items, loading, fetchItems } = useStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async () => {
    const name = window.prompt("Nombre del producto:");
    if (!name) return;
    const priceStr = window.prompt("Precio (€):");
    if (!priceStr) return;
    const imageUrl = window.prompt("URL de imagen:", "https://via.placeholder.com/300x400");
    if (!imageUrl) return;

    try {
      await adapter.createItem({ name, price: parseFloat(priceStr), imageUrl, description: '' });
      fetchItems();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este producto?")) return;
    try {
      await adapter.deleteItem(id);
      fetchItems();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  if (loading && items.length === 0) {
    return <div className="loading-state">Cargando productos...</div>;
  }

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>Tienda Oficial</h1>
        <AdminGuard>
          <button className="btn-admin-add" onClick={handleAddItem}>+ Añadir Producto</button>
        </AdminGuard>
      </div>

      <div className="products-grid">
        {items.length === 0 ? (
          <p className="no-items">Próximamente disponible.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="product-card">
              <AdminGuard>
                <button className="btn-admin-delete" onClick={() => handleDelete(item.id)}>X</button>
              </AdminGuard>
              <div className="product-image-wrap">
                <img src={item.imageUrl} alt={item.name} className="product-img" loading="lazy" />
              </div>
              <div className="product-info">
                <h3 className="product-name">{item.name}</h3>
                <div className="product-footer">
                  <span className="product-price">{item.price.toFixed(2)} €</span>
                  <button className="btn-buy">Comprar</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
