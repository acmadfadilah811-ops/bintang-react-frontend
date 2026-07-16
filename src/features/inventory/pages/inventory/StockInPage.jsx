import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Calendar, Printer, X, Plus, CloudUpload, Download, Check, ChevronsUpDown, ArrowLeft, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '../../../../api/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { todayISO, startOfYearISO } from '../../../../utils/date';

const getLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiBase = (import.meta.env.VITE_API_URL || 'https://bintang-adv.duckdns.org/api').replace('/api', '');
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
};

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const STATUS_LABEL = { draft: 'Draft', selesai: 'Selesai', batal: 'Batal' };

// Batas baris import CSV — harus sama dengan batas di backend
// (StockInDocumentViewSet.import_csv) supaya user tidak ditolak server
// setelah preview terlanjur bilang aman.
const CSV_MAX_ROWS = 200;
// Kolom template resmi: product,variant,sku,supplier,qty,new_buy_price,rack
const CSV_PREVIEW_COLUMNS = [
  { key: 'product', label: 'Produk' },
  { key: 'variant', label: 'Varian' },
  { key: 'sku', label: 'SKU' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'qty', label: 'Qty' },
  { key: 'new_buy_price', label: 'Harga Beli' },
  { key: 'rack', label: 'Rak' },
];

const formatDisplayDate = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(`${isoStr}T00:00:00`);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${MONTHS_ID[d.getMonth()]}-${d.getFullYear()}`;
};

const getFileSizeStr = (size) => {
  if (!size) return '0.0 KB';
  const kb = size / 1024;
  return `${kb.toFixed(1)} KB`;
};

const truncateFilename = (name) => {
  if (!name) return '';
  if (name.length <= 25) return name;
  return name.slice(0, 18) + '...';
};

const mapDocToRow = (doc) => ({
  id: doc.id,
  no: doc.nomor,
  from: doc.nama_penerima || '-',
  supplier: doc.supplier || '-',
  date: formatDisplayDate(doc.tanggal),
  note: doc.catatan || '-',
  status: STATUS_LABEL[doc.status] || doc.status,
  receivedBy: doc.dibuat_oleh_nama || '-',
  // Nilai mentah (bukan untuk tampilan) — dipakai saat export XLSX agar cocok kolom asli Olsera
  supplierRaw: doc.supplier || '',
  tanggalRaw: doc.tanggal || '',
  noteRaw: doc.catatan || '',
  receiverNameRaw: doc.nama_penerima || '',
  receivedByRaw: doc.dibuat_oleh_nama || '',
});

const formatCurrencyRp = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

export function StockInPage({ onToggleCreate, viewState: propViewState }) {
  const { businessSettings } = useAuth();
  const [viewState, setViewState] = useState('list'); // 'list', 'create', 'detail'

  useEffect(() => {
    if (propViewState) {
      setViewState(propViewState);
    }
  }, [propViewState]);

  const [showTambahDropdown, setShowTambahDropdown] = useState(false);
  const [showPembelianModal, setShowPembelianModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  // Preview CSV: baris di-parse di browser DULU supaya user bisa memeriksa
  // datanya sebelum dokumen dibuat di server (mencegah draft sampah).
  const [previewRows, setPreviewRows] = useState([]);
  const [previewIssues, setPreviewIssues] = useState([]);
  // Daftar nama supplier (huruf kecil) untuk validasi preview.
  // null = belum/gagal dimuat -> validasi supplier dilewati di sini dan
  // diserahkan ke backend, supaya user tidak diblokir tanpa alasan jelas.
  const [supplierNames, setSupplierNames] = useState(null);

  // Stock List State (dari API)
  const [stockList, setStockList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const fetchDocuments = async () => {
    setListLoading(true);
    try {
      const res = await apiClient.get('/stock-in-documents/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setStockList(data.map(mapDocToRow));
    } catch (err) {
      console.error('[StockInPage] fetch documents error:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Form State
  // Supplier & nama penerima sengaja tidak ada di form create — diisi lewat
  // tombol Ubah di halaman detail (dokumen dibuat sebagai draft dulu).
  const [tanggal, setTanggal] = useState(todayISO());
  const [catatan, setCatatan] = useState('');

  const [searchPembelian, setSearchPembelian] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchListQuery, setSearchListQuery] = useState('');
  const [itemSaving, setItemSaving] = useState(false);

  // Qty Counter State for Detail Product Add
  const [qtyValue, setQtyValue] = useState(1);
  const [productHargaBeli, setProductHargaBeli] = useState('0');

  // Active Detail Document (for Staging / Detail screen) — dokumen mentah dari API
  const [activeDetailDoc, setActiveDetailDoc] = useState(null);

  useEffect(() => {
    if (!searchProduct.trim()) {
      setProductOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await apiClient.get('/products/', { params: { search: searchProduct } });
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setProductOptions(data);
      } catch (err) {
        console.error('[StockInPage] search product error:', err);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchProduct]);

  const fetchDocumentDetail = async (id) => {
    const res = await apiClient.get(`/stock-in-documents/${id}/`);
    setActiveDetailDoc(res.data);
    return res.data;
  };

  // Sort & Pagination State
  const [sortKey, setSortKey] = useState('no');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dropdown Cetak (Cetak / Cetak A5)
  const [cetakMenuOpen, setCetakMenuOpen] = useState(false);

  // Inline editing states for Detail Metadata Cards
  const [isEditingTanggal, setIsEditingTanggal] = useState(false);
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [isEditingNamaPenerima, setIsEditingNamaPenerima] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);

  // Inline edit input value states
  const [editTanggalValue, setEditTanggalValue] = useState('');
  const [editCatatanValue, setEditCatatanValue] = useState('');
  const [editNamaPenerimaValue, setEditNamaPenerimaValue] = useState('');
  const [editSupplierValue, setEditSupplierValue] = useState('');

  const [validationError, setValidationError] = useState('');
  const [startDate, setStartDate] = useState(startOfYearISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  // Table container reference and horizontal scroll handler
  const tableContainerRef = useRef(null);

  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      const scrollAmount = 180;
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Draggable resizable columns widths state
  const [columnWidths, setColumnWidths] = useState({
    no: 180,
    from: 180,
    supplier: 180,
    date: 150,
    note: 180,
    status: 120,
    receivedBy: 180
  });

  const handleResizeStart = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey];

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [colKey]: Math.max(80, startWidth + deltaX)
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchListQuery, pageSize]);

  const handleStateChange = (state) => {
    setViewState(state);
    if (onToggleCreate) {
      onToggleCreate(state);
    }
    if (state === 'list') {
      fetchDocuments();
    }
  };

  // Buat dokumen draft baru di backend, lalu lanjut ke layar staging produk
  const handleStageStock = async () => {
    try {
      // nama_penerima & supplier tidak dikirim di sini — keduanya opsional di
      // model (blank, default '') dan diisi lewat Ubah di halaman detail.
      const res = await apiClient.post('/stock-in-documents/', {
        tanggal,
        catatan,
      });
      setActiveDetailDoc(res.data);
      handleStateChange('detail');

      setTanggal(todayISO());
      setCatatan('');
    } catch (err) {
      console.error('[StockInPage] create document error:', err);
      setValidationError('Gagal membuat dokumen stok masuk.');
    }
  };

  // Import CSV: buat dokumen draft baru lalu proses file CSV sekaligus
  // Muat daftar supplier saat modal import dibuka, supaya preview bisa
  // memperingatkan supplier tak dikenal sebelum file diunggah.
  useEffect(() => {
    if (!showImportModal) return undefined;
    let dibatalkan = false;
    (async () => {
      try {
        const res = await apiClient.get('/suppliers/');
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (!dibatalkan) {
          setSupplierNames(new Set(list.map((s) => String(s.nama || '').trim().toLowerCase())));
        }
      } catch (err) {
        console.error('[StockInPage] gagal memuat daftar supplier:', err);
        if (!dibatalkan) setSupplierNames(null);
      }
    })();
    return () => { dibatalkan = true; };
  }, [showImportModal]);

  // Baca & periksa CSV di browser sebelum apa pun dikirim ke server.
  // Aturan validasinya sengaja dibuat mengikuti backend (import_csv):
  // produk dicocokkan lewat sku ATAU nama, qty wajib angka > 0.
  const parseCsvPreview = async (file) => {
    try {
      const text = await file.text();
      const wb = XLSX.read(text, { type: 'string', raw: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).map((row) => {
        const lower = {};
        Object.keys(row).forEach((k) => {
          lower[String(k).trim().toLowerCase()] = String(row[k] ?? '').trim();
        });
        return lower;
      });

      const issues = [];
      if (rows.length === 0) issues.push('File tidak berisi baris data.');
      if (rows.length > CSV_MAX_ROWS) {
        issues.push(`Maksimal ${CSV_MAX_ROWS} baris — file ini berisi ${rows.length} baris.`);
      }
      rows.forEach((row, i) => {
        const baris = i + 2; // baris 1 = header
        if (!row.sku && !row.product) {
          issues.push(`Baris ${baris}: kolom "product" atau "sku" wajib diisi.`);
        }
        const qty = Number(String(row.qty ?? '').replace(',', '.'));
        if (!row.qty || Number.isNaN(qty)) {
          issues.push(`Baris ${baris}: qty "${row.qty || ''}" bukan angka.`);
        } else if (qty <= 0) {
          issues.push(`Baris ${baris}: qty harus lebih besar dari 0.`);
        }
      });

      // Supplier yang diisi harus sudah terdaftar (backend juga menolak).
      // Kolom kosong tetap boleh — template resmi pun mencontohkan begitu.
      if (supplierNames) {
        const takDikenal = [...new Set(rows.map((r) => r.supplier).filter(Boolean))]
          .filter((nama) => !supplierNames.has(nama.toLowerCase()));
        if (takDikenal.length > 0) {
          issues.push(
            `Supplier belum terdaftar: ${takDikenal.map((n) => `"${n}"`).join(', ')}. `
            + 'Tambahkan dulu lewat menu Pelanggan & Supplier, atau kosongkan kolom supplier.'
          );
        }
      }

      setPreviewRows(rows);
      setPreviewIssues(issues);
    } catch (err) {
      console.error('[StockInPage] parse csv preview error:', err);
      setPreviewRows([]);
      setPreviewIssues(['Gagal membaca file. Pastikan berformat CSV (UTF-8).']);
    }
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportResult(null);
    setPreviewRows([]);
    setPreviewIssues([]);
  };

  const handleImportCsv = async () => {
    if (!importFile || importing) return;
    if (previewIssues.length > 0 || previewRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const docRes = await apiClient.post('/stock-in-documents/', {
        tanggal: todayISO(),
        catatan: 'Import CSV',
      });
      const docId = docRes.data.id;

      const fd = new FormData();
      fd.append('file', importFile);
      const importRes = await apiClient.post(`/stock-in-documents/${docId}/import-csv/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult({ errors: importRes.data.errors || [], createdCount: importRes.data.created?.length || 0 });
      setActiveDetailDoc(importRes.data.document);
      setImportFile(null);
      setPreviewRows([]);
      setPreviewIssues([]);
      if ((importRes.data.created?.length || 0) > 0) {
        setShowImportModal(false);
        handleStateChange('detail');
      }
    } catch (err) {
      console.error('[StockInPage] import csv error:', err);
      setImportResult({ errors: [err.response?.data?.error || 'Gagal mengimpor file CSV.'], createdCount: 0 });
    } finally {
      setImporting(false);
    }
  };

  // Draft = kembali ke daftar (dokumen sudah otomatis tersimpan sbg draft di backend)
  // Batal = panggil action cancel
  // Selesai = panggil action post-document (validasi header & item dilakukan backend)
  const handleCommitStockIn = async (targetStatus) => {
    if (targetStatus === 'Draft') {
      handleStateChange('list');
      return;
    }
    try {
      if (targetStatus === 'Batal') {
        await apiClient.post(`/stock-in-documents/${activeDetailDoc.id}/cancel/`);
      } else if (targetStatus === 'Selesai') {
        await apiClient.post(`/stock-in-documents/${activeDetailDoc.id}/post-document/`);
      }
      handleStateChange('list');
    } catch (err) {
      const message = err.response?.data?.error || 'Gagal memproses dokumen stok masuk.';
      setValidationError(message);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleExport = (rows) => {
    // Kolom & urutan persis file export asli Olsera (stockincoming-*.xlsx):
    // no, supplier, transfer from, date, notes, status, received by, receiver name
    const data = rows.map((row) => ({
      no: row.no,
      supplier: row.supplierRaw,
      'transfer from': '',
      date: row.tanggalRaw,
      notes: row.noteRaw,
      status: row.status,
      'received by': row.receivedByRaw,
      'receiver name': row.receiverNameRaw,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `stockincoming-${startDate}__${endDate}.xlsx`);
  };

  // Sorting and Filtering logic
  const filteredList = stockList.filter(row => {
    const q = searchListQuery.toLowerCase();
    
    // Parse the row date (DD-MMM-YYYY format, e.g. 25-Jun-2026)
    let matchesDate = true;
    if (row.date) {
      const parts = row.date.split('-');
      if (parts.length === 3) {
        const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
        const rowDate = new Date(parts[2], months[parts[1]] || 0, parts[0]);
        
        // Start and end dates are YYYY-MM-DD
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        matchesDate = rowDate >= start && rowDate <= end;
      }
    }

    return (
      matchesDate &&
      (row.no.toLowerCase().includes(q) ||
       row.from.toLowerCase().includes(q) ||
       row.supplier.toLowerCase().includes(q) ||
       row.note.toLowerCase().includes(q))
    );
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal = a[sortKey] || '';
    let bVal = b[sortKey] || '';

    if (sortKey === 'date') {
      // Parse DD-MMM-YYYY format
      const parseDate = (dStr) => {
        const parts = dStr.split('-');
        if (parts.length < 3) return new Date(0);
        const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
        return new Date(parts[2], months[parts[1]] || 0, parts[0]);
      };
      aVal = parseDate(aVal).getTime();
      bVal = parseDate(bVal).getTime();
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sortedList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = sortedList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Date Range Picker helpers
  const getFormattedRange = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const parse = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    };
    return `${parse(startDate)} - ${parse(endDate)}`;
  };

  const handleShiftDate = (direction) => {
    setSelectedPreset('custom');
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const shiftDays = direction * diffDays;
    
    const newStart = new Date(start.setDate(start.getDate() + shiftDays));
    const newEnd = new Date(end.setDate(end.getDate() + shiftDays));
    
    const toISO = (d) => d.toISOString().split('T')[0];
    setStartDate(toISO(newStart));
    setEndDate(toISO(newEnd));
  };

  const handlePresetSelect = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (preset) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7':
        start.setDate(today.getDate() - 6);
        break;
      case 'last30':
        start.setDate(today.getDate() - 29);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }
    
    const toISO = (d) => d.toISOString().split('T')[0];
    setStartDate(toISO(start));
    setEndDate(toISO(end));
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  // inline updates — PATCH langsung ke dokumen (hanya berlaku saat status draft)
  const patchDocument = async (payload) => {
    try {
      const res = await apiClient.patch(`/stock-in-documents/${activeDetailDoc.id}/`, payload);
      setActiveDetailDoc(res.data);
    } catch (err) {
      console.error('[StockInPage] patch document error:', err);
      setValidationError(err.response?.data?.error || 'Gagal menyimpan perubahan.');
    }
  };

  const saveInlineTanggal = async () => {
    await patchDocument({ tanggal: editTanggalValue });
    setIsEditingTanggal(false);
  };

  const saveInlineCatatan = async () => {
    await patchDocument({ catatan: editCatatanValue });
    setIsEditingCatatan(false);
  };

  const saveInlineNamaPenerima = async () => {
    await patchDocument({ nama_penerima: editNamaPenerimaValue });
    setIsEditingNamaPenerima(false);
  };

  const saveInlineSupplier = async () => {
    await patchDocument({ supplier: editSupplierValue });
    setIsEditingSupplier(false);
  };

  const handleAddItem = async () => {
    if (!selectedProduct || itemSaving) return;
    setItemSaving(true);
    try {
      await apiClient.post(`/stock-in-documents/${activeDetailDoc.id}/add-item/`, {
        product: selectedProduct.id,
        qty: qtyValue,
        harga_beli: parseFloat(productHargaBeli) || 0,
      });
      await fetchDocumentDetail(activeDetailDoc.id);
      setSelectedProduct(null);
      setSearchProduct('');
      setProductOptions([]);
      setQtyValue(1);
      setProductHargaBeli('0');
    } catch (err) {
      console.error('[StockInPage] add item error:', err);
      setValidationError(err.response?.data?.error || 'Gagal menambah produk.');
    } finally {
      setItemSaving(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await apiClient.post(`/stock-in-documents/${activeDetailDoc.id}/remove-item/`, { item_id: itemId });
      setActiveDetailDoc(res.data);
    } catch (err) {
      console.error('[StockInPage] remove item error:', err);
      setValidationError(err.response?.data?.error || 'Gagal menghapus produk.');
    }
  };

  const handleCetak = (paper = 'A4') => {
    if (!activeDetailDoc) return;
    const isA5 = paper === 'A5';
    const doc = activeDetailDoc;
    const esc = (v) => String(v ?? '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const fmtRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0).replace('Rp', 'IDR');
    const namaBisnis = businessSettings?.nama_bisnis || '';
    const logoUrl = getLogoUrl(businessSettings?.logo_url);
    let totalQty = 0;
    let totalJumlah = 0;
    const rows = (doc.items || []).map((item, i) => {
      const qty = Number(item.qty) || 0;
      const jumlah = (Number(item.harga_beli) || 0) * qty;
      totalQty += qty;
      totalJumlah += jumlah;
      return `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(item.product_nama)}${item.product_sku ? ` (${esc(item.product_sku)})` : ''}${item.rak ? ` — Rak ${esc(item.rak)}` : ''}</td>
        <td style="text-align:right">${qty} ${esc(item.product_satuan || '')}</td>
        <td style="text-align:right">${fmtRp(item.harga_beli)}</td>
        <td style="text-align:right">${fmtRp(jumlah)}</td>
      </tr>`;
    }).join('');
    const infoExtra = [
      doc.nama_penerima ? `Nama Penerima: ${esc(doc.nama_penerima)}` : '',
      doc.supplier ? `Supplier: ${esc(doc.supplier)}` : '',
      doc.catatan ? `Catatan: ${esc(doc.catatan)}` : '',
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(doc.nomor)}</title>
      <style>
        @page { size: ${paper}; margin: ${isA5 ? '8mm' : '14mm'}; }
        body { font-family: Arial, sans-serif; font-size: ${isA5 ? '10px' : '13px'}; color: #111; margin: 0; }
        .logo-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: ${isA5 ? '8px' : '16px'}; margin-bottom: ${isA5 ? '8px' : '16px'}; min-height: ${isA5 ? '34px' : '60px'}; display: flex; align-items: center; }
        .logo-box img { max-height: ${isA5 ? '30px' : '56px'}; max-width: ${isA5 ? '100px' : '160px'}; object-fit: contain; }
        .doc-title { font-size: ${isA5 ? '12px' : '15px'}; margin: 0 0 4px; }
        .doc-title .biz { font-size: ${isA5 ? '10px' : '12px'}; color: #555; margin-left: 6px; }
        .tanggal { margin: 6px 0 4px; }
        .info-extra { color: #666; font-size: ${isA5 ? '9px' : '11px'}; margin-bottom: 10px; }
        table.items { border-collapse: collapse; width: 100%; margin-top: ${isA5 ? '6px' : '10px'}; }
        table.items th, table.items td { border: 1px solid #999; padding: ${isA5 ? '3px 5px' : '6px 8px'}; text-align: left; }
        table.items th { background: #f8fafc; }
        .foot { margin-top: ${isA5 ? '12px' : '24px'}; color: #999; font-size: ${isA5 ? '8px' : '10px'}; }
      </style></head><body>
      <div class="logo-box">${logoUrl ? `<img src="${esc(logoUrl)}" alt="logo">` : ''}</div>
      <p class="doc-title">No. Stok Masuk #${esc(doc.nomor)}<span class="biz">${esc(namaBisnis)}</span></p>
      <p class="tanggal"><strong>Tanggal</strong> : ${esc(doc.tanggal)}</p>
      ${infoExtra ? `<p class="info-extra">${infoExtra}</p>` : ''}
      <table class="items">
        <thead><tr><th>#</th><th>Produk</th><th style="text-align:right">Qty</th><th style="text-align:right">Harga Beli</th><th style="text-align:right">Jumlah</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Tidak ada produk</td></tr>'}</tbody>
        <tfoot><tr><td colspan="2" style="text-align:right"><strong>Total</strong></td><td style="text-align:right">${totalQty}</td><td></td><td style="text-align:right">${fmtRp(totalJumlah)}</td></tr></tfoot>
      </table>
      <p class="foot">Dicetak ${new Date().toLocaleString('id-ID')}</p>
      <script>window.onload = function () { window.print(); };</script>
      </body></html>`;
    const win = window.open('', '_blank', isA5 ? 'width=600,height=520' : 'width=800,height=600');
    if (!win) {
      setValidationError('Popup diblokir browser. Izinkan popup untuk mencetak.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <>
      {viewState === 'list' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Daftar Stok Masuk</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{stockList.length} Stok Masuk</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Date Range Picker */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', height: '34px', position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => handleShiftDate(-1)} 
                  style={{ border: 0, background: 'transparent', padding: '0 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}
                >
                  &lt;
                </button>
                <div 
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', fontSize: '13px', color: '#1e293b', fontWeight: '500', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', height: '100%', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Calendar size={14} style={{ color: '#64748b' }} />
                  <span>{getFormattedRange()}</span>
                  <ChevronDown size={12} style={{ color: '#64748b' }} />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleShiftDate(1)} 
                  style={{ border: 0, background: 'transparent', padding: '0 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                >
                  &gt;
                </button>

                {showDateDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '8px 0',
                    zIndex: 1000,
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'last7', label: 'Last 7 Days' },
                      { id: 'last30', label: 'Last 30 Days' },
                      { id: 'thisMonth', label: 'This Month' },
                      { id: 'lastMonth', label: 'Last Month' },
                      { id: 'thisYear', label: 'This Year' },
                      { id: 'lastYear', label: 'Last Year' },
                      { id: 'custom', label: 'Custom Range' }
                    ].map((item) => {
                      const isSelected = selectedPreset === item.id;
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.id === 'custom') {
                                setSelectedPreset('custom');
                              } else {
                                handlePresetSelect(item.id);
                              }
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 0,
                              background: isSelected ? '#0ea5e9' : 'transparent',
                              color: isSelected ? '#ffffff' : '#334155',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              cursor: 'pointer',
                              transition: 'background 0.2s, color 0.2s',
                              display: 'block'
                            }}
                            onMouseOver={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = '#f1f5f9';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {item.label}
                          </button>
                          
                          {item.id === 'custom' && selectedPreset === 'custom' && (
                            <div style={{
                              padding: '12px 16px',
                              borderTop: '1px solid #e2e8f0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              background: '#f8fafc'
                            }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Mulai Dari</label>
                                <input 
                                  type="date" 
                                  value={startDate}
                                  onChange={(e) => setStartDate(e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Sampai Dengan</label>
                                <input 
                                  type="date" 
                                  value={endDate}
                                  onChange={(e) => setEndDate(e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={() => setShowDateDropdown(false)}
                                style={{ background: '#0ea5e9', color: '#ffffff', border: 0, borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', marginTop: '4px', width: '100%' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#0284c7'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#0ea5e9'}
                              >
                                Terapkan
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Export Button - Premium Blue */}
              <button
                type="button"
                onClick={() => handleExport(sortedList)}
                disabled={sortedList.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: sortedList.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#ffffff',
                  border: 0,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: sortedList.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                }}
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              {/* Import Button - Premium Teal */}
              <button
                onClick={() => { resetImportState(); setShowImportModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                  color: '#ffffff',
                  border: 0,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
                }}
              >
                <CloudUpload size={14} />
                <span>Import</span>
              </button>

              {/* Tambah Dropdown Button - Premium Blue */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowTambahDropdown(!showTambahDropdown)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                    color: '#ffffff', 
                    border: 0, 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                  }}
                >
                  <Plus size={14} />
                  <span>Tambah</span>
                  <ChevronDown size={12} />
                </button>

                {showTambahDropdown && (
                  <>
                    <div 
                      onClick={() => setShowTambahDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    />
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '220px', zIndex: 999, overflow: 'hidden' }}>
                      <button 
                        onClick={() => {
                          setShowTambahDropdown(false);
                          setShowPembelianModal(true);
                        }}
                        style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#334155', cursor: 'pointer' }}
                        className="pi-dropdown-item-hover"
                      >
                        Terima dari Pembelian
                      </button>
                      <button 
                        onClick={() => {
                          setShowTambahDropdown(false);
                          handleStateChange('create');
                        }}
                        style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#334155', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}
                        className="pi-dropdown-item-hover"
                      >
                        Tambah Stok Masuk
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div className="pi-category-card-body" style={{ padding: '20px' }}>
              {/* Row: Show / Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <select 
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px', 
                    padding: '6px 12px', 
                    fontSize: '13px', 
                    color: '#334155', 
                    outline: 'none',
                    background: '#ffffff',
                    height: '34px',
                    minWidth: '100px'
                  }}
                >
                  <option value={10}>10 Baris</option>
                  <option value={25}>25 Baris</option>
                  <option value={50}>50 Baris</option>
                </select>

                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari No. Stok Masuk" 
                    value={searchListQuery}
                    onChange={(e) => setSearchListQuery(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px', 
                      padding: '8px 10px 8px 32px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      height: '34px'
                    }}
                  />
                </div>
              </div>

              {/* Table Container - WITH RESIZABLE COLUMNS AND HORIZONTAL SCROLLSIDEWAY & VERTICAL DIVIDERS */}
              <div 
                ref={tableContainerRef}
                className="pi-table-scroll-container"
                style={{ 
                  overflowX: 'scroll', 
                  width: '100%', 
                  marginTop: '8px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px 6px 0 0'
                }}
              >
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  textAlign: 'left', 
                  tableLayout: 'fixed',
                  border: 'none' 
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {/* NO HEADER */}
                      <th 
                        onClick={() => handleSort('no')} 
                        style={{ 
                          width: `${columnWidths.no}px`, 
                          minWidth: `${columnWidths.no}px`,
                          maxWidth: `${columnWidths.no}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>No.</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'no' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'no')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>
                      
                      {/* DITERIMA DARI HEADER */}
                      <th 
                        onClick={() => handleSort('from')} 
                        style={{ 
                          width: `${columnWidths.from}px`, 
                          minWidth: `${columnWidths.from}px`,
                          maxWidth: `${columnWidths.from}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Nama Penerima</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'from' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'from')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>

                      {/* SUPPLIER HEADER */}
                      <th 
                        onClick={() => handleSort('supplier')} 
                        style={{ 
                          width: `${columnWidths.supplier}px`, 
                          minWidth: `${columnWidths.supplier}px`,
                          maxWidth: `${columnWidths.supplier}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Supplier</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'supplier' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'supplier')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>

                      {/* DATE HEADER */}
                      <th 
                        onClick={() => handleSort('date')} 
                        style={{ 
                          width: `${columnWidths.date}px`, 
                          minWidth: `${columnWidths.date}px`,
                          maxWidth: `${columnWidths.date}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Tanggal</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'date' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'date')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>

                      {/* NOTE HEADER */}
                      <th 
                        onClick={() => handleSort('note')} 
                        style={{ 
                          width: `${columnWidths.note}px`, 
                          minWidth: `${columnWidths.note}px`,
                          maxWidth: `${columnWidths.note}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Catatan</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'note' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'note')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>

                      {/* STATUS HEADER */}
                      <th 
                        onClick={() => handleSort('status')} 
                        style={{ 
                          width: `${columnWidths.status}px`, 
                          minWidth: `${columnWidths.status}px`,
                          maxWidth: `${columnWidths.status}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Status</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'status' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'status')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>

                      {/* RECEIVED BY HEADER */}
                      <th 
                        onClick={() => handleSort('receivedBy')} 
                        style={{ 
                          width: `${columnWidths.receivedBy}px`, 
                          minWidth: `${columnWidths.receivedBy}px`,
                          maxWidth: `${columnWidths.receivedBy}px`,
                          padding: '14px 20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: '#475569', 
                          cursor: 'pointer', 
                          userSelect: 'none', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Diterima Oleh</span>
                          <ChevronsUpDown size={14} style={{ color: sortKey === 'receivedBy' ? '#0ea5e9' : '#94a3b8' }} />
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, 'receivedBy')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 20 }}
                          className="pi-resize-handle"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>{listLoading ? 'Memuat...' : 'No Data'}</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((row, index) => (
                        <tr 
                          key={index} 
                          style={{ cursor: 'default' }}
                          className="pi-table-row-hover"
                        >
                          <td
                            onClick={async () => {
                              await fetchDocumentDetail(row.id);
                              handleStateChange('detail');
                            }}
                            style={{ 
                              width: `${columnWidths.no}px`, 
                              minWidth: `${columnWidths.no}px`, 
                              maxWidth: `${columnWidths.no}px`, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap', 
                              padding: '14px 20px', 
                              fontSize: '13px', 
                              fontWeight: 'semibold', 
                              color: '#0ea5e9', 
                              cursor: 'pointer', 
                              borderBottom: '1px solid #e2e8f0', 
                              borderRight: '1px solid #e2e8f0' 
                            }}
                            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {row.no}
                          </td>
                          <td style={{ width: `${columnWidths.from}px`, minWidth: `${columnWidths.from}px`, maxWidth: `${columnWidths.from}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.from}</td>
                          <td style={{ width: `${columnWidths.supplier}px`, minWidth: `${columnWidths.supplier}px`, maxWidth: `${columnWidths.supplier}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.supplier}</td>
                          <td style={{ width: `${columnWidths.date}px`, minWidth: `${columnWidths.date}px`, maxWidth: `${columnWidths.date}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.date}</td>
                          <td style={{ width: `${columnWidths.note}px`, minWidth: `${columnWidths.note}px`, maxWidth: `${columnWidths.note}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.note || '-'}</td>
                          <td style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px`, maxWidth: `${columnWidths.status}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ 
                              background: row.status === 'Draf' || row.status === 'Draft' ? '#ffedd5' : row.status === 'Selesai' ? '#dcfce7' : '#fee2e2', 
                              color: row.status === 'Draf' || row.status === 'Draft' ? '#ea580c' : row.status === 'Selesai' ? '#16a34a' : '#dc2626', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 'bold' 
                            }}>{row.status}</span>
                          </td>
                          <td style={{ width: `${columnWidths.receivedBy}px`, minWidth: `${columnWidths.receivedBy}px`, maxWidth: `${columnWidths.receivedBy}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 20px', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{row.receivedBy || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'center', 
                gap: '16px', 
                marginTop: '16px', 
                fontSize: '13px', 
                color: '#64748b' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button 
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1} 
                    style={{ 
                      border: 0, 
                      background: 'none', 
                      color: currentPage === 1 ? '#cbd5e1' : '#64748b', 
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      style={{
                        border: 0,
                        background: 'none',
                        color: currentPage === page ? '#0085ca' : '#64748b',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: currentPage === page ? '#e4f8ff' : 'transparent'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages} 
                    style={{ 
                      border: 0, 
                      background: 'none', 
                      color: currentPage === totalPages ? '#cbd5e1' : '#64748b', 
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    &gt;
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Go to</span>
                  <input 
                    type="number" 
                    min={1}
                    max={totalPages}
                    value={currentPage} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val >= 1 && val <= totalPages) {
                        setCurrentPage(val);
                      }
                    }}
                    style={{ 
                      width: '45px', 
                      height: '28px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px', 
                      textAlign: 'center', 
                      outline: 'none',
                      fontSize: '13px'
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Terima dari Pembelian */}
      {showPembelianModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '800px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Terima dari Pembelian</h3>
              <button 
                onClick={() => setShowPembelianModal(false)}
                style={{ background: '#f1f5f9', border: 0, padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
              >
                Batal
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Cari No. Pembelian/Nama Supplier"
                  value={searchPembelian}
                  onChange={(e) => setSearchPembelian(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px 10px 36px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>No. Pembelian</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Nama Supplier</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Jumlah</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>Tgl. Beli</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                        No Data
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px' }}>
              <div style={{ color: '#64748b' }}>Total 0</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button disabled style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', background: '#ffffff', cursor: 'not-allowed', color: '#cbd5e1' }}>&lt;</button>
                <span style={{ background: '#3b82f6', color: '#ffffff', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</span>
                <button disabled style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', background: '#ffffff', cursor: 'not-allowed', color: '#cbd5e1' }}>&gt;</button>
                <span style={{ color: '#64748b', marginLeft: '8px' }}>
                  Go to <input type="number" defaultValue="1" style={{ width: '40px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px', textAlign: 'center', fontSize: '12px' }} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import Stok Masuk via CSV */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '680px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Import Stok Masuk</h3>
              <button
                onClick={() => { setShowImportModal(false); resetImportState(); }}
                style={{ background: 'transparent', border: 0, padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
              {/* Left Panel */}
              <div style={{ width: '160px', display: 'flex', flexDirection: 'column' }}>
                <a
                  href="/templates/stok-masuk-template.csv"
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#334155',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  Download Template
                </a>
              </div>

              {/* Right Panel */}
              <div style={{ flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Import dari CSV (max. 200 baris)</span>
                
                {/* Upload Container Box */}
                <div style={{
                  width: '100%',
                  minHeight: '240px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '16px',
                  boxSizing: 'border-box'
                }}>
                  {!importFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <CloudUpload size={32} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Pilih atau seret file ke sini</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => {
                          const file = e.target.files[0] || null;
                          resetImportState();
                          setImportFile(file);
                          if (file) parseCsvPreview(file);
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          cursor: 'pointer',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    </div>
                  ) : (
                    /* Blue status card exactly matching the screenshot */
                    <div style={{
                      width: '160px',
                      height: '160px',
                      background: '#3b82f6',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      color: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      padding: '12px',
                      boxSizing: 'border-box'
                    }}>
                      {/* Top Left: file size */}
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{getFileSizeStr(importFile.size)}</span>
                      
                      {/* Center: white X in blue circle */}
                      <button
                        type="button"
                        onClick={resetImportState}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          color: '#3b82f6',
                          border: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          alignSelf: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)'
                        }}
                      >
                        <X size={16} />
                      </button>

                      {/* Bottom: filename */}
                      <span style={{ fontSize: '10px', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', display: 'block' }}>
                        {truncateFilename(importFile.name)}
                      </span>

                      {/* Error banner overlay if any error */}
                      {importResult && importResult.errors && importResult.errors.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: '#dc2626',
                          color: '#ffffff',
                          padding: '6px 8px',
                          fontSize: '10px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          lineHeight: '1.2',
                          maxHeight: '80px',
                          overflowY: 'auto',
                          boxSizing: 'border-box'
                        }}>
                          {importResult.errors[0]}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {importFile && (
                  <button
                    type="button"
                    onClick={resetImportState}
                    style={{
                      alignSelf: 'flex-start',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#475569',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                      marginTop: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    Hapus semua file
                  </button>
                )}

                {/* Preview isi CSV — ditampilkan SEBELUM dikirim ke server */}
                {importFile && (previewRows.length > 0 || previewIssues.length > 0) && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                        Pratinjau data ({previewRows.length} baris)
                      </span>
                      {previewIssues.length === 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>Siap diimpor</span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>
                          {previewIssues.length} masalah
                        </span>
                      )}
                    </div>

                    {previewRows.length > 0 && (
                      <div style={{ maxHeight: '180px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', position: 'sticky', top: 0, background: '#f8fafc' }}>#</th>
                              {CSV_PREVIEW_COLUMNS.map((col) => (
                                <th key={col.key} style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc' }}>
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, i) => (
                              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '5px 8px', color: '#94a3b8' }}>{i + 1}</td>
                                {CSV_PREVIEW_COLUMNS.map((col) => (
                                  <td key={col.key} style={{ padding: '5px 8px', color: '#334155', whiteSpace: 'nowrap' }}>
                                    {row[col.key] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {previewIssues.length > 0 && (
                      <div style={{ marginTop: '6px', maxHeight: '90px', overflowY: 'auto', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px' }}>
                        {previewIssues.map((msg, i) => (
                          <div key={i} style={{ fontSize: '11px', color: '#b91c1c', lineHeight: '1.5' }}>• {msg}</div>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                      Produk dicocokkan lewat SKU, atau nama produk bila SKU kosong.
                    </div>
                  </div>
                )}

                {/* Import success count banner */}
                {importResult && importResult.createdCount > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#16a34a',
                    fontWeight: 'bold',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    marginTop: '8px'
                  }}>
                    {importResult.createdCount} baris berhasil ditambahkan!
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 20px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              {(() => {
                // Tombol hanya aktif kalau preview bersih — CSV bermasalah
                // ditolak di sini, sebelum dokumen dibuat di server.
                const belumSiap = !importFile || importing
                  || previewRows.length === 0 || previewIssues.length > 0;
                return (
                  <button
                    onClick={handleImportCsv}
                    disabled={belumSiap}
                    title={previewIssues.length > 0 ? 'Perbaiki dulu masalah pada file CSV' : undefined}
                    style={{
                      background: belumSiap ? '#99f6e4' : '#0d9488',
                      border: 0,
                      borderRadius: '4px',
                      padding: '8px 24px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      cursor: belumSiap ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {importing
                      ? 'Memproses...'
                      : previewRows.length > 0 && previewIssues.length === 0
                        ? `Import ${previewRows.length} baris`
                        : 'Import'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* STATE: create (Tambah Stok Masuk Form) */}
      {viewState === 'create' && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          <div className="pi-category-card" style={{ maxWidth: '1200px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Tambah Stok Masuk</span>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Tanggal */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Tanggal</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 10 }} />
                    <input 
                      type="date" 
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      style={{ 
                        width: '100%', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px', 
                        padding: '8px 12px 8px 38px', 
                        fontSize: '13px', 
                        outline: 'none', 
                        boxSizing: 'border-box', 
                        color: '#334155',
                        height: '36px'
                      }}
                    />
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Catatan <span style={{ color: '#94a3b8', fontWeight: '400' }}>(opsional)</span></label>
                  <input 
                    type="text" 
                    placeholder="Masukkan catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ 
                      width: '100%', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      outline: 'none', 
                      boxSizing: 'border-box', 
                      color: '#334155',
                      height: '36px'
                    }}
                  />
                </div>

              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button 
                  onClick={() => handleStateChange('list')}
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px', 
                    padding: '8px 20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#475569', 
                    cursor: 'pointer',
                    height: '36px'
                  }}
                >
                  Batal
                </button>
                <button 
                  onClick={handleStageStock}
                  style={{ 
                    background: '#0ea5e9', 
                    border: 0, 
                    borderRadius: '4px', 
                    padding: '8px 24px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#ffffff', 
                    cursor: 'pointer',
                    height: '36px'
                  }}
                >
                  Lanjut tambah stok masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE: detail (Detail/Incoming Add View) */}
      {viewState === 'detail' && activeDetailDoc && (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
          {/* Warning Banner */}
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b45309', fontSize: '13px' }}>
            <span>ⓘ Pastikan data sudah benar sebelum diposting. Setelah diposting, data tidak diperbolehkan diubah.</span>
          </div>

          {/* Draft Info Header Card */}
          {/* Catatan: JANGAN pakai overflow:hidden di sini — itu memotong
              dropdown Cetak yang menjulur ke bawah kartu. Sudut membulat
              blok status di kiri diatur lewat borderRadius-nya sendiri. */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '20px',
            minHeight: '80px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Left Status Block */}
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
              borderRight: '1px solid #fed7aa',
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
              padding: '16px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c2410c',
              gap: '4px',
              minWidth: '95px'
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>📄</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{STATUS_LABEL[activeDetailDoc.status] || activeDetailDoc.status}</span>
            </div>

            {/* Center Title and Back Button */}
            <div style={{ flex: 1, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => handleStateChange('list')}
                title="Kembali ke Daftar"
                style={{
                  border: 0,
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <ArrowLeft size={16} />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. Stok Masuk</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginTop: '1px' }}>{activeDetailDoc.nomor}</span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}>
              {/* Dropdown Cetak — pilihan A4 / A5 */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setCetakMenuOpen((open) => !open)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: cetakMenuOpen ? '#f8fafc' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer',
                    height: '36px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = cetakMenuOpen ? '#f8fafc' : '#ffffff'}
                >
                  <Printer size={14} />
                  <span>Cetak</span>
                  <ChevronDown size={14} style={{ transform: cetakMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {cetakMenuOpen && (
                  <>
                    {/* Lapisan penutup: klik di mana pun menutup menu */}
                    <div
                      onClick={() => setCetakMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      zIndex: 41,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      minWidth: '150px',
                      overflow: 'hidden'
                    }}>
                      {[
                        { label: 'Cetak', paper: 'A4' },
                        { label: 'Cetak A5', paper: 'A5' },
                      ].map((opt) => (
                        <button
                          key={opt.paper}
                          type="button"
                          onClick={() => { setCetakMenuOpen(false); handleCetak(opt.paper); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            border: 0,
                            background: 'transparent',
                            padding: '9px 14px',
                            fontSize: '13px',
                            color: '#475569',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Printer size={14} />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {activeDetailDoc.status === 'draft' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleCommitStockIn('Draft')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      border: 0,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      cursor: 'pointer',
                      height: '36px',
                      boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                    }}
                  >
                    <Check size={14} />
                    <span>Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCommitStockIn('Batal')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      border: '1px solid #fecdd3',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#e11d48',
                      cursor: 'pointer',
                      height: '36px',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fff1f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <X size={14} />
                    <span>Batalkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCommitStockIn('Selesai')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      border: 0,
                      padding: '8px 20px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      cursor: 'pointer',
                      height: '36px',
                      boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)'
                    }}
                  >
                    <Check size={14} />
                    <span>Posting Sekarang</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sub-card metadata details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Card 1: Tanggal */}
            <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tanggal</span>
                {activeDetailDoc.status === 'draft' && (!isEditingTanggal ? (
                  <button
                    onClick={() => {
                      setEditTanggalValue(activeDetailDoc.tanggal || '');
                      setIsEditingTanggal(true);
                    }}
                    style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Ubah
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={saveInlineTanggal} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                    <button onClick={() => setIsEditingTanggal(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                  </div>
                ))}
              </div>
              <div style={{ padding: '20px' }}>
                {!isEditingTanggal ? (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{formatDisplayDate(activeDetailDoc.tanggal)}</div>
                ) : (
                  <input
                    type="date"
                    value={editTanggalValue}
                    onChange={(e) => setEditTanggalValue(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', outline: 'none' }}
                  />
                )}
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Tanggal buat: {formatDisplayDate(activeDetailDoc.tanggal)}</span>
                  <span>Dibuat oleh: {activeDetailDoc.dibuat_oleh_nama || '-'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Info Penerimaan & Supplier */}
            <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Info Penerimaan & Supplier</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Nama Penerima row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>NAMA PENERIMA</span>
                    {activeDetailDoc.status === 'draft' && (!isEditingNamaPenerima ? (
                      <button
                        onClick={() => {
                          setEditNamaPenerimaValue(activeDetailDoc.nama_penerima || '');
                          setIsEditingNamaPenerima(true);
                        }}
                        style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Ubah
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={saveInlineNamaPenerima} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                        <button onClick={() => setIsEditingNamaPenerima(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                      </div>
                    ))}
                  </div>
                  {!isEditingNamaPenerima ? (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: activeDetailDoc.nama_penerima ? '#1e293b' : '#94a3b8' }}>
                      {activeDetailDoc.nama_penerima || '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editNamaPenerimaValue}
                      onChange={(e) => setEditNamaPenerimaValue(e.target.value)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', outline: 'none' }}
                    />
                  )}
                </div>

                {/* Supplier row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>SUPPLIER</span>
                    {activeDetailDoc.status === 'draft' && (!isEditingSupplier ? (
                      <button
                        onClick={() => {
                          setEditSupplierValue(activeDetailDoc.supplier || '');
                          setIsEditingSupplier(true);
                        }}
                        style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Ubah
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={saveInlineSupplier} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                        <button onClick={() => setIsEditingSupplier(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                      </div>
                    ))}
                  </div>
                  {!isEditingSupplier ? (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: activeDetailDoc.supplier ? '#1e293b' : '#94a3b8' }}>
                      {activeDetailDoc.supplier || '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editSupplierValue}
                      onChange={(e) => setEditSupplierValue(e.target.value)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', outline: 'none' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Catatan */}
            <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Catatan</span>
                {activeDetailDoc.status === 'draft' && (!isEditingCatatan ? (
                  <button
                    onClick={() => {
                      setEditCatatanValue(activeDetailDoc.catatan || '');
                      setIsEditingCatatan(true);
                    }}
                    style={{ border: 0, background: 'transparent', color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Ubah
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={saveInlineCatatan} style={{ border: 0, background: 'transparent', color: '#16a34a', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                    <button onClick={() => setIsEditingCatatan(false)} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                  </div>
                ))}
              </div>
              <div style={{ padding: '20px' }}>
                {!isEditingCatatan ? (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: activeDetailDoc.catatan ? '#1e293b' : '#94a3b8' }}>
                    {activeDetailDoc.catatan || '-'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editCatatanValue}
                    onChange={(e) => setEditCatatanValue(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', outline: 'none' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Staging Product Add Container */}
          <div className="pi-category-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tambah Produk</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 120px auto', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
                {/* Cari Produk */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Produk</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Cari Produk"
                      value={searchProduct}
                      onChange={(e) => {
                        setSearchProduct(e.target.value);
                        setSelectedProduct(null);
                      }}
                      disabled={activeDetailDoc.status !== 'draft'}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '8px 10px 8px 30px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#ffffff',
                        backgroundColor: '#ffffff',
                        height: '36px'
                      }}
                    />
                    {productOptions.length > 0 && !selectedProduct && (
                      <div style={{ position: 'absolute', top: '38px', left: 0, right: 0, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
                        {productOptions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setSearchProduct(p.nama);
                              setProductOptions([]);
                              if (p.harga_beli) setProductHargaBeli(String(Math.round(Number(p.harga_beli))));
                            }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            {p.nama} {p.sku ? `(${p.sku})` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Harga Beli */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Harga Beli</label>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', height: '36px', background: '#ffffff', backgroundColor: '#ffffff' }}>
                    <div style={{ background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                      Rp.
                    </div>
                    <input
                      type="text"
                      value={productHargaBeli}
                      onChange={(e) => setProductHargaBeli(e.target.value)}
                      disabled={activeDetailDoc.status !== 'draft'}
                      style={{
                        border: 0, 
                        outline: 0, 
                        padding: '0 12px', 
                        fontSize: '13px', 
                        flex: 1, 
                        textAlign: 'right', 
                        color: '#334155',
                        background: '#ffffff',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                {/* Qty Stepper */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Qty</label>
                  <div style={{ 
                    display: 'flex', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    height: '36px', 
                    width: '120px',
                    background: '#ffffff',
                    backgroundColor: '#ffffff'
                  }}>
                    <button
                      type="button"
                      onClick={() => setQtyValue(prev => Math.max(1, prev - 1))}
                      disabled={activeDetailDoc.status !== 'draft'}
                      style={{ border: 0, background: '#f8fafc', width: '32px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={qtyValue}
                      onChange={(e) => setQtyValue(parseInt(e.target.value, 10) || 1)}
                      disabled={activeDetailDoc.status !== 'draft'}
                      style={{
                        border: 0,
                        borderLeft: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        textAlign: 'center',
                        flex: 1,
                        fontSize: '13px',
                        color: '#334155',
                        outline: 'none',
                        background: '#ffffff',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setQtyValue(prev => prev + 1)}
                      disabled={activeDetailDoc.status !== 'draft'}
                      style={{ border: 0, background: '#f8fafc', width: '32px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Plus Blue Button */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={activeDetailDoc.status !== 'draft' || !selectedProduct || itemSaving}
                  style={{
                    background: (!selectedProduct || itemSaving) ? '#93c5fd' : '#0ea5e9',
                    color: '#ffffff',
                    border: 0,
                    borderRadius: '4px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!selectedProduct || itemSaving) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Daftar produk yang sudah ditambahkan */}
              {activeDetailDoc.items && activeDetailDoc.items.length > 0 ? (
                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '10px 20px', fontWeight: 'bold', color: '#475569' }}>Produk</th>
                        <th style={{ padding: '10px 20px', fontWeight: 'bold', color: '#475569' }}>Rak</th>
                        <th style={{ padding: '10px 20px', fontWeight: 'bold', color: '#475569' }}>Harga Beli</th>
                        <th style={{ padding: '10px 20px', fontWeight: 'bold', color: '#475569' }}>Qty</th>
                        <th style={{ padding: '10px 20px', fontWeight: 'bold', color: '#475569' }}>Subtotal</th>
                        {activeDetailDoc.status === 'draft' && <th style={{ padding: '10px 20px' }}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {activeDetailDoc.items.map((item) => (
                        <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 20px', color: '#1e293b' }}>{item.product_nama}{item.product_sku ? ` (${item.product_sku})` : ''}</td>
                          <td style={{ padding: '10px 20px', color: '#334155' }}>{item.rak || '-'}</td>
                          <td style={{ padding: '10px 20px', color: '#334155' }}>{formatCurrencyRp(item.harga_beli)}</td>
                          <td style={{ padding: '10px 20px', color: '#334155' }}>{item.qty} {item.product_satuan}</td>
                          <td style={{ padding: '10px 20px', color: '#334155', fontWeight: '600' }}>{formatCurrencyRp(Number(item.harga_beli) * Number(item.qty))}</td>
                          {activeDetailDoc.status === 'draft' && (
                            <td style={{ padding: '10px 20px' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>Belum ada produk</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VALIDATION ERROR MODAL OVERLAY */}
      {validationError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #fee2e2',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Gagal Posting</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
              {validationError}
            </p>
            <button 
              onClick={() => setValidationError('')}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 0,
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
