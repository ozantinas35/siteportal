import React, { useState } from 'react';
import { Home, Users, CreditCard, Wrench, Bell, LogOut, Edit, Building, X } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useSiteData } from './hooks/useSiteData';
import { LoginView } from './components/LoginView';
import { CompleteRegistrationView } from './components/CompleteRegistrationView';
import { AdminDashboardView, AdminResidentsView, AdminDuesView, AdminTicketsView, AdminAnnouncementsView } from './components/AdminViews';
import { ResidentDashboardView, ResidentDuesView, ResidentTicketsView, ResidentAnnouncementsView } from './components/ResidentViews';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firebase-utils';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return <LoginView />;
  }

  if (!user.role || !user.siteId) {
    return <React.Fragment key={refreshKey}><CompleteRegistrationView user={user} onComplete={() => setRefreshKey(prev => prev + 1)} /></React.Fragment>;
  }

  return <React.Fragment key={refreshKey}><MainApp user={user} onLogout={handleLogout} /></React.Fragment>;
}

function MainApp({ user, onLogout }: { user: any, onLogout: () => void }) {
  const { siteInfo, residents, dues, tickets, announcements, loading: dataLoading } = useSiteData(user.siteId, user.role, user.uid);

  if (dataLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  const handleUpdateProfile = async (updatedUser: any) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), updatedUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
    }
  };

  const handleUpdateSiteInfo = async (updatedSiteInfo: any) => {
    if (!siteInfo?.id) return;
    try {
      await updateDoc(doc(db, 'sites', siteInfo.id), updatedSiteInfo);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sites/${siteInfo.id}`, auth);
    }
  };

  if (user.role === 'admin') {
    return (
      <AdminPortal 
        currentUser={user}
        siteInfo={siteInfo}
        onLogout={onLogout}
        onUpdateProfile={handleUpdateProfile}
        onUpdateSiteInfo={handleUpdateSiteInfo}
        residents={residents}
        dues={dues}
        tickets={tickets}
        announcements={announcements}
      />
    );
  }

  return (
    <ResidentPortal 
      currentUser={user}
      siteInfo={siteInfo}
      onLogout={onLogout}
      onUpdateProfile={handleUpdateProfile}
      dues={dues}
      tickets={tickets}
      announcements={announcements}
    />
  );
}

function NavItem({ icon, label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function AdminPortal({ currentUser, siteInfo, onLogout, onUpdateProfile, onUpdateSiteInfo, residents, dues, tickets, announcements }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">S</div>
          <span className="text-xl font-semibold tracking-tight">SitePortal</span>
        </div>
        <div className="px-6 pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Yönetici Paneli</div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<Home size={20} />} label="Özet Ekranı" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Sakin Yönetimi" isActive={activeTab === 'residents'} onClick={() => setActiveTab('residents')} />
          <NavItem icon={<CreditCard size={20} />} label="Aidat Yönetimi" isActive={activeTab === 'dues'} onClick={() => setActiveTab('dues')} />
          <NavItem icon={<Wrench size={20} />} label="Talep & Arızalar" isActive={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} />
          <NavItem icon={<Bell size={20} />} label="Duyurular" isActive={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2 w-full hover:bg-slate-800 rounded-lg transition-colors text-red-400 hover:text-red-300">
            <LogOut size={20} /><span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-2xl font-semibold text-slate-800 capitalize">
            {activeTab === 'dashboard' && 'Özet Ekranı'}
            {activeTab === 'residents' && 'Daire ve Sakin Yönetimi'}
            {activeTab === 'dues' && 'Aidat ve Finans Yönetimi'}
            {activeTab === 'tickets' && 'Talep ve Arıza Bildirimleri'}
            {activeTab === 'announcements' && 'Duyuru Sistemi'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 hover:bg-indigo-200 transition-colors focus:outline-none"
              >
                {currentUser.name?.[0] || 'A'}
              </button>
              
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Building size={16} className="text-indigo-500" /> 
                        <span>Site Yöneticisi</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button 
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Edit size={16} /> Profili Düzenle
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} /> Çıkış Yap
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'dashboard' && <AdminDashboardView dues={dues} tickets={tickets} announcements={announcements} residents={residents} siteInfo={siteInfo} />}
          {activeTab === 'residents' && <AdminResidentsView residents={residents} />}
          {activeTab === 'dues' && <AdminDuesView dues={dues} residents={residents} siteInfo={siteInfo} />}
          {activeTab === 'tickets' && <AdminTicketsView tickets={tickets} residents={residents} />}
          {activeTab === 'announcements' && <AdminAnnouncementsView announcements={announcements} siteInfo={siteInfo} />}
        </div>
      </main>

      {isProfileModalOpen && (
        <AdminProfileModal 
          user={currentUser} 
          siteInfo={siteInfo}
          onClose={() => setIsProfileModalOpen(false)} 
          onSave={onUpdateProfile} 
          onSaveSiteInfo={onUpdateSiteInfo}
        />
      )}
    </div>
  );
}

function ResidentPortal({ currentUser, siteInfo, onLogout, onUpdateProfile, dues, tickets, announcements }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      <aside className="w-64 bg-slate-800 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">S</div>
          <span className="text-xl font-semibold tracking-tight">SitePortal</span>
        </div>
        <div className="px-6 pb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Sakin Paneli</div>
          <div className="text-sm text-white font-medium">{currentUser.firstName} {currentUser.lastName}</div>
          <div className="text-xs text-slate-400">{currentUser.flatNumber}</div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<Home size={20} />} label="Özet Ekranı" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<CreditCard size={20} />} label="Aidat & Borçlar" isActive={activeTab === 'dues'} onClick={() => setActiveTab('dues')} />
          <NavItem icon={<Wrench size={20} />} label="Taleplerim" isActive={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} />
          <NavItem icon={<Bell size={20} />} label="Duyurular" isActive={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2 w-full hover:bg-slate-700 rounded-lg transition-colors text-red-400 hover:text-red-300">
            <LogOut size={20} /><span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-2xl font-semibold text-slate-800 capitalize">
            {activeTab === 'dashboard' && 'Özet Ekranı'}
            {activeTab === 'dues' && 'Aidat ve Borçlarım'}
            {activeTab === 'tickets' && 'Talep ve Arıza Bildirimlerim'}
            {activeTab === 'announcements' && 'Duyurular'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 hover:bg-emerald-200 transition-colors focus:outline-none"
              >
                {currentUser.firstName?.[0] || 'S'}
              </button>
              
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{currentUser.firstName} {currentUser.lastName}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button 
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Edit size={16} /> Profili Düzenle
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} /> Çıkış Yap
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'dashboard' && <ResidentDashboardView currentUser={currentUser} dues={dues} tickets={tickets} announcements={announcements} />}
          {activeTab === 'dues' && <ResidentDuesView currentUser={currentUser} dues={dues} siteInfo={siteInfo} />}
          {activeTab === 'tickets' && <ResidentTicketsView currentUser={currentUser} tickets={tickets} />}
          {activeTab === 'announcements' && <ResidentAnnouncementsView announcements={announcements} />}
        </div>
      </main>

      {isProfileModalOpen && (
        <ResidentProfileModal 
          user={currentUser} 
          onClose={() => setIsProfileModalOpen(false)} 
          onSave={onUpdateProfile} 
        />
      )}
    </div>
  );
}

function AdminProfileModal({ user, siteInfo, onClose, onSave, onSaveSiteInfo }: any) {
  const [formData, setFormData] = useState({ name: user.name });
  const [siteData, setSiteData] = useState({ iban: siteInfo?.iban || '' });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
    if (onSaveSiteInfo && siteInfo) {
      onSaveSiteInfo({ ...siteInfo, ...siteData });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Profili ve Siteyi Düzenle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
          </div>
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Site Bilgileri</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aidat Ödemeleri İçin IBAN</label>
              <input type="text" value={siteData.iban} onChange={e => setSiteData({...siteData, iban: e.target.value})} placeholder="TR00 0000 0000 0000 0000 0000 00" className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm" />
              <p className="text-xs text-slate-500 mt-1">Bu IBAN numarası sakinlerin aidat ödeme ekranında görünecektir.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">İptal</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResidentProfileModal({ user, onClose, onSave }: any) {
  const [formData, setFormData] = useState({ 
    firstName: user.firstName, 
    lastName: user.lastName,
    phone: user.phone
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Profili Düzenle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
              <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
              <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">İptal</button>
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}
