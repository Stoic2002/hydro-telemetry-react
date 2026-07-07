import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../../store/notification-store';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Operator PLTA' | 'Viewer';
  status: 'Aktif' | 'Nonaktif';
  avatarText: string;
}

export default function UserAdmin() {
  const { addToast } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-1',
      name: 'Agus Hartono',
      username: 'agus.hartono',
      email: 'agus.hartono@pln.co.id',
      role: 'Super Admin',
      status: 'Aktif',
      avatarText: 'AH',
    },
    {
      id: 'user-2',
      name: 'Budi Santoso',
      username: 'budi.santoso',
      email: 'budi.santoso@pln.co.id',
      role: 'Operator PLTA',
      status: 'Aktif',
      avatarText: 'BS',
    },
    {
      id: 'user-3',
      name: 'Dewi Kurniawati',
      username: 'dewi.kurnia',
      email: 'dewi.kurnia@pln.co.id',
      role: 'Operator PLTA',
      status: 'Aktif',
      avatarText: 'DK',
    },
    {
      id: 'user-4',
      name: 'Rizky Pratama',
      username: 'rizky.pratama',
      email: 'rizky.pratama@pln.co.id',
      role: 'Viewer',
      status: 'Aktif',
      avatarText: 'RP',
    },
    {
      id: 'user-5',
      name: 'Siti Nurhaliza',
      username: 'siti.nurhaliza',
      email: 'siti.nurhaliza@pln.co.id',
      role: 'Viewer',
      status: 'Nonaktif',
      avatarText: 'SN',
    },
    {
      id: 'user-6',
      name: 'Teguh Wibowo',
      username: 'teguh.wibowo',
      email: 'teguh.wibowo@pln.co.id',
      role: 'Operator PLTA',
      status: 'Nonaktif',
      avatarText: 'TW',
    },
    {
      id: 'user-7',
      name: 'Lestari Maharani',
      username: 'lestari.maharani',
      email: 'lestari.maharani@pln.co.id',
      role: 'Viewer',
      status: 'Aktif',
      avatarText: 'LM',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'Operator PLTA' as 'Super Admin' | 'Operator PLTA' | 'Viewer',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate initials for avatar
    const initials = formData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      status: 'Aktif',
      avatarText: initials || 'UN',
    };

    setUsers([...users, newUser]);
    setShowAddForm(false);
    setFormData({ name: '', email: '', username: '', role: 'Operator PLTA' });
    addToast({ type: 'success', message: `Pengguna ${newUser.name} berhasil ditambahkan` });
  };

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : u
      )
    );
    addToast({ type: 'info', message: 'Status pengguna diperbarui' });
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = users.find((u) => u.id === id);
    if (userToDelete?.role === 'Super Admin') return;
    
    setUsers(users.filter((u) => u.id !== id));
    addToast({ type: 'info', message: 'User berhasil dihapus' });
  };

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#0f172a] font-display text-[22px] font-bold leading-normal">
            User Management
          </h1>
          <p className="text-[#64748b] font-sans text-[13px] leading-normal">
            Kelola akun pengguna dan hak akses aplikasi
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex h-11 shrink-0 items-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-sm font-semibold rounded-[10px] px-[18px] gap-2 cursor-pointer transition-colors border-0"
        >
          <Plus size={16} />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Add User Form Section */}
      {showAddForm && (
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-2xl p-6 gap-6 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-[#0f172a] font-sans text-[15px] font-semibold">Tambah Pengguna Baru</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-pln-teal"
                  placeholder="Masukkan nama lengkap..."
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-pln-teal"
                  placeholder="Masukkan alamat email..."
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-11 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-pln-teal"
                  placeholder="Masukkan username..."
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Peran (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="h-11 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-pln-teal bg-white"
                >
                  <option value="Super Admin">Superadmin</option>
                  <option value="Operator PLTA">GHW (Operator PLTA)</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-4 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl text-sm font-medium text-white bg-[#0891b2] hover:bg-[#0e7490] transition-colors border-0 cursor-pointer"
              >
                Simpan Pengguna
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Container Card (No Shadow!) */}
      <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-[14px] overflow-clip">
        {/* Search Header Row */}
        <div className="flex items-center border-b border-[#e2e8f0] px-5 py-3.5 gap-2.5">
          <Search size={16} className="text-[#94a3b8] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email user..."
            className="text-[#0f172a] font-sans text-[13px] leading-normal w-full border-0 focus:outline-none placeholder-[#94a3b8]"
          />
        </div>

        {/* Table Headers */}
        <div className="flex w-full h-11 items-center bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-0 gap-4">
          <div className="text-[#64748b] font-sans text-xs font-semibold leading-normal tracking-[0.72px] uppercase flex-1">
            User
          </div>
          <div className="w-[160px] shrink-0 text-[#64748b] font-sans text-xs font-semibold leading-normal tracking-[0.72px] uppercase">
            Role
          </div>
          <div className="w-[140px] shrink-0 text-[#64748b] font-sans text-xs font-semibold leading-normal tracking-[0.72px] uppercase">
            Status
          </div>
          <div className="w-[100px] shrink-0 text-[#64748b] font-sans text-xs font-semibold leading-normal tracking-[0.72px] uppercase">
            Action
          </div>
        </div>

        {/* Table Body Row List */}
        <div className="flex w-full flex-col">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex w-full items-center border-b px-5 py-3.5 gap-4 border-b-[#f1f5f9] hover:bg-slate-50/50 transition-colors"
              >
                {/* User Info with Avatar */}
                <div className="flex items-center flex-1 gap-3">
                  <div className="size-9 flex shrink-0 justify-center items-center bg-[#e0f2fe] rounded-full text-[#0369a1] font-sans text-xs font-semibold">
                    {user.avatarText}
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[#0f172a] font-sans text-sm font-medium leading-normal">
                      {user.name}
                    </div>
                    <div className="text-[#94a3b8] font-sans text-xs leading-normal">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex w-[160px] shrink-0">
                  {user.role === 'Super Admin' && (
                    <span className="bg-[#ecfeff] text-[#0891b2] font-sans text-xs font-semibold leading-normal rounded-full px-2.5 py-[3px]">
                      Superadmin
                    </span>
                  )}
                  {user.role === 'Operator PLTA' && (
                    <span className="bg-[#fef3c7] text-[#b45309] font-sans text-xs font-semibold leading-normal rounded-full px-2.5 py-[3px]">
                      GHW
                    </span>
                  )}
                  {user.role === 'Viewer' && (
                    <span className="bg-[#f1f5f9] text-[#475569] font-sans text-xs font-semibold leading-normal rounded-full px-2.5 py-[3px]">
                      Viewer
                    </span>
                  )}
                </div>

                {/* Status indicator (clickable toggle) */}
                <div 
                  className="flex w-[140px] shrink-0 items-center gap-1.5 cursor-pointer"
                  onClick={() => toggleUserStatus(user.id)}
                >
                  <div className={`size-2 flex flex-col rounded-full ${user.status === 'Aktif' ? 'bg-[#22c55e]' : 'bg-[#cbd5e1]'}`} />
                  <div className="text-[#334155] font-sans text-[13px] font-medium leading-normal select-none">
                    {user.status === 'Aktif' ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Action button triggers */}
                <div className="flex w-[100px] shrink-0 items-center gap-3">
                  <button 
                    className="p-1 text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer border-0 bg-transparent"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1 text-[#dc2626] hover:text-[#b91c1c] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0 bg-transparent" 
                    title="Hapus"
                    disabled={user.role === 'Super Admin'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm font-medium">
              Tidak ada pengguna yang cocok dengan pencarian.
            </div>
          )}
        </div>

        {/* Footer Summary & Pagination */}
        <div className="flex justify-between items-center px-5 py-3">
          <div className="text-[#94a3b8] font-sans text-xs leading-normal">
            Menampilkan {filteredUsers.length} dari {users.length} user
          </div>
          <div className="flex items-center gap-1.5">
            <button className="size-7 flex justify-center items-center bg-[#0891b2] text-white rounded-lg font-sans text-xs font-semibold border-0 cursor-pointer">
              1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
