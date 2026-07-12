import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  Clock, 
  LogOut, 
  TrendingUp, 
  UserCheck, 
  Settings,
  Trash2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import instance from '../utils/axios';
import ToastContainer from '../components/ToastContainer';

export default function Dashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, users, settings
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Settings states - current admin update
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Settings states - create new admin account
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Authenticate Admin
  useEffect(() => {
    const savedAdmin = localStorage.getItem('sweet_shop_admin');
    if (!savedAdmin) {
      navigate('/login');
    } else {
      const parsed = JSON.parse(savedAdmin);
      setAdmin(parsed);
      setNewEmail(parsed.email);
    }
  }, [navigate]);

  // Global click handler to dismiss dropdowns
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenDropdownId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Fetch metrics data with a 1.2s mock delay to showcase skeleton screens
  const fetchData = async () => {
    const startTime = Date.now();
    try {
      const [usersRes, ordersRes] = await Promise.all([
        instance.get('/users/all'),
        instance.get('/orders/all')
      ]);

      const elapsed = Date.now() - startTime;
      const delay = 1200 - elapsed;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (usersRes.data?.success) {
        setUsersList(usersRes.data.users);
      }
      if (ordersRes.data?.success) {
        setOrdersList(ordersRes.data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await instance.delete(`/users/delete/${userId}`);
      if (res.data?.success) {
        fetchData();
        addToast('Customer account removed successfully.', 'success');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to remove user account.', 'error');
    }
  };

  useEffect(() => {
    if (admin) {
      fetchData();
    }
  }, [admin]);

  const handleLogout = () => {
    localStorage.removeItem('sweet_shop_admin');
    navigate('/login');
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      const res = await instance.put(`/orders/status/${orderId}`, { status: newStatus });
      if (res.data?.success) {
        setOrdersList(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsMessage('');
    setIsUpdating(true);

    try {
      const res = await instance.put('/users/admin/update', {
        email: newEmail,
        password: newPassword || undefined
      });

      if (res.data?.success) {
        const updatedAdmin = res.data.admin;
        localStorage.setItem('sweet_shop_admin', JSON.stringify(updatedAdmin));
        setAdmin(updatedAdmin);
        setNewPassword('');
        setSettingsMessage('Settings saved successfully! Email and password updated.');
      }
    } catch (err) {
      setSettingsError(err.response?.data?.message || err.message || 'Failed to update credentials.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsMessage('');
    setIsUpdating(true);

    try {
      const res = await instance.post('/users/admin/create', {
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword
      });

      if (res.data?.success) {
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setSettingsMessage('New Administrator account created successfully!');
      }
    } catch (err) {
      setSettingsError(err.response?.data?.message || err.message || 'Failed to create new admin account.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculations
  const totalUsers = usersList.length;
  const totalOrders = ordersList.length;
  const pendingOrdersCount = ordersList.filter(o => o.status === 'Pending').length;
  
  const totalRevenue = ordersList
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // Generate chart data (aggregated by date)
  const getChartData = () => {
    const dailyMap = {};
    const chronOrders = [...ordersList].reverse();
    
    chronOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
      });
      
      const sales = order.status !== 'Cancelled' ? order.totalPrice : 0;
      
      if (dailyMap[date]) {
        dailyMap[date].sales += sales;
        dailyMap[date].orders += 1;
      } else {
        dailyMap[date] = { date, sales, orders: 1 };
      }
    });

    const dataArray = Object.values(dailyMap);
    if (dataArray.length === 0) {
      return [
        { date: 'No Data', sales: 0, orders: 0 }
      ];
    }
    return dataArray;
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="global-loader-overlay" style={{ background: 'var(--surface)' }}>
        <div className="loader-spinner-wrap">
          <div className="loader-circle-spinner"></div>
          <img src="/sweet_shop_logo.png" alt="Loading" className="loader-logo-pulsing" />
        </div>
        <p className="loader-text">Loading sweet dashboard metrics...</p>
      </div>
    );
  }

  // Skeleton Components for Dashboard Sections
  const MetricsSkeleton = () => (
    <div className="metrics-grid">
      {[1, 2, 3, 4].map(num => (
        <div className="metric-card" style={{ opacity: 0.75 }} key={num}>
          <div className="metric-icon-wrap skeleton-pulse" style={{ background: 'var(--border-mid)' }}></div>
          <div className="metric-details" style={{ flex: 1 }}>
            <div className="skeleton-pulse" style={{ height: '12px', width: '45%', background: 'var(--border-mid)', borderRadius: 'var(--r-pill)', marginBottom: '8px' }}></div>
            <div className="skeleton-pulse" style={{ height: '24px', width: '70%', background: 'var(--border-mid)', borderRadius: 'var(--r-pill)' }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  const ChartSkeleton = () => (
    <div className="chart-card" style={{ opacity: 0.75 }}>
      <div className="skeleton-pulse" style={{ height: '20px', width: '180px', background: 'var(--border-mid)', borderRadius: 'var(--r-pill)', marginBottom: '24px' }}></div>
      <div className="skeleton-pulse" style={{ height: '250px', width: '100%', background: 'var(--border-mid)', borderRadius: 'var(--r-sm)' }}></div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="table-card" style={{ opacity: 0.75 }}>
      <div className="skeleton-pulse" style={{ height: '20px', width: '150px', background: 'var(--border-mid)', borderRadius: 'var(--r-pill)', marginBottom: '24px' }}></div>
      <table className="admin-table">
        <thead>
          <tr>
            {[1, 2, 3, 4, 5].map(num => (
              <th key={num} style={{ background: 'var(--surface)' }}>
                <div className="skeleton-pulse" style={{ height: '12px', width: '60px', background: 'var(--border-mid)', borderRadius: 'var(--r-pill)' }}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map(rowNum => (
            <tr key={rowNum}>
              {[1, 2, 3, 4, 5].map(colNum => (
                <td key={colNum}>
                  <div className="skeleton-pulse" style={{ height: '14px', width: colNum === 1 ? '100px' : '70px', background: 'var(--border)', borderRadius: 'var(--r-pill)' }}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/sweet_shop_logo.png" alt="Cacao & Crumb Logo" className="sidebar-logo" />
          <h2 className="sidebar-title">Cacao & Crumb</h2>
        </div>

        <nav className="sidebar-nav">
          <div 
            onClick={() => setActiveTab('overview')} 
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <TrendingUp size={18} />
            <span>Overview</span>
          </div>

          <div 
            onClick={() => setActiveTab('orders')} 
            className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={18} />
            <span>Incoming Orders</span>
          </div>

          <div 
            onClick={() => setActiveTab('users')} 
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Sweet Lovers</span>
          </div>

          <div 
            onClick={() => setActiveTab('settings')} 
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Dashboard Section */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/sweet_shop_logo.png" 
              alt="Cacao & Crumb Logo" 
              className="top-bar-logo" 
            />
            <div>
              <h1 className="page-title">
                {activeTab === 'overview' && 'Storefront Overview'}
                {activeTab === 'orders' && 'Fresh Incoming Orders'}
                {activeTab === 'users' && 'Registered Sweet Lovers'}
                {activeTab === 'settings' && 'Admin Settings'}
              </h1>
              <div className="top-bar-date" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-dim)', marginTop: '2px' }}>
                System Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* User Profile Badge & Logout (Storefront Style) */}
          <div className="top-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {admin && (
              <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div className="user-avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--gold)', background: 'var(--surface)' }}>
                  <img 
                    src={admin.profile} 
                    alt={admin.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <span className="user-display-name" style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--navy)' }}>
                  {admin.name.split(' ')[0]}
                </span>
              </div>
            )}
            
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary btn-sm" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '8px 12px 9px', 
                width: 'auto', 
                cursor: 'pointer',
                background: 'var(--white)',
                border: '1px solid var(--border-mid)',
                borderBottom: '4px solid var(--border-mid)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--navy)'
              }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <div className="content-body">
          {loading ? (
            <>
              {activeTab === 'overview' && (
                <>
                  <MetricsSkeleton />
                  <ChartSkeleton />
                </>
              )}
              {(activeTab === 'overview' || activeTab === 'orders' || activeTab === 'users') && (
                <TableSkeleton />
              )}
            </>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  {/* Metrics Grid */}
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon-wrap">
                        <Users size={22} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Total Users</span>
                        <span className="metric-value">{totalUsers}</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon-wrap">
                        <ShoppingBag size={22} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Total Orders</span>
                        <span className="metric-value">{totalOrders}</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon-wrap">
                        <IndianRupee size={22} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Total Sales</span>
                        <span className="metric-value">₹{totalRevenue}</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon-wrap">
                        <Clock size={22} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Pending</span>
                        <span className="metric-value">{pendingOrdersCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Recharts Chart */}
                  <div className="chart-card">
                    <h3 className="chart-title">Revenue & Order Trends</h3>
                    <div style={{ width: '100%', height: 300, position: 'relative', minWidth: 0 }}>
                      <ResponsiveContainer>
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3d2314" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3d2314" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-mid)" />
                          <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                          <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'var(--white)', 
                              border: '1px solid var(--border-mid)', 
                              borderRadius: 'var(--r-sm)',
                              fontFamily: 'Outfit',
                              fontSize: '0.85rem'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#3d2314" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorSales)" 
                            name="Sales (₹)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {/* Orders Tab */}
              {(activeTab === 'overview' || activeTab === 'orders') && (
                <div className="table-card">
                  <div className="table-header-row">
                    <h3 className="table-title">Fresh Incoming Orders</h3>
                  </div>
                  {ordersList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontWeight: '600' }}>
                      No orders placed yet.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Ordered Items</th>
                          <th>Amount</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersList.map((order, idx) => (
                          <tr key={order._id}>
                            <td data-label="Date">
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '700', color: 'var(--navy)' }}>
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                                  {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td data-label="Customer">
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '700', color: 'var(--navy)' }}>{order.userName}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{order.userEmail}</span>
                              </div>
                            </td>
                            <td data-label="Ordered Items">
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '320px' }}>
                                {order.items.map((item, idx) => (
                                  <span key={idx} style={{ fontSize: '0.78rem', background: 'rgba(61, 35, 20, 0.05)', color: 'var(--navy)', border: '1px solid rgba(61, 35, 20, 0.08)', padding: '4px 8px', borderRadius: 'var(--r-sm)', fontWeight: '700' }}>
                                    {item.title} × {item.quantity}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td data-label="Amount" style={{ fontWeight: '800', color: 'var(--navy)' }}>₹{order.totalPrice}</td>
                            <td data-label="Status" style={{ textAlign: 'center' }}>
                              <span className={`status-badge ${order.status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                {order.status}
                              </span>
                            </td>
                            <td data-label="Actions" style={{ textAlign: 'center' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(openDropdownId === order._id ? null : order._id);
                                  }}
                                  className={`status-select-btn status-badge ${order.status.toLowerCase()}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <span>{order.status}</span>
                                  <span style={{ fontSize: '0.65rem', marginLeft: '4px' }}>▼</span>
                                </button>

                                {openDropdownId === order._id && (
                                  <div 
                                    className="status-dropdown-menu"
                                    style={{ 
                                      position: 'absolute', 
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      ...(idx >= ordersList.length - 2 && ordersList.length > 2
                                        ? { bottom: 'calc(100% + 6px)' }
                                        : { top: 'calc(100% + 6px)' }
                                      ),
                                      background: 'var(--white)', 
                                      border: '1px solid var(--border-mid)', 
                                      boxShadow: 'var(--shadow-lg)', 
                                      borderRadius: 'var(--r-sm)', 
                                      zIndex: 100, 
                                      minWidth: '120px',
                                      width: 'max-content',
                                      overflow: 'hidden',
                                      animation: 'fadeInOverlay 0.15s ease-out'
                                    }}
                                  >
                                    {['Pending', 'Completed', 'Delivered', 'Cancelled'].map((statusOption) => (
                                      <div 
                                        key={statusOption}
                                        onClick={() => {
                                          handleStatusChange(order._id, statusOption);
                                          setOpenDropdownId(null);
                                        }}
                                        className="status-dropdown-item"
                                      >
                                        <span className={`status-badge-dot ${statusOption.toLowerCase()}`}></span>
                                        {statusOption}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {(activeTab === 'overview' || activeTab === 'users') && (
                <div className="table-card">
                  <div className="table-header-row">
                    <h3 className="table-title">Registered Sweet Lovers</h3>
                  </div>
                  {usersList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontWeight: '600' }}>
                      No registered users yet.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer Details</th>
                          <th>Registered Email</th>
                          <th>Registration Date</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map(user => (
                          <tr key={user._id}>
                            <td data-label="Customer">
                              <div className="user-cell">
                                {user.profile ? (
                                  <img src={user.profile} alt={user.name} className="user-avatar-table" style={{ border: '2px solid var(--gold)', boxShadow: 'var(--shadow-sm)' }} />
                                ) : (
                                  <div className="user-avatar-table-fallback" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3d2314, #52301c)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', border: '2px solid var(--gold)', boxShadow: 'var(--shadow-sm)' }}>
                                    {user.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                                  </div>
                                )}
                                <span className="user-name-table">{user.name}</span>
                              </div>
                            </td>
                            <td data-label="Email" style={{ fontWeight: '500' }}>{user.email}</td>
                            <td data-label="Registered" style={{ color: 'var(--text-dim)' }}>
                              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td data-label="Status" style={{ textAlign: 'center' }}>
                              <span className="status-badge completed" style={{ background: 'rgba(22, 163, 74, 0.08)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center' }}>
                                <UserCheck size={12} style={{ marginRight: '4px' }} />
                                <span>Active</span>
                              </span>
                            </td>
                            <td data-label="Actions" style={{ textAlign: 'center' }}>
                              <button 
                                onClick={() => setUserToDelete(user._id)} 
                                className="btn btn-secondary btn-sm" 
                                style={{ display: 'inline-flex', padding: '6px 12px', width: 'auto', alignItems: 'center', gap: '6px' }}
                              >
                                <Trash2 size={13} style={{ verticalAlign: 'middle' }} />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {settingsMessage && (
                    <div style={{ color: 'var(--success)', background: 'rgba(22, 163, 74, 0.08)', padding: '12px', borderRadius: 'var(--r-sm)', fontSize: '0.85rem', fontWeight: '600', border: '1px solid rgba(22, 163, 74, 0.2)', textAlign: 'center' }}>
                      {settingsMessage}
                    </div>
                  )}
                  {settingsError && (
                    <div style={{ color: 'var(--danger)', background: 'rgba(220, 38, 38, 0.08)', padding: '12px', borderRadius: 'var(--r-sm)', fontSize: '0.85rem', fontWeight: '600', border: '1px solid rgba(220, 38, 38, 0.2)', textAlign: 'center' }}>
                      {settingsError}
                    </div>
                  )}

                  <div className="settings-grid">
                    {/* Admin Profile Settings */}
                    <div className="table-card" style={{ margin: 0 }}>
                      <div className="table-header-row" style={{ marginBottom: '24px' }}>
                        <h3 className="table-title">Update My Credentials</h3>
                      </div>
                      <form onSubmit={handleSettingsSubmit} className="enquiry-form">
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label className="form-label">Current Admin Email *</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            style={{ paddingLeft: '16px' }}
                            value={newEmail} 
                            onChange={(e) => setNewEmail(e.target.value)} 
                            required 
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '28px' }}>
                          <label className="form-label">New Password (leave empty to keep current) *</label>
                          <input 
                            type="password" 
                            className="form-input" 
                            style={{ paddingLeft: '16px' }}
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            placeholder="Enter new password"
                          />
                        </div>

                        <button type="submit" className="btn btn-primary">
                          <span>Save Changes</span>
                        </button>
                      </form>
                    </div>

                    {/* Add New Admin */}
                    <div className="table-card" style={{ margin: 0 }}>
                      <div className="table-header-row" style={{ marginBottom: '24px' }}>
                        <h3 className="table-title">Add New Admin Account</h3>
                      </div>
                      <form onSubmit={handleCreateAdminSubmit} className="enquiry-form">
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label className="form-label">Name *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ paddingLeft: '16px' }}
                            placeholder="e.g. John Doe"
                            value={newAdminName} 
                            onChange={(e) => setNewAdminName(e.target.value)} 
                            required 
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label className="form-label">Email Address *</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            style={{ paddingLeft: '16px' }}
                            placeholder="e.g. newadmin@sweetshop.in"
                            value={newAdminEmail} 
                            onChange={(e) => setNewAdminEmail(e.target.value)} 
                            required 
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '28px' }}>
                          <label className="form-label">Password *</label>
                          <input 
                            type="password" 
                            className="form-input" 
                            style={{ paddingLeft: '16px' }}
                            placeholder="••••••••"
                            value={newAdminPassword} 
                            onChange={(e) => setNewAdminPassword(e.target.value)} 
                            required
                          />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--navy)', borderColor: 'var(--navy)' }}>
                          <span>Create Admin</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Glassmorphic Loader Overlay */}
      {isUpdating && (
        <div className="global-loader-overlay">
          <div className="loader-spinner-wrap">
            <div className="loader-circle-spinner"></div>
            <img src="/sweet_shop_logo.png" alt="Pulsing Cake" className="loader-logo-pulsing" />
          </div>
          <p className="loader-text">Saving sweet changes...</p>
        </div>
      )}

      {/* Custom Delete Account Confirmation Modal */}
      {userToDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Remove Customer Account?</h3>
            <p className="modal-desc">
              Are you sure you want to permanently remove this customer's account? This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button 
                onClick={() => setUserToDelete(null)} 
                className="btn btn-secondary btn-sm"
                style={{ minWidth: '100px' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const targetId = userToDelete;
                  setUserToDelete(null);
                  setIsUpdating(true);
                  await handleDeleteUser(targetId);
                  setIsUpdating(false);
                }} 
                className="btn btn-primary btn-sm"
                style={{ minWidth: '100px', background: 'var(--navy)', borderColor: 'var(--navy)' }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
