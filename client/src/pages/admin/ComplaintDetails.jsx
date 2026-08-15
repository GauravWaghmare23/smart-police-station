import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintApi } from '../../api/complaint.api';
import { officerApi } from '../../api/officer.api';
import { firApi } from '../../api/fir.api';
import { LoadingSpinner, ErrorState, StatusBadge, PageHeader, InfoRow, SectionCard } from '../../components/common/CommonUI';
import PoliceMap from '../../components/maps/PoliceMap';
import { FileText, User, MapPin, ArrowLeft, Upload, FileBadge, CheckCircle, X, Shield, Clock } from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint]     = useState(null);
  const [officers, setOfficers]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Modals & Forms
  const [assignModalOpen, setAssignModalOpen]             = useState(false);
  const [selectedOfficerUserId, setSelectedOfficerUserId] = useState('');
  const [assigning, setAssigning]                         = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus]             = useState('');
  const [updatingStatus, setUpdatingStatus]   = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [evidenceFile, setEvidenceFile]       = useState(null);
  const [uploading, setUploading]             = useState(false);

  const [firCreating, setFirCreating]         = useState(false);

  const fetchComplaintData = async () => {
    try {
      const res = await complaintApi.getById(id);
      if (res.success && res.data?.complaint) {
        setComplaint(res.data.complaint);
        setNewStatus(res.data.complaint.status);

        if (res.data.complaint.policeStationId?._id) {
          const offRes = await officerApi.getAll({ stationId: res.data.complaint.policeStationId._id });
          if (offRes.success && offRes.data?.officers) {
            setOfficers(offRes.data.officers);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch complaint details:', err);
      setError(err.response?.data?.message || err.message || 'Complaint record unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintData();
  }, [id]);

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!selectedOfficerUserId) return;
    setAssigning(true);
    try {
      const res = await complaintApi.assignOfficer(id, selectedOfficerUserId);
      if (res.success) {
        setAssignModalOpen(false);
        fetchComplaintData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await complaintApi.updateStatus(id, newStatus);
      if (res.success) {
        setStatusModalOpen(false);
        fetchComplaintData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update complaint status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('evidence', evidenceFile);

      const res = await complaintApi.uploadEvidence(id, formData);
      if (res.success) {
        setUploadModalOpen(false);
        setEvidenceFile(null);
        fetchComplaintData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterFIR = async () => {
    if (!window.confirm('Convert this complaint into a formal FIR?')) return;
    setFirCreating(true);
    try {
      const res = await firApi.create(id);
      if (res.success) {
        alert(`FIR registered successfully! FIR Number: ${res.data.fir.firNumber}`);
        fetchComplaintData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register FIR');
    } finally {
      setFirCreating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching Case File..." />;
  if (error)   return <ErrorState message={error} onRetry={fetchComplaintData} />;
  if (!complaint) return <ErrorState message="Complaint file not found" />;

  const statusTimeline = [
    { key: 'SUBMITTED',      label: 'Submitted' },
    { key: 'UNDER_REVIEW',   label: 'Under Review' },
    { key: 'ASSIGNED',       label: 'Assigned' },
    { key: 'INVESTIGATION',  label: 'Investigation' },
    { key: 'FIR_REGISTERED', label: 'FIR Registered' },
    { key: 'RESOLVED',       label: 'Resolved' }
  ];

  const currentStatusIndex = statusTimeline.findIndex(s => s.key === complaint.status);

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost btn-sm gap-2 text-surface-500 hover:text-surface-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Complaints
      </button>

      {/* Header Dossier */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-surface-900">{complaint.title}</h1>
              <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                {complaint.complaintId}
              </span>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-xs text-surface-500 mt-1 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-surface-400" /> {complaint.location?.address}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              Update Status
            </button>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              Assign Officer
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn btn-sm bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" /> Upload Evidence
            </button>
            {complaint.status !== 'FIR_REGISTERED' && (
              <button
                onClick={handleRegisterFIR}
                disabled={firCreating}
                className="btn btn-sm bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 gap-1.5 disabled:opacity-50"
              >
                <FileBadge className="h-3.5 w-3.5" /> {firCreating ? 'Filing...' : 'Register FIR'}
              </button>
            )}
          </div>
        </div>

        {/* Case Timeline Visualizer */}
        <div className="pt-5">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Case Progression Timeline</p>
          <div className="flex items-center justify-between relative overflow-x-auto py-2">
            {statusTimeline.map((step, idx) => {
              const isCompleted = idx <= currentStatusIndex && currentStatusIndex !== -1;
              const isCurrent = idx === currentStatusIndex;
              return (
                <div key={step.key} className="flex flex-col items-center min-w-[100px] z-10">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : isCompleted
                        ? 'bg-success-600 text-white'
                        : 'bg-surface-200 text-surface-400'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium ${isCurrent ? 'text-primary-700 font-bold' : isCompleted ? 'text-surface-700' : 'text-surface-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-100 mt-4 text-xs">
          <div>
            <span className="text-surface-400 block uppercase font-semibold text-[10px]">Citizen Complainant</span>
            <span className="font-semibold text-surface-900 mt-0.5 block">{complaint.citizenId?.name || 'Anonymous'}</span>
            <span className="text-[11px] text-surface-400">{complaint.citizenId?.phone}</span>
          </div>
          <div>
            <span className="text-surface-400 block uppercase font-semibold text-[10px]">Crime Category</span>
            <span className="font-semibold text-primary-600 font-mono mt-0.5 block">{complaint.crimeType}</span>
          </div>
          <div>
            <span className="text-surface-400 block uppercase font-semibold text-[10px]">Assigned Station</span>
            <span className="font-semibold text-surface-900 mt-0.5 block">{complaint.policeStationId?.name || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-surface-400 block uppercase font-semibold text-[10px]">Investigating Officer</span>
            <span className="font-semibold text-success-700 mt-0.5 block">{complaint.assignedOfficerId?.name || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Description & Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Statement */}
          <SectionCard title="Incident Statement" icon={FileText}>
            <p className="text-xs text-surface-700 leading-relaxed whitespace-pre-line">{complaint.description}</p>
          </SectionCard>

          {/* Evidence Attachments */}
          <SectionCard title={`Case Evidence Files (${complaint.evidence?.length || 0})`} icon={Shield}>
            {(!complaint.evidence || complaint.evidence.length === 0) ? (
              <p className="text-xs text-surface-400 italic py-4 text-center">No digital evidence files attached.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {complaint.evidence.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-surface-900 truncate">{ev.originalName}</p>
                      <p className="text-[10px] text-surface-400 font-mono">{ev.type} • {new Date(ev.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <a
                      href={ev.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm text-[10px] shrink-0"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Location Map */}
        <div>
          <div className="card p-4">
            <h2 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" /> Incident Scene GIS
            </h2>
            <PoliceMap
              complaints={[complaint]}
              height="h-[320px]"
              title="Crime Scene GIS Telemetry"
            />
          </div>
        </div>
      </div>

      {/* Assign Officer Modal */}
      {assignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md w-full">
            <div className="modal-header">
              <h2 className="modal-title">Assign Officer</h2>
              <button onClick={() => setAssignModalOpen(false)} className="text-surface-400 hover:text-surface-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAssignOfficer} className="space-y-4 text-xs">
              <div>
                <label className="input-label">Select Officer</label>
                <select
                  required
                  value={selectedOfficerUserId}
                  onChange={(e) => setSelectedOfficerUserId(e.target.value)}
                  className="select"
                >
                  <option value="">Choose officer...</option>
                  {officers.map((off) => (
                    <option key={off.userId?._id} value={off.userId?._id}>
                      {off.userId?.name} ({off.rank} - {off.badgeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={assigning} className="btn btn-primary">
                  {assigning ? 'Assigning...' : 'Assign Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md w-full">
            <div className="modal-header">
              <h2 className="modal-title">Update Complaint Status</h2>
              <button onClick={() => setStatusModalOpen(false)} className="text-surface-400 hover:text-surface-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="input-label">Select Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="INVESTIGATION">INVESTIGATION</option>
                  <option value="FIR_REGISTERED">FIR_REGISTERED</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setStatusModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updatingStatus} className="btn btn-primary">
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md w-full">
            <div className="modal-header">
              <h2 className="modal-title">Attach Evidence File</h2>
              <button onClick={() => setUploadModalOpen(false)} className="text-surface-400 hover:text-surface-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUploadEvidence} className="space-y-4 text-xs">
              <div>
                <label className="input-label">Select File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setEvidenceFile(e.target.files[0])}
                  className="input"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setUploadModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="btn btn-primary">
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
