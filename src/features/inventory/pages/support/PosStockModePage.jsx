import { useState } from 'react';
import { Button, PageHeader } from '../components/PageShell';

const MODES = [
  { id: 'auto', label: 'Kurangi stok otomatis', desc: 'Stok berkurang otomatis setiap transaksi POS terjadi.' },
  { id: 'manual', label: 'Kurangi stok manual', desc: 'Stok hanya berubah lewat dokumen stok (masuk/keluar/opname).' },
  { id: 'off', label: 'Tanpa pelacakan stok', desc: 'POS tidak melacak stok untuk produk apa pun.' },
];

export function PosStockModePage() {
  const [mode, setMode] = useState('auto');
  return (
    <>
      <PageHeader
        title="Mode Stok POS"
        description="Atur bagaimana stok diperlakukan saat transaksi di Point of Sale (POS)."
        actions={<Button variant="success">Simpan</Button>}
      />
      <div className="pi-settings-grid">
        {MODES.map((m) => (
          <label key={m.id} className="pi-checkbox-line">
            <input
              type="radio"
              name="pos-stock-mode"
              value={m.id}
              checked={mode === m.id}
              onChange={() => setMode(m.id)}
            />
            <span>
              <strong>{m.label}</strong>
              <br />
              <span className="pi-muted">{m.desc}</span>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}
