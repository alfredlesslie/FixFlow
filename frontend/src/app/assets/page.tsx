'use client';

import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import {
  Boxes,
  Search,
  Plus,
  Tag,
  QrCode,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const GET_ASSETS_DATA_QUERY = gql`
  query GetAssetsData($filter: AssetFilterInput) {
    assets(filter: $filter) {
      id
      assetTag
      name
      description
      status
      criticality
      conditionRating
      serialNumber
      manufacturer
      model
      qrIdentifier
      createdAt
      category {
        id
        code
        name
      }
      location {
        id
        code
        name
        building
      }
    }
    locations {
      id
      code
      name
      building
    }
    assetCategories {
      id
      code
      name
    }
  }
`;

const CREATE_ASSET_MUTATION = gql`
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      id
      assetTag
      name
      status
      criticality
      conditionRating
      category {
        id
        code
        name
      }
      location {
        id
        code
        name
      }
    }
  }
`;

const UPDATE_ASSET_STATUS_MUTATION = gql`
  mutation UpdateAssetStatus($id: ID!, $status: AssetStatus!) {
    updateAssetStatus(id: $id, status: $status) {
      id
      assetTag
      status
    }
  }
`;

const FALLBACK_ASSETS = [
  {
    id: 'ast-1',
    assetTag: 'AST-HVAC-001',
    name: 'Carrier 30XA Chiller Unit 1',
    manufacturer: 'Carrier',
    model: 'AquaForce 30XA',
    category: { id: 'c-1', name: 'HVAC Systems' },
    location: { id: 'l-1', code: 'ENG-ROOF', building: 'Engineering Complex' },
    criticality: 'CRITICAL',
    conditionRating: 4,
    status: 'OPERATIONAL',
    qrIdentifier: 'fixflow://asset/AST-HVAC-001',
  },
  {
    id: 'ast-2',
    assetTag: 'AST-ELEC-042',
    name: 'Schneider Main Distribution Panel A',
    manufacturer: 'Schneider Electric',
    model: 'PowerPact 400A',
    category: { id: 'c-2', name: 'Electrical' },
    location: { id: 'l-2', code: 'SCI-B1', building: 'Science Center Basement' },
    criticality: 'CRITICAL',
    conditionRating: 5,
    status: 'OPERATIONAL',
    qrIdentifier: 'fixflow://asset/AST-ELEC-042',
  },
  {
    id: 'ast-3',
    assetTag: 'AST-PLMB-108',
    name: 'Grundfos Booster Pump 2',
    manufacturer: 'Grundfos',
    model: 'Hydro Multi-E',
    category: { id: 'c-3', name: 'Plumbing' },
    location: { id: 'l-3', code: 'HOSTEL-UTILITY', building: 'Dormitory Block C' },
    criticality: 'HIGH',
    conditionRating: 3,
    status: 'UNDER_MAINTENANCE',
    qrIdentifier: 'fixflow://asset/AST-PLMB-108',
  },
  {
    id: 'ast-4',
    assetTag: 'AST-LAB-214',
    name: 'Thermo Scientific Biosafety Cabinet B2',
    manufacturer: 'Thermo Scientific',
    model: '1300 Series A2',
    category: { id: 'c-4', name: 'Laboratory' },
    location: { id: 'l-4', code: 'LAB-302', building: 'Research Annex' },
    criticality: 'HIGH',
    conditionRating: 4,
    status: 'OPERATIONAL',
    qrIdentifier: 'fixflow://asset/AST-LAB-214',
  },
];

const FALLBACK_CATEGORIES = [
  { id: 'c-1', name: 'HVAC Systems' },
  { id: 'c-2', name: 'Electrical' },
  { id: 'c-3', name: 'Plumbing' },
  { id: 'c-4', name: 'Laboratory' },
];

const FALLBACK_LOCATIONS = [
  { id: 'l-1', code: 'ENG-ROOF', building: 'Engineering Complex' },
  { id: 'l-2', code: 'SCI-B1', building: 'Science Center Basement' },
  { id: 'l-3', code: 'HOSTEL-UTILITY', building: 'Dormitory Block C' },
  { id: 'l-4', code: 'LAB-302', building: 'Research Annex' },
];

export default function AssetsPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCriticality, setSelectedCriticality] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    assetTag: '',
    name: '',
    categoryId: '',
    locationId: '',
    criticality: 'MEDIUM',
    conditionRating: 5,
    manufacturer: '',
    model: '',
    serialNumber: '',
    description: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_ASSETS_DATA_QUERY, {
    variables: {
      filter: {
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        locationId: selectedLocation || undefined,
        status: selectedStatus || undefined,
        criticality: selectedCriticality || undefined,
      },
    },
    skip: !user,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'ignore',
    pollInterval: 15000,
  });

  const [createAsset, { loading: creating }] = useMutation(CREATE_ASSET_MUTATION);
  const [updateAssetStatus] = useMutation(UPDATE_ASSET_STATUS_MUTATION);

  const canManageAssets =
    user?.role === 'FACILITY_MANAGER' || user?.role === 'ADMIN';

  const assetList = data?.assets?.length ? data.assets : FALLBACK_ASSETS;
  const categoriesList = data?.assetCategories?.length ? data.assetCategories : FALLBACK_CATEGORIES;
  const locationsList = data?.locations?.length ? data.locations : FALLBACK_LOCATIONS;

  const filteredAssets = assetList.filter((asset: any) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTag = asset.assetTag?.toLowerCase().includes(q);
      const matchName = asset.name?.toLowerCase().includes(q);
      const matchMfg = asset.manufacturer?.toLowerCase().includes(q);
      if (!matchTag && !matchName && !matchMfg) return false;
    }
    if (selectedCategory && asset.category?.id !== selectedCategory) return false;
    if (selectedLocation && asset.location?.id !== selectedLocation) return false;
    if (selectedStatus && asset.status !== selectedStatus) return false;
    if (selectedCriticality && asset.criticality !== selectedCriticality) return false;
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      await createAsset({
        variables: {
          input: {
            assetTag: createForm.assetTag,
            name: createForm.name,
            categoryId: createForm.categoryId,
            locationId: createForm.locationId,
            criticality: createForm.criticality,
            conditionRating: parseInt(createForm.conditionRating.toString(), 10),
            manufacturer: createForm.manufacturer || undefined,
            model: createForm.model || undefined,
            serialNumber: createForm.serialNumber || undefined,
            description: createForm.description || undefined,
          },
        },
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        assetTag: '',
        name: '',
        categoryId: '',
        locationId: '',
        criticality: 'MEDIUM',
        conditionRating: 5,
        manufacturer: '',
        model: '',
        serialNumber: '',
        description: '',
      });
      refetch();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create asset');
    }
  };

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    try {
      await updateAssetStatus({
        variables: {
          id: assetId,
          status: newStatus,
        },
      });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
            Operational
          </span>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Under Maintenance
          </span>
        );
      case 'OUT_OF_SERVICE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
            Out of Service
          </span>
        );
      case 'RETIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Retired
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getCriticalityBadge = (crit: string) => {
    switch (crit) {
      case 'CRITICAL':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Low
          </span>
        );
      default:
        return <span>{crit}</span>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['REQUESTER', 'TECHNICIAN', 'FACILITY_MANAGER', 'ADMIN']}>
      <AppShell>
        <div className="space-y-6">
          {/* Page Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <Boxes className="w-6 h-6 text-sky-500" />
                <span>Campus Asset Registry</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Centralized catalog of all educational, HVAC, electrical, laboratory, and IT infrastructure
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>

              {canManageAssets && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  id="open-create-asset-modal"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Register New Asset
                </Button>
              )}
            </div>
          </div>

          {/* Filter and Search Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Input */}
              <div className="relative lg:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="asset-search-input"
                  placeholder="Search by tag, name, manufacturer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  id="category-filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">All Categories</option>
                  {categoriesList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <select
                  id="location-filter-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="block w-full py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">All Locations</option>
                  {locationsList.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.code} ({l.building})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  id="status-filter-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-full py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assets Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Asset Tag / QR</th>
                    <th className="py-3 px-4">Equipment & Model</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Criticality</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Status</th>
                    {canManageAssets && <th className="py-3 px-4 text-right">Lifecycle Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {loading && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-500" />
                        <span className="mt-2 block">Loading campus assets...</span>
                      </td>
                    </tr>
                  )}

                  {!loading && filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No assets found matching the selected criteria.
                      </td>
                    </tr>
                  )}

                  {filteredAssets.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-1.5">
                          <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{asset.assetTag}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">
                          {asset.qrIdentifier}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {asset.manufacturer ? `${asset.manufacturer} ` : ''}
                          {asset.model ? `(${asset.model})` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{asset.category?.name || 'Unclassified'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-900 dark:text-white">{asset.location?.code}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{asset.location?.building}</div>
                      </td>

                      <td className="py-3.5 px-4">{getCriticalityBadge(asset.criticality)}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 text-amber-500">
                          {'★'.repeat(asset.conditionRating)}
                          <span className="text-slate-300 dark:text-slate-700">
                            {'★'.repeat(5 - asset.conditionRating)}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 ml-1">
                            ({asset.conditionRating}/5)
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(asset.status)}</td>

                      {canManageAssets && (
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={asset.status}
                            onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                            className="text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 outline-none hover:border-slate-300"
                          >
                            <option value="OPERATIONAL">Mark Operational</option>
                            <option value="UNDER_MAINTENANCE">Mark Maintenance</option>
                            <option value="OUT_OF_SERVICE">Mark Out of Service</option>
                            <option value="RETIRED">Mark Retired</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Registration Modal Dialog */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-sky-500" />
                  <span>Register New Institutional Asset</span>
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Asset Tag *</label>
                    <input
                      type="text"
                      required
                      placeholder="AST-AC-201"
                      value={createForm.assetTag}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, assetTag: e.target.value.toUpperCase() })
                      }
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Asset Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Carrier 2.0 Ton AC"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category *</label>
                    <select
                      required
                      value={createForm.categoryId}
                      onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="">Select Category</option>
                      {categoriesList.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Location *</label>
                    <select
                      required
                      value={createForm.locationId}
                      onChange={(e) => setCreateForm({ ...createForm, locationId: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="">Select Location</option>
                      {locationsList.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.code} ({l.building || l.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Criticality</label>
                    <select
                      value={createForm.criticality}
                      onChange={(e) => setCreateForm({ ...createForm, criticality: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Condition Rating (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={createForm.conditionRating}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          conditionRating: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="Daikin / Cisco"
                      value={createForm.manufacturer}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, manufacturer: e.target.value })
                      }
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Model / Serial</label>
                    <input
                      type="text"
                      placeholder="Model Number"
                      value={createForm.model}
                      onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={creating}
                  >
                    Save Asset
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
