import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      // Navigate to verify email screen and pass the email
      setTimeout(() => navigate('/verify-email', { state: { email: formData.email } }), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Driver Registration</h2>
        
        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {successMsg && <div style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>{successMsg}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} />
          </div>
          
          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="e.g. 1234567890" />
          </div>

          <div className="input-group">
            <label>Vehicle Type</label>
            <input type="text" name="vehicleType" required value={formData.vehicleType} onChange={handleChange} placeholder="e.g. Toyota Prius" />
          </div>

          <div className="input-group">
            <label>License Plate</label>
            <input type="text" name="licensePlate" required value={formData.licensePlate} onChange={handleChange} placeholder="e.g. XYZ 1234" />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
