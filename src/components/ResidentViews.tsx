import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Paperclip, Upload, Bell, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

function StatCard({ title, amount, icon, trend, trendUp, isNumber = false }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{amount}</h3>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      </div>
      {!isNumber && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>{trend}</span>
          <span className="text-slate-400 ml-2">için</span>
        </div>
      )}
    </div>
  );
}

function AnnouncementItem({ title, date, content }: any) {
  return (
    <div className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <Bell size={16} className="text-indigo-500" />
          {title}
        </h3>
        <span className="text-xs text-slate-400 font-medium">{date}</span>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">{content}</p>
    </div>
  );
}

export function ResidentDashboardView({ currentUser, dues, tickets, announcements }: any) {
  const myDues = dues.filter((d: any) => d.residentId === currentUser.uid);
  const totalDebt = myDues.filter((d: any) => d.status === 'unpaid').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const myTickets = tickets.filter((t: any) => t.residentId === currentUser.uid);
  const pendingTickets = myTickets.filter((t: any) => t.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Güncel Borcunuz" amount={`₺${totalDebt.toLocaleString('tr-TR')}`} icon={<AlertCircle size={24} className="text-rose-500" />} trend="Toplam" trendUp={false} />
        <StatCard title="Açık Talepleriniz" amount={pendingTickets.toString()} icon={<Clock size={24} className="text-amber-500" />} isNumber />
        <StatCard title="Son Ödeme" amount={myDues.find((d: any) => d.status === 'paid') ? `₺${myDues.find((d: any) => d.status === 'paid').amount.toLocaleString('tr-TR')}` : 'Yok'} icon={<CheckCircle size={24} className="text-emerald-500" />} trend="Geçen Ay" trendUp={true} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Son Duyurular</h2>
          <div className="space-y-4">
            {announcements.slice(0, 3).map((ann: any) => <AnnouncementItem key={ann.id} title={ann.title} date={ann.date} content={ann.content} />)}
            {announcements.length === 0 && <p className="text-slate-500 text-sm">Duyuru bulunmuyor.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResidentDuesView({ currentUser, dues, siteInfo }: any) {
  const myDues = dues.filter((d: any) => d.residentId === currentUser.uid);

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ödendi</span>;
    if (status === 'pending') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Onay Bekliyor</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Ödenmedi</span>;
  };

  const handlePayment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'dues', id), { status: 'pending' });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `dues/${id}`, auth);
    }
  };

  const copyIban = () => {
    if (siteInfo?.iban) {
      navigator.clipboard.writeText(siteInfo.iban);
    }
  };

  return (
    <div className="space-y-6">
      {siteInfo?.iban && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-indigo-900">Aidat Ödeme Bilgileri</h3>
            <p className="text-sm text-indigo-700 mt-1">Lütfen ödemelerinizi aşağıdaki IBAN numarasına yapınız ve ardından tablodan "Ödeme Bildir" butonuna tıklayınız.</p>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-indigo-200 shadow-sm flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Yönetici IBAN</span>
              <span className="text-sm font-mono font-bold text-slate-800">{siteInfo.iban}</span>
            </div>
            <button 
              onClick={copyIban}
              className="ml-auto sm:ml-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Kopyala
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Aidat ve Borçlarım</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Dönem</th><th className="p-4 font-medium">Tutar</th><th className="p-4 font-medium">Durum</th><th className="p-4 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {myDues.map((due: any) => (
              <tr key={due.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-slate-600">{due.month} {due.year}</td>
                <td className="p-4 font-medium text-slate-800">₺{due.amount.toLocaleString('tr-TR')}</td>
                <td className="p-4">{getStatusBadge(due.status)}</td>
                <td className="p-4 text-right">
                  {due.status === 'unpaid' && (
                    <button onClick={() => handlePayment(due.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors ml-auto">Ödeme Bildir</button>
                  )}
                </td>
              </tr>
            ))}
            {myDues.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Geçmiş aidat kaydınız bulunmamaktadır.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export function ResidentTicketsView({ currentUser, tickets }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', attachment: null as File | null });
  const [uploading, setUploading] = useState(false);

  const myTickets = tickets
    .filter((t: any) => t.residentId === currentUser.uid)
    .sort((a: any, b: any) => {
      const dateA = a.createdAt || a.date;
      const dateB = b.createdAt || b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024) {
        e.target.value = '';
        return;
      }
      setNewTicket({ ...newTicket, attachment: file });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tickets/${id}`, auth);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const date = new Date().toISOString().split('T')[0];
    const createdAt = new Date().toISOString();
    
    try {
      let attachmentData = null;
      if (newTicket.attachment) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        reader.readAsDataURL(newTicket.attachment);
        const base64String = await base64Promise;
        attachmentData = { name: newTicket.attachment.name, url: base64String };
      }

      await addDoc(collection(db, 'tickets'), {
        siteId: currentUser.siteId,
        residentId: currentUser.uid,
        subject: newTicket.subject,
        description: newTicket.description,
        status: 'pending',
        date,
        createdAt,
        ...(attachmentData && { attachment: attachmentData })
      });

      setIsAdding(false);
      setNewTicket({ subject: '', description: '', attachment: null });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets', auth);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Çözüldü</span>;
    if (status === 'in_progress') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">İşlemde</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Açık</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Taleplerim</h2>
          <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"><Plus size={18} /> Yeni Talep Oluştur</button>
        </div>
        {isAdding && (
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Konu</label><input required type="text" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} placeholder="Örn: Asansör Arızası" className="w-full p-2 border border-slate-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label><textarea required rows={3} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg resize-none"></textarea></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dosya Eki (İsteğe Bağlı)</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                    <Upload size={16} className="text-slate-500" />
                    <span>Dosya Seç</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                  </label>
                  {newTicket.attachment && <span className="text-sm text-slate-600 truncate max-w-xs">{newTicket.attachment.name}</span>}
                </div>
              </div>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">İptal</button><button disabled={uploading} type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">{uploading ? 'Gönderiliyor...' : 'Gönder'}</button></div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Konu & Açıklama</th><th className="p-4 font-medium">Tarih</th><th className="p-4 font-medium">Durum</th><th className="p-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {myTickets.map((ticket: any) => (
                <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{ticket.subject}</div>
                    <div className="text-sm text-slate-500 mt-1 max-w-md truncate">{ticket.description}</div>
                    {ticket.attachment && (
                      <a href={ticket.attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md">
                        <Paperclip size={12} /> {ticket.attachment.name}
                      </a>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">{ticket.date}</td>
                  <td className="p-4">{getStatusBadge(ticket.status)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(ticket.id)} className="text-rose-500 hover:text-rose-700 p-2 rounded-md hover:bg-rose-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {myTickets.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Geçmiş talebiniz bulunmamaktadır.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ResidentAnnouncementsView({ announcements }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Güncel Duyurular</h2>
      </div>
      <div className="p-6 space-y-4">
        {announcements.map((ann: any) => (
          <AnnouncementItem key={ann.id} title={ann.title} date={ann.date} content={ann.content} />
        ))}
        {announcements.length === 0 && <p className="text-slate-500 text-center py-8">Henüz duyuru yayınlanmamış.</p>}
      </div>
    </div>
  );
}
