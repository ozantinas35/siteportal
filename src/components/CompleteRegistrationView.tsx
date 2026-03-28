import React, { useState } from 'react';
import { Building, User, AlertCircle } from 'lucide-react';
import { doc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

export function CompleteRegistrationView({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [loginType, setLoginType] = useState<'admin' | 'resident'>('resident');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [regData, setRegData] = useState({
    siteName: '',
    firstName: '', lastName: '', flatNumber: '', phone: '', inviteCode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'admin') {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const siteId = Date.now().toString(); // Or use a proper ID generator like uuid

        // Create Site
        await setDoc(doc(db, 'sites', siteId), {
          name: regData.siteName,
          inviteCode: newCode,
          adminId: user.uid
        });

        // Create User Profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          role: 'admin',
          email: user.email,
          name: user.displayName || 'Yönetici',
          siteId: siteId
        });

        onComplete();
      } else {
        // Find site by invite code
        const sitesRef = collection(db, 'sites');
        const q = query(sitesRef, where('inviteCode', '==', regData.inviteCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Geçersiz davet kodu! Lütfen yöneticinizden doğru kodu isteyin.');
          setLoading(false);
          return;
        }

        const siteDoc = querySnapshot.docs[0];
        const siteId = siteDoc.id;

        // Create User Profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          role: 'resident',
          email: user.email,
          firstName: regData.firstName,
          lastName: regData.lastName,
          flatNumber: regData.flatNumber,
          phone: regData.phone,
          siteId: siteId
        });

        onComplete();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users/sites', auth);
      setError('Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Building size={32} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Kayıt Tamamlama
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Lütfen hesap türünüzü seçin ve bilgileri doldurun
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Login Type Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              onClick={() => { setLoginType('resident'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                loginType === 'resident' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User size={18} />
              Bina Sakini
            </button>
            <button
              onClick={() => { setLoginType('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                loginType === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building size={18} />
              Yönetici
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {loginType === 'admin' ? (
              <>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Site/Apartman Adı</label><input required type="text" value={regData.siteName} onChange={e => setRegData({...regData, siteName: e.target.value})} placeholder="Örn: Güneş Sitesi" className="w-full p-2.5 border border-slate-300 rounded-xl" /></div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Ad</label><input required type="text" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label><input required type="text" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Daire No</label><input required type="text" value={regData.flatNumber} onChange={e => setRegData({...regData, flatNumber: e.target.value})} placeholder="Örn: A Blok D:12" className="w-full p-2.5 border border-slate-300 rounded-xl" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label><input required type="tel" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Site Davet Kodu</label>
                  <input required type="text" value={regData.inviteCode} onChange={e => setRegData({...regData, inviteCode: e.target.value})} placeholder="Yöneticinizden aldığınız kod" className="w-full p-2.5 border border-indigo-300 bg-indigo-50 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 font-mono uppercase" />
                </div>
              </>
            )}
            <div className="pt-2">
              <button disabled={loading} type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                {loading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
