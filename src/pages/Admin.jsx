import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, formatDateTime } from '../utils/helpers';
import QuotationPreview from '../components/QuotationPreview';
import { Eye, FileText, Calendar, Search, Pencil, Copy, Building2 } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { tenantLogo, setTenantLogo, subscription, quotations } = useApp();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

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

  /* eslint-disable react-hooks/set-state-in-effect -- mount-load of user list; loading state lives here by design */
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    <div style={{ padding: '16px 12px', maxWidth: 1000, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: '1.4rem' }}>User &amp; Company Management</h2>
      </div>

      <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, margin: 0, width: '100%', maxWidth: '100%' }}>
        {/* CREATE USER FORM */}
        <div className="col-md-5" style={{ flex: '1 1 300px', minWidth: 0, padding: 0, maxWidth: '100%' }}>
          <div className="card" style={{ padding: '18px 16px', boxSizing: 'border-box', overflow: 'hidden' }}>
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
        <div className="col-md-7" style={{ flex: '1 1 340px', minWidth: 0, padding: 0, maxWidth: '100%' }}>
          <div className="card" style={{ padding: '18px 16px', marginBottom: 20, boxSizing: 'border-box', overflow: 'hidden' }}>
            <h4 style={{ marginBottom: 15 }}>Company Settings</h4>
            
            {/* SUBSCRIPTION WIDGET */}
            {subscription && (
              <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 20, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--secondary)' }}>Subscription Plan</h5>
                  <span style={{ background: (subscription.plan === 'free' || subscription.plan === 'trial') ? '#e0e0e0' : 'var(--primary)', color: (subscription.plan === 'free' || subscription.plan === 'trial') ? '#333' : '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {subscription.plan} TIER
                  </span>
                </div>
                
                {subscription.plan === 'trial' && (
                  <>
                    <div style={{ marginBottom: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Days left in trial: <strong>{Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))}</strong> / 30
                    </div>
                    <div style={{ height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ height: '100%', width: `${Math.min((Math.max(0, 30 - Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))) / 30) * 100, 100)}%`, background: new Date() > new Date(subscription.trialEndsAt) ? '#dc3545' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </>
                )}
                {/* SPENT & BALANCE CREDITS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, marginBottom: 14 }}>
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Spent Credits</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c2410c', marginTop: 2 }}>
                      {subscription.spentCredits !== undefined ? subscription.spentCredits : quotations.length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Quotes Generated</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Balance Credits</div>
                    <div style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: (subscription.balanceCredits !== undefined ? subscription.balanceCredits : Math.max(0, (subscription.totalCredits || 50) - quotations.length)) <= 5 ? '#dc2626' : '#16a34a',
                      marginTop: 2
                    }}>
                      {subscription.balanceCredits !== undefined ? subscription.balanceCredits : Math.max(0, (subscription.totalCredits || 50) - quotations.length)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Remaining Balance</div>
                  </div>
                </div>
                
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
                {tenantLogo ? (
                  <img src={tenantLogo} alt="Tenant Logo" style={{ height: 50, width: 50, objectFit: 'contain', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 6, padding: 4, flexShrink: 0 }} />
                ) : (
                  <div style={{ height: 50, width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: 6, fontSize: '0.7rem', color: '#888', textAlign: 'center', flexShrink: 0 }}>
                    No Logo
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={handleLogoUpload}
                  className="form-control"
                  style={{ flex: '1 1 140px', minWidth: 0, width: '100%', maxWidth: '100%', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light, #eee)', width: '100%' }}>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/company-profile')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  textAlign: 'center',
                  lineHeight: 1.35,
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
              >
                <Building2 size={16} style={{ flexShrink: 0 }} />
                <span>Manage Full Company Profile &amp; Banking</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 16px', boxSizing: 'border-box', overflow: 'hidden' }}>
            <h4 style={{ marginBottom: 20 }}>Registered Users</h4>
            
            <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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

      {/* ALL INVOICES & CREATION ACTIVITY LOG */}
      <div className="card" style={{ padding: '18px 16px', marginTop: 24, boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <h4 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', flexWrap: 'wrap' }}>
              <FileText size={20} color="var(--primary)" style={{ flexShrink: 0 }} /> <span>Company Invoices &amp; Activity Log</span>
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Complete audit trail of all quotations and invoices generated across the studio with exact creation dates and timestamps.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', minWidth: 0, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 0 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search invoices, clients..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                style={{ paddingLeft: 30, fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <span className="badge badge-info" style={{ padding: '6px 10px', fontSize: '0.78rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {(quotations || []).length} Total
            </span>
          </div>
        </div>

        <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created Date &amp; Time</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(quotations || [])
                .filter(q => {
                  const s = invoiceSearch.toLowerCase();
                  return (
                    (q.clientName || '').toLowerCase().includes(s) ||
                    (q.quotationNo || '').toLowerCase().includes(s) ||
                    (q.projectTitle || '').toLowerCase().includes(s) ||
                    (q.createdByName || '').toLowerCase().includes(s)
                  );
                })
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .map(q => {
                  const statusBadge = q.status === 'INVOICE CREATED'
                    ? 'badge-primary'
                    : q.status === 'APPROVED'
                      ? 'badge-success'
                      : q.status === 'PENDING'
                        ? 'badge-warning'
                        : 'badge-draft';

                  return (
                    <tr key={q.id}>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontSize: '0.88rem' }}>
                          #{q.quotationNo || 'QT'}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{q.clientName}</div>
                        {q.clientContact && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{q.clientContact}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{q.projectTitle || 'Interior Project'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {(q.rooms || []).length} Rooms • {q.totalSqft ? `${q.totalSqft} SQFT` : `${(q.rooms || []).reduce((s, r) => s + (r.items || []).length, 0)} Items`}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.92rem' }}>₹{formatIndianCurrency(q.total || 0)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                          {q.status || 'DRAFT'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          <Calendar size={13} color="var(--primary)" />
                          {formatDateTime(q.createdAt || q.date)}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {q.createdByName || 'Staff Member'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setPreviewQuotation(q)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: '0.78rem' }}
                          >
                            <Eye size={13} /> View
                          </button>
                          {q.status !== 'APPROVED' ? (
                            <button
                              className={`btn btn-sm ${q.status === 'DRAFT' ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => navigate(`/builder?edit=${q.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: '0.78rem', fontWeight: q.status === 'DRAFT' ? 700 : 500 }}
                              title={q.status === 'DRAFT' ? 'Edit this draft quotation in Builder' : 'Edit this invoice'}
                            >
                              <Pencil size={12} /> {q.status === 'DRAFT' ? 'Edit Draft' : 'Edit'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => navigate(`/builder?revise=${q.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: '0.78rem' }}
                              title="Approved quotation is locked. Click to create a new revision."
                            >
                              <Copy size={12} /> Revise
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {(!quotations || quotations.length === 0) && (
                <tr>
                  <td colSpan="8" className="text-center" style={{ padding: 24, color: 'var(--text-muted)' }}>
                    No invoices or quotations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal if opened from Admin */}
      {previewQuotation && (
        <QuotationPreview
          quotation={previewQuotation}
          onClose={() => setPreviewQuotation(null)}
        />
      )}
    </div>
  );
}
