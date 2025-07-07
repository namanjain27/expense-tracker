import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import logo from '../assets/logo.png';

const ForgotPasswordRequest: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      // This API call needs to be created in main.py and api.ts
      await api.requestPasswordReset(email);
      setMessage('If an account with that email exists, a password reset link has been sent to your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#2b0c3d',
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
        backgroundColor: '#3a1550',
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

        <h3 style={{ fontSize: '28px', marginBottom: '20px', color: '#FFD700' }}>Forgot Password</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="email"
            placeholder="Enter your email"
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

          {error && <p style={{ color: '#FF6347', margin: '0', fontSize: '14px' }}>{error}</p>}
          {message && <p style={{ color: '#9ACD32', margin: '0', fontSize: '14px' }}>{message}</p>}

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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Remember your password? {' '}
          <Link to="/login" style={{ color: '#FFD700', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordRequest; 