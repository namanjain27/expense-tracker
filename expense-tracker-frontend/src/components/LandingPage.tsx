import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const CalendarIcon = '/icons/3dicons-calender-front-color.png';
const TravelIcon = '/icons/3dicons-travel-dynamic-color.png';
const RocketIcon = '/icons/3dicons-rocket-front-color.png';
const ComputerIcon = '/icons/3dicons-computer-dynamic-color.png';
const RupeeIcon = '/icons/3dicons-rupee-dynamic-color.png';
const CalculatorIcon = '/icons/3dicons-calculator-front-color.png';
const MailIcon = '/icons/3dicons-mail-front-color.png';
const WalletIcon = '/icons/3dicons-wallet-front-color.png';
const TargetIcon = '/icons/3dicons-target-front-color.png';
const CreditCardIcon = '/icons/3dicons-credit-card-front-color.png';
const ChartIcon = '/icons/3dicons-chart-dynamic-color.png';
import logo from '../assets/logo.png';
import { api } from '../services/api';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.loginUser({ username: "jainnaman027@gmail.com", password: "adminpassword" });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to login as guest. Please try again.");
      console.error("Guest login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#2b0c3d', // A dark purple from the image
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <header style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 40px',
        maxWidth: '1200px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '48px', fontWeight: 'bold' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Logo" style={{ width: '80px', height: '80px' }} />
            TrackX
          </Link>
        </div>
        <nav>
          <Link to="/login" style={{
            background: 'none',
            border: '1px solid #7B247C',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '15px',
            cursor: 'pointer',
            fontSize: '16px',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            Login
          </Link>
          <Link to="/signup" style={{
            background: '#7B247C',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{
        textAlign: 'center',
        marginTop: '60px',
        maxWidth: '700px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <h1 style={{ fontSize: '42px', margin: '0', lineHeight: '1.2' }}>The Modern Pocket Saver</h1>
        <p style={{ fontSize: '24px', margin: '0' }}>Fulfill your dream vacation trip</p>
        <p style={{ fontSize: '24px', margin: '0' }}>Your personal finance analysis app.</p>
        {error && <p style={{ color: '#FF6347', margin: '0', fontSize: '16px' }}>{error}</p>}
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          style={{
            background: loading ? '#6a3a7b' : '#7B247C',
            border: 'none',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            marginTop: '30px',
          }}>
          {loading ? 'Logging in...' : 'Try TrackX for free'}
        </button>

        {/* Floating Icons */}
        <img src={CalendarIcon} alt="Calendar" style={{ position: 'absolute', top: '10px', left: '-150px', width: '120px' }} />
        <img src={TravelIcon} alt="Travel Suitcase" style={{ position: 'absolute', top: '-20px', right: '-160px', width: '150px' }} />
        <img src={RocketIcon} alt="Rocket" style={{ position: 'absolute', bottom: '-50px', left: '-150px', width: '100px' }} />
        <img src={ComputerIcon} alt="Computer" style={{ position: 'absolute', bottom: '-80px', right: '-120px', width: '120px' }} />
      </main>

      {/* Feature Grids */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '50px',
        marginTop: '150px',
        width: '100%',
        maxWidth: '1000px',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}>
        {/* Row 1 */}
        <div style={{ textAlign: 'center' }}>
          <img src={RupeeIcon} alt="Expenses" style={{ width: '100px', height: '100px' }} />
          <p style={{ fontSize: '20px', marginTop: '10px' }}>Expenses</p>
        </div>
        <div style={{ textAlign: 'center', gridColumn: '2 / 3' }}>
          <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#FFD700', margin: '0' }}>Supercharge</p>
          <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#FFD700', margin: '0' }}>Your Finances</p>
          <img src={WalletIcon} alt="Wallet" style={{ width: '150px', height: '150px', marginTop: '20px' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <img src={TargetIcon} alt="Saving Goals" style={{ width: '100px', height: '100px' }} />
          <p style={{ fontSize: '20px', marginTop: '10px' }}>Saving Goals</p>
        </div>

        {/* Row 2 */}
        <div style={{ textAlign: 'center' }}>
          <img src={CalculatorIcon} alt="Budget" style={{ width: '100px', height: '100px' }} />
          <p style={{ fontSize: '20px', marginTop: '10px' }}>Budget</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <img src={ChartIcon} alt="Analyze with charts" style={{ width: '120px', height: '120px' }} />
          <p style={{ fontSize: '20px', marginTop: '10px' }}>Analyze with charts</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <img src={CreditCardIcon} alt="Subscriptions" style={{ width: '100px', height: '100px' }} />
          <p style={{ fontSize: '20px', marginTop: '10px' }}>Subscriptions</p>
        </div>

        {/* Row 3 */}
        <div style={{ textAlign: 'center' }}>
          <img src={MailIcon} alt="Summary Report Mail" style={{ width: '100px', height: '100px' }} />
          <p style={{ fontSize: '20px', marginTop: '10px' }}>Summary Report Mail</p>
        </div>
        {/* Placeholder for the last empty column, if needed for layout */}
        <div></div>
        <div></div>
      </section>
    </div>
  );
};

export default LandingPage; 