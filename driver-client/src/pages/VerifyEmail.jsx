import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); // We'll just force a reload or set user after verify

  // Get email passed from Register page, or fallback
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // The backend has an endpoint for verifyEmail
      const { data } = await api.post('/auth/verify-email', { email, otp });
      
      // Verification returns tokens just like login
      localStorage.setItem('accessToken', data.data.accessToken);
      // Force a reload so AuthContext picks up the new token
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Verification failed. Incorrect OTP?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Verify Email</h2>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          We sent a 6-digit OTP to <strong>{email}</strong>. Check your console logs if email sending is mocked!
        </p>

        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>OTP Code</label>
            <input 
              type="text" 
              required 
              maxLength="6"
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              placeholder="123456" 
              style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
