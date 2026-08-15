import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firApi } from '../../api/fir.api';
import { LoadingSpinner, ErrorState, StatusBadge, PageHeader, EmptyState } from '../../components/common/CommonUI';
import { FileBadge, Search, Filter, ChevronRight, Shield } from 'lucide-react';

const STATUSES = ['REGISTERED', 'UNDER_INVESTIGATION', 'CLOSED'];

const FIRs = () => {
  const [firs, setFirs]                 = useState([]);
  const [filteredFirs, setFilteredFirs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery]   = useState('');

  const navigate = useNavigate();

  const fetchFIRs = async () => {
    try {
      const res = await firApi.getAll();
      if (res.success && res.data?.firs) {
        setFirs(res.data.firs);
        setFilteredFirs(res.data.firs);
      }
    } catch (err) {
      console.error('Failed to fetch FIRs:', err);
      setError(err.response?.data?.message || err.message || 'FIR register unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFIRs();
  }, []);

  useEffect(() => {
    let result = [...firs];
    if (statusFilter) {
      result = result.filter((f) => f.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.firNumber?.toLowerCase().includes(q) ||
          f.crimeType?.toLowerCase().includes(q) ||
          f.citizenId?.name?.toLowerCase().includes(q)
      );
    }
    setFilteredFirs(result);
  }, [statusFilter, searchQuery, firs]);

  if (loading) return <LoadingSpinner message="Fetching First Information Reports (FIR) Register..." />;
  if (error)   return <ErrorState message={error} onRetry={fetchFIRs} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="First Information Reports (FIR)"
        subtitle="Official statutory crime records registered under criminal procedure code"
        icon={FileBadge}
      />

      {/* Filter Control Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FIR Number, Crime Type, Citizen..."
              className="input pl-10"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="">All FIR Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FIRs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th>FIR Number</th>
                <th>Crime Type</th>
                <th>Complainant Citizen</th>
                <th>Jurisdiction Station</th>
                <th>Investigating Officer</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredFirs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12">
                    <EmptyState
                      icon={FileBadge}
                      message="No FIRs match the criteria"
                      description="Search query or filters returned zero registered FIR records."
                    />
                  </td>
                </tr>
              ) : (
                filteredFirs.map((f) => (
                  <tr key={f._id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                        {f.firNumber}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray text-[11px] font-mono">{f.crimeType?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="text-xs">{f.citizenId?.name || 'N/A'}</td>
                    <td className="text-xs text-surface-500">{f.policeStationId?.name || 'Unassigned'}</td>
                    <td className="text-xs font-semibold text-primary-700">
                      {f.investigatingOfficerId?.name || 'Unassigned'}
                    </td>
                    <td><StatusBadge status={f.status} /></td>
                    <td className="text-xs text-surface-400 font-mono">
                      {new Date(f.registeredAt || f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => navigate(`/admin/firs/${f._id}`)}
                        className="btn btn-ghost btn-sm text-primary-600 gap-1"
                      >
                        View Dossier <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FIRs;
