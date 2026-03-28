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

    if (role === 'admin') {
      unsubResidents = onSnapshot(query(collection(db, 'users'), where('siteId', '==', siteId), where('role', '==', 'resident')), (snapshot) => {
        setResidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users', auth));

      unsubDues = onSnapshot(query(collection(db, 'dues'), where('siteId', '==', siteId)), (snapshot) => {
        setDues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'dues', auth));

      unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('siteId', '==', siteId)), (snapshot) => {
        setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets', auth));
    } else {
      if (userId) {
        unsubDues = onSnapshot(query(collection(db, 'dues'), where('siteId', '==', siteId), where('residentId', '==', userId)), (snapshot) => {
          setDues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'dues', auth));

        unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('siteId', '==', siteId), where('residentId', '==', userId)), (snapshot) => {
          setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets', auth));
      } else {
        unsubDues = () => {};
        unsubTickets = () => {};
      }
    }

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), where('siteId', '==', siteId)), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements', auth));

    setLoading(false);

    return () => {
      unsubSite();
      if (unsubResidents) unsubResidents();
      unsubDues();
      unsubTickets();
      unsubAnnouncements();
    };
  }, [siteId, role, userId]);

  return { siteInfo, residents, dues, tickets, announcements, loading };
}
