/**
 * Helper to serialize and deserialize order metadata stored inside the DB's `catatan_pelanggan` text.
 * This avoids needing a database migration while keeping metadata synced across devices.
 */

export const defaultMetadata = {
  customerEmail: '',
  customerAddress: '',
  shippingCourier: '-',
  shippingService: '-',
  shippingDate: '-',
  dropshipStore: '-',
  dropshipSender: '-',
  dropshipPhone: '-',
  posStaff: '-',
  dueDate: '-',
  invoiceFooter: 'Terima kasih atas pesanan Anda',
  catatan: ''
};

export const parseOrderMetadata = (catatanPelanggan) => {
  if (!catatanPelanggan) return { ...defaultMetadata };

  // Look for the metadata JSON tag [METADATA: {...}]
  const match = catatanPelanggan.match(/\[METADATA:\s*({.*?})\]/s);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      // Remove the metadata tag from the note text to display the clean customer note
      const cleanNotes = catatanPelanggan.replace(/\[METADATA:\s*({.*?})\]\n?/s, '').trim();
      return {
        ...defaultMetadata,
        ...parsed,
        catatan: cleanNotes || 'Tidak ada'
      };
    } catch (e) {
      console.error('Failed to parse order metadata JSON:', e);
    }
  }

  // Fallback if no tag: treat the whole text as the customer note
  return {
    ...defaultMetadata,
    catatan: catatanPelanggan.trim() || 'Tidak ada'
  };
};

export const serializeOrderMetadata = (meta, cleanNotesText) => {
  const { catatan, ...rest } = meta;
  const jsonStr = JSON.stringify(rest);
  const notesPart = (cleanNotesText !== undefined ? cleanNotesText : catatan) || '';
  return `[METADATA: ${jsonStr}]\n${notesPart.trim()}`.trim();
};
