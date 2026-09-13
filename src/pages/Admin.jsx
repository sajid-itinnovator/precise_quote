import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Admin() {
  const { currentUser, userProfile } = useAuth();
  const { tenantLogo, setTenantLogo, subscription, quotations } = useApp();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [dataAccess, setDataAccess] = useState('private');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('tenantId', '==', userProfile.tenantId));
      const snap = await getDocs(q);
      setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // 1. Create user in Firebase Auth using the Secondary App
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      
      // 2. Add profile to Firestore
      const newUser = {
        name,
        email,
        role,
        dataAccess: role === 'admin' ? 'shared' : dataAccess, // Admins always share
        tenantId: userProfile.tenantId,
        tenantName: userProfile.tenantName,
        createdAt: new Date().toISOString(),
        createdByAdmin: currentUser.uid
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      // 3. Sign out the secondary auth so it's clean
      await secondaryAuth.signOut();
      
      // 4. Update UI
      setSuccess('User created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      setDataAccess('private');
      
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (uid === currentUser.uid) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (window.confirm("Delete this user profile from the database? (Note: This does not delete the Firebase Auth record, only the profile)")) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert("Failed to delete user profile.");
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
      alert("Logo image is too large. Please upload an image smaller than 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTenantLogo(reader.result);
      alert("Logo updated successfully! Changes will appear across the app.");
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>User Management</h2>
      </div>

      <div className="row">
        {/* CREATE USER FORM */}
        <div className="col-md-5">
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 20 }}>Create New User</h4>
            
            {error && <div className="alert alert-danger" style={{ padding: 10, fontSize: '0.9rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ padding: 10, fontSize: '0.9rem' }}>{success}</div>}
            
            <form onSubmit={handleCreateUser}>
              <div className="form-group mb-3">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Temporary Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Role</label>
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === 'user' && (
                <div className="form-group mb-4">
                  <label className="form-label">Data Privacy Access</label>
                  <select className="form-select" value={dataAccess} onChange={(e) => setDataAccess(e.target.value)}>
                    <option value="private">Private Workspace (Can only see their own clients & quotes)</option>
                    <option value="shared">Shared Workspace (Can see entire company database)</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        {/* USERS LIST & SETTINGS */}
        <div className="col-md-7">
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 15 }}>Company Settings</h4>
            
            {/* SUBSCRIPTION WIDGET */}
            {subscription && (
              <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--secondary)' }}>Subscription Plan</h5>
                  <span style={{ background: (subscription.plan === 'free' || subscription.plan === 'trial') ? '#e0e0e0' : 'var(--primary)', color: (subscription.plan === 'free' || subscription.plan === 'trial') ? '#333' : '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {subscription.plan} TIER
                  </span>
                </div>
                
                {subscription.plan === 'trial' ? (
                  <>
                    <div style={{ marginBottom: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Days left in trial: <strong>{Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))}</strong> / 30
                    </div>
                    <div style={{ height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ height: '100%', width: `${Math.min((Math.max(0, 30 - Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))) / 30) * 100, 100)}%`, background: new Date() > new Date(subscription.trialEndsAt) ? '#dc3545' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Quotations Used: <strong>{quotations.length}</strong> / {subscription.plan === 'enterprise' || subscription.plan === 'pro' ? 'Unlimited' : subscription.quoteLimit}
                  </div>
                )}
                
                {subscription.plan !== 'enterprise' && subscription.plan !== 'pro' && subscription.plan !== 'trial' && (
                  <div style={{ height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', width: `${Math.min((quotations.length / subscription.quoteLimit) * 100, 100)}%`, background: quotations.length >= subscription.quoteLimit ? '#dc3545' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                  </div>
                )}
                
                {subscription.plan !== 'enterprise' && subscription.plan !== 'pro' && (
                  <button className="btn btn-outline-primary w-100" onClick={() => alert("Redirecting to Stripe Billing... (Mock)")}>
                    Upgrade to Pro (₹699/mo)
                  </button>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Custom Company Logo</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Upload your company logo to display in the sidebar and on PDF Quotations. (Max 500KB, PNG or JPG)
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 10 }}>
                {tenantLogo ? (
                  <img src={tenantLogo} alt="Tenant Logo" style={{ height: 60, width: 60, objectFit: 'contain', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 6, padding: 4 }} />
                ) : (
                  <div style={{ height: 60, width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: 6, fontSize: '0.7rem', color: '#888', textAlign: 'center' }}>
                    No Logo
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={handleLogoUpload}
                  className="form-control"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 20 }}>Registered Users</h4>
            
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Access Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge bg-${u.role === 'admin' ? 'danger' : 'primary'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {u.dataAccess === 'shared' ? 'Shared DB' : 'Private Only'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === currentUser.uid}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr><td colSpan="5" className="text-center">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
