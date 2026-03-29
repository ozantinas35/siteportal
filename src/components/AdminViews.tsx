import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Trash2, Check, Bell, Paperclip } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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

function TicketItem({ title, location, status, time }: any) {
  const getStatusColor = (s: string) => {
    if (s === 'resolved') return 'bg-emerald-100 text-emerald-700';
    if (s === 'in_progress') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };
  const getStatusText = (s: string) => {
    if (s === 'resolved') return 'Çözüldü';
    if (s === 'in_progress') return 'İşlemde';
    return 'Açık';
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`mt-1 w-2 h-2 rounded-full ${status === 'resolved' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
        <div>
          <h3 className="font-medium text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{location}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{getStatusText(status)}</span>
        <span className="text-xs text-slate-400 font-medium">{time}</span>
      </div>
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

export function AdminDashboardView({ dues, tickets, announcements, residents, siteInfo }: any) {
  const totalCollected = dues.filter((d: any) => d.status === 'paid').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalUnpaid = dues.filter((d: any) => d.status === 'unpaid').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const pendingTickets = tickets.filter((t: any) => t.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-indigo-900">Sakinleri Davet Edin</h2>
          <p className="text-sm text-indigo-700 mt-1">Sakinlerin kayıt olabilmesi için yandaki davet kodunu paylaşın.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-indigo-200 shadow-sm flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Davet Kodu</span>
          <span className="text-xl font-mono font-bold text-indigo-700 tracking-widest">{siteInfo?.inviteCode}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Tahsil Edilen Aidat" amount={`₺${totalCollected.toLocaleString('tr-TR')}`} icon={<CheckCircle size={24} className="text-emerald-500" />} trend="Bu Ay" trendUp={true} />
        <StatCard title="Ödenmemiş Borç" amount={`₺${totalUnpaid.toLocaleString('tr-TR')}`} icon={<AlertCircle size={24} className="text-rose-500" />} trend="Toplam" trendUp={false} />
        <StatCard title="Bekleyen Talepler" amount={pendingTickets.toString()} icon={<Clock size={24} className="text-amber-500" />} isNumber />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Son Talepler & Arızalar</h2>
          <div className="space-y-4">
            {tickets.slice(0, 3).map((ticket: any) => {
              const resident = residents.find((r: any) => r.id === ticket.residentId);
              return <TicketItem key={ticket.id} title={ticket.subject} location={resident?.flatNumber || 'Bilinmiyor'} status={ticket.status} time={ticket.date} />;
            })}
            {tickets.length === 0 && <p className="text-slate-500 text-sm">Bekleyen talep yok.</p>}
          </div>
        </div>
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

export function AdminResidentsView({ residents }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ firstName: '', lastName: '', flatNumber: '', phone: '' });

  const confirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`, auth);
    }
  };

  const handleEditClick = (resident: any) => {
    setEditingId(resident.id);
    setEditData({
      firstName: resident.firstName || '',
      lastName: resident.lastName || '',
      flatNumber: resident.flatNumber || '',
      phone: resident.phone || ''
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        firstName: editData.firstName,
        lastName: editData.lastName,
        flatNumber: editData.flatNumber,
        phone: editData.phone
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`, auth);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Kayıtlı Sakinler</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Ad Soyad</th>
              <th className="p-4 font-medium">Daire No</th>
              <th className="p-4 font-medium">İletişim</th>
              <th className="p-4 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {residents.map((resident: any) => (
              <tr key={resident.id} className="border-b border-slate-100 hover:bg-slate-50">
                {editingId === resident.id ? (
                  <>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <input type="text" value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} className="w-full p-1 border border-slate-300 rounded" placeholder="Ad" />
                        <input type="text" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} className="w-full p-1 border border-slate-300 rounded" placeholder="Soyad" />
                      </div>
                    </td>
                    <td className="p-4">
                      <input type="text" value={editData.flatNumber} onChange={e => setEditData({...editData, flatNumber: e.target.value})} className="w-full p-1 border border-slate-300 rounded" placeholder="Daire No" />
                    </td>
                    <td className="p-4">
                      <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full p-1 border border-slate-300 rounded" placeholder="Telefon" />
                      <div className="text-xs text-slate-400 mt-1">{resident.email}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSaveEdit(resident.id)} className="text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors">Kaydet</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded-lg text-sm font-medium transition-colors">İptal</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-medium text-slate-800">{resident.firstName} {resident.lastName}</td>
                    <td className="p-4 text-slate-600">{resident.flatNumber}</td>
                    <td className="p-4 text-slate-600">
                      <div>{resident.phone}</div>
                      <div className="text-xs text-slate-400">{resident.email}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {deletingId === resident.id ? (
                          <>
                            <button onClick={() => confirmDelete(resident.id)} className="text-white bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded-lg text-sm font-medium transition-colors">Eminim, Sil</button>
                            <button onClick={() => setDeletingId(null)} className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded-lg text-sm font-medium transition-colors">İptal</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(resident)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors">Düzenle</button>
                            <button onClick={() => setDeletingId(resident.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDuesView({ dues, residents, siteInfo }: any) {
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const [bulkData, setBulkData] = useState({ amount: '', month: 'Nisan', year: '2026' });

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      for (const r of residents) {
        await addDoc(collection(db, 'dues'), {
          siteId: siteInfo.id,
          residentId: r.id,
          amount: Number(bulkData.amount),
          month: bulkData.month,
          year: Number(bulkData.year),
          status: 'unpaid'
        });
      }
      setIsAddingBulk(false);
      alert('Toplu aidat borçlandırması başarıyla yapıldı!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'dues', auth);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'dues', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `dues/${id}`, auth);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ödendi</span>;
    if (status === 'pending') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Onay Bekliyor</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Ödenmedi</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Aidat ve Borç Listesi</h2>
          <button onClick={() => setIsAddingBulk(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={18} /> Toplu Aidat Yansıt
          </button>
        </div>
        {isAddingBulk && (
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-medium text-slate-800 mb-4">Tüm Dairelere Aidat Yansıt</h3>
            <form onSubmit={handleBulkAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Tutar (₺)</label><input required type="number" value={bulkData.amount} onChange={e => setBulkData({...bulkData, amount: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Ay</label><select value={bulkData.month} onChange={e => setBulkData({...bulkData, month: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg bg-white">{['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Yıl</label><input required type="number" value={bulkData.year} onChange={e => setBulkData({...bulkData, year: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700">Yansıt</button>
                <button type="button" onClick={() => setIsAddingBulk(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-300">İptal</button>
              </div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Sakin</th><th className="p-4 font-medium">Dönem</th><th className="p-4 font-medium">Tutar</th><th className="p-4 font-medium">Durum</th><th className="p-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {dues.filter((due: any) => residents.some((r: any) => r.id === due.residentId)).map((due: any) => {
                const resident = residents.find((r: any) => r.id === due.residentId);
                return (
                  <tr key={due.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4"><div className="font-medium text-slate-800">{resident?.firstName} {resident?.lastName}</div><div className="text-xs text-slate-500">{resident?.flatNumber}</div></td>
                    <td className="p-4 text-slate-600">{due.month} {due.year}</td>
                    <td className="p-4 font-medium text-slate-800">₺{due.amount.toLocaleString('tr-TR')}</td>
                    <td className="p-4">{getStatusBadge(due.status)}</td>
                    <td className="p-4 text-right">
                      {due.status === 'pending' && (
                        <button onClick={() => handleUpdateStatus(due.id, 'paid')} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors ml-auto"><Check size={16} /> Onayla</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminTicketsView({ tickets, residents }: any) {
  const [showResolved, setShowResolved] = useState(false);

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Çözüldü</span>;
    if (status === 'in_progress') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">İşlemde</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Açık</span>;
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'tickets', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`, auth);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tickets/${id}`, auth);
    }
  };

  const filteredTickets = (showResolved ? tickets : tickets.filter((t: any) => t.status !== 'resolved'))
    .sort((a: any, b: any) => {
      const dateA = a.createdAt || a.date;
      const dateB = b.createdAt || b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Talep ve Arıza Bildirimleri</h2>
        <button 
          onClick={() => setShowResolved(!showResolved)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showResolved ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          {showResolved ? 'Sadece Aktif Talepler' : 'Çözülenleri Göster'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Konu & Açıklama</th><th className="p-4 font-medium">Sakin</th><th className="p-4 font-medium">Tarih</th><th className="p-4 font-medium">Durum</th><th className="p-4 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.filter((ticket: any) => residents.some((r: any) => r.id === ticket.residentId)).map((ticket: any) => {
              const resident = residents.find((r: any) => r.id === ticket.residentId);
              return (
                <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{ticket.subject}</div>
                    <div className="text-sm text-slate-500 mt-1 max-w-md truncate">{ticket.description}</div>
                    {ticket.attachment && (
                      <a href={ticket.attachment.url} download={ticket.attachment.name} className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md">
                        <Paperclip size={12} /> {ticket.attachment.name}
                      </a>
                    )}
                  </td>
                  <td className="p-4"><div className="font-medium text-slate-800">{resident?.firstName} {resident?.lastName}</div><div className="text-xs text-slate-500">{resident?.flatNumber}</div></td>
                  <td className="p-4 text-slate-600">{ticket.date}</td>
                  <td className="p-4">{getStatusBadge(ticket.status)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select value={ticket.status} onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="pending">Açık</option>
                        <option value="in_progress">İşlemde</option>
                        <option value="resolved">Çözüldü</option>
                      </select>
                      <button onClick={() => handleDelete(ticket.id)} className="text-rose-500 hover:text-rose-700 p-2 rounded-md hover:bg-rose-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminAnnouncementsView({ announcements, siteInfo }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date().toISOString().split('T')[0];
    try {
      await addDoc(collection(db, 'announcements'), {
        siteId: siteInfo.id,
        title: newAnn.title,
        content: newAnn.content,
        date
      });
      setIsAdding(false);
      setNewAnn({ title: '', content: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements', auth);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`, auth);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Duyuru Sistemi</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"><Plus size={18} /> Yeni Duyuru</button>
      </div>
      {isAdding && (
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label><input required type="text" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">İçerik</label><textarea required rows={4} value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg resize-none"></textarea></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">İptal</button><button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">Yayınla</button></div>
          </form>
        </div>
      )}
      <div className="p-6 space-y-4">
        {announcements.map((ann: any) => (
          <div key={ann.id} className="relative group">
            <AnnouncementItem title={ann.title} date={ann.date} content={ann.content} />
            <button onClick={() => handleDelete(ann.id)} className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-md shadow-sm border border-rose-100"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
