import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../../inventory/pages/components/DataTable';
import { Button, PageHeader, StatusBadge, Toolbar } from '../../../inventory/pages/components/PageShell';
import { supplierSeed } from '../customerSupplierData';

const emptyForm = { name: '', contact: '', phone: '', address: '' };

export function SuppliersPage() {
  const [items, setItems] = useState(supplierSeed);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      items.filter((it) =>
        `${it.name} ${it.contact} ${it.phone}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [items, query],
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      window.alert('Nama supplier wajib diisi.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `SUP-${String(prev.length + 1).padStart(3, '0')}`,
        name: form.name.trim(),
        contact: form.contact.trim() || '-',
        phone: form.phone.trim() || '-',
        address: form.address.trim() || '-',
        active: true,
      },
    ]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus supplier ini?')) setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Daftar Supplier"
        description="Kelola data supplier / pemasok bahan baku dan jasa."
        actions={
          <Button variant="success" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> {showForm ? 'Tutup' : 'Tambah Supplier'}
          </Button>
        }
      />
      {showForm && (
        <form className="pi-inline-form" onSubmit={handleAdd}>
          <div className="pi-form-group">
            <label>Nama Supplier</label>
            <input value={form.name} onChange={set('name')} placeholder="Nama supplier" />
          </div>
          <div className="pi-form-group">
            <label>Kontak (PIC)</label>
            <input value={form.contact} onChange={set('contact')} placeholder="Nama kontak" />
          </div>
          <div className="pi-form-group">
            <label>Telepon</label>
            <input value={form.phone} onChange={set('phone')} placeholder="08xx / 021" />
          </div>
          <div className="pi-form-group">
            <label>Alamat</label>
            <input value={form.address} onChange={set('address')} placeholder="Alamat" />
          </div>
          <Button type="submit" variant="primary">Simpan</Button>
        </form>
      )}
      <Toolbar searchPlaceholder="Cari supplier / kontak / telepon" searchValue={query} onSearchChange={setQuery} />
      <DataTable
        rows={filtered}
        emptyText="Belum ada supplier"
        columns={[
          { key: 'name', label: 'Nama Supplier' },
          { key: 'contact', label: 'Kontak' },
          { key: 'phone', label: 'Telepon' },
          { key: 'address', label: 'Alamat' },
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
