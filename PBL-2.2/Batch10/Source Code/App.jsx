import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  
  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Data State
  const [leads, setLeads] = useState([]);
  
  // --- NEW FORM FIELDS ---
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    turnover: '',
    employees: '',
    expenditure: '',
    type: 'Tech Startup' // Default value
  });

  // Handle Auth (Login/Register)
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    try {
      const res = await axios.post(`http://localhost:3000${endpoint}`, { username, password });
      if (isRegistering) {
        alert("Success! Please login.");
        setIsRegistering(false);
      } else {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
      }
    } catch (err) { alert(err.response?.data?.message || "Error"); }
  };

  // Handle Logout
  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setLeads([]);
  };

  // Handle Input Change (One function for all inputs)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fetch Leads
  useEffect(() => {
    if (token) {
      axios.get('http://localhost:3000/api/leads', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setLeads(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  // Add Lead
  const addLead = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/leads', 
        formData, // Send all the new fields automatically
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads([...leads, res.data.lead]);
      // Reset form but keep the dropdown default
      setFormData({ name: '', company: '', turnover: '', employees: '', expenditure: '', type: 'Tech Startup' });
    } catch(err) { alert("Failed to add lead"); }
  };

  const deleteLead = async (id) => {
    await axios.delete(`http://localhost:3000/api/leads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setLeads(leads.filter(l => l.id !== id));
  };

  // --- VIEW: AUTH ---
  if (!token) return (
    <div className="auth-container">
      <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
      <form onSubmit={handleAuth}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{marginBottom: '10px'}} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{marginBottom: '20px'}} />
        <button className="btn-primary">{isRegistering ? "Sign Up" : "Login"}</button>
      </form>
      <p style={{marginTop: '20px'}}>
        {isRegistering ? "Has account? " : "No account? "}
        <span className="link" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Login" : "Register"}
        </span>
      </p>
    </div>
  );

  // --- VIEW: DASHBOARD ---
  return (
    <div className="dashboard-container">
      <header>
        <h1>🚀 Businesses Lead Manager</h1>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </header>

      {/* NEW FORM WITH GRID LAYOUT */}
      <div className="card">
        <h3>Add New Company</h3>
        <form onSubmit={addLead} className="form-grid">
          
          <input name="name" placeholder="Client Name (e.g. Elon)" value={formData.name} onChange={handleChange} required />
          <input name="company" placeholder="Company Name" value={formData.company} onChange={handleChange} required />
          
          <input name="turnover" placeholder="Annual Turnover (e.g. $5M)" value={formData.turnover} onChange={handleChange} />
          <input name="employees" placeholder="No. of Employees" type="number" value={formData.employees} onChange={handleChange} />
          
          <input name="expenditure" placeholder="Net Expenditure" value={formData.expenditure} onChange={handleChange} />
          
          <select name="type" value={formData.type} onChange={handleChange}>
             <option>Tech Startup</option>
             <option>Enterprise</option>
             <option>SME</option>
             <option>Government</option>
          </select>

          <button className="btn-primary full-width">Add to Pipeline</button>
        </form>
      </div>

      {/* LIST WITH DETAILS */}
      <div>
        {leads.map(l => (
          <div key={l.id} className="lead-item">
            <div className="lead-details">
              <strong>
                {l.company} 
                <span className="lead-badge">{l.type}</span>
              </strong>
              <div className="lead-meta">
                👤 POC: {l.name} <br/>
                💰 Turnover: {l.turnover || 'N/A'} | 💸 Spend: {l.expenditure || 'N/A'} <br/>
                👥 Team Size: {l.employees || '0'}
              </div>
            </div>
            <button onClick={() => deleteLead(l.id)} className="btn-danger">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default App