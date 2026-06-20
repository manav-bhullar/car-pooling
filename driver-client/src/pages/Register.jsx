import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: '',
    licensePlate: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(formData);
      setSuccessMsg('Registration successful! Please check your email for the OTP.');
      setTimeout(() => navigate('/verify-email', { state: { email: formData.email } }), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen-expressive">
      <div className="auth-blur-driver-1" />
      <div className="auth-blur-driver-2" />

      <div className="auth-content-layer">
        <div className="auth-card">
          <div className="auth-header">
            <div className="driver-badge">
              <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/></svg>
              Driver Portal
            </div>
            <h1>Create Account</h1>
            <p>Register to start accepting rides</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="driver@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vehicleType">Vehicle Type</label>
              <input
                type="text"
                id="vehicleType"
                name="vehicleType"
                required
                value={formData.vehicleType}
                onChange={handleChange}
                placeholder="e.g. Toyota Innova"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="licensePlate">License Plate</label>
              <input
                type="text"
                id="licensePlate"
                name="licensePlate"
                required
                value={formData.licensePlate}
                onChange={handleChange}
                placeholder="e.g. PB 10 AB 1234"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
