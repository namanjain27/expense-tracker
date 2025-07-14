import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logo from '../assets/logo.png';

const SignUp: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await api.registerUser({
        name,
        email,
        password,
      });
      setSuccess('Registration successful! Logging you in...');
      // Auto-login after successful registration
      await api.loginUser({
        username: email,
        password: password,
      });
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
          <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="TrackX Logo" style={{ width: '60px', height: '60px', marginRight: '10px' }} />
            <h2 style={{ margin: '0', fontSize: '36px', color: 'white' }}>TrackX</h2>
          </Link>
        </div>

        <h3 style={{ fontSize: '28px', marginBottom: '20px', color: '#FFD700' }}>Sign Up</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="text"
            placeholder="Name (Optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {success && <p style={{ color: '#9ACD32', margin: '0', fontSize: '14px' }}>{success}</p>}

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
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Already have an account? {' '}
          <Link to="/login" style={{ color: '#FFD700', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp; 