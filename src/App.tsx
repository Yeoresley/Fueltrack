import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Warehouse, 
  Users, 
  Truck, 
  Car, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileText, 
  Settings, 
  LogOut,
  ClipboardList,
  Menu,
  X,
  Plus,
  Search,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency, formatDate } from './utils';
import { User, Deposit, FuelType, Driver, Vehicle, Client, Movement, FuelRequest } from './types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
      secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Close sidebar on mobile when tab changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [requests, setRequests] = useState<FuelRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('fuel_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [depRes, fuelRes, driverRes, vehicleRes, clientRes, moveRes, reqRes, userRes] = await Promise.all([
        fetch('/api/deposits'),
        fetch('/api/fuel-types'),
        fetch('/api/drivers'),
        fetch('/api/vehicles'),
        fetch('/api/clients'),
        fetch('/api/movements'),
        fetch('/api/requests'),
        fetch('/api/users')
      ]);

      setDeposits(await depRes.json());
      setFuelTypes(await fuelRes.json());
      setDrivers(await driverRes.json());
      setVehicles(await vehicleRes.json());
      setClients(await clientRes.json());
      setMovements(await moveRes.json());
      setRequests(await reqRes.json());
      setUsers(await userRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('fuel_user', JSON.stringify(userData));
    } else {
      alert("Credenciales inválidas");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fuel_user');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Truck size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">FuelTrack Pro</h1>
            <p className="text-slate-500">Gestión de Almacén de Combustible</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Usuario</label>
              <Input name="username" placeholder="admin, eco, ope, trans, cons" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
              <Input name="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">Iniciar Sesión</Button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Sugerencia: admin/admin, eco/eco, ope/ope</p>
          </div>
        </Card>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'economia', 'operador', 'transporte', 'consultor'] },
    { id: 'deposits', label: 'Depósitos', icon: Warehouse, roles: ['admin', 'economia', 'consultor'] },
    { id: 'fuel-types', label: 'Combustibles', icon: ClipboardList, roles: ['admin', 'economia', 'consultor'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['admin', 'economia', 'consultor'] },
    { id: 'drivers', label: 'Choferes', icon: Truck, roles: ['admin', 'economia', 'consultor'] },
    { id: 'vehicles', label: 'Vehículos', icon: Car, roles: ['admin', 'economia', 'consultor'] },
    { id: 'movements', label: 'Movimientos', icon: ArrowDownCircle, roles: ['admin', 'economia', 'operador', 'consultor'] },
    { id: 'kardex', label: 'Kardex', icon: ClipboardList, roles: ['admin', 'economia', 'consultor'] },
    { id: 'requests', label: 'Solicitudes', icon: Clock, roles: ['admin', 'transporte', 'operador', 'consultor'] },
    { id: 'users', label: 'Usuarios', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-bottom">
          <div className="flex items-center gap-2">
            <Truck className="text-indigo-600" size={24} />
            <span className="text-xl font-bold text-slate-900">FuelTrack</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 px-4 space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="mb-4 px-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</p>
            <p className="text-sm font-medium text-slate-900">{user.username}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('es-CU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard movements={movements} deposits={deposits} />}
              {activeTab === 'deposits' && <Deposits deposits={deposits} onRefresh={fetchData} />}
              {activeTab === 'fuel-types' && <FuelTypes fuelTypes={fuelTypes} movements={movements} onRefresh={fetchData} />}
              {activeTab === 'clients' && <Clients clients={clients} onRefresh={fetchData} />}
              {activeTab === 'drivers' && <Drivers drivers={drivers} onRefresh={fetchData} />}
              {activeTab === 'vehicles' && <Vehicles vehicles={vehicles} fuelTypes={fuelTypes} onRefresh={fetchData} />}
              {activeTab === 'movements' && <MovementsView 
                movements={movements} 
                deposits={deposits} 
                fuelTypes={fuelTypes} 
                vehicles={vehicles} 
                drivers={drivers} 
                clients={clients} 
                user={user}
                onRefresh={fetchData} 
              />}
              {activeTab === 'kardex' && <Kardex movements={movements} deposits={deposits} fuelTypes={fuelTypes} />}
              {activeTab === 'requests' && <RequestsView requests={requests} fuelTypes={fuelTypes} user={user} onRefresh={fetchData} />}
              {activeTab === 'users' && <UsersView users={users} onRefresh={fetchData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- View Components ---

function Dashboard({ movements, deposits }: { movements: Movement[], deposits: Deposit[] }) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = now.toISOString().slice(0, 7);

  const stats = {
    today: {
      entries: movements.filter(m => m.date?.startsWith(todayStr) && (m.type === 'entry' || m.type === 'adjustment_in')).reduce((acc, m) => acc + (m.quantity || 0), 0),
      exits: movements.filter(m => m.date?.startsWith(todayStr) && (m.type !== 'entry' && m.type !== 'adjustment_in')).reduce((acc, m) => acc + (m.quantity || 0), 0),
    },
    month: {
      entries: movements.filter(m => m.date?.startsWith(monthStr) && (m.type === 'entry' || m.type === 'adjustment_in')).reduce((acc, m) => acc + (m.quantity || 0), 0),
      exits: movements.filter(m => m.date?.startsWith(monthStr) && (m.type !== 'entry' && m.type !== 'adjustment_in')).reduce((acc, m) => acc + (m.quantity || 0), 0),
      sales: movements.filter(m => m.date?.startsWith(monthStr) && m.type === 'sale').reduce((acc, m) => acc + ((m.price || 0) * (m.quantity || 0)), 0),
    }
  };

  const totalEntries = movements.filter(m => m.type === 'entry' || m.type === 'adjustment_in').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const totalExits = movements.filter(m => m.type !== 'entry' && m.type !== 'adjustment_in').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const stock = totalEntries - totalExits;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
              <Warehouse size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Stock Actual</p>
              <p className="text-2xl font-bold text-slate-900">{stock.toLocaleString()} Lts</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <ArrowDownCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Entradas (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">{stats.month.entries.toLocaleString()} Lts</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-orange-100 p-3 text-orange-600">
              <ArrowUpCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Salidas (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">{stats.month.exits.toLocaleString()} Lts</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Salidas (Hoy)</p>
              <p className="text-2xl font-bold text-slate-900">{stats.today.exits.toLocaleString()} Lts</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ventas (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.month.sales)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Últimos Movimientos</h3>
          <div className="space-y-4">
            {movements.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-full p-2",
                    m.type === 'entry' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {m.type === 'entry' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{TYPE_LABELS[m.type] || m.type}</p>
                    <p className="text-xs text-slate-500">{formatDate(m.date)}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  m.type === 'entry' ? "text-emerald-600" : "text-orange-600"
                )}>
                  {m.type === 'entry' ? '+' : '-'}{m.quantity} Lts
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Estado de Depósitos</h3>
          <div className="space-y-4">
            {deposits.map(d => {
              const dStock = movements
                .filter(m => m.deposit_id === d.id)
                .reduce((acc, m) => acc + (m.type === 'entry' || m.type === 'adjustment_in' ? m.quantity : -m.quantity), 0);
              return (
                <div key={d.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{d.name}</span>
                    <span className="text-slate-500">{dStock.toLocaleString()} Lts</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div 
                      className="h-full rounded-full bg-indigo-500" 
                      style={{ width: `${Math.min(100, (dStock / 10000) * 100)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Deposits({ deposits, onRefresh }: { deposits: Deposit[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    if (editingId) {
      await fetch(`/api/deposits/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    onRefresh();
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (d: Deposit) => {
    setEditingId(d.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gestión de Depósitos</h3>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2">
          <Plus size={18} /> Nuevo Depósito
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del Depósito</label>
              <Input name="name" defaultValue={deposits.find(d => d.id === editingId)?.name} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ubicación</label>
              <Input name="location" defaultValue={deposits.find(d => d.id === editingId)?.location} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Responsable</label>
              <Input name="responsible" defaultValue={deposits.find(d => d.id === editingId)?.responsible} required />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deposits.map(d => (
          <Card key={d.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{d.name}</h4>
                <p className="text-sm text-slate-500">Ubicación: {d.location}</p>
                <p className="text-sm text-slate-500">Resp: {d.responsible}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(d)} className="h-8 px-2 text-xs">Editar</Button>
                </div>
              </div>
              <Warehouse className="text-indigo-200" size={32} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FuelTypes({ fuelTypes, movements, onRefresh }: { fuelTypes: FuelType[], movements: Movement[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const getGlobalPMP = (fuelId: number) => {
    const fuelMovements = movements.filter(m => m.fuel_type_id === fuelId);
    let totalQty = 0;
    let totalVal = 0;
    
    // Sort by date to calculate correctly
    const sorted = [...fuelMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(m => {
      const isEntry = m.type === 'entry' || m.type === 'adjustment_in';
      if (isEntry) {
        totalQty += m.quantity;
        totalVal += m.quantity * m.price;
      } else {
        const currentWAC = totalQty > 0 ? totalVal / totalQty : m.price;
        totalQty -= m.quantity;
        totalVal -= m.quantity * currentWAC;
      }
    });
    
    return totalQty > 0 ? totalVal / totalQty : 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    if (editingId) {
      await fetch(`/api/fuel-types/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/fuel-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    onRefresh();
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (f: FuelType) => {
    setEditingId(f.id);
    setShowForm(true);
  };

  const currentFuel = fuelTypes.find(f => f.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gestión de Tipos de Combustible</h3>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2">
          <Plus size={18} /> Nuevo Tipo
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del Combustible</label>
              <Input name="name" defaultValue={currentFuel?.name} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Precio Venta Ecosistema ($)</label>
              <Input name="price_ecosistema" type="number" step="0.01" defaultValue={currentFuel?.price_ecosistema} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Precio Venta Externo ($)</label>
              <Input name="price_externo" type="number" step="0.01" defaultValue={currentFuel?.price_externo} required />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fuelTypes.map(f => {
          const costPMP = getGlobalPMP(f.id);
          return (
            <Card key={f.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-slate-900">{f.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Costo Actual (PMP)</p>
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(costPMP)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Ecosistema</p>
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(f.price_ecosistema || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Externo</p>
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(f.price_externo || 0)}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(f)} className="h-8 px-2 text-xs">Editar Precios</Button>
                  </div>
                </div>
                <ClipboardList className="text-indigo-100" size={48} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Clients({ clients, onRefresh }: { clients: Client[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    if (editingId) {
      await fetch(`/api/clients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    onRefresh();
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gestión de Clientes</h3>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2">
          <Plus size={18} /> Nuevo Cliente
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre/Razón Social</label>
              <Input name="name" defaultValue={clients.find(c => c.id === editingId)?.name} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <Select name="type" defaultValue={clients.find(c => c.id === editingId)?.type} required>
                <option value="Ecosistema">Ecosistema</option>
                <option value="Externo">Externo</option>
              </Select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    c.type === 'Ecosistema' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  )}>
                    {c.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)} className="h-8 px-2 text-xs">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Drivers({ drivers, onRefresh }: { drivers: Driver[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    if (editingId) {
      await fetch(`/api/drivers/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    onRefresh();
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (d: Driver) => {
    setEditingId(d.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gestión de Choferes</h3>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2">
          <Plus size={18} /> Nuevo Chofer
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre Completo</label>
              <Input name="full_name" defaultValue={drivers.find(d => d.id === editingId)?.full_name} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Flota</label>
              <Select name="fleet" defaultValue={drivers.find(d => d.id === editingId)?.fleet} required>
                <option value="TL38">TL38</option>
                <option value="Yeya">Yeya</option>
                <option value="25MN">25MN</option>
              </Select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Flota</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{d.full_name}</td>
                <td className="px-6 py-4 text-slate-600">{d.fleet}</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(d)} className="h-8 px-2 text-xs">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Vehicles({ vehicles, fuelTypes, onRefresh }: { vehicles: Vehicle[], fuelTypes: FuelType[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    if (editingId) {
      await fetch(`/api/vehicles/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    onRefresh();
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setShowForm(true);
  };

  const currentVehicle = vehicles.find(v => v.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gestión de Vehículos</h3>
        <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="gap-2">
          <Plus size={18} /> Nuevo Vehículo
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Marca</label>
              <Input name="brand" defaultValue={currentVehicle?.brand} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Modelo</label>
              <Input name="model" defaultValue={currentVehicle?.model} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Chapa</label>
              <Input name="plate" defaultValue={currentVehicle?.plate} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo Combustible</label>
              <Select name="fuel_type_id" defaultValue={currentVehicle?.fuel_type_id} required>
                {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">IC</label>
              <Input name="ic" defaultValue={currentVehicle?.ic} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Capacidad Tanque (Lts)</label>
              <Input name="tank_capacity" type="number" step="0.01" defaultValue={currentVehicle?.tank_capacity} required />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Chapa</th>
              <th className="px-6 py-3">Marca/Modelo</th>
              <th className="px-6 py-3">Combustible</th>
              <th className="px-6 py-3">IC</th>
              <th className="px-6 py-3">Capacidad</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-indigo-600">{v.plate}</td>
                <td className="px-6 py-4 text-slate-900">{v.brand} {v.model}</td>
                <td className="px-6 py-4 text-slate-600">{v.fuel_type_name}</td>
                <td className="px-6 py-4 text-slate-600">{v.ic}</td>
                <td className="px-6 py-4 text-slate-600">{v.tank_capacity} Lts</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(v)} className="h-8 px-2 text-xs">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  entry: 'Entrada',
  consumption: 'Consumo Propio',
  sale: 'Venta',
  loan: 'Préstamo',
  adjustment_in: 'Ajuste Entrada',
  adjustment_out: 'Ajuste Salida'
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  processed: 'Procesado'
};

function MovementsView({ movements, deposits, fuelTypes, vehicles, drivers, clients, user, onRefresh }: { 
  movements: Movement[], 
  deposits: Deposit[], 
  fuelTypes: FuelType[], 
  vehicles: Vehicle[], 
  drivers: Driver[], 
  clients: Client[],
  user: User,
  onRefresh: () => void 
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<Movement['type']>('entry');
  const [showQR, setShowQR] = useState<Movement | null>(null);

  const [selectedDeposit, setSelectedDeposit] = useState<string>('');
  const [selectedFuel, setSelectedFuel] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formPrice, setFormPrice] = useState<number>(0);

  useEffect(() => {
    if (editingId) {
      const m = movements.find(x => x.id === editingId);
      if (m) {
        setType(m.type);
        setSelectedDeposit(m.deposit_id?.toString() || '');
        setSelectedFuel(m.fuel_type_id?.toString() || '');
        setSelectedClient(m.client_id?.toString() || '');
        setFormQuantity(m.quantity || 0);
        setFormPrice(m.price || 0);
      }
    } else {
      setFormQuantity(0);
      setFormPrice(0);
      setSelectedClient('');
    }
  }, [editingId, movements]);

  // Auto-calculate selling price for sales
  useEffect(() => {
    if (type === 'sale' && selectedClient && selectedFuel) {
      // If editing, only auto-update if the client or fuel changed from the original movement
      if (editingId) {
        const m = movements.find(x => x.id === editingId);
        if (m && m.client_id?.toString() === selectedClient && m.fuel_type_id.toString() === selectedFuel) {
          // It's the original movement's client/fuel, don't overwrite the price
          return;
        }
      }

      const client = clients.find(c => c.id.toString() === selectedClient);
      const fuel = fuelTypes.find(f => f.id.toString() === selectedFuel);
      if (client && fuel) {
        const price = client.type === 'Ecosistema' ? (fuel.price_ecosistema || 0) : (fuel.price_externo || 0);
        setFormPrice(price);
      }
    }
  }, [type, selectedClient, selectedFuel, clients, fuelTypes, editingId, movements]);

  const getLatestPMP = (depositId: string, fuelId: string) => {
    if (!depositId || !fuelId) return 0;
    
    // Filter movements for this deposit and fuel type
    const filtered = movements
      .filter(m => m.deposit_id?.toString() === depositId && m.fuel_type_id?.toString() === fuelId)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
    
    if (filtered.length === 0) return 0;

    let balance = 0;
    let totalValue = 0;
    
    filtered.forEach(m => {
      const isEntry = m.type === 'entry' || m.type === 'adjustment_in';
      const prevBalance = balance;
      const prevValue = totalValue;
      
      if (isEntry) {
        balance += m.quantity;
        totalValue += m.quantity * m.price;
      } else {
        const currentWAC = prevBalance > 0 ? prevValue / prevBalance : m.price;
        balance -= m.quantity;
        totalValue -= m.quantity * currentWAC;
      }
    });
    
    return balance > 0 ? totalValue / balance : (filtered.length > 0 ? filtered[filtered.length - 1].price : 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData);
    
    let finalPrice = Number(rawData.price);
    const quantity = Number(rawData.quantity);

    if (type === 'entry' || type === 'adjustment_in') {
      const totalAmount = Number(rawData.total_amount);
      finalPrice = quantity > 0 ? totalAmount / quantity : 0;
    } else if (type === 'sale') {
      finalPrice = formPrice;
    } else {
      finalPrice = getLatestPMP(rawData.deposit_id as string, rawData.fuel_type_id as string);
    }

    const data = { ...rawData, price: finalPrice, type };
    
    if (editingId) {
      await fetch(`/api/movements/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    onRefresh();
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (m: Movement) => {
    if (m.status === 'processed') {
      alert("No se puede editar un movimiento procesado.");
      return;
    }
    setEditingId(m.id);
    setType(m.type);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este movimiento?")) return;
    const res = await fetch(`/api/movements/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onRefresh();
    } else {
      const err = await res.json();
      alert(err.error || "Error al eliminar");
    }
  };

  const handleProcess = async (id: number) => {
    if (!confirm("¿Desea procesar este movimiento? Una vez procesado no podrá editarse ni eliminarse.")) return;
    const m = movements.find(mov => mov.id === id);
    if (!m) return;
    
    await fetch(`/api/movements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...m, status: 'processed' })
    });
    onRefresh();
  };

  const currentMovement = movements.find(m => m.id === editingId);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Movimientos de Combustible', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);
    
    autoTable(doc, {
      head: [['Fecha', 'Tipo', 'Estado', 'Depósito', 'Comb.', 'Cant.', 'Detalle']],
      body: movements.map(m => [
        formatDate(m.date),
        m.type,
        m.status,
        m.deposit_name,
        m.fuel_type_name,
        m.quantity,
        m.plate || m.client_name || m.provider || ''
      ]),
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });
    doc.save('movimientos.pdf');
  };

  const exportSinglePDF = (m: Movement) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Comprobante de Movimiento', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      
      let y = 40;
      const addLine = (label: string, value: string | number | undefined) => {
        if (value === undefined) return;
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), 70, y);
        y += 10;
      };

      addLine('ID Operación', m.id);
      addLine('No. Operación', m.op_number || 'N/A');
      addLine('Fecha', formatDate(m.date));
      addLine('Tipo', TYPE_LABELS[m.type] || m.type);
      addLine('Estado', STATUS_LABELS[m.status] || m.status);
      addLine('Depósito', m.deposit_name);
      addLine('Combustible', m.fuel_type_name);
      addLine('Cantidad', `${m.quantity} ${m.um}`);
      addLine('Precio', formatCurrency(m.price));
      addLine('Importe Total', formatCurrency(m.price * m.quantity));
      
      if (m.provider) addLine('Proveedor', m.provider);
      if (m.plate) addLine('Vehículo (Chapa)', m.plate);
      if (m.driver_name) addLine('Chofer', m.driver_name);
      if (m.client_name) addLine('Cliente', m.client_name);
      if (m.receiver_name) addLine('Recibe', m.receiver_name);
      
      // Adjust box height based on content
      doc.rect(14, 30, 182, y - 25);
      
      doc.text('__________________________', 40, y + 20);
      doc.text('Firma Responsable', 45, y + 25);
      
      doc.text('__________________________', 130, y + 20);
      doc.text('Firma Recibe', 140, y + 25);

      doc.save(`movimiento_${m.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Por favor, intente de nuevo.");
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(movements);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, "movimientos.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-900">Operaciones de Combustible</h3>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportPDF} className="gap-2"><FileText size={18} /> PDF</Button>
          <Button variant="secondary" onClick={exportExcel} className="gap-2"><Download size={18} /> Excel</Button>
          {(user.role === 'admin' || user.role === 'operador' || user.role === 'economia') && (
            <Button onClick={() => { setShowForm(true); setEditingId(null); setType('entry'); }} className="gap-2">
              <Plus size={18} /> Nueva Operación
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <div className="mb-6 flex flex-wrap gap-2">
            {(['entry', 'consumption', 'sale', 'loan'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full px-4 py-1 text-sm font-medium transition-colors",
                  type === t ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {t === 'entry' && 'Entrada'}
                {t === 'consumption' && 'Consumo Propio'}
                {t === 'sale' && 'Venta'}
                {t === 'loan' && 'Préstamo'}
              </button>
            ))}
            {user.role === 'economia' && (['adjustment_in', 'adjustment_out'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full px-4 py-1 text-sm font-medium transition-colors",
                  type === t ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                )}
              >
                Ajuste {t === 'adjustment_in' ? 'Entrada' : 'Salida'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha</label>
              <Input 
                name="date" 
                type="datetime-local" 
                defaultValue={currentMovement?.date ? currentMovement.date.slice(0, 16) : new Date().toISOString().slice(0, 16)} 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Depósito</label>
              <Select name="deposit_id" defaultValue={currentMovement?.deposit_id} onChange={e => setSelectedDeposit(e.target.value)} required>
                <option value="">Seleccione Depósito</option>
                {deposits.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Combustible</label>
              <Select name="fuel_type_id" defaultValue={currentMovement?.fuel_type_id} onChange={e => setSelectedFuel(e.target.value)} required>
                <option value="">Seleccione Combustible</option>
                {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cantidad (Lts)</label>
              <Input 
                name="quantity" 
                type="number" 
                step="0.01" 
                defaultValue={currentMovement?.quantity} 
                onChange={e => setFormQuantity(Number(e.target.value))}
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">UM</label>
              <Input name="um" defaultValue={currentMovement?.um || "Lts"} required />
            </div>
            
            {(type === 'entry' || type === 'adjustment_in') ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Importe Total ($)</label>
                <Input name="total_amount" type="number" step="0.01" defaultValue={currentMovement ? (currentMovement.price * currentMovement.quantity) : ''} required />
              </div>
            ) : type === 'sale' ? (
              <div className="flex flex-col gap-3 pb-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Precio de Venta ($)</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formPrice} 
                    onChange={e => setFormPrice(Number(e.target.value))} 
                    required 
                  />
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 border border-emerald-100 w-full">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold">Total a Cobrar:</span>
                    <span className="text-lg font-black">{formatCurrency(formPrice * formQuantity)}</span>
                  </div>
                  <p className="italic mt-1 text-[10px]">Precio sugerido según tipo de cliente. Puede ajustarse manualmente.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end pb-2">
                <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-500 border border-slate-100 w-full">
                  <p className="font-semibold">Precio Costo Estimado (PMP):</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(getLatestPMP(selectedDeposit || currentMovement?.deposit_id?.toString() || '', selectedFuel || currentMovement?.fuel_type_id?.toString() || ''))}</p>
                  <p className="italic">El importe se calculará automáticamente al procesar.</p>
                </div>
              </div>
            )}

            {type === 'entry' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor/Origen</label>
                <Input name="provider" defaultValue={currentMovement?.provider} required />
              </div>
            )}

            {type === 'consumption' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Vehículo (Chapa)</label>
                  <Select name="vehicle_id" defaultValue={currentMovement?.vehicle_id} required>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.brand})</option>)}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Chofer</label>
                  <Select name="driver_id" defaultValue={currentMovement?.driver_id} required>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Actividad</label>
                  <Input name="activity" defaultValue={currentMovement?.activity} required />
                </div>
              </>
            )}

            {(type === 'sale' || type === 'loan') && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Negocio/Cliente</label>
                  <Select name="client_id" defaultValue={currentMovement?.client_id} onChange={e => setSelectedClient(e.target.value)} required>
                    <option value="">Seleccione Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Recibe (Nombre)</label>
                  <Input name="receiver_name" defaultValue={currentMovement?.receiver_name} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
                  <Input name="observations" defaultValue={currentMovement?.observations} />
                </div>
              </>
            )}

            <div className="lg:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Actualizar' : 'Registrar Movimiento'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Depósito</th>
              <th className="px-6 py-3">Combustible</th>
              <th className="px-6 py-3">Cantidad</th>
              <th className="px-6 py-3">Importe</th>
              <th className="px-6 py-3">Detalle</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(m.date)}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    m.type === 'entry' ? "bg-emerald-50 text-emerald-600" : 
                    m.type.startsWith('adjustment') ? "bg-red-50 text-red-600" :
                    "bg-orange-50 text-orange-600"
                  )}>
                    {TYPE_LABELS[m.type] || m.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    m.status === 'processed' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"
                  )}>
                    {STATUS_LABELS[m.status] || m.status}
                  </span>
                </td>
                <td className="px-6 py-4">{m.deposit_name}</td>
                <td className="px-6 py-4">{m.fuel_type_name}</td>
                <td className="px-6 py-4 font-bold">{m.quantity} {m.um}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(m.price * m.quantity)}</td>
                <td className="px-6 py-4">
                  {m.type === 'entry' && <span className="text-slate-500">Prov: {m.provider}</span>}
                  {m.type === 'consumption' && <span className="text-slate-500">Chapa: {m.plate}</span>}
                  {(m.type === 'sale' || m.type === 'loan') && <span className="text-slate-500">Cli: {m.client_name}</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => exportSinglePDF(m)} className="h-8 px-2 text-xs text-indigo-600">
                      <FileText size={14} className="mr-1" /> Imprimir
                    </Button>
                    {m.type === 'sale' && (
                      <Button variant="ghost" size="sm" onClick={() => setShowQR(m)} className="h-8 px-2 text-xs text-emerald-600">
                        <QrCode size={14} className="mr-1" /> Pagar
                      </Button>
                    )}
                    {m.status === 'draft' && (user.role === 'admin' || user.role === 'operador' || user.role === 'economia') && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(m)} className="h-8 px-2 text-xs">Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleProcess(m.id)} className="h-8 px-2 text-xs text-blue-600">Procesar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="h-8 px-2 text-xs text-red-600">Eliminar</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative"
            >
              <button 
                onClick={() => setShowQR(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Treewlog</h3>
                <p className="text-slate-500 font-medium">Cuenta de Empresa</p>
                <p className="text-indigo-600 font-mono font-bold mt-1">SM020110062368 <span className="text-slate-400">USD</span></p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-6 flex flex-col items-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center border border-slate-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://www.superpay23.com/payto/SM020110062368')}`} 
                      alt="QR Pago Treewlog"
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="bg-indigo-600 text-white font-bold text-sm px-2 py-1 rounded shadow-lg border-2 border-white">TL38</div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400 uppercase tracking-widest font-bold">Escanee para pagar</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Monto a pagar:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(showQR.price * showQR.quantity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Concepto:</span>
                  <span className="font-medium text-slate-900">Venta Combustible #{showQR.id}</span>
                </div>
              </div>

              <Button onClick={() => setShowQR(null)} className="w-full mt-8">Cerrar</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kardex({ movements, deposits, fuelTypes }: { movements: Movement[], deposits: Deposit[], fuelTypes: FuelType[] }) {
  const [filterDeposit, setFilterDeposit] = useState<string>('');
  const [filterFuel, setFilterFuel] = useState<string>('');

  const filtered = movements.filter(m => {
    return (!filterDeposit || m.deposit_id?.toString() === filterDeposit) &&
           (!filterFuel || m.fuel_type_id?.toString() === filterFuel);
  });

  // Calculate running balance and weighted average price
  let balance = 0;
  let totalValue = 0;
  
  // Sort movements by date ascending for calculation
  const sortedMovements = [...filtered].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });
  
  const calculatedData = sortedMovements.map(m => {
    const isEntry = m.type === 'entry' || m.type === 'adjustment_in';
    const prevBalance = balance;
    const prevValue = totalValue;
    const qty = m.quantity || 0;
    const price = m.price || 0;
    
    if (isEntry) {
      balance += qty;
      totalValue += qty * price;
    } else {
      const currentWAC = prevBalance > 0 ? prevValue / prevBalance : price;
      balance -= qty;
      totalValue -= qty * currentWAC;
    }
    
    const wac = balance > 0 ? totalValue / balance : 0;
    
    return { 
      ...m, 
      balance, 
      totalValue, 
      wac: isEntry ? m.price : (prevBalance > 0 ? prevValue / prevBalance : m.price),
      finalWac: wac
    };
  }).reverse();

  const exportKardexPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Kardex de Combustible', 14, 20);
    doc.setFontSize(10);
    doc.text(`Depósito: ${deposits.find(d => d.id.toString() === filterDeposit)?.name || 'Todos'}`, 14, 28);
    doc.text(`Combustible: ${fuelTypes.find(f => f.id.toString() === filterFuel)?.name || 'Todos'}`, 14, 34);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 40);
    
    autoTable(doc, {
      head: [['Fecha', 'Concepto', 'Entrada', 'Salida', 'Precio Costo', 'Saldo', 'Valor Total']],
      body: calculatedData.map(m => {
        const isEntry = m.type === 'entry' || m.type === 'adjustment_in';
        return [
          formatDate(m.date),
          TYPE_LABELS[m.type] || m.type,
          isEntry ? m.quantity.toLocaleString() : '-',
          !isEntry ? m.quantity.toLocaleString() : '-',
          formatCurrency(m.wac),
          m.balance.toLocaleString(),
          formatCurrency(m.totalValue)
        ];
      }),
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });
    doc.save('kardex.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-900">Kardex / Submayor de Combustible</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportKardexPDF} className="gap-2">
            <FileText size={18} /> Imprimir Kardex
          </Button>
          <Select value={filterDeposit} onChange={e => setFilterDeposit(e.target.value)} className="w-40">
            <option value="">Todos los Depósitos</option>
            {deposits.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filterFuel} onChange={e => setFilterFuel(e.target.value)} className="w-40">
            <option value="">Todos los Combustibles</option>
            {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-white uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Concepto</th>
              <th className="px-6 py-3 text-right">Entrada</th>
              <th className="px-6 py-3 text-right">Salida</th>
              <th className="px-6 py-3 text-right">Precio Costo (PMP)</th>
              <th className="px-6 py-3 text-right">Saldo</th>
              <th className="px-6 py-3 text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calculatedData.map(m => {
              const isEntry = m.type === 'entry' || m.type === 'adjustment_in';
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(m.date)}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{TYPE_LABELS[m.type] || m.type}</p>
                    <p className="text-xs text-slate-500">{m.plate || m.client_name || m.provider}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                    {isEntry ? m.quantity.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-orange-600 font-medium">
                    {!isEntry ? m.quantity.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    {formatCurrency(m.wac)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {m.balance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600">
                    {formatCurrency(m.totalValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function RequestsView({ requests, fuelTypes, user, onRefresh }: { requests: FuelRequest[], fuelTypes: FuelType[], user: User, onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...Object.fromEntries(formData),
        requester_id: user.id,
        date: new Date().toISOString()
      })
    });
    onRefresh();
    setShowForm(false);
  };

  const handleStatus = async (id: number, status: string) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Solicitudes de Combustible</h3>
        {user.role === 'transporte' && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus size={18} /> Nueva Solicitud
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo Combustible</label>
              <Select name="fuel_type_id" required>
                {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cantidad Solicitada (Lts)</label>
              <Input name="quantity" type="number" step="0.01" required />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Enviar Solicitud</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {requests.map(r => (
          <Card key={r.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Solicitud #{r.id}</p>
                <p className="text-lg font-bold text-slate-900">{r.quantity} Lts de {r.fuel_type_name}</p>
                <p className="text-xs text-slate-500">{formatDate(r.date)}</p>
              </div>
              <span className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                r.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                r.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                "bg-red-50 text-red-600"
              )}>
                {r.status}
              </span>
            </div>
            {r.status === 'pending' && (user.role === 'admin' || user.role === 'operador') && (
              <div className="flex gap-2">
                <Button onClick={() => handleStatus(r.id, 'approved')} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Aprobar</Button>
                <Button onClick={() => handleStatus(r.id, 'rejected')} variant="danger" className="flex-1">Rechazar</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsersView({ users, onRefresh }: { users: User[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    onRefresh();
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gestión de Usuarios</h3>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={18} /> Nuevo Usuario
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Usuario</label>
              <Input name="username" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
              <Input name="password" type="password" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
              <Select name="role" required>
                <option value="admin">Administrador</option>
                <option value="economia">Economía</option>
                <option value="operador">Operador</option>
                <option value="transporte">Transporte</option>
                <option value="consultor">Consultor</option>
              </Select>
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Crear Usuario</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{u.username}</td>
                <td className="px-6 py-4 capitalize text-slate-600">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
