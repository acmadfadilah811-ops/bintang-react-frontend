import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../../inventory/pages/components/DataTable';
import { Button, PageHeader, StatusBadge, Toolbar } from '../../../inventory/pages/components/PageShell';
import { customerGroupOptions, customerSeed, formatCurrency } from '../customerSupplierData';

const emptyForm = { name: '', phone: '', email: '', group: 'Reguler', deposit: '' };

export function CustomersPage() {
  const [items, setItems] = useState(customerSeed);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      items.filter((it) =>
        `${it.name} ${it.phone} ${it.email}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [items, query],
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      window.alert('Nama pelanggan wajib diisi.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `CUST-${String(prev.length + 1).padStart(3, '0')}`,
        name: form.name.trim(),
        phone: form.phone.trim() || '-',
        email: form.email.trim() || '-',
        group: form.group,
        deposit: Number(form.deposit) || 0,
        active: true,
      },
    ]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus pelanggan ini?')) setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Daftar Pelanggan"
        description="Kelola data pelanggan, grup, dan saldo deposit."
        actions={
          <Button variant="success" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> {showForm ? 'Tutup' : 'Tambah Pelanggan'}
          </Button>
        }
      />
      {showForm && (
        <form className="pi-inline-form" onSubmit={handleAdd}>
          <div className="pi-form-group">
            <label>Nama</label>
            <input value={form.name} onChange={set('name')} placeholder="Nama pelanggan" />
          </div>
          <div className="pi-form-group">
            <label>Telepon</label>
            <input value={form.phone} onChange={set('phone')} placeholder="08xx / 021" />
          </div>
          <div className="pi-form-group">
            <label>Email</label>
            <input value={form.email} onChange={set('email')} placeholder="email@contoh.com" />
          </div>
          <div className="pi-form-group">
            <label>Grup</label>
            <select value={form.group} onChange={set('group')}>
              {customerGroupOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="pi-form-group">
            <label>Saldo Deposit</label>
            <input type="number" value={form.deposit} onChange={set('deposit')} placeholder="0" />
          </div>
          <Button type="submit" variant="primary">Simpan</Button>
        </form>
      )}
      <Toolbar searchPlaceholder="Cari nama / telepon / email" searchValue={query} onSearchChange={setQuery} />
      <DataTable
        rows={filtered}
        emptyText="Belum ada pelanggan"
        columns={[
          { key: 'name', label: 'Nama' },
          { key: 'phone', label: 'Telepon' },
          { key: 'email', label: 'Email' },
          { key: 'group', label: 'Grup' },
          { key: 'deposit', label: 'Saldo Deposit', render: (r) => formatCurrency(r.deposit) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge active={r.active} /> },
          {
            key: 'aksi',
            label: '',
            render: (r) => (
              <button type="button" className="pi-icon-button" onClick={() => handleDelete(r.id)} aria-label="Hapus">
                <Trash2 size={16} />
              </button>
            ),
          },
        ]}
      />
    </>
  );
}
