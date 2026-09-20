import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, LogOut, ShieldCheck, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import MediaUploadField from '../components/MediaUploadField';
import { DEFAULT_PAYMENT_TERMS, PAYMENT_TERMS_PRESETS, BRAND_COLOR_PRESETS } from '../constants/defaults';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Palette } from 'lucide-react';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { companyProfile, updateCompanyProfile } = useApp();
  const { currentUser, userProfile, logout } = useAuth();

  // Local form state initialized with context companyProfile
  const [formData, setFormData] = useState({
    companyName: companyProfile?.companyName || userProfile?.tenantName || '',
    tagline: companyProfile?.tagline || '',
    officeAddress: companyProfile?.officeAddress || '',
    phone: companyProfile?.phone || '',
    email: companyProfile?.email || '',
    website: companyProfile?.website || '',
    gstNumber: companyProfile?.gstNumber || '',
    logo: companyProfile?.logo || null,
    signature: companyProfile?.signature || null,
    stamp: companyProfile?.stamp || null,
    brandColor: companyProfile?.brandColor || '#1a56ff',
    brandColorDark: companyProfile?.brandColorDark || '#1240cc',
    brandColorLight: companyProfile?.brandColorLight || '#e8eeff',
    workspaceSubtitle: companyProfile?.workspaceSubtitle || 'Interior Studio',
    hidePlatformAttribution: companyProfile?.hidePlatformAttribution !== undefined ? companyProfile.hidePlatformAttribution : true,
    showBottomLogo: companyProfile?.showBottomLogo !== undefined ? companyProfile.showBottomLogo : true,
    bottomLogo: companyProfile?.bottomLogo || null,
    paymentTerms: companyProfile?.paymentTerms || DEFAULT_PAYMENT_TERMS,
    bankDetails: {
      accountHolderName: companyProfile?.bankDetails?.accountHolderName || '',
      bankName: companyProfile?.bankDetails?.bankName || '',
      branchName: companyProfile?.bankDetails?.branchName || '',
      accountNumber: companyProfile?.bankDetails?.accountNumber || '',
      ifscCode: companyProfile?.bankDetails?.ifscCode || '',
      swiftCode: companyProfile?.bankDetails?.swiftCode || '',
    },
    upiId: companyProfile?.upiId || '',
    qrCode: companyProfile?.qrCode || null,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync if companyProfile changes in context — form mirrors context; user edits go the other way on save
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (companyProfile) {
      setFormData(prev => ({
        ...prev,
        companyName: companyProfile.companyName || userProfile?.tenantName || prev.companyName,
        tagline: companyProfile.tagline ?? prev.tagline,
        officeAddress: companyProfile.officeAddress ?? prev.officeAddress,
        phone: companyProfile.phone ?? prev.phone,
        email: companyProfile.email ?? prev.email,
        website: companyProfile.website ?? prev.website,
        gstNumber: companyProfile.gstNumber ?? prev.gstNumber,
        logo: companyProfile.logo ?? prev.logo,
        signature: companyProfile.signature ?? prev.signature,
        stamp: companyProfile.stamp ?? prev.stamp,
        brandColor: companyProfile.brandColor ?? prev.brandColor ?? '#1a56ff',
        brandColorDark: companyProfile.brandColorDark ?? prev.brandColorDark ?? '#1240cc',
        brandColorLight: companyProfile.brandColorLight ?? prev.brandColorLight ?? '#e8eeff',
        workspaceSubtitle: companyProfile.workspaceSubtitle ?? prev.workspaceSubtitle ?? 'Interior Studio',
        hidePlatformAttribution: companyProfile.hidePlatformAttribution !== undefined ? companyProfile.hidePlatformAttribution : (prev.hidePlatformAttribution !== undefined ? prev.hidePlatformAttribution : true),
        showBottomLogo: companyProfile.showBottomLogo !== undefined ? companyProfile.showBottomLogo : (prev.showBottomLogo !== undefined ? prev.showBottomLogo : true),
        bottomLogo: companyProfile.bottomLogo ?? prev.bottomLogo,
        paymentTerms: companyProfile.paymentTerms ?? prev.paymentTerms ?? DEFAULT_PAYMENT_TERMS,
        bankDetails: {
          accountHolderName: companyProfile.bankDetails?.accountHolderName ?? prev.bankDetails.accountHolderName,
          bankName: companyProfile.bankDetails?.bankName ?? prev.bankDetails.bankName,
          branchName: companyProfile.bankDetails?.branchName ?? prev.bankDetails.branchName,
          accountNumber: companyProfile.bankDetails?.accountNumber ?? prev.bankDetails.accountNumber,
          ifscCode: companyProfile.bankDetails?.ifscCode ?? prev.bankDetails.ifscCode,
          swiftCode: companyProfile.bankDetails?.swiftCode ?? prev.bankDetails.swiftCode,
        },
        upiId: companyProfile.upiId ?? prev.upiId,
        qrCode: companyProfile.qrCode ?? prev.qrCode,
      }));
    }
  }, [companyProfile, userProfile]);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleBankChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: val,
      },
    }));
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error('Image is too large. Please select an image smaller than 800KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, [field]: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await updateCompanyProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Save profile error:", err);
      setErrorMsg(err.message || 'Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7fd', paddingBottom: 60 }}>
      {/* Header bar matching screenshot */}
      <div style={{
        background: '#f4effa',
        borderBottom: '1px solid #e7ddf3',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3e2468',
          }}
          title="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#3e2468',
          letterSpacing: '0.2px',
        }}>
          Company Profile
        </h1>
      </div>

      {/* Main Form Container */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        {/* Toast / Notification */}
        {saveSuccess && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
          }}>
            <Check size={18} color="#10b981" />
            Company profile updated and saved to cloud!
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            fontSize: '0.9rem',
          }}>
            <AlertCircle size={18} color="#ef4444" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Company Name */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={e => handleInputChange('companyName', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Tagline */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tagline"
              value={formData.tagline}
              onChange={e => handleInputChange('tagline', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Office Address (multiline) */}
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              placeholder="Office Address"
              value={formData.officeAddress}
              onChange={e => handleInputChange('officeAddress', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Phone Numbers */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Phone Numbers"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Website */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Website"
              value={formData.website}
              onChange={e => handleInputChange('website', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* GST Number */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="GST Number"
              value={formData.gstNumber}
              onChange={e => handleInputChange('gstNumber', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* ─── White Label & Brand Theme Customization ─── */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #dcd5e7',
            borderRadius: 16,
            padding: '20px 18px',
            marginTop: 4,
            boxShadow: '0 2px 8px rgba(92, 71, 158, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#1d1b20',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Palette size={20} color="var(--primary)" />
                <span>White Label &amp; Studio Branding</span>
              </h2>
              <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: 'var(--primary)', padding: '3px 9px', borderRadius: 10, fontWeight: 700, border: '1px solid #bfdbfe' }}>
                CUSTOM BRANDING
              </span>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Completely brand the workspace under your studio identity. Your brand color, company name, and logo will be reflected across your entire interface, sidebar, navigation, and client PDF invoices.
            </p>

            {/* Studio/Workspace Subtitle */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                Studio / Workspace Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. Interior Studio, Architecture & Design, Turnkey Contractors"
                value={formData.workspaceSubtitle || ''}
                onChange={e => handleInputChange('workspaceSubtitle', e.target.value)}
                style={inputStyle}
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3, display: 'block' }}>
                Displayed below your company name in the sidebar and topbar.
              </span>
            </div>

            {/* Brand Color Theme Selection */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                Primary Brand Color Theme
              </label>
              
              {/* Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {BRAND_COLOR_PRESETS.map((preset, idx) => {
                  const isSelected = formData.brandColor?.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          brandColor: preset.hex,
                          brandColorDark: preset.dark,
                          brandColorLight: preset.light,
                        }));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: isSelected ? `2px solid ${preset.hex}` : '1px solid #e2e8f0',
                        background: isSelected ? preset.light : '#f8fafc',
                        color: isSelected ? preset.dark : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? `0 0 0 1px ${preset.hex}` : 'none'
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: preset.hex, display: 'inline-block', flexShrink: 0 }} />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Input and Color Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="color"
                    value={formData.brandColor || '#1a56ff'}
                    onChange={e => {
                      const hex = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        brandColor: hex,
                        brandColorDark: hex,
                        brandColorLight: '#f1f5f9',
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: -10,
                      width: 64,
                      height: 64,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <input
                    type="text"
                    placeholder="#1a56ff"
                    value={formData.brandColor || ''}
                    onChange={e => {
                      const hex = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        brandColor: hex,
                        brandColorDark: hex,
                        brandColorLight: '#f1f5f9',
                      }));
                    }}
                    style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }}
                  />
                </div>
                <div style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: formData.brandColor || '#1a56ff',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  Live Theme Preview
                </div>
              </div>
            </div>

            {/* Platform Attribution Toggle */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              marginTop: 4
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={formData.hidePlatformAttribution !== false}
                  onChange={e => handleInputChange('hidePlatformAttribution', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: formData.brandColor || '#1a56ff', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
                    100% White Label (Hide platform attribution)
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Removes all platform watermarks and badges so quotations and interfaces present solely as your studio product.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ─── Media & Brand Assets ─── */}
          {/* Logo */}
          <div style={{ marginTop: 4 }}>
            <MediaUploadField
              field="logo"
              src={formData.logo}
              label="Logo"
              alt="Company Logo"
              chooseLabel="Choose Logo"
              status={formData.logo ? <strong style={{ color: '#10b981' }}>Set</strong> : <span style={{ color: '#64748b' }}>not set</span>}
              onUpload={handleFileUpload}
              onRemove={handleRemoveMedia}
            />
          </div>

          {/* Signature */}
          <MediaUploadField
            field="signature"
            src={formData.signature}
            label="Signature"
            alt="Signature"
            chooseLabel="Choose Signature"
            status={formData.signature ? <strong style={{ color: '#10b981' }}>Set</strong> : <span style={{ color: '#64748b' }}>not set</span>}
            previewMaxHeight={50}
            onUpload={handleFileUpload}
            onRemove={handleRemoveMedia}
          />

          {/* Stamp */}
          <MediaUploadField
            field="stamp"
            src={formData.stamp}
            label="Stamp"
            alt="Stamp"
            chooseLabel="Choose Stamp"
            status={formData.stamp ? <strong style={{ color: '#10b981' }}>Set</strong> : <span style={{ color: '#64748b' }}>not set</span>}
            onUpload={handleFileUpload}
            onRemove={handleRemoveMedia}
          />

          {/* ─── Bottom Logo (Thank You Note & Signature) Option ─── */}
          <div style={{
            marginTop: 10,
            padding: '14px 16px',
            background: '#f6f1fc',
            borderRadius: 12,
            border: '1px solid #e3d7f2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#3e2468' }}>
                <input
                  type="checkbox"
                  checked={formData.showBottomLogo !== false}
                  onChange={e => handleInputChange('showBottomLogo', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#5c479e', cursor: 'pointer' }}
                />
                <span>Set Logo at Bottom of Invoice</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: '#5c479e', background: '#fff', padding: '2px 8px', borderRadius: 10, border: '1px solid #dcd1eb', fontWeight: 600 }}>
                Thank You &amp; Signature
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 10px 28px', lineHeight: 1.4 }}>
              Displays company logo at the bottom of quotation and invoice pages alongside the Thank You Note and Authorized Signatory.
            </p>

            {formData.showBottomLogo !== false && (
              <div style={{ marginLeft: 28 }}>
                <MediaUploadField
                  field="bottomLogo"
                  src={formData.bottomLogo}
                  label="Bottom Logo Source"
                  alt="Bottom Logo Preview"
                  removeLabel="Reset to Main Logo"
                  title="Reset to main logo"
                  chooseLabel="Choose Custom Bottom Logo (Optional)"
                  replaceLabel="Change Custom Bottom Logo"
                  status={formData.bottomLogo ? <strong style={{ color: '#10b981' }}>Custom Footer Logo</strong> : (formData.logo ? <strong style={{ color: '#5c479e' }}>Using Company Logo</strong> : <span style={{ color: '#dc2626' }}>No logo set yet</span>)}
                  previewMaxHeight={50}
                  previewStyle={{ maxHeight: 75, marginBottom: 8, background: '#fff' }}
                  buttonStyle={{ padding: '7px 18px', fontSize: '0.82rem' }}
                  onUpload={handleFileUpload}
                  onRemove={handleRemoveMedia}
                />
              </div>
            )}
          </div>

          {/* ─── Payment Details Card ─── */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dcd5e7',
            borderRadius: 16,
            padding: '20px 18px',
            marginTop: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#1d1b20',
            }}>
              Payment Details
            </h2>

            {/* Bank Details section */}
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#654b9d',
              marginTop: 4,
            }}>
              Bank Details
            </div>

            <input
              type="text"
              placeholder="Account Holder Name"
              value={formData.bankDetails.accountHolderName}
              onChange={e => handleBankChange('accountHolderName', e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Bank Name"
              value={formData.bankDetails.bankName}
              onChange={e => handleBankChange('bankName', e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Branch Name"
              value={formData.bankDetails.branchName}
              onChange={e => handleBankChange('branchName', e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Account Number"
              value={formData.bankDetails.accountNumber}
              onChange={e => handleBankChange('accountNumber', e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="IFSC Code"
              value={formData.bankDetails.ifscCode}
              onChange={e => handleBankChange('ifscCode', e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="SWIFT Code (Optional)"
              value={formData.bankDetails.swiftCode}
              onChange={e => handleBankChange('swiftCode', e.target.value)}
              style={inputStyle}
            />

            <hr style={{ border: 'none', borderTop: '1px solid #ece6f2', margin: '4px 0' }} />

            {/* UPI Details section */}
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#654b9d',
            }}>
              UPI Details
            </div>

            <input
              type="text"
              placeholder="UPI ID (Optional)"
              value={formData.upiId}
              onChange={e => handleInputChange('upiId', e.target.value)}
              style={inputStyle}
            />

            <hr style={{ border: 'none', borderTop: '1px solid #ece6f2', margin: '4px 0' }} />

            {/* QR Code section */}
            <MediaUploadField
              field="qrCode"
              src={formData.qrCode}
              label="QR Code"
              alt="Payment QR Code"
              chooseLabel="Upload QR Code"
              replaceLabel="Replace QR Code"
              status={null}
              previewMaxHeight={120}
              previewStyle={{ textAlign: 'center' }}
              buttonStyle={{ width: '100%', padding: '12px 20px', textAlign: 'center', justifyContent: 'center' }}
              onUpload={handleFileUpload}
              onRemove={handleRemoveMedia}
            />

            <hr style={{ border: 'none', borderTop: '1px solid #ece6f2', margin: '6px 0' }} />

            {/* Default Payment Terms & Schedule section */}
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#654b9d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Default Payment Terms &amp; Schedule</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 6px' }}>
              These milestone terms appear on the final invoice. Click a preset or edit manually:
            </p>

            {/* Preset chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {PAYMENT_TERMS_PRESETS.map((preset, idx) => {
                const isActive = formData.paymentTerms?.trim() === preset.terms.trim();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInputChange('paymentTerms', preset.terms)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.73rem',
                      borderRadius: 14,
                      border: isActive ? '1px solid #654b9d' : '1px solid #d4c2ea',
                      background: isActive ? '#654b9d' : '#f5f0fa',
                      color: isActive ? '#fff' : '#654b9d',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.15s'
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={5}
              placeholder="1. 10% Advance on booking...&#10;2. 40% on 3D approval..."
              value={formData.paymentTerms || ''}
              onChange={e => handleInputChange('paymentTerms', e.target.value)}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* ─── Save Button ─── */}
          <div style={{ marginTop: 14 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                background: saving ? '#8b79b8' : '#5c479e',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '14px 24px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(92, 71, 158, 0.3)',
                transition: 'background 0.2s, transform 0.1s',
              }}
              onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

        </form>

        {/* Account & Session Management */}
        <div style={{
          marginTop: 40,
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Account & Workspace Session
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Logged-in user credentials and workspace security
              </p>
            </div>
            <span style={{
              background: '#eff6ff',
              color: 'var(--primary)',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.74rem',
              fontWeight: 700,
              border: '1px solid #bfdbfe'
            }}>
              Active Session
            </span>
          </div>

          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Signed-In User</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{userProfile?.name || 'Administrator'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Account Email</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>{currentUser?.email || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Role / Permissions</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7', textTransform: 'capitalize' }}>{userProfile?.role || 'Admin'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Workspace ID</div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>{userProfile?.tenantId || 'Default'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to log out of this workspace?')) {
                  await logout();
                  navigate('/login');
                }
              }}
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                borderRadius: 10,
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 3px rgba(185, 28, 28, 0.1)'
              }}
            >
              <LogOut size={17} /> Log Out of Workspace
            </button>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              style={{
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <User size={17} /> Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable Styles ─────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 8,
  border: '1px solid #79747e',
  background: '#ffffff',
  fontSize: '0.95rem',
  color: '#1d1b20',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

