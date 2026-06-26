import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../../inventory/pages/components/DataTable';
import { Button, PageHeader, StatusBadge, Toolbar } from '../../../inventory/pages/components/PageShell';
import { membershipSeed } from '../customerSupplierData';

export function MembershipPage() {
  const [members, setMembers] = useState(membershipSeed);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => members.filter((m) => `${m.name} ${m.tier}`.toLowerCase().includes(query.trim().toLowerCase())),
    [members, query],
  );

  const addPoints = (id) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, points: m.points + 100 } : m)));

  return (
    <>
      <PageHeader
        title="Membership & Poin"
        description="Pantau tier membership dan poin loyalitas pelanggan."
      />
      <Toolbar searchPlaceholder="Cari member / tier" searchValue={query} onSearchChange={setQuery} />
      <DataTable
        rows={filtered}
        emptyText="Belum ada member"
        columns={[
          { key: 'name', label: 'Nama Member' },
          { key: 'tier', label: 'Tier', render: (r) => <StatusBadge active label={r.tier} /> },
          { key: 'points', label: 'Poin' },
          { key: 'joined', label: 'Bergabung' },
          {
            key: 'aksi',
            label: '',
            render: (r) => (
              <button type="button" className="pi-btn pi-btn-info" onClick={() => addPoints(r.id)}>
                <Plus size={14} /> 100 Poin
              </button>
            ),
          },
        ]}
      />
    </>
  );
}
