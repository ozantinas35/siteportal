import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Plus, Trash2, Check, X, Wallet, PieChart, Truck, Calendar } from 'lucide-react';

export function ResidentPollsView({ polls, votes, currentUser }: any) {
  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      await addDoc(collection(db, 'votes'), {
        siteId: currentUser.siteId,
        pollId,
        residentId: currentUser.uid,
        optionIndex
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'votes', auth);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Site Anketleri</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll: any) => {
          const myVote = votes.find((v: any) => v.pollId === poll.id && v.residentId === currentUser.uid);
          const totalVotes = votes.filter((v: any) => v.pollId === poll.id).length;
          
          return (
            <div key={poll.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-slate-800">{poll.question}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${poll.status === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{poll.status === 'active' ? 'Aktif' : 'Kapalı'}</span>
              </div>
              
              <div className="space-y-3">
                {poll.options.map((opt: string, i: number) => {
                  const optionVotes = votes.filter((v: any) => v.pollId === poll.id && v.optionIndex === i).length;
                  const percentage = totalVotes === 0 ? 0 : Math.round((optionVotes / totalVotes) * 100);
                  const isSelected = myVote?.optionIndex === i;

                  return (
                    <button 
                      key={i} 
                      onClick={() => { if (!myVote && poll.status === 'active') handleVote(poll.id, i); }}
                      disabled={!!myVote || poll.status !== 'active'}
                      className={`w-full text-left relative overflow-hidden flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? 'border-indigo-600' : 'border-slate-200 bg-white hover:border-slate-300'} ${!!myVote || poll.status !== 'active' ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50'}`}
                    >
                      {/* Progress bar background */}
                      {(myVote || poll.status !== 'active') && (
                        <div className={`absolute left-0 top-0 bottom-0 ${isSelected ? 'bg-indigo-50' : 'bg-slate-100'}`} style={{ width: `${percentage}%`, zIndex: 0 }} />
                      )}
                      
                      <div className="relative z-10 flex items-center gap-2">
                        {isSelected && <Check size={16} className="text-indigo-600" />}
                        <span className={`text-sm ${isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}`}>{opt}</span>
                      </div>
                      
                      {(myVote || poll.status !== 'active') && (
                        <span className="relative z-10 text-xs font-medium text-slate-500">{percentage}% ({optionVotes})</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-slate-500 text-right">Toplam {totalVotes} oy</div>
            </div>
          );
        })}
        {polls.length === 0 && <div className="col-span-full p-8 text-center text-slate-500">Henüz aktif anket bulunmuyor.</div>}
      </div>
    </div>
  );
}

export function ResidentVisitorsView({ visitors, currentUser }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVisitor, setNewVisitor] = useState({ name: '', type: 'visitor', date: new Date().toISOString().split('T')[0] });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'visitors'), {
        siteId: currentUser.siteId,
        residentId: currentUser.uid,
        ...newVisitor,
        status: 'expected'
      });
      setIsAdding(false);
      setNewVisitor({ name: '', type: 'visitor', date: new Date().toISOString().split('T')[0] });
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'visitors', auth); }
  };

  const pendingCount = visitors.filter((v:any) => v.status === 'expected').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Beklenen Ziyaretçiler ve Kargolar</h2>
            {pendingCount > 0 && <p className="text-sm text-slate-500">{pendingCount} adet bekleyen kaydınız var.</p>}
          </div>
          <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={16} /> Yeni Kayıt Ekle</button>
        </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={newVisitor.type} onChange={e => setNewVisitor({...newVisitor, type: e.target.value})} className="p-2 border border-slate-200 rounded-lg bg-white">
                <option value="visitor">Ziyaretçi / Misafir</option>
                <option value="package">Kargo / Teslimat</option>
              </select>
              <input type="text" placeholder="İsim / Kargo Şirketi" value={newVisitor.name} onChange={e => setNewVisitor({...newVisitor, name: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required />
              <input type="date" value={newVisitor.date} onChange={e => setNewVisitor({...newVisitor, date: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">İptal</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Kaydet</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr><th className="p-4">Tür</th><th className="p-4">İsim / Kargo</th><th className="p-4">Tarih</th><th className="p-4">Durum</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {visitors.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((v: any) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${v.type === 'visitor' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{v.type === 'visitor' ? 'Misafir' : 'Kargo'}</span></td>
                  <td className="p-4 font-medium">{v.name}</td>
                  <td className="p-4 text-slate-500">{v.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v.status === 'expected' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {v.status === 'expected' ? 'Bekleniyor' : 'Geldi/Teslim Alındı'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {v.status === 'expected' && (
                      <button onClick={async () => {
                         try { await deleteDoc(doc(db, 'visitors', v.id)); } catch(e) { handleFirestoreError(e, OperationType.DELETE, `visitors/${v.id}`, auth); }
                      }} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {visitors.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Ziyaretçi kaydınız bulunmuyor.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ResidentReservationsView({ reservations, currentUser }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newRes, setNewRes] = useState({ facility: 'Spor Salonu', date: new Date().toISOString().split('T')[0], time: '18:00' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'reservations'), {
        siteId: currentUser.siteId,
        residentId: currentUser.uid,
        ...newRes,
        status: 'pending'
      });
      setIsAdding(false);
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'reservations', auth); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Onaylandı</span>;
      case 'rejected': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">Reddedildi</span>;
      default: return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Onay Bekliyor</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Tesis Rezervasyonlarım</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={16} /> Rezervasyon Yap</button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={newRes.facility} onChange={e => setNewRes({...newRes, facility: e.target.value})} className="p-2 border border-slate-200 rounded-lg bg-white">
              <option value="Spor Salonu">Spor Salonu</option>
              <option value="Yüzme Havuzu">Yüzme Havuzu</option>
              <option value="Toplantı Odası">Toplantı Odası</option>
              <option value="Barbekü Alanı">Barbekü Alanı</option>
            </select>
            <input type="date" value={newRes.date} onChange={e => setNewRes({...newRes, date: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required min={new Date().toISOString().split('T')[0]} />
            <input type="time" value={newRes.time} onChange={e => setNewRes({...newRes, time: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Talep Gönder</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr><th className="p-4">Tesis</th><th className="p-4">Tarih</th><th className="p-4">Saat</th><th className="p-4">Durum</th><th className="p-4"></th></tr>
          </thead>
          <tbody>
            {reservations.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((res: any) => (
              <tr key={res.id} className="border-b border-slate-100">
                <td className="p-4 font-medium">{res.facility}</td>
                <td className="p-4 text-slate-500">{res.date}</td>
                <td className="p-4">{res.time}</td>
                <td className="p-4">{getStatusBadge(res.status)}</td>
                <td className="p-4 text-right">
                  {res.status === 'pending' && (
                    <button onClick={async () => {
                       try { await deleteDoc(doc(db, 'reservations', res.id)); } catch(e) { handleFirestoreError(e, OperationType.DELETE, `reservations/${res.id}`, auth); }
                    }} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
            {reservations.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Rezervasyonunuz bulunmuyor.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
