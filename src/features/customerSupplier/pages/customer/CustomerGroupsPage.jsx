import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../../inventory/pages/components/DataTable';
import { Button, PageHeader, Toolbar } from '../../../inventory/pages/components/PageShell';
import { customerGroupSeed } from '../customerSupplierData';

const emptyForm = { name: '', discount: '' };

export function CustomerGroupsPage() {
  const [groups, setGroups] = useState(customerGroupSeed);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())),
    [groups, query],
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      window.alert('Nama grup wajib diisi.');
      return;
    }
    setGroups((prev) => [
      ...prev,
      { id: `CG-${String(prev.length + 1).padStart(2, '0')}`, name: form.name.trim(), discount: Number(form.discount) || 0, members: 0 },
    ]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus grup ini?')) setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Grup Pelanggan"
        description="Kelompokkan pelanggan untuk menerapkan diskon khusus per grup."
        actions={
          <Button variant="success" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> {showForm ? 'Tutup' : 'Tambah Grup'}
          </Button>
        }
      />
      {showForm && (
        <form className="pi-inline-form" onSubmit={handleAdd}>
          <div className="pi-form-group">
            <label>Nama Grup</label>
            <input value={form.name} onChange={set('name')} placeholder="Nama grup" />
          </div>
          <div className="pi-form-group">
            <label>Diskon (%)</label>
            <input type="number" value={form.discount} onChange={set('discount')} placeholder="0" />
          </div>
          <Button type="submit" variant="primary">Simpan</Button>
        </form>
      )}
      <Toolbar searchPlaceholder="Cari grup" searchValue={query} onSearchChange={setQuery} />
      <DataTable
        rows={filtered}
        emptyText="Belum ada grup pelanggan"
        columns={[
          { key: 'name', label: 'Nama Grup' },
          { key: 'discount', label: 'Diskon', render: (r) => `${r.discount}%` },
          { key: 'members', label: 'Jumlah Anggota' },
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
