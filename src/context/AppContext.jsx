/* eslint-disable react-refresh/only-export-components -- context modules export the useApp hook alongside the provider by convention */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, setDoc, query, where, increment, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthContext';
import { getDomainContext } from '../utils/domainRouting';
import { createTenantCrud } from '../utils/tenantCrud';
import { deriveSubscription, defaultTrialSubscription } from '../utils/subscription';
import {
  ROOMS_DEFAULT, MATERIAL_SPEC_DEFAULT, calculateNextQuoteNo,
  DEFAULT_PAYMENT_TERMS, PAYMENT_TERMS_PRESETS, BRAND_COLOR_PRESETS,
  VISTARA_SAMPLE_PROFILE, DEFAULT_COMPANY_PROFILE,
} from '../constants/defaults';
import {
  SAMPLE_CLIENTS, SAMPLE_PROJECTS, SAMPLE_QUOTATIONS, SAMPLE_PRODUCTS,
} from '../constants/sampleData';

const AppContext = createContext(null);

// Increment this version whenever default data changes — forces a localStorage reset
const DATA_VERSION = 'v3_bathroom_civil';

function loadFromStorage(key, fallback) {
  // Version check: wipe stale data if version mismatch
  const storedVersion = localStorage.getItem('vi_data_version');
  if (storedVersion !== DATA_VERSION) {
    Object.keys(localStorage).filter(k => k.startsWith('vi_')).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('vi_data_version', DATA_VERSION);
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export { loadFromStorage };

export function AppProvider({ children }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [products, setProducts] = useState([]);
  const [materialSpec, setMaterialSpec] = useState(MATERIAL_SPEC_DEFAULT);
  const [nextQuoteNo, setNextQuoteNo] = useState(1290);
  const [tenantLogo, setTenantLogo] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(DEFAULT_COMPANY_PROFILE);
  const [subscription, setSubscription] = useState(defaultTrialSubscription());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Ref tracks the true attempt count — retryLoad bumps it synchronously so
  // an in-flight load from the previous attempt always sees itself as stale.
  const loadAttemptRef = useRef(0);

  // One CRUD triple per entity, all delegating to the shared factory.
  const getActor = () => ({ uid: currentUser?.uid, tenantId: userProfile?.tenantId });
  const clientsCrud = createTenantCrud('clients', setClients, getActor);
  const projectsCrud = createTenantCrud('projects', setProjects, getActor);
  const productsCrud = createTenantCrud('products', setProducts, getActor);

  // Quotations need extra behavior (number assignment + credit burn) on add.
  const quotationsCrud = createTenantCrud('quotations', setQuotations, getActor);

  // Load from Firebase — this effect owns the loading flag across the async tenant seed/load
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (authLoading || !currentUser || !userProfile) {
      if (!authLoading && !currentUser) setLoading(false);
      return;
    }

    const loadData = async () => {
      // Staleness guard: this async load must only apply state for the
      // identity it started under — a mid-flight sign-out/sign-in switch
      // (the intermittent 'Missing or insufficient permissions' source)
      // would otherwise write another session's data into this one.
      const uidAtStart = currentUser.uid;
      const attempt = loadAttemptRef.current;
      const isStale = () => auth.currentUser?.uid !== uidAtStart || attempt !== loadAttemptRef.current;

      // Per-section loading: one denied/failing query must not blank the
      // whole dashboard. Collect failures, render what loaded, surface the
      // rest honestly with a retry.
      const results = {};
      const failures = [];
      const loadSection = async (name, fn) => {
        try { results[name] = await fn(); }
        catch (err) { failures.push({ name, code: err.code || 'unknown', message: err.message }); }
      };

      const isPrivate = userProfile.dataAccess === 'private';
      const tenantId = userProfile.tenantId;

      try {
        if (!tenantId) {
          console.error("User profile has no tenantId! Cannot load data.");
          setLoading(false);
          return;
        }

        const isVistara = (userProfile.companyName && userProfile.companyName.toLowerCase().includes('vistara')) ||
                          (userProfile.tenantName && userProfile.tenantName.toLowerCase().includes('vistara')) ||
                          (tenantId && tenantId.toLowerCase().includes('vistara'));

        const initialBaseProfile = isVistara ? VISTARA_SAMPLE_PROFILE : {
          ...DEFAULT_COMPANY_PROFILE,
          companyName: userProfile.tenantName || userProfile.companyName || '',
        };

        const fetchTenantCollection = async (name) => {
          const snap = await getDocs(query(collection(db, name), where('tenantId', '==', tenantId)));
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        };

        // ── Clients first — their emptiness decides whether to seed ──
        let loadedClients = null;
        await loadSection('clients', async () => {
          loadedClients = (await getDocs(query(collection(db, 'clients'), where('tenantId', '==', tenantId)))).docs.map(d => ({ id: d.id, ...d.data() }));
          if (isPrivate) loadedClients = loadedClients.filter(c => c.createdBy === uidAtStart);
        });

        // Seed ONLY on a verified-empty read. A denied read (null) must never
        // trigger seeding, or a later successful read would duplicate data.
        const needsSeed = loadedClients !== null && loadedClients.length === 0 && !isPrivate;

        if (needsSeed) {
          await loadSection('seed', async () => {
            await setDoc(doc(db, 'config', `${tenantId}_materialSpec`), { data: MATERIAL_SPEC_DEFAULT, tenantId });
            await setDoc(doc(db, 'config', `${tenantId}_nextQuoteNo`), { value: 1290, tenantId });
            await setDoc(doc(db, 'config', `${tenantId}_tenantLogo`), { data: null, tenantId });
            await setDoc(doc(db, 'config', `${tenantId}_companyProfile`), { data: initialBaseProfile, tenantId });
            setCompanyProfile(initialBaseProfile);

            const initialSpent = isVistara ? SAMPLE_QUOTATIONS.length : 0;
            const trialSub = defaultTrialSubscription(initialSpent);
            await setDoc(doc(db, 'config', `${tenantId}_subscription`), { ...trialSub, tenantId });
            setSubscription(trialSub);

            for (const pr of SAMPLE_PRODUCTS) await setDoc(doc(db, 'products', `${tenantId}_${pr.id}`), { ...pr, tenantId });
            setProducts(SAMPLE_PRODUCTS.map(pr => ({ ...pr, id: `${tenantId}_${pr.id}`, tenantId })));

            // Only seed Vistara demo clients/projects for Vistara accounts
            if (isVistara) {
              for (const c of SAMPLE_CLIENTS) await setDoc(doc(db, 'clients', `${tenantId}_${c.id}`), { ...c, tenantId, createdBy: uidAtStart });
              for (const p of SAMPLE_PROJECTS) await setDoc(doc(db, 'projects', `${tenantId}_${p.id}`), { ...p, clientId: `${tenantId}_${p.clientId}`, tenantId, createdBy: uidAtStart });
              for (const q of SAMPLE_QUOTATIONS) await setDoc(doc(db, 'quotations', `${tenantId}_${q.id}`), { ...q, clientId: `${tenantId}_${q.clientId}`, tenantId, createdBy: uidAtStart });

              setClients(SAMPLE_CLIENTS.map(c => ({ ...c, id: `${tenantId}_${c.id}`, tenantId })));
              setProjects(SAMPLE_PROJECTS.map(p => ({ ...p, id: `${tenantId}_${p.id}`, clientId: `${tenantId}_${p.clientId}`, tenantId })));
              setQuotations(SAMPLE_QUOTATIONS.map(q => ({ ...q, id: `${tenantId}_${q.id}`, clientId: `${tenantId}_${q.clientId}`, tenantId })));
            } else {
              setClients([]);
              setProjects([]);
              setQuotations([]);
            }
          });
        } else if (loadedClients !== null) {
          if (!isStale()) setClients(loadedClients);

          await loadSection('projects', async () => {
            let loadedProjects = await fetchTenantCollection('projects');
            if (isPrivate) loadedProjects = loadedProjects.filter(p => p.createdBy === uidAtStart);
            if (!isStale()) setProjects(loadedProjects);
          });

          let loadedQuotes = null;
          await loadSection('quotations', async () => {
            loadedQuotes = await fetchTenantCollection('quotations');
            if (isPrivate) loadedQuotes = loadedQuotes.filter(q => q.createdBy === uidAtStart);
            if (!isStale()) setQuotations(loadedQuotes);
          });

          await loadSection('products', async () => {
            const loadedProducts = await fetchTenantCollection('products');
            if (!isStale()) setProducts(loadedProducts);
          });

          await loadSection('config', async () => {
            let savedNextNo = null;
            let savedProfile = null;
            const specSnap = await getDocs(query(collection(db, 'config'), where('tenantId', '==', tenantId)));
            specSnap.docs.forEach(d => {
              if (d.id.includes('materialSpec')) setMaterialSpec(d.data().data);
              if (d.id.includes('nextQuoteNo')) savedNextNo = d.data().value;
              if (d.id.includes('tenantLogo')) {
                setTenantLogo(d.data().data);
              }
              if (d.id.includes('companyProfile')) {
                savedProfile = d.data().data;
              }
              if (d.id.includes('subscription')) {
                setSubscription(deriveSubscription(d.data(), { docSpent: (loadedQuotes || []).length }));
              }
            });

            const resolvedProfile = savedProfile
              ? { ...initialBaseProfile, ...savedProfile }
              : initialBaseProfile;
            if (!isStale()) {
              setCompanyProfile(resolvedProfile);
              if (resolvedProfile.logo) {
                setTenantLogo(resolvedProfile.logo);
              }
              setNextQuoteNo(calculateNextQuoteNo(loadedQuotes || [], savedNextNo || 1290));
            }
          });
        }

        if (isStale()) return; // a dead session owns neither state nor flags

        if (failures.length) {
          console.error('Tenant data load: some sections failed:', failures);
          setLoadError({
            sections: failures.map(f => f.name),
            code: failures[0].code,
            message: failures[0].message,
          });
        } else {
          setLoadError(null);
        }
      } finally {
        if (!isStale()) setLoading(false);
      }
    };
    loadData();
  }, [currentUser, userProfile, authLoading, loadAttempt]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Sync materialSpec and nextQuoteNo to Firebase when they change
  useEffect(() => {
    if (loading || !userProfile?.tenantId) return;
    const saveSpec = async () => {
      try { await setDoc(doc(db, 'config', `${userProfile.tenantId}_materialSpec`), { data: materialSpec, tenantId: userProfile.tenantId }); }
      catch (e) { console.error("Error saving material specs", e); }
    };
    saveSpec();
  }, [materialSpec, loading, userProfile]);

  // NOTE: the nextQuoteNo counter doc is owned exclusively by the
  // transaction in addQuotation — never mirror it back from local state,
  // or one device could regress another device's advance.

  // Dynamic White Label Theme Injection
  useEffect(() => {
    const domain = getDomainContext();
    const isVistaraDomain = domain.tenantSubdomain && domain.tenantSubdomain.includes('vistara');

    const effectiveProfile = companyProfile || (isVistaraDomain ? VISTARA_SAMPLE_PROFILE : DEFAULT_COMPANY_PROFILE);

    const primary = effectiveProfile?.brandColor || '#1a56ff';
    const dark = effectiveProfile?.brandColorDark || '#1240cc';
    const light = effectiveProfile?.brandColorLight || '#e8eeff';

    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-dark', dark);
    document.documentElement.style.setProperty('--primary-light', light);

    const cleanHex = primary.replace('#', '').trim();
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
      }
    }

    const tenantBrand = effectiveProfile?.companyName || userProfile?.tenantName || (isVistaraDomain ? "VISTARA INTERIOR'S" : '');
    if (tenantBrand && tenantBrand.trim()) {
      const customSubtitle = effectiveProfile?.workspaceSubtitle || 'Quotation & Estimation Studio';
      document.title = `${tenantBrand} – ${customSubtitle}`;
    }
  }, [companyProfile, userProfile]);

  useEffect(() => {
    if (loading || !userProfile?.tenantId || tenantLogo === null) return;
    const saveLogo = async () => {
      try { await setDoc(doc(db, 'config', `${userProfile.tenantId}_tenantLogo`), { data: tenantLogo, tenantId: userProfile.tenantId }); }
      catch (e) { console.error("Error saving tenant logo", e); }
    };
    saveLogo();
  }, [tenantLogo, loading, userProfile]);

  const addClient = clientsCrud.add;
  const updateClient = clientsCrud.update;
  const deleteClient = clientsCrud.remove;
  const addProject = projectsCrud.add;
  const updateProject = projectsCrud.update;
  const deleteProject = projectsCrud.remove;
  const addProduct = productsCrud.add;
  const updateProduct = productsCrud.update;
  const deleteProduct = productsCrud.remove;
  const updateQuotation = quotationsCrud.update;
  const deleteQuotation = quotationsCrud.remove;

  const addQuotation = async (quotation) => {
    if (subscription.plan === 'trial') {
      if (new Date() > new Date(subscription.trialEndsAt)) {
        throw new Error('SUBSCRIPTION_LIMIT_REACHED');
      }
    } else if (subscription.plan !== 'enterprise' && subscription.plan !== 'pro') {
      if (subscription.quoteLimit && quotations.length >= subscription.quoteLimit) {
        throw new Error('SUBSCRIPTION_LIMIT_REACHED');
      }
    }

    // The invoice number is assigned HERE, once, at save time. The tenant's
    // counter doc is mutated inside a Firestore transaction, so concurrent
    // saves (two tabs, two staff members) can never mint the same number.
    // historyFloor protects hand-seeded invoices (e.g. a manual #1240 below
    // the counter) and self-heals a missing counter doc; the transaction is
    // the authority when both exist.
    const counterRef = doc(db, 'config', `${userProfile.tenantId}_nextQuoteNo`);
    const historyFloor = calculateNextQuoteNo(quotations, nextQuoteNo);
    const assignedNo = await runTransaction(db, async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const savedVal = counterSnap.exists() ? parseInt(counterSnap.data().value, 10) : NaN;
      const next = Math.max(historyFloor, isNaN(savedVal) ? 0 : savedVal);
      tx.set(counterRef, { value: next + 1, tenantId: userProfile.tenantId });
      return String(next);
    });

    const nowIso = new Date().toISOString();
    const qWithDetails = {
      ...quotation,
      quotationNo: assignedNo,
      status: quotation.status || 'DRAFT',
      date: quotation.date || nowIso.slice(0, 10),
      createdAt: quotation.createdAt || nowIso,
      createdByName: userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Staff',
    };
    // Stamp ownership + tenant through the shared factory path.
    const docId = await quotationsCrud.add(qWithDetails);

    // Update credit consumption. The server write is an atomic increment so
    // rapid successive saves can never deduct from a stale base; the local
    // state update recomputes balance via deriveSubscription.
    try {
      const currentSpent = subscription.spentCredits !== undefined ? subscription.spentCredits : quotations.length;
      const currentTotal = subscription.totalCredits !== undefined ? subscription.totalCredits : 50;
      const updatedSub = deriveSubscription({
        ...subscription,
        spentCredits: currentSpent + 1,
        totalCredits: currentTotal,
      });
      setSubscription(updatedSub);
      // Firestore rejects undefined fields (deriveSubscription leaves quoteLimit/
      // activeUntil undefined on trial plans), so persist only the defined subset.
      const subDoc = Object.fromEntries(
        Object.entries(updatedSub).filter(([, v]) => v !== undefined)
      );
      await setDoc(doc(db, 'config', `${userProfile.tenantId}_subscription`), {
        ...subDoc,
        spentCredits: increment(1),
        tenantId: userProfile.tenantId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (credErr) {
      console.warn("Could not sync credit deduction:", credErr);
    }

    setNextQuoteNo(parseInt(assignedNo, 10) + 1);
    return docId;
  };

  const updateMaterialSpec = (spec) => setMaterialSpec(spec);

  const updateCompanyProfile = async (profileData) => {
    if (!userProfile?.tenantId) return false;
    try {
      const updated = { ...profileData, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'config', `${userProfile.tenantId}_companyProfile`), {
        data: updated,
        tenantId: userProfile.tenantId
      });
      setCompanyProfile(updated);
      if (updated.logo !== undefined) {
        setTenantLogo(updated.logo);
        await setDoc(doc(db, 'config', `${userProfile.tenantId}_tenantLogo`), { data: updated.logo, tenantId: userProfile.tenantId });
      }
      return true;
    } catch (err) {
      console.error("Error saving company profile:", err);
      throw err;
    }
  };

  const value = {
    clients, projects, quotations, products, materialSpec, nextQuoteNo, tenantLogo, setTenantLogo,
    companyProfile, updateCompanyProfile,
    subscription, loading, loadError, retryLoad: () => { loadAttemptRef.current += 1; setLoadAttempt(a => a + 1); },
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addQuotation, updateQuotation, deleteQuotation,
    addProduct, updateProduct, deleteProduct,
    updateMaterialSpec,
    calculateNextQuoteNo,
    ROOMS_DEFAULT,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
