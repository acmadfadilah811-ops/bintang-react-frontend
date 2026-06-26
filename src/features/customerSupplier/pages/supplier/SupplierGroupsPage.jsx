import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../../inventory/pages/components/DataTable';
import { Button, PageHeader, Toolbar } from '../../../inventory/pages/components/PageShell';
import { supplierGroupSeed } from '../customerSupplierData';

export function SupplierGroupsPage() {
  const [groups, setGroups] = useState(supplierGroupSeed);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const filtered = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())),
    [groups, query],
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      window.alert('Nama grup wajib diisi.');
      return;
    }
    setGroups((prev) => [...prev, { id: `SG-${String(prev.length + 1).padStart(2, '0')}`, name: name.trim(), members: 0 }]);
    setName('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus grup ini?')) setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Grup Supplier"
        description="Kelompokkan supplier berdasarkan jenis pasokan."
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama grup" />
          </div>
          <Button type="submit" variant="primary">Simpan</Button>
        </form>
      )}
      <Toolbar searchPlaceholder="Cari grup" searchValue={query} onSearchChange={setQuery} />
      <DataTable
        rows={filtered}
        emptyText="Belum ada grup supplier"
        columns={[
          { key: 'name', label: 'Nama Grup' },
          { key: 'members', label: 'Jumlah Supplier' },
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
