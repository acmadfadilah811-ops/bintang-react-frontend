import { useState } from 'react';
import { 
  ArrowLeft, Wallet, Award, Plus, Trash2, Edit2, 
  User, Mail, Phone, MapPin, Calendar, Building, 
  FileText, AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../pages/customerSupplierData';
import { formatDisplayDate } from '../../../utils/date';

const GENDER_LABEL = { L: 'Laki-laki', P: 'Perempuan' };

const FIELD_ALAMAT = [
  ['alamat', 'Alamat'],
  ['negara', 'Negara'],
  ['provinsi', 'Propinsi'],
  ['kota', 'Kota'],
  ['kecamatan', 'Kecamatan'],
  ['kode_pos', 'Kode Pos'],
];

function DetailRow({ icon: Icon, label, value, valClass = "text-slate-800" }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-2.5 text-slate-500 min-w-0">
        {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
        <span className="text-xs md:text-sm font-medium truncate">{label}</span>
      </div>
      <span className={`text-xs md:text-sm font-semibold text-right break-all ml-4 ${valClass}`}>{value || '-'}</span>
    </div>
  );
}

export default function CustomerDetailPage({ customer, notes = [], onBack, onEdit, onDelete, onAddNote }) {
  const [activeTab, setActiveTab] = useState('profil'); // 'profil', 'alamat', 'catatan'
  const c = customer;
  const catatanPelanggan = notes.filter((n) => String(n.customer) === String(c.id));
  const alamatKosong = FIELD_ALAMAT.filter(([key]) => !c[key]).map(([, label]) => label);
  const initials = c.nama ? c.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';

  return (
    <div className="pb-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 rounded-full p-2 hover:bg-slate-100 cursor-pointer transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-center text-lg md:text-xl font-bold text-slate-800 pr-10">Rincian Pelanggan</h2>
      </div>

      {/* Banner / Hero Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar Initials with beautiful gradient */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-100 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">{c.nama}</h1>
                {c.customer_group_nama ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    {c.customer_group_nama}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Guest
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  c.is_active 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {c.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 font-mono">{c.kode_pelanggan || 'KODE: -'}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onEdit(c)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
            >
              <Edit2 size={15} />
              Ubah
            </button>
            <button
              type="button"
              onClick={() => onDelete(c)}
              className="flex items-center gap-1.5 px-4 py-2 border border-rose-100 hover:border-rose-300 hover:bg-rose-50 text-rose-600 text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
            >
              <Trash2 size={15} />
              Hapus
            </button>
            <button
              type="button"
              onClick={onAddNote}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-4 py-2 cursor-pointer shadow-md shadow-blue-100 hover:shadow-lg transition-all duration-150 shrink-0"
            >
              <Plus size={16} />
              Catatan
            </button>
          </div>
        </div>

        {/* Quick Stat Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Deposit Widget Card */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50/30 border border-sky-100/50 rounded-2xl p-4 flex items-center justify-between hover:shadow-md hover:shadow-sky-50/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Saldo Deposit</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{formatCurrency(c.deposit)}</p>
              </div>
            </div>
          </div>

          {/* Loyalty Points Widget Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100/50 rounded-2xl p-4 flex items-center justify-between hover:shadow-md hover:shadow-amber-50/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loyalty Points</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{c.loyalty_points ?? 0} <span className="text-xs font-semibold text-slate-500">Pts</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
        {[
          { id: 'profil', label: 'Profil Lengkap', icon: User },
          { id: 'alamat', label: 'Alamat Pengiriman', icon: MapPin },
          { id: 'catatan', label: `Catatan (${catatanPelanggan.length})`, icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'profil' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={16} className="text-blue-500" />
                Informasi Personal
              </h3>
              <div className="space-y-1">
                <DetailRow icon={User} label="Nama Lengkap" value={c.nama} />
                <DetailRow icon={User} label="Jenis Kelamin" value={GENDER_LABEL[c.jenis_kelamin]} />
                <DetailRow icon={Calendar} label="Tanggal Lahir" value={formatDisplayDate(c.tanggal_lahir)} />
                <DetailRow icon={Calendar} label="Batas Tanggal Aktif" value={formatDisplayDate(c.tanggal_berakhir)} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Phone size={16} className="text-blue-500" />
                Kontak & Pekerjaan
              </h3>
              <div className="space-y-1">
                <DetailRow icon={Phone} label="Nomor HP / WhatsApp" value={c.handphone} />
                <DetailRow icon={Mail} label="Alamat Email" value={c.email} />
                <DetailRow icon={Building} label="Nama Perusahaan" value={c.nama_perusahaan} />
                <DetailRow icon={Wallet} label="Batas Kredit/Hutang" value={formatCurrency(c.batas_kredit)} />
                <DetailRow 
                  icon={Mail} 
                  label="Terima Buletin Berkala" 
                  value={c.terima_buletin ? 'Aktif' : 'Tidak Aktif'} 
                  valClass={c.terima_buletin ? 'text-emerald-600 font-bold' : 'text-slate-500'}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alamat' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={18} className="text-blue-500" />
              Alamat Lengkap
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <DetailRow icon={MapPin} label="Alamat Jalan" value={c.alamat} />
                <DetailRow icon={MapPin} label="Kecamatan" value={c.kecamatan} />
                <DetailRow icon={MapPin} label="Kota / Kabupaten" value={c.kota} />
              </div>
              <div className="space-y-1">
                <DetailRow icon={MapPin} label="Provinsi" value={c.provinsi} />
                <DetailRow icon={MapPin} label="Negara" value={c.negara} />
                <DetailRow icon={MapPin} label="Kode Pos" value={c.kode_pos} />
              </div>
            </div>

            {alamatKosong.length > 0 && (
              <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-4">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm">
                  <p className="font-bold">Informasi Alamat Belum Lengkap</p>
                  <p className="mt-1 text-slate-600">
                    Beberapa detail belum diisi: <span className="font-semibold">{alamatKosong.join(', ')}</span>.
                    Ini bisa terjadi jika pelanggan di-import. Anda bisa melengkapinya melalui menu <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => onEdit(c)}>Ubah</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'catatan' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Riwayat & Catatan Pelanggan
              </h3>
              <button
                onClick={onAddNote}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} /> Tambah Catatan
              </button>
            </div>

            {catatanPelanggan.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Belum Ada Catatan</p>
                <p className="text-xs text-slate-500 mt-1">Gunakan catatan untuk melacak kebutuhan, permintaan, atau keluhan khusus pelanggan ini.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-100 space-y-6">
                {catatanPelanggan.map((n) => (
                  <div key={n.id} className="relative">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center shadow-sm animate-pulse" />
                    
                    <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100/50 transition-colors border border-slate-100">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{n.judul || '(Tanpa Judul)'}</span>
                        <span className="text-xs text-slate-400 font-medium bg-white px-2 py-0.5 rounded border border-slate-100">{formatDisplayDate(n.tanggal)}</span>
                      </div>
                      
                      {n.entries?.length > 0 ? (
                        <p className="text-xs md:text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">{n.entries[0].content}</p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-2 italic">Entri catatan kosong.</p>
                      )}
                      
                      {(n.tags || []).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-3">
                          {n.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/50">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
