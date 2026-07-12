import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, Mail } from 'lucide-react';
import instance from '../utils/axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Authenticate Admin session
  useEffect(() => {
    const admin = localStorage.getItem('sweet_shop_admin');
    if (admin) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await instance.post('/users/login', { email, password, isAdmin: true });
      if (res.data?.success) {
        const userData = res.data.Data;
        if (userData.isAdmin) {
          localStorage.setItem('sweet_shop_admin', JSON.stringify(userData));
          navigate('/dashboard');
        } else {
          setError('Access denied. Administrator privileges required.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: '20px' }}>
      {loading && (
        <div className="global-loader-overlay">
          <div className="loader-spinner-wrap">
            <div className="loader-circle-spinner"></div>
            <img src="/sweet_shop_logo.png" alt="Loading" className="loader-logo-pulsing" />
          </div>
          <p className="loader-text">Verifying credentials...</p>
        </div>
      )}

      <div className="contact-form-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(61, 35, 20, 0.08)', color: 'var(--accent)', marginBottom: '16px' }}>
            <LogIn size={22} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '6px' }}>Cacao & Crumb Admin</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '.875rem' }}>Sign in to manage your storefront</p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', background: 'rgba(220, 38, 38, 0.08)', padding: '12px', borderRadius: 'var(--r-sm)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '20px', border: '1px solid rgba(220, 38, 38, 0.2)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="enquiry-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                id="email" 
                placeholder="admin@sweetshop.in" 
                className="form-input"
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password" className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                <Key size={16} />
              </span>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••" 
                className="form-input"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </main>
  );
}
