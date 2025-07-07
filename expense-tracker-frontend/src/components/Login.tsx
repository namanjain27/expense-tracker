import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logo from '../assets/logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.loginUser({
        username: email,
        password: password,
      });
      // Redirect to dashboard on successful login
      navigate('/dashboard'); 
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#2b0c3d', // Consistent dark purple background
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        backgroundColor: '#3a1550', // Slightly lighter purple for the form card
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
          <img src={logo} alt="TrackX Logo" style={{ width: '60px', height: '60px', marginRight: '10px' }} />
          <h2 style={{ margin: '0', fontSize: '36px', color: 'white' }}>TrackX</h2>
        </div>

        <h3 style={{ fontSize: '28px', marginBottom: '20px', color: '#FFD700' }}>Login</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #7B247C',
              background: '#4a1c6a',
              color: 'white',
              fontSize: '16px',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #7B247C',
              background: '#4a1c6a',
              color: 'white',
              fontSize: '16px',
            }}
          />

          {error && <p style={{ color: '#FF6347', margin: '0', fontSize: '14px' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#6a3a7b' : '#7B247C',
              border: 'none',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              marginTop: '10px',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <Link to="/forgot-password" style={{
          color: '#FFD700',
          textDecoration: 'none',
          marginTop: '20px',
          fontSize: '14px',
          display: 'block',
        }}>
          Forgot Password?
        </Link>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Don't have an account? {' '}
          <Link to="/signup" style={{ color: '#FFD700', textDecoration: 'none' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 