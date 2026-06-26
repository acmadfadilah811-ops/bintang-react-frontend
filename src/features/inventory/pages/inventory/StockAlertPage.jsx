import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export function StockAlertPage() {
  const [emailList, setEmailList] = useState([
    { email: 'bayumaruf1410@gmail.com' }
  ]);
  const [newEmail, setNewEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    if (emailList.some(item => item.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      alert('Email ini sudah terdaftar.');
      return;
    }
    setEmailList([...emailList, { email: newEmail.trim() }]);
    setNewEmail('');
    setShowAddForm(false);
  };

  const handleDeleteEmail = (email) => {
    setEmailList(emailList.filter(item => item.email !== email));
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Email Peringatan Stok</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Daftar email penerima peringatan stok rendah setiap pagi.</p>
        </div>
      </div>

      {/* Info Description banner */}
      <div style={{ display: 'flex', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', color: '#1e3a8a', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
        <span style={{ fontSize: '16px' }}>ⓘ</span>
        <div>
          <strong style={{ display: 'block', marginBottom: '2px' }}>Peringatan Stok:</strong>
          <span>Setiap pagi, system akan mengirimkan "Peringatan Sisa Stok" ke email-email penerima di bawah ini. Kosongkan jika Anda tidak ingin menerima peringatan ini via email.</span>
        </div>
      </div>

      {/* Main panel */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Email Penerima</span>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#3b82f6', border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
          >
            <Plus size={14} />
            <span>Tambah</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddEmail} style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="email"
              placeholder="Masukkan email penerima"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
            />
            <button type="submit" style={{ background: '#22c55e', border: 0, color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
              Simpan
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
              Batal
            </button>
          </form>
        )}

        <div style={{ padding: '0px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Email Penerima</th>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#475569', width: '80px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {emailList.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Belum ada email penerima. Klik Tambah untuk memasukkan email.
                  </td>
                </tr>
              ) : (
                emailList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 'semibold', color: '#334155' }}>{item.email}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteEmail(item.email)}
                        style={{ background: 'transparent', border: 0, color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
