import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

export function useSiteData(siteId: string | null, role: string | null, userId?: string | null) {
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;

    setLoading(true);

    const unsubSite = onSnapshot(doc(db, 'sites', siteId), (docSnap) => {
      if (docSnap.exists()) {
        setSiteInfo({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `sites/${siteId}`, auth));

    let unsubResidents: () => void;
    let unsubDues: () => void;
    let unsubTickets: () => void;
    let unsubExpenses: () => void;
    let unsubPolls: () => void;
    let unsubVotes: () => void;
    let unsubReservations: () => void;

    if (role === 'admin') {
      unsubResidents = onSnapshot(query(collection(db, 'users'), where('siteId', '==', siteId), where('role', '==', 'resident')), (snapshot) => setResidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'users', auth));
      unsubDues = onSnapshot(query(collection(db, 'dues'), where('siteId', '==', siteId)), (snapshot) => setDues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'dues', auth));
      unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('siteId', '==', siteId)), (snapshot) => setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'tickets', auth));
      unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('siteId', '==', siteId)), (snapshot) => setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'expenses', auth));
      unsubReservations = onSnapshot(query(collection(db, 'reservations'), where('siteId', '==', siteId)), (snapshot) => setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'reservations', auth));
    } else {
      if (userId) {
        unsubDues = onSnapshot(query(collection(db, 'dues'), where('siteId', '==', siteId), where('residentId', '==', userId)), (snapshot) => setDues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'dues', auth));
        unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('siteId', '==', siteId), where('residentId', '==', userId)), (snapshot) => setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'tickets', auth));
        unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('siteId', '==', siteId)), (snapshot) => setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'expenses', auth));
        unsubReservations = onSnapshot(query(collection(db, 'reservations'), where('siteId', '==', siteId)), (snapshot) => setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'reservations', auth));
      } else {
        unsubDues = () => {};
        unsubTickets = () => {};
        unsubExpenses = () => {};
        unsubReservations = () => {};
      }
    }

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), where('siteId', '==', siteId)), (snapshot) => setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'announcements', auth));
    unsubPolls = onSnapshot(query(collection(db, 'polls'), where('siteId', '==', siteId)), (snapshot) => setPolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'polls', auth));
    unsubVotes = onSnapshot(query(collection(db, 'votes'), where('siteId', '==', siteId)), (snapshot) => setVotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (e) => handleFirestoreError(e, OperationType.LIST, 'votes', auth));

    setLoading(false);

    return () => {
      unsubSite();
      if (unsubResidents) unsubResidents();
      unsubDues();
      unsubTickets();
      unsubAnnouncements();
      if (unsubExpenses) unsubExpenses();
      if (unsubPolls) unsubPolls();
      if (unsubVotes) unsubVotes();
      if (unsubReservations) unsubReservations();
    };
  }, [siteId, role, userId]);

  return { siteInfo, residents, dues, tickets, announcements, expenses, polls, votes, reservations, loading };
}
