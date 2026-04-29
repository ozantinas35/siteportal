import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Plus, Trash2, Check, X, Wallet, PieChart, Truck, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AdminExpensesView({ expenses, siteInfo }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', date: '', type: 'expense' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        siteId: siteInfo.id,
        ...newExpense,
        amount: Number(newExpense.amount),
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewExpense({ title: '', amount: '', date: '', type: 'expense' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses', auth);
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDoc(doc(db, 'expenses', id)); } 
    catch (error) { handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`, auth); }
  };

  const totalIncome = expenses.filter((e: any) => e.type === 'income').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalExpense = expenses.filter((e: any) => e.type === 'expense').reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.text("Kasa Hareketleri Raporu", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Olusturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
    doc.text(`Toplam Gelir: ${totalIncome.toLocaleString('tr-TR')} TL`, 14, 36);
    doc.text(`Toplam Gider: ${totalExpense.toLocaleString('tr-TR')} TL`, 14, 42);
    doc.text(`Kasa Durumu: ${(totalIncome - totalExpense).toLocaleString('tr-TR')} TL`, 14, 48);

    const tableData = [...expenses].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp: any) => [
      exp.date,
      exp.title,
      exp.type === 'income' ? 'Gelir' : 'Gider',
      `${exp.type === 'income' ? '+' : '-'} ${exp.amount.toLocaleString('tr-TR')} TL`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Tarih', 'Aciklama', 'Tur', 'Tutar']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, font: "helvetica" },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save('kasa_hareketleri.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-slate-500 font-medium mb-1">Toplam Gelir</p><p className="text-2xl font-bold text-emerald-600">₺{totalIncome.toLocaleString('tr-TR')}</p></div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Wallet size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-slate-500 font-medium mb-1">Toplam Gider</p><p className="text-2xl font-bold text-rose-600">₺{totalExpense.toLocaleString('tr-TR')}</p></div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><Wallet size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-slate-500 font-medium mb-1">Kasa Durumu</p><p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>₺{(totalIncome - totalExpense).toLocaleString('tr-TR')}</p></div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Wallet size={24} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Kasa Hareketleri</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download size={16} /> PDF İndir
            </button>
            <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Yeni İşlem
            </button>
          </div>
        </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" placeholder="Başlık / Açıklama" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required />
              <input type="number" placeholder="Tutar (₺)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required min="0" />
              <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="p-2 border border-slate-200 rounded-lg" required />
              <select value={newExpense.type} onChange={e => setNewExpense({...newExpense, type: e.target.value})} className="p-2 border border-slate-200 rounded-lg">
                <option value="expense">Gider (-)</option>
                <option value="income">Gelir (+)</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">İptal</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Kaydet</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr><th className="p-4">Tarih</th><th className="p-4">Açıklama</th><th className="p-4">Tür</th><th className="p-4">Tutar</th><th className="p-4"></th></tr></thead>
            <tbody>
              {expenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp: any) => (
                <tr key={exp.id} className="border-b border-slate-100">
                  <td className="p-4">{exp.date}</td>
                  <td className="p-4 font-medium">{exp.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${exp.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {exp.type === 'income' ? 'Gelir' : 'Gider'}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${exp.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {exp.type === 'income' ? '+' : '-'}₺{exp.amount.toLocaleString('tr-TR')}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(exp.id)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Henüz kasa hareketi bulunmuyor.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminPollsView({ polls, siteInfo }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPoll.options.filter(o => o.trim() !== '').length < 2) return alert('En az 2 seçenek gereklidir.');
    try {
      await addDoc(collection(db, 'polls'), {
        siteId: siteInfo.id,
        question: newPoll.question,
        options: newPoll.options.filter(o => o.trim() !== ''),
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewPoll({ question: '', options: ['', ''] });
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'polls', auth); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDoc(doc(db, 'polls', id)); } catch (error) { handleFirestoreError(error, OperationType.DELETE, `polls/${id}`, auth); }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try { await updateDoc(doc(db, 'polls', id), { status: currentStatus === 'active' ? 'closed' : 'active' }); } 
    catch (error) { handleFirestoreError(error, OperationType.UPDATE, `polls/${id}`, auth); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Sakin Anketleri</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={16} /> Yeni Anket</button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anket Sorusu</label>
              <input type="text" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seçenekler</label>
              {newPoll.options.map((opt, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={opt} onChange={e => {
                    const newOpts = [...newPoll.options];
                    newOpts[i] = e.target.value;
                    setNewPoll({...newPoll, options: newOpts});
                  }} className="flex-1 p-2 border border-slate-300 rounded-lg" placeholder={`${i+1}. Seçenek`} required={i < 2} />
                  {i >= 2 && <button type="button" onClick={() => setNewPoll({...newPoll, options: newPoll.options.filter((_, idx) => idx !== i)})} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>}
                </div>
              ))}
              {newPoll.options.length < 10 && (
                <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-indigo-600 text-sm font-medium hover:underline mt-1">+ Yeni Seçenek</button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg">İptal</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Anketi Yayınla</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll: any) => (
          <div key={poll.id} className={`p-5 rounded-xl border ${poll.status === 'active' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-800">{poll.question}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${poll.status === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{poll.status === 'active' ? 'Aktif' : 'Kapalı'}</span>
            </div>
            <div className="space-y-2 mb-4">
              {poll.options.map((opt: string, i: number) => (
                <div key={i} className="text-sm bg-white p-2 rounded border border-slate-200 flex justify-between">
                  <span>{opt}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-slate-200/50">
              <button onClick={() => handleToggleStatus(poll.id, poll.status)} className="text-sm text-slate-600 hover:text-indigo-600 font-medium">
                {poll.status === 'active' ? 'Anketi Kapat' : 'Yeniden Aç'}
              </button>
              <button onClick={() => handleDelete(poll.id)} className="text-sm text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"><Trash2 size={14}/> Sil</button>
            </div>
          </div>
        ))}
        {polls.length === 0 && <div className="col-span-full p-8 text-center text-slate-500">Henüz anket bulunmuyor.</div>}
      </div>
    </div>
  );
}

export function AdminVisitorsView({ visitors, residents, siteInfo }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Ziyaretçi & Kargo Takibi</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr><th className="p-4">Daire</th><th className="p-4">Tür</th><th className="p-4">İsim / Kargo</th><th className="p-4">Tarih</th><th className="p-4">Durum</th></tr>
          </thead>
          <tbody>
            {visitors.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((v: any) => {
              const res = residents.find((r: any) => r.id === v.residentId);
              return (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="p-4 font-medium">{res?.flatNumber || 'Bilinmiyor'}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${v.type === 'visitor' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{v.type === 'visitor' ? 'Misafir' : 'Kargo'}</span></td>
                  <td className="p-4">{v.name}</td>
                  <td className="p-4 text-slate-500">{v.date}</td>
                  <td className="p-4">
                    <select 
                      value={v.status} 
                      onChange={async e => {
                        try { await updateDoc(doc(db, 'visitors', v.id), { status: e.target.value }); }
                        catch (err) { handleFirestoreError(err, OperationType.UPDATE, `visitors/${v.id}`, auth); }
                      }}
                      className="p-1.5 border border-slate-200 rounded text-xs bg-white"
                    >
                      <option value="expected">Bekleniyor</option>
                      <option value="arrived">{v.type === 'visitor' ? 'Geldi' : 'Teslim Alındı'}</option>
                    </select>
                  </td>
                </tr>
              )
            })}
            {visitors.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Bekleyen ziyaretçi veya kargo yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminReservationsView({ reservations, residents, siteInfo }: any) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Onaylandı</span>;
      case 'rejected': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">Reddedildi</span>;
      default: return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Bekliyor</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Ortak Alan Rezervasyonları</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr><th className="p-4">Tesis</th><th className="p-4">Daire</th><th className="p-4">Tarih</th><th className="p-4">Saat</th><th className="p-4">Durum</th><th className="p-4 text-right">İşlem</th></tr>
          </thead>
          <tbody>
            {reservations.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((res: any) => {
              const resident = residents.find((r: any) => r.id === res.residentId);
              return (
                <tr key={res.id} className="border-b border-slate-100">
                  <td className="p-4 font-medium">{res.facility}</td>
                  <td className="p-4">{resident?.flatNumber || 'Bilinmiyor'}</td>
                  <td className="p-4 text-slate-500">{res.date}</td>
                  <td className="p-4">{res.time}</td>
                  <td className="p-4">{getStatusBadge(res.status)}</td>
                  <td className="p-4 text-right">
                    {res.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={async () => await updateDoc(doc(db, 'reservations', res.id), { status: 'approved'})} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check size={16} /></button>
                        <button onClick={async () => await updateDoc(doc(db, 'reservations', res.id), { status: 'rejected'})} className="p-1.5 bg-rose-100 text-rose-700 rounded hover:bg-rose-200"><X size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {reservations.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Rezervasyon talebi bulunmuyor.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
