import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * One factory for the Firestore tenant-collection CRUD triple that every
 * entity (clients, projects, quotations, products) used to copy-paste.
 * Owns: Firestore I/O, optimistic state updates, and tenant/ownership stamping.
 *
 * getActor is a function so every operation resolves the CURRENT actor
 * (uid/tenantId) at call time — no stale-closure captures.
 */
export function createTenantCrud(collectionName, setState, getActor) {
  return {
    async add(entity) {
      const stamped = { ...entity, createdBy: getActor().uid, tenantId: getActor().tenantId };
      const docRef = await addDoc(collection(db, collectionName), stamped);
      setState(prev => [...prev, { ...stamped, id: docRef.id }]);
      return docRef.id;
    },
    async update(id, data) {
      const updateData = { ...data, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, collectionName, id), updateData);
      setState(prev => prev.map(e => (e.id === id ? { ...e, ...updateData } : e)));
    },
    async remove(id) {
      await deleteDoc(doc(db, collectionName, id));
      setState(prev => prev.filter(e => e.id !== id));
    },
  };
}
