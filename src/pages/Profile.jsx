import { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { User, Save, Upload, Briefcase, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { updateUser } = useAuth();
  
  const [profile, setProfile] = useState({
    username: "",
    role: "",
    divisi_nama: "",
    no_hp: "",
    kota: "",
    negara: "",
    alamat: "",
    bio: "",
    foto_profil: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/users/me/");
      setProfile(res.data);
    } catch (err) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Buat local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMsg("");
      
      // Menggunakan FormData karena kita mengirim file fisik
      const formData = new FormData();
      formData.append("no_hp", profile.no_hp || "");
      formData.append("kota", profile.kota || "");
      formData.append("negara", profile.negara || "");
      formData.append("alamat", profile.alamat || "");
      formData.append("bio", profile.bio || "");
      
      if (selectedFile) {
        formData.append("foto_profil", selectedFile);
      }

      const res = await apiClient.patch("/users/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setProfile(res.data); // Update dengan foto baru dari backend
      updateUser(res.data); // Update context global (sidebar dll)
      setSuccessMsg("Profil berhasil diperbarui!");
      setTimeout(() => setSuccessMsg(""), 3000);
      
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      alert("Gagal menyimpan profil. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  // Menentukan URL gambar yang akan dirender (Preview Lokal vs Foto dari Server)
  // Perhatikan: jika URL dari backend sudah lengkap HTTP, tidak perlu prepend URL base lagi
  let serverAvatar = null;
  if (profile.foto_profil) {
    serverAvatar = profile.foto_profil.startsWith('http') 
      ? profile.foto_profil 
      : `http://127.0.0.1:8000${profile.foto_profil}`;
  }
  const displayAvatar = previewUrl || serverAvatar;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profil Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola informasi pribadi dan atur foto profil Anda.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Avatar & Info Singkat */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            
            {/* Foto Profil Area */}
            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center transition-all group-hover:brightness-90">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-400" />
                )}
              </div>
              
              {/* Overlay Upload */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={24} className="text-white" />
              </div>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors mb-2"
            >
              Ubah Foto
            </button>
            
            <h2 className="text-xl font-bold text-slate-900 capitalize">{profile.username}</h2>
            <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 mt-1 capitalize">
              <Briefcase size={14} />
              {profile.role} {profile.divisi_nama ? `- ${profile.divisi_nama}` : ''}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Data Diri */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Informasi Akun</h2>
          
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nomor HP / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={profile.no_hp || ""}
                    onChange={(e) => setProfile({...profile, no_hp: e.target.value})}
                    placeholder="0812..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kota</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={profile.kota || ""}
                    onChange={(e) => setProfile({...profile, kota: e.target.value})}
                    placeholder="Jakarta"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
              <textarea
                rows="2"
                value={profile.alamat || ""}
                onChange={(e) => setProfile({...profile, alamat: e.target.value})}
                placeholder="Jl. Contoh No. 123..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Bio Singkat</label>
              <textarea
                rows="2"
                value={profile.bio || ""}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Saya ahli dalam mendesain..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white shadow hover:bg-indigo-700 h-10 px-6 disabled:opacity-70"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
