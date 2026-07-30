import React, { useState } from 'react';
import {
  Package,
  Truck,
  TrendingUp,
  ShoppingCart,
  FileText,
  Home as HomeIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  X
} from 'lucide-react';

// Define Interfaces for strict TS compatibility
// Base URL for the backend API. Empty string keeps using the Vite dev proxy locally;
// in production (Vercel) this points at the Railway-hosted FastAPI backend.
const API_BASE = import.meta.env.VITE_API_URL || '';

interface Product {
  idProducto: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  descripcion: string;
}

interface Provider {
  idProveedor: string;
  nombre: string;
  contacto: string;
  direccion: string;
}

interface Sale {
  idVenta: string;
  idProducto: string;
  idCliente: string;
  fechaDeVenta: string;
  cantidad: number;
}

interface Purchase {
  idCompra: string;
  idProducto: string;
  idProveedor: string;
  fechaDeCompra: string;
  cantidad: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: '#18181b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0'
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={28} color="#d4d4d8" />
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>StockWise Web</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '20px 10px' }}>
          {[
            { id: 'home', label: 'Home', icon: <HomeIcon size={20} /> },
            { id: 'products', label: 'Productos', icon: <Package size={20} /> },
            { id: 'providers', label: 'Proveedores', icon: <Truck size={20} /> },
            { id: 'sales', label: 'Ventas', icon: <TrendingUp size={20} /> },
            { id: 'purchases', label: 'Compras', icon: <ShoppingCart size={20} /> },
            { id: 'reports', label: 'Reportes', icon: <FileText size={20} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="nav-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#3f3f46' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#a1a1aa',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'background-color 0.15s, color 0.15s'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, backgroundColor: '#f3f4f6', padding: '30px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <DashboardContent activeTab={activeTab} />
      </div>
    </div>
  );
}

// Subcomponents
function DashboardContent({ activeTab }: { activeTab: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pRes = await fetch(`${API_BASE}/api/products`);
      const pData = await pRes.json();
      setProducts(pData);

      const prRes = await fetch(`${API_BASE}/api/providers`);
      const prData = await prRes.json();
      setProviders(prData);

      const sRes = await fetch(`${API_BASE}/api/sales`);
      const sData = await sRes.json();
      setSales(sData);

      const puRes = await fetch(`${API_BASE}/api/purchases`);
      const puData = await puRes.json();
      setPurchases(puData);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  switch (activeTab) {
    case 'home':
      return <HomeView products={products} providers={providers} sales={sales} purchases={purchases} />;
    case 'products':
      return <ProductsView products={products} onRefresh={fetchData} />;
    case 'providers':
      return <ProvidersView providers={providers} onRefresh={fetchData} />;
    case 'sales':
      return <SalesView sales={sales} products={products} onRefresh={fetchData} />;
    case 'purchases':
      return <PurchasesView purchases={purchases} products={products} providers={providers} onRefresh={fetchData} />;
    case 'reports':
      return <ReportsView />;
    default:
      return <div>Section not found</div>;
  }
}

// Reusable page header with a colored emoji badge, like a friendly section title
function PageHeader({ emoji, title, subtitle, bg }: { emoji: string, title: string, subtitle: string, bg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '25px' }}>
      <div style={{
        backgroundColor: bg,
        borderRadius: '16px',
        width: '56px',
        height: '56px',
        minWidth: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.75rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
      }}>
        {emoji}
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '1rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function HomeView({ products, providers, sales, purchases }: { products: Product[], providers: Provider[], sales: Sale[], purchases: Purchase[] }) {
  const totalProducts = products.length;
  const totalProviders = providers.length;
  const totalSales = sales.reduce((acc, s) => acc + s.cantidad, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <div>
      <PageHeader emoji="🏠" title="Home" subtitle="Bienvenido al StockWise Web Dashboard. Administre todo su inventario y transacciones." bg="#ede9fe" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { title: "Productos", emoji: "📦", value: totalProducts, bg: '#dbeafe' },
          { title: "Proveedores", emoji: "🚚", value: totalProviders, bg: '#dcfce7' },
          { title: "Unidades Vendidas", emoji: "📈", value: totalSales, bg: '#fef3c7' },
          { title: "Unidades Compradas", emoji: "🛒", value: totalPurchases, bg: '#fee2e2' }
        ].map((card, idx) => (
          <div key={idx} className="card-lift" style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.03em' }}>{card.title}</span>
              <h2 style={{ fontSize: '2.25rem', margin: '5px 0 0 0', color: '#111827', fontWeight: 800 }}>{card.value}</h2>
            </div>
            <div style={{ backgroundColor: card.bg, width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', fontSize: '1.5rem' }}>
              {card.emoji}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Global modal & styles shared
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContainerStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '18px',
  width: '500px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box',
  marginBottom: '15px',
  transition: 'border-color 0.15s, box-shadow 0.15s'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: '600',
  fontSize: '0.9rem',
  color: '#374151'
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#27272a',
  color: 'white',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600'
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #d1d5db',
  color: '#374151',
  padding: '10px 18px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600'
};

const CATEGORY_COLORS: Record<string, { bg: string, color: string }> = {
  "Belleza": { bg: '#fce7f3', color: '#be185d' },
  "Tecnología": { bg: '#dbeafe', color: '#1d4ed8' },
  "Alimentos": { bg: '#fef3c7', color: '#b45309' },
  "Ropa y Calzado": { bg: '#ede9fe', color: '#6d28d9' },
  "Electrónica": { bg: '#cffafe', color: '#0e7490' },
  "Hogar": { bg: '#dcfce7', color: '#15803d' },
  "Deportes": { bg: '#fee2e2', color: '#b91c1c' },
  "Juguetes": { bg: '#ffedd5', color: '#c2410c' },
};

// ---------------- PRODUCTS ----------------
function ProductsView({ products, onRefresh }: { products: Product[], onRefresh: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditProduct(null);
    setNombre('');
    setCategoria('Belleza');
    setPrecio('');
    setStock('');
    setDescripcion('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setNombre(p.nombre);
    setCategoria(p.categoria);
    setPrecio(p.precio.toString());
    setStock(p.stock.toString());
    setDescripcion(p.descripcion);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !descripcion.trim()) {
      setErrorMsg("El nombre y la descripción no pueden estar vacíos.");
      return;
    }

    const payload = {
      nombre,
      categoria,
      precio: parseFloat(precio) || 0,
      stock: parseInt(stock) || 0,
      descripcion
    };

    const url = editProduct ? `${API_BASE}/api/products/${editProduct.idProducto}` : `${API_BASE}/api/products`;
    const method = editProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setModalOpen(false);
      onRefresh();
    } else {
      const err = await res.json();
      setErrorMsg(err.detail || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`¿Seguro que deseas eliminar el producto ${id}?`)) {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = searchCategory ? p.categoria === searchCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <PageHeader emoji="📦" title="Productos" subtitle="Visualice y gestione todo el catálogo de productos" bg="#dbeafe" />
        <button onClick={openAddModal} style={{ ...primaryButtonStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> ✨ Añadir Producto
        </button>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '15px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 10px' }}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', padding: '8px 0', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }}
          >
            <option value="">Todas las categorías</option>
            {["Belleza", "Tecnología", "Alimentos", "Ropa y Calzado", "Electrónica", "Hogar", "Deportes", "Juguetes"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {["ID", "Nombre", "Categoría", "Precio", "Stock", "Descripción", "Acciones"].map(h => (
                <th key={h} style={{ padding: '16px 20px', fontWeight: '600', fontSize: '0.85rem', color: '#374151', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, idx) => (
              <tr key={p.idProducto} style={{ borderBottom: idx < filteredProducts.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111827' }}>{p.idProducto}</td>
                <td style={{ padding: '16px 20px' }}>{p.nombre}</td>
                <td style={{ padding: '16px 20px' }}><span style={{ backgroundColor: (CATEGORY_COLORS[p.categoria] || { bg: '#f4f4f5' }).bg, color: (CATEGORY_COLORS[p.categoria] || { color: '#3f3f46' }).color, padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>{p.categoria}</span></td>
                <td style={{ padding: '16px 20px', fontWeight: '500' }}>${p.precio.toFixed(2)}</td>
                <td style={{ padding: '16px 20px' }}><span style={{ color: p.stock <= 20 ? '#ef4444' : '#111827', fontWeight: '600' }}>{p.stock}</span></td>
                <td style={{ padding: '16px 20px', color: '#4b5563', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descripcion}</td>
                <td style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => openEditModal(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3f3f46' }}><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(p.idProducto)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{editProduct ? '✏️ Editar Producto' : '✨ Añadir Producto'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {errorMsg && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSave}>
              <label style={labelStyle}>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} required />

              <label style={labelStyle}>Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
                {["Belleza", "Tecnología", "Alimentos", "Ropa y Calzado", "Electrónica", "Hogar", "Deportes", "Juguetes"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Precio</label>
                  <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Stock</label>
                  <input type="number" value={stock} onChange={e => setStock(e.target.value)} style={inputStyle} required />
                </div>
              </div>

              <label style={labelStyle}>Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'none' }} required></textarea>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={secondaryButtonStyle}>Cancelar</button>
                <button type="submit" style={primaryButtonStyle}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- PROVIDERS ----------------
function ProvidersView({ providers, onRefresh }: { providers: Provider[], onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditProvider(null);
    setNombre('');
    setContacto('');
    setDireccion('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (p: Provider) => {
    setEditProvider(p);
    setNombre(p.nombre);
    setContacto(p.contacto);
    setDireccion(p.direccion);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg("El nombre no puede estar vacío");
      return;
    }
    // Validation: numeric or contain @
    const isNum = /^\d+$/.test(contacto);
    const isEmail = contacto.includes('@');
    if (!isNum && !isEmail) {
      setErrorMsg("Contacto debe ser un número o un email válido");
      return;
    }

    const payload = { nombre, contacto, direccion };
    const url = editProvider ? `${API_BASE}/api/providers/${editProvider.idProveedor}` : `${API_BASE}/api/providers`;
    const method = editProvider ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setModalOpen(false);
      onRefresh();
    } else {
      const err = await res.json();
      setErrorMsg(err.detail || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`¿Seguro que deseas eliminar el proveedor ${id}?`)) {
      const res = await fetch(`${API_BASE}/api/providers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <PageHeader emoji="🚚" title="Proveedores" subtitle="Gestión de la red de proveedores" bg="#dcfce7" />
        <button onClick={openAddModal} style={{ ...primaryButtonStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> ✨ Añadir Proveedor
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {["ID", "Nombre", "Contacto", "Dirección", "Acciones"].map(h => (
                <th key={h} style={{ padding: '16px 20px', fontWeight: '600', fontSize: '0.85rem', color: '#374151', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((p, idx) => (
              <tr key={p.idProveedor} style={{ borderBottom: idx < providers.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111827' }}>{p.idProveedor}</td>
                <td style={{ padding: '16px 20px' }}>{p.nombre}</td>
                <td style={{ padding: '16px 20px' }}>{p.contacto}</td>
                <td style={{ padding: '16px 20px', color: '#4b5563' }}>{p.direccion}</td>
                <td style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => openEditModal(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3f3f46' }}><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(p.idProveedor)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{editProvider ? '✏️ Editar Proveedor' : '✨ Añadir Proveedor'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {errorMsg && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSave}>
              <label style={labelStyle}>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} required />

              <label style={labelStyle}>Contacto (Número o Email)</label>
              <input type="text" value={contacto} onChange={e => setContacto(e.target.value)} style={inputStyle} required />

              <label style={labelStyle}>Dirección</label>
              <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} style={inputStyle} required />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={secondaryButtonStyle}>Cancelar</button>
                <button type="submit" style={primaryButtonStyle}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- SALES ----------------
function SalesView({ sales, products, onRefresh }: { sales: Sale[], products: Product[], onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [idProducto, setIdProducto] = useState('');
  const [idCliente, setIdCliente] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setIdProducto(products[0]?.idProducto || '');
    setIdCliente('');
    setCantidad('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      idProducto,
      idCliente,
      cantidad: parseInt(cantidad) || 0
    };

    const res = await fetch(`${API_BASE}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setModalOpen(false);
      onRefresh();
    } else {
      const err = await res.json();
      setErrorMsg(err.detail || "Error al registrar la venta");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`¿Seguro que deseas eliminar la venta ${id}?`)) {
      const res = await fetch(`${API_BASE}/api/sales/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <PageHeader emoji="💰" title="Ventas" subtitle="Historial y registro de transacciones de salida (Ventas)" bg="#fef3c7" />
        <button onClick={openAddModal} style={{ ...primaryButtonStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> ✨ Nueva Venta
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {["ID Venta", "Producto ID", "Cliente ID", "Fecha", "Cantidad", "Acciones"].map(h => (
                <th key={h} style={{ padding: '16px 20px', fontWeight: '600', fontSize: '0.85rem', color: '#374151', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((s, idx) => (
              <tr key={s.idVenta} style={{ borderBottom: idx < sales.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111827' }}>{s.idVenta}</td>
                <td style={{ padding: '16px 20px' }}>{s.idProducto}</td>
                <td style={{ padding: '16px 20px' }}>{s.idCliente}</td>
                <td style={{ padding: '16px 20px' }}>{s.fechaDeVenta}</td>
                <td style={{ padding: '16px 20px', fontWeight: '600' }}>{s.cantidad}</td>
                <td style={{ padding: '16px 20px' }}>
                  <button onClick={() => handleDelete(s.idVenta)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>💰 Registrar Venta</h2>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {errorMsg && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSave}>
              <label style={labelStyle}>Producto</label>
              <select value={idProducto} onChange={e => setIdProducto(e.target.value)} style={inputStyle}>
                {products.map(p => (
                  <option key={p.idProducto} value={p.idProducto}>{p.idProducto} - {p.nombre} (Stock: {p.stock})</option>
                ))}
              </select>

              <label style={labelStyle}>ID Cliente</label>
              <input type="text" placeholder="ejemplo: cliente01" value={idCliente} onChange={e => setIdCliente(e.target.value)} style={inputStyle} required />

              <label style={labelStyle}>Cantidad</label>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} style={inputStyle} required />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={secondaryButtonStyle}>Cancelar</button>
                <button type="submit" style={primaryButtonStyle}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- PURCHASES ----------------
function PurchasesView({ purchases, products, providers, onRefresh }: { purchases: Purchase[], products: Product[], providers: Provider[], onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [idProducto, setIdProducto] = useState('');
  const [idProveedor, setIdProveedor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setIdProducto(products[0]?.idProducto || '');
    setIdProveedor(providers[0]?.idProveedor || '');
    setCantidad('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      idProducto,
      idProveedor,
      cantidad: parseInt(cantidad) || 0
    };

    const res = await fetch(`${API_BASE}/api/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setModalOpen(false);
      onRefresh();
    } else {
      const err = await res.json();
      setErrorMsg(err.detail || "Error al registrar la compra");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`¿Seguro que deseas eliminar la compra ${id}?`)) {
      const res = await fetch(`${API_BASE}/api/purchases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <PageHeader emoji="🛒" title="Compras" subtitle="Historial y registro de transacciones de entrada (Compras)" bg="#fee2e2" />
        <button onClick={openAddModal} style={{ ...primaryButtonStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> ✨ Nueva Compra
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {["ID Compra", "Producto ID", "Proveedor ID", "Fecha", "Cantidad", "Acciones"].map(h => (
                <th key={h} style={{ padding: '16px 20px', fontWeight: '600', fontSize: '0.85rem', color: '#374151', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map((p, idx) => (
              <tr key={p.idCompra} style={{ borderBottom: idx < purchases.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111827' }}>{p.idCompra}</td>
                <td style={{ padding: '16px 20px' }}>{p.idProducto}</td>
                <td style={{ padding: '16px 20px' }}>{p.idProveedor}</td>
                <td style={{ padding: '16px 20px' }}>{p.fechaDeCompra}</td>
                <td style={{ padding: '16px 20px', fontWeight: '600' }}>{p.cantidad}</td>
                <td style={{ padding: '16px 20px' }}>
                  <button onClick={() => handleDelete(p.idCompra)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>🛒 Registrar Compra</h2>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {errorMsg && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSave}>
              <label style={labelStyle}>Producto</label>
              <select value={idProducto} onChange={e => setIdProducto(e.target.value)} style={inputStyle}>
                {products.map(p => (
                  <option key={p.idProducto} value={p.idProducto}>{p.idProducto} - {p.nombre}</option>
                ))}
              </select>

              <label style={labelStyle}>Proveedor</label>
              <select value={idProveedor} onChange={e => setIdProveedor(e.target.value)} style={inputStyle}>
                {providers.map(prov => (
                  <option key={prov.idProveedor} value={prov.idProveedor}>{prov.idProveedor} - {prov.nombre}</option>
                ))}
              </select>

              <label style={labelStyle}>Cantidad</label>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} style={inputStyle} required />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={secondaryButtonStyle}>Cancelar</button>
                <button type="submit" style={primaryButtonStyle}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Interfaces for report schemas
interface LowStockReportProduct {
  idProducto: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}

interface FrequentProvider {
  idProveedor: string;
  compras: number;
  unidades: number;
}

interface SalesByPeriod {
  idVenta: string;
  idProducto: string;
  idCliente: string;
  fechaDeVenta: string;
  cantidad: number;
}

interface BestSeller {
  idProducto: string;
  unidades_vendidas: number;
}

// ---------------- REPORTS ----------------
function ReportsView() {
  const [reportType, setReportType] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchReport = async (type: string) => {
    setReportType(type);
    setReportData([]);
    setErrorMsg('');

    let url = '';
    if (type === 'low-stock') {
      url = `${API_BASE}/api/reports/low-stock`;
    } else if (type === 'frequent-providers') {
      url = `${API_BASE}/api/reports/frequent-providers`;
    } else if (type === 'best-sellers') {
      url = `${API_BASE}/api/reports/best-sellers`;
    } else {
      return;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setReportData(data);
    } else {
      setErrorMsg("Error cargando reporte");
    }
  };

  const fetchPeriodReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMsg("Especifique ambas fechas");
      return;
    }
    const res = await fetch(`${API_BASE}/api/reports/sales-by-period?start_date=${startDate}&end_date=${endDate}`);
    if (res.ok) {
      const data = await res.json();
      setReportData(data);
    } else {
      setErrorMsg("Error al cargar reporte o formato inválido");
    }
  };

  return (
    <div>
      <PageHeader emoji="📑" title="Reportes" subtitle="Visualización interactiva de métricas del inventario" bg="#fce7f3" />

      {/* Selector */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '25px' }}>
        {[
          { id: 'low-stock', label: 'Menor Stock (≤ 20)', emoji: '📉' },
          { id: 'frequent-providers', label: 'Proveedores Frecuentes', emoji: '🏢' },
          { id: 'sales-period', label: 'Ventas por período', emoji: '📅' },
          { id: 'best-sellers', label: 'Más vendidos (4+ unidades)', emoji: '🔥' }
        ].map(btn => (
          <button
            key={btn.id}
            className="pill-btn"
            onClick={() => {
              if (btn.id === 'sales-period') {
                setReportType('sales-period');
                setReportData([]);
              } else {
                fetchReport(btn.id);
              }
            }}
            style={{
              padding: '11px 20px',
              borderRadius: '999px',
              border: reportType === btn.id ? 'none' : '1px solid #e4e4e7',
              backgroundColor: reportType === btn.id ? '#7c3aed' : 'white',
              color: reportType === btn.id ? 'white' : '#3f3f46',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.92rem',
              boxShadow: reportType === btn.id ? '0 2px 8px rgba(124,58,237,0.35)' : '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            {btn.emoji} {btn.label}
          </button>
        ))}
      </div>

      {errorMsg && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>{errorMsg}</div>}

      {/* Date fields if Sales period is selected */}
      {reportType === 'sales-period' && (
        <form onSubmit={fetchPeriodReport} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
          <div>
            <label style={labelStyle}>Fecha Inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: '200px' }} required />
          </div>
          <div>
            <label style={labelStyle}>Fecha Fin</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: '200px' }} required />
          </div>
          <button type="submit" style={primaryButtonStyle}>Generar Reporte</button>
        </form>
      )}

      {/* Report Data display area */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '25px' }}>
        {reportData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
            <FileText size={48} color="#d1d5db" style={{ marginBottom: '10px' }} />
            <p style={{ margin: 0 }}>Seleccione una categoría de reporte para visualizar las métricas de stock</p>
          </div>
        ) : (
          <div>
            {reportType === 'low-stock' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0' }}>📉 Productos con stock menor o igual a 20:</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {["ID", "Nombre", "Categoría", "Precio", "Stock"].map(h => <th key={h} style={{ padding: '12px 15px', fontWeight: '600' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData as LowStockReportProduct[]).map(p => (
                      <tr key={p.idProducto} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 15px', fontWeight: '600' }}>{p.idProducto}</td>
                        <td style={{ padding: '12px 15px' }}>{p.nombre}</td>
                        <td style={{ padding: '12px 15px' }}>{p.categoria}</td>
                        <td style={{ padding: '12px 15px' }}>${p.precio.toFixed(2)}</td>
                        <td style={{ padding: '12px 15px', color: '#ef4444', fontWeight: '600' }}>{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'frequent-providers' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0' }}>🏢 Proveedores más frecuentes (Top 3):</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(reportData as FrequentProvider[]).map((prov, idx) => (
                    <div key={prov.idProveedor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: '15px 20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3f3f46' }}>#{idx+1}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Proveedor {prov.idProveedor}</h4>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '30px' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>Compras</span>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{prov.compras}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>Unidades</span>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{prov.unidades}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'sales-period' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0' }}>🛒 Ventas en el período seleccionado:</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {["ID Venta", "ID Producto", "ID Cliente", "Fecha", "Cantidad"].map(h => <th key={h} style={{ padding: '12px 15px', fontWeight: '600' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData as SalesByPeriod[]).map(v => (
                      <tr key={v.idVenta} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 15px', fontWeight: '600' }}>{v.idVenta}</td>
                        <td style={{ padding: '12px 15px' }}>{v.idProducto}</td>
                        <td style={{ padding: '12px 15px' }}>{v.idCliente}</td>
                        <td style={{ padding: '12px 15px' }}>{v.fechaDeVenta}</td>
                        <td style={{ padding: '12px 15px', fontWeight: '600' }}>{v.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'best-sellers' && (
              <div>
                <h3 style={{ margin: '0 0 15px 0' }}>🔥 Productos más vendidos (4+ unidades):</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                  {(reportData as BestSeller[]).map(item => (
                    <div key={item.idProducto} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#fffbeb' }}>
                      <TrendingUp size={24} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
                      <h4 style={{ margin: '0 0 5px 0' }}>Producto {item.idProducto}</h4>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#b45309' }}>{item.unidades_vendidas} unidades</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
