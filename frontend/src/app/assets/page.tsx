'use client';

import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Search,
  Plus,
  Filter,
  Building2,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  Shield,
  LogOut,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
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

export default function AssetsPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data, loading, error, refetch } = useQuery(GET_ASSETS_DATA_QUERY, {
    variables: {
      filter: {
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        locationId: selectedLocation || undefined,
        status: selectedStatus || undefined,
        criticality: selectedCriticality || undefined,
      },
    },
    pollInterval: 15000,
  });

  const [createAsset, { loading: creating }] = useMutation(CREATE_ASSET_MUTATION);
  const [updateAssetStatus] = useMutation(UPDATE_ASSET_STATUS_MUTATION);

  const canManageAssets =
    user?.role === 'FACILITY_MANAGER' || user?.role === 'ADMIN';

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
            Operational
          </span>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Under Maintenance
          </span>
        );
      case 'OUT_OF_SERVICE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
            Out of Service
          </span>
        );
      case 'RETIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Low
          </span>
        );
      default:
        return <span>{crit}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top App Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg">
                F
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">FixFlow</span>
            </a>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-600">Asset Management</span>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{user.role} &bull; {user.department || 'Campus'}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs border border-brand-200">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  id="signout-btn"
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="/login"
                id="login-btn"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition shadow-sm"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Page Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Boxes className="w-6 h-6 text-brand-600" />
              <span>Campus Asset Registry</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Centralized catalog of all educational, HVAC, electrical, laboratory, and IT infrastructure
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {canManageAssets && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                id="open-create-asset-modal"
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
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
                className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-700"
              >
                <option value="">All Categories</option>
                {data?.assetCategories?.map((c: any) => (
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
                className="block w-full py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-700"
              >
                <option value="">All Locations</option>
                {data?.locations?.map((l: any) => (
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
                className="block w-full py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-700"
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
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
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
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" />
                      <span className="mt-2 block">Loading campus assets via GraphQL...</span>
                    </td>
                  </tr>
                )}

                {!loading && data?.assets?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No assets found matching the selected criteria.
                    </td>
                  </tr>
                )}

                {data?.assets?.map((asset: any) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{asset.assetTag}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">
                        {asset.qrIdentifier}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{asset.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {asset.manufacturer ? `${asset.manufacturer} ` : ''}
                        {asset.model ? `(${asset.model})` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{asset.category?.name || 'Unclassified'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-900">{asset.location?.code}</div>
                      <div className="text-[11px] text-slate-500">{asset.location?.building}</div>
                    </td>

                    <td className="py-3.5 px-4">{getCriticalityBadge(asset.criticality)}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-amber-500">
                        {'★'.repeat(asset.conditionRating)}
                        <span className="text-slate-300">
                          {'★'.repeat(5 - asset.conditionRating)}
                        </span>
                        <span className="text-[11px] text-slate-600 ml-1">
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
                          className="text-[11px] border border-slate-200 rounded px-2 py-1 bg-white font-medium text-slate-700 outline-none hover:border-slate-300"
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
      </main>

      {/* Registration Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-brand-600" />
                <span>Register New Institutional Asset</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Asset Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="AST-AC-201"
                    value={createForm.assetTag}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, assetTag: e.target.value.toUpperCase() })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Carrier 2.0 Ton AC"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    required
                    value={createForm.categoryId}
                    onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="">Select Category</option>
                    {data?.assetCategories?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location *</label>
                  <select
                    required
                    value={createForm.locationId}
                    onChange={(e) => setCreateForm({ ...createForm, locationId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="">Select Location</option>
                    {data?.locations?.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.code} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Criticality</label>
                  <select
                    value={createForm.criticality}
                    onChange={(e) => setCreateForm({ ...createForm, criticality: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
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
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Daikin / Cisco"
                    value={createForm.manufacturer}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, manufacturer: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Model / Serial</label>
                  <input
                    type="text"
                    placeholder="Model Number"
                    value={createForm.model}
                    onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center space-x-1"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
