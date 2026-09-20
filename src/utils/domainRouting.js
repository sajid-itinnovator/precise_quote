/**
 * Domain & Subdomain Routing Utility
 * Handles dynamic routing for:
 * 1. Platform Super Admin (super-admin.* or precisequote-superadmin.*)
 * 2. Multi-Tenant Subdomains (e.g. vistarainteriors.* or <tenant>.*)
 */

export function getDomainContext() {
  const hostname = window.location.hostname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const explicitTenant = searchParams.get('tenant') || searchParams.get('tenantId');
  const explicitSuperAdmin = searchParams.get('superadmin') === 'true' || searchParams.get('admin_mode') === 'super';

  // 1. Detect Super Admin Host
  // Matches:
  // - super-admin.precisequote.web.app
  // - super-admin.precisequote.com / super-admin.precisequote.in
  // - superadmin.precisequote.com
  // - precisequote-superadmin.web.app (Firebase Hosting dedicated site)
  // - super-admin.localhost / superadmin.localhost
  const isSuperAdminHost = 
    explicitSuperAdmin ||
    hostname.startsWith('super-admin.') ||
    hostname.startsWith('superadmin.') ||
    hostname.includes('precisequote-superadmin') ||
    hostname.includes('super-admin-precisequote');

  // 2. Detect Tenant Subdomain
  let tenantSubdomain = null;

  if (!isSuperAdminHost) {
    if (explicitTenant) {
      tenantSubdomain = explicitTenant.toLowerCase().trim();
    } else if (hostname.includes('.precisequote.')) {
      // e.g. "vistarainteriors.precisequote.com" or "vistarainteriors.precisequote.web.app"
      const prefix = hostname.split('.precisequote.')[0];
      if (prefix && prefix !== 'www' && prefix !== 'app' && prefix !== 'super-admin' && prefix !== 'superadmin') {
        tenantSubdomain = prefix;
      }
    } else if (hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')) {
      // Firebase Hosting site names
      const site = hostname.split('.')[0];
      if (site !== 'precisequote' && !site.includes('superadmin')) {
        tenantSubdomain = site; // e.g. "vistara-interiors"
      }
    } else if (hostname.endsWith('.localhost')) {
      // Local dev subdomain: e.g. vistarainteriors.localhost
      const parts = hostname.split('.');
      if (parts.length > 1 && parts[0] !== 'super-admin' && parts[0] !== 'superadmin') {
        tenantSubdomain = parts[0];
      }
    }
  }

  return {
    hostname,
    isSuperAdminHost,
    tenantSubdomain,
    cleanTenantSlug: tenantSubdomain ? tenantSubdomain.replace(/[^a-z0-9]/g, '') : null
  };
}
