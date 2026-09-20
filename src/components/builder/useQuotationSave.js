import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../Toast';

/**
 * Single owner of the quotation save orchestration: the ref-guarded duplicate
 * save protection, client auto-create/sync, subscription-limit handling, and
 * post-save navigation. The Builder owns the fields; this owns the save.
 */
export default function useQuotationSave({ editId, reviseId, existingQuote, getClient, fields }) {
  const { addQuotation, updateQuotation, addClient, updateClient, projects, updateProject } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const savingRef = useRef(false); // duplicate-save guard: ref reads synchronously, immune to stale closures

  const handleSave = async (saveStatus = 'DRAFT') => {
    if (savingRef.current) return; // in-flight: swallow double submits
    savingRef.current = true;
    setSaving(true);
    try {
      const isApproved = existingQuote?.status === 'APPROVED';
      if (editId && isApproved) {
        toast.info("This quotation is APPROVED and locked against direct edits. Please use 'Create Revision' to make changes.");
        return;
      }

      const { clientName, clientContact, clientAddress, clientId, setClientId, projectTitle, rooms, total, totalSqft, quoteMaterialSpec, showItemAmount } = fields;
      const client = getClient();
      const resolvedName = clientName.trim() || client?.name || 'Client';
      const resolvedContact = clientContact.trim() || client?.contact || '';
      const resolvedAddress = clientAddress.trim() || client?.address || '';
      // New saves: addQuotation assigns the real number (single owner of numbering)
      const resolvedQuoteNo = editId
        ? (existingQuote?.quotationNo || fields.quotationNo || '')
        : fields.quotationNo.trim();

      let effectiveClientId = clientId === '__new__' ? '' : clientId;

      // Auto-create client record if user entered a custom client name and no client was selected
      if (!effectiveClientId && resolvedName && resolvedName !== 'Client' && addClient) {
        try {
          const newCId = await addClient({
            name: resolvedName,
            contact: resolvedContact,
            address: resolvedAddress,
            email: ''
          });
          if (newCId) {
            effectiveClientId = newCId;
            setClientId(newCId);
          }
        } catch (cErr) {
          console.warn("Could not auto-create client record:", cErr);
        }
      } else if (effectiveClientId && updateClient) {
        // If client already exists, sync back any updated contact or address
        try {
          const currentC = getClient();
          if (currentC && ((resolvedContact && currentC.contact !== resolvedContact) || (resolvedAddress && currentC.address !== resolvedAddress))) {
            await updateClient(effectiveClientId, {
              contact: resolvedContact || currentC.contact || '',
              address: resolvedAddress || currentC.address || ''
            });
          }
        } catch (syncErr) {
          console.warn("Could not sync client details:", syncErr);
        }
      }

      const quoteData = {
        quotationNo: resolvedQuoteNo,
        clientId: effectiveClientId || '',
        clientName: resolvedName,
        clientContact: resolvedContact,
        clientAddress: resolvedAddress,
        projectTitle,
        rooms,
        total,
        totalSqft,
        materialSpec: quoteMaterialSpec,
        showItemAmount,
        status: saveStatus,
      };

      if (editId) {
        await updateQuotation(editId, quoteData);
        setSavedMessage(saveStatus === 'INVOICE CREATED' ? '✓ Invoice Updated & Finalized!' : '✓ Draft Updated Successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      } else {
        const newId = await addQuotation(quoteData);
        setSavedMessage(saveStatus === 'INVOICE CREATED' ? '✓ Invoice Created Successfully!' : '✓ Saved as Draft!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
        if (reviseId) {
          setTimeout(() => {
            navigate('/history');
          }, 1500);
        } else if (newId && saveStatus === 'DRAFT') {
          // Immediately enter edit mode for this draft so subsequent edits update it directly
          navigate(`/builder?edit=${newId}`, { replace: true });
        }
      }

      // Keep project.amount in sync with the latest invoice total if a matching project exists
      if (effectiveClientId && projects && projects.length > 0 && updateProject) {
        const matchingProj = projects.find(p => p.clientId === effectiveClientId);
        if (matchingProj) {
          try {
            await updateProject(matchingProj.id, { amount: total, status: saveStatus });
          } catch (projErr) {
            console.warn("Could not sync project amount:", projErr);
          }
        }
      }
    } catch (err) {
      if (err.message === 'SUBSCRIPTION_LIMIT_REACHED') {
        toast.error('Subscription limit reached — upgrade to keep quoting.', {
          action: { label: 'Upgrade', onClick: () => navigate('/admin') }
        });
      } else {
        console.error(err);
        toast.error('An error occurred while saving the quotation.');
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return { handleSave, saving, saved, savedMessage };
}
