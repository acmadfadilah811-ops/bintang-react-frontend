import { useMemo, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import './ProductInventory.css';
import { inventoryTabs, priceLabelTabs, productTabs, specialTypeTabs } from './productInventoryData';
import ProductsPage from './products/ProductsPage';
import { AddonsPage, BrandsPage, CategoriesPage, PackagesPage, ProductOthersPage, SpecificationsPage } from './products/MasterPages';
import {
  StockAlertPage,
  StockInPage,
  StockMovementPage,
  StockOpnamePage,
  StockOutPage,
  StockProductionPage,
  StockOutstandingPage,
} from './inventory/InventoryPages';
import {
  BarcodePage,
  DepositPage,
  PriceLabelProductsPage,
  PriceLabelSettingsPage,
  ProductionCostPage,
  SpecialCollectionPage,
  SpecialLookBookPage,
  SpecialTypeListPage,
  PosStockModePage,
  MergeStocksPage,
} from './support/SupportPages';

const featureMap = {
  product: {
    title: 'Katalog Produk / Daftar Produk',
    tabs: productTabs,
    defaultTab: 'products',
  },
  inventory: {
    title: 'Inventory / Stok Masuk',
    tabs: inventoryTabs,
    defaultTab: 'stock-in',
  },
  'production-cost': {
    title: 'Production Cost',
    defaultTab: 'production-cost',
  },
  'special-type': {
    title: 'Special Type / Specialtype',
    tabs: specialTypeTabs,
    defaultTab: 'special-type-list',
  },
  barcode: {
    title: 'Print Barcode Product',
    defaultTab: 'barcode',
  },
  'price-label': {
    title: 'Cetak Label Harga / Produk Label Harga',
    tabs: priceLabelTabs,
    defaultTab: 'price-label-products',
  },
  deposit: {
    title: 'Deposit',
    defaultTab: 'deposit',
  },
  'pos-stock-mode': {
    title: 'Mode Stok POS',
    defaultTab: 'pos-stock-mode',
  },
  'merge-stocks': {
    title: 'Gabung Stok',
    defaultTab: 'merge-stocks',
  },
};

const pageMap = {
  products: ProductsPage,
  categories: CategoriesPage,
  packages: PackagesPage,
  addons: AddonsPage,
  brands: BrandsPage,
  specifications: SpecificationsPage,
  'stock-in': StockInPage,
  'stock-out': StockOutPage,
  'stock-production': StockProductionPage,
  'stock-opname': StockOpnamePage,
  'stock-movement': StockMovementPage,
  'stock-alert': StockAlertPage,
  'production-cost': ProductionCostPage,
  'special-type-list': SpecialTypeListPage,
  'special-collection': SpecialCollectionPage,
  'special-lookbook': SpecialLookBookPage,
  barcode: BarcodePage,
  'price-label-products': PriceLabelProductsPage,
  'price-label-settings': PriceLabelSettingsPage,
  deposit: DepositPage,
  'stock-outstanding': StockOutstandingPage,
  'product-others': ProductOthersPage,
  'pos-stock-mode': PosStockModePage,
  'merge-stocks': MergeStocksPage,
};

export default function ProductInventoryApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, featureKey, tabKey] = location.pathname.replace(/^\//, '').split('/');
  const [isPackageCreating, setIsPackageCreating] = useState(false);
  const [isAddonCreating, setIsAddonCreating] = useState(false);
  const [stockInState, setStockInState] = useState('list'); // 'list' | 'create' | 'detail'
  const [stockOutState, setStockOutState] = useState('list'); // 'list' | 'create' | 'detail'
  const [stockProductionState, setStockProductionState] = useState('list'); // 'list' | 'detail'
  const [stockOpnameState, setStockOpnameState] = useState('list'); // 'list' | 'create' | 'detail'

  useEffect(() => {
    setIsPackageCreating(false);
    setIsAddonCreating(false);
    setStockInState('list');
    setStockOutState('list');
    setStockProductionState('list');
    setStockOpnameState('list');
  }, [location.key]);

  const feature = useMemo(() => featureMap[featureKey], [featureKey]);

  if (!featureKey) return <Navigate to="/product-inventory/product" replace />;
  if (!feature) return <Navigate to="/product-inventory/product" replace />;

  const activeTab = feature.tabs ? tabKey || feature.defaultTab : feature.defaultTab;
  const ActivePage = pageMap[activeTab] || pageMap[feature.defaultTab];

  const handleTabChange = (tabId) => {
    navigate(`/product-inventory/${featureKey}/${tabId}`);
  };

  const getDynamicTitle = () => {
    if (featureKey === 'product') {
      if (activeTab === 'packages' && isPackageCreating) {
        return 'Buat Paket Produk';
      }
      if (activeTab === 'addons' && isAddonCreating) {
        return 'Katalog Produk / Buat Produk Tambahan';
      }
      switch (activeTab) {
        case 'products':
          return 'Katalog Produk / Daftar Produk';
        case 'categories':
          return 'Katalog Produk / Grup Produk';
        case 'packages':
          return 'Katalog Produk / Paket Produk';
        case 'addons':
          return 'Katalog Produk / Produk Tambahan';
        case 'brands':
          return 'Katalog Produk / Merk Produk';
        case 'specifications':
          return 'Katalog Produk / Spesifikasi Produk';
        default:
          return feature?.title;
      }
    }
    if (featureKey === 'inventory') {
      if (activeTab === 'stock-in') {
        if (stockInState === 'create') {
          return 'Inventory / Buat Stok Masuk';
        }
        if (stockInState === 'detail') {
          return 'Inventory / Detail Stok Masuk';
        }
        return 'Inventory / Stok Masuk';
      }
      if (activeTab === 'stock-out') {
        if (stockOutState === 'create') {
          return 'Inventory / Buat Stok Keluar';
        }
        if (stockOutState === 'detail') {
          return 'Inventory / Detail Stok Keluar';
        }
        return 'Inventory / Stok Keluar';
      }
      if (activeTab === 'stock-production') {
        if (stockProductionState === 'detail') {
          return 'Inventory / Detail Produksi Stock';
        }
        return 'Inventory / Produksi Stock';
      }
      if (activeTab === 'stock-opname') {
        if (stockOpnameState === 'create') {
          return 'Inventory / Buat Opname Stok';
        }
        if (stockOpnameState === 'detail') {
          return 'Inventory / Detail Stok Opname';
        }
        return 'Inventory / Stok Opname';
      }
    }
    if (featureKey === 'price-label') {
      if (activeTab === 'price-label-settings') {
        return 'Cetak Label Harga / Konfigurasi Label Harga';
      }
      return 'Cetak Label Harga / Produk Label Harga';
    }
    if (featureKey === 'special-type') {
      if (activeTab === 'special-collection') {
        return 'Special Type / Koleksi';
      }
      if (activeTab === 'special-lookbook') {
        return 'Special Type / Look Book';
      }
      return 'Special Type / Tipe Special';
    }
    return feature?.title;
  };

  return (
    <div className="pi-module pi-module-full">
      <div className="pi-content-topbar">
        <h1>{getDynamicTitle()}</h1>
      </div>

      <section className="pi-full-panel">
        {feature.tabs && !isPackageCreating && !isAddonCreating && (activeTab !== 'stock-in' || stockInState === 'list') && (activeTab !== 'stock-out' || stockOutState === 'list') && (activeTab !== 'stock-production' || stockProductionState === 'list') && (activeTab !== 'stock-opname' || stockOpnameState === 'list') ? (
          <nav className="pi-top-tabs pi-top-tabs-full" aria-label={feature.title}>
            {feature.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={tab.id === activeTab ? 'is-active' : ''}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        ) : null}
        <div className="pi-page-body">
          <ActivePage 
            viewState={
              activeTab === 'stock-in'
                ? stockInState
                : activeTab === 'stock-out'
                ? stockOutState
                : activeTab === 'stock-production'
                ? stockProductionState
                : activeTab === 'stock-opname'
                ? stockOpnameState
                : 'list'
            }
            onToggleCreate={
              activeTab === 'packages' 
                ? setIsPackageCreating 
                : activeTab === 'addons' 
                ? setIsAddonCreating 
                : activeTab === 'stock-in'
                ? setStockInState
                : activeTab === 'stock-out'
                ? setStockOutState
                : activeTab === 'stock-production'
                ? setStockProductionState
                : activeTab === 'stock-opname'
                ? setStockOpnameState
                : undefined
            } 
          />
        </div>
      </section>
    </div>
  );
}
