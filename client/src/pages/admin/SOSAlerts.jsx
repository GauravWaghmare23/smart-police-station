import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sosApi } from '../../api/sos.api';
import { officerApi } from '../../api/officer.api';
import { LoadingSpinner, ErrorState, StatusBadge, PageHeader, EmptyState } from '../../components/common/CommonUI';
import PoliceMap from '../../components/maps/PoliceMap';
import { getSocket } from '../../socket/socket';
import { Siren, ShieldAlert, CheckCircle, Radio, AlertOctagon, UserCheck, MapPin, X, Clock, Navigation, Building2, RefreshCw } from 'lucide-react';

// ── Officer availability filter ──────────────────────────────────────────────
const DISPATCHABLE = ['AVAILABLE', 'ON_DUTY'];

const SOSAlerts = () => {
  const { user } = useAuth();
  const [sosList,   setSosList]   = useState([]);
  const [officers,  setOfficers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const [selectedSos, setSelectedSos]             = useState(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOfficerUserId, setSelectedOfficerUserId] = useState('');
  const [dispatching, setDispatching]             = useState(false);

  // Live officer location state: { [officerId]: {lat, lng, name, status} }
  const [liveOfficerLocations, setLiveOfficerLocations] = useState({});
  const liveRef = useRef({});

  // Dispatch route: visible after dispatch, keyed by sosId
  const [dispatchRoute, setDispatchRoute] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSOSData = async () => {
    try {
      const [sosRes, offRes] = await Promise.all([sosApi.getAll(), officerApi.getAll()]);
      if (sosRes.success && sosRes.data?.sosList) {
        setSosList(sosRes.data.sosList);
        if (sosRes.data.sosList.length > 0 && !selectedSos) {
          const active = sosRes.data.sosList.find(s => s.status !== 'RESOLVED');
          setSelectedSos(active || sosRes.data.sosList[0]);
        }
      }
      if (offRes.success && offRes.data?.officers) setOfficers(offRes.data.officers);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load SOS monitor');
    } finally {
      setLoading(false);
    }
  };

  // ── Socket Listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchSOSData();
    const socket = getSocket();
    if (!socket) return;

    const handleSOSEvent = (data) => {
      fetchSOSData();
      // Update selected SOS in-place without losing selection
      const updated = data?.sos || data;
      if (updated?._id) {
        setSosList(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
        setSelectedSos(prev => prev?._id === updated._id ? { ...prev, ...updated } : prev);
      }
    };

    // Live officer location tracking
    const handleOfficerLocation = (payload) => {
      const { officerId, userId, name, currentLocation, dutyStatus } = payload;
      if (!currentLocation?.latitude || !currentLocation?.longitude) return;
      const key = String(officerId || userId);
      const entry = {
        key,
        name: name || 'Officer',
        lat: Number(currentLocation.latitude),
        lng: Number(currentLocation.longitude),
        status: dutyStatus,
        updatedAt: new Date(),
      };
      liveRef.current[key] = entry;
      setLiveOfficerLocations(prev => ({ ...prev, [key]: entry }));
    };

    socket.on('sos:new', handleSOSEvent);
    socket.on('sos:updated', handleSOSEvent);
    socket.on('sos:acknowledged', handleSOSEvent);
    socket.on('sos:dispatched', (data) => {
      handleSOSEvent(data);
      // Auto-show dispatch route on the map
      const sos = data?.sos || data;
      if (sos?.location?.latitude && sos?.assignedOfficerId) {
        const offKey = String(sos.assignedOfficerId._id || sos.assignedOfficerId);
        const live = liveRef.current[offKey];
        if (live) {
          setDispatchRoute({
            officer: { lat: live.lat, lng: live.lng, name: live.name },
            sos: { lat: Number(sos.location.latitude), lng: Number(sos.location.longitude), address: sos.location.address },
            sosId: sos.sosId,
          });
        }
      }
    });
    socket.on('sos:resolved', (data) => {
      handleSOSEvent(data);
      setDispatchRoute(null);
    });
    socket.on('officer:location', handleOfficerLocation);

    return () => {
      socket.off('sos:new', handleSOSEvent);
      socket.off('sos:updated', handleSOSEvent);
      socket.off('sos:acknowledged', handleSOSEvent);
      socket.off('sos:dispatched', handleSOSEvent);
      socket.off('sos:resolved', handleSOSEvent);
      socket.off('officer:location', handleOfficerLocation);
    };
  }, []);

  // ── SOS Actions ────────────────────────────────────────────────────────────
  const handleAcknowledge = async (id) => {
    try { await sosApi.acknowledge(id); fetchSOSData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to acknowledge'); }
  };

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this SOS alert as RESOLVED?')) return;
    try {
      await sosApi.resolve(id);
      fetchSOSData();
      setDispatchRoute(null);
    }
    catch (err) { alert(err.response?.data?.message || 'Failed to resolve'); }
  };

  const handleEscalate = async (id) => {
    if (!window.confirm('Escalate this SOS system-wide?')) return;
    try { await sosApi.escalate(id); fetchSOSData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to escalate'); }
  };

  const handleExecuteDispatch = async (e) => {
    e.preventDefault();
    if (!selectedSos?._id) return;
    setDispatching(true);
    try {
      const res = await sosApi.dispatch(selectedSos._id, selectedOfficerUserId || undefined);
      if (res.success) {
        setDispatchModalOpen(false);
        setSelectedOfficerUserId('');
        fetchSOSData();

        // Build dispatch route immediately from selected officer or any live officer
        const dispatchedSos = res.data?.sos || selectedSos;
        let offLoc = null;

        if (selectedOfficerUserId) {
          // Try live location first
          offLoc = Object.values(liveRef.current).find(o => o.key === selectedOfficerUserId);
          // Fallback to static prop location
          if (!offLoc) {
            const staticOff = officers.find(o => o.userId?._id === selectedOfficerUserId);
            if (staticOff?.currentLocation?.latitude) {
              offLoc = {
                lat: Number(staticOff.currentLocation.latitude),
                lng: Number(staticOff.currentLocation.longitude),
                name: staticOff.userId?.name || 'Officer',
              };
            }
          }
        } else {
          // Auto-dispatch: use closest live officer
          offLoc = Object.values(liveRef.current).find(o => o.status !== 'OFF_DUTY');
        }

        if (offLoc && dispatchedSos?.location?.latitude) {
          setDispatchRoute({
            officer: { lat: offLoc.lat, lng: offLoc.lng, name: offLoc.name },
            sos: {
              lat: Number(dispatchedSos.location.latitude),
              lng: Number(dispatchedSos.location.longitude),
              address: dispatchedSos.location.address,
            },
            sosId: selectedSos.sosId,
          });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch officer');
    } finally {
      setDispatching(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeSOS = sosList.filter((s) => s.status !== 'RESOLVED');

  // Filter officers: If user is STATION_HEAD, only show officers assigned to their station
  const stationHeadOfficer = user?.role === 'STATION_HEAD' ? officers.find(o => o.userId?._id === user._id) : null;
  const filteredOfficers = user?.role === 'STATION_HEAD' && stationHeadOfficer?.stationId
    ? officers.filter(o => o.stationId === stationHeadOfficer.stationId || o.stationId?._id === stationHeadOfficer.stationId)
    : officers;

  const availableOfficers = filteredOfficers.filter(o => DISPATCHABLE.includes(o.dutyStatus));
  const liveOfficerList = Object.values(liveOfficerLocations);

  // Build officer markers for map from both static + live
  const officersForMap = officers.filter(o => {
    const loc = o.currentLocation || o.location;
    return loc?.latitude && loc?.longitude;
  });

  if (loading) return <LoadingSpinner message="Connecting to emergency SOS feed..." />;
  if (error)   return <ErrorState message={error} onRetry={fetchSOSData} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Siren className={`h-6 w-6 ${activeSOS.length > 0 ? 'text-danger-500 animate-bounce' : 'text-surface-400'}`} />
            <h1 className="text-2xl font-bold text-surface-900">Emergency SOS Control Room</h1>
          </div>
          <p className="text-sm text-surface-500">Real-time distress beacon tracking and rapid dispatch console</p>
        </div>
        <div className="flex items-center gap-3">
          {liveOfficerList.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-50 border border-success-200">
              <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-xs font-bold text-success-700">{liveOfficerList.length} Officers Live</span>
            </div>
          )}
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border ${
            activeSOS.length > 0 ? 'bg-danger-50 border-danger-200' : 'bg-success-50 border-success-200'
          }`}>
            <span className={`h-2 w-2 rounded-full ${activeSOS.length > 0 ? 'bg-danger-500 animate-pulse' : 'bg-success-500'}`} />
            <span className={`text-sm font-bold ${activeSOS.length > 0 ? 'text-danger-700' : 'text-success-700'}`}>
              {activeSOS.length > 0 ? `${activeSOS.length} Active` : 'All Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main: Detail card + Map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOS Detail Card */}
        <div className="card p-6 bg-white border-danger-200 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-danger-50 rounded-xl">
                  <Siren className="h-5 w-5 text-danger-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-surface-900">🚨 ACTIVE SOS TELEMETRY</h2>
                  <p className="text-xs font-mono font-bold text-danger-600">{selectedSos?.sosId || 'NO SELECTION'}</p>
                </div>
              </div>
              {selectedSos && <StatusBadge status={selectedSos.status} />}
            </div>

            {selectedSos ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest block">Citizen</span>
                  <p className="font-bold text-surface-900 text-sm mt-0.5">{selectedSos.citizenId?.name || '—'}</p>
                  <p className="text-[11px] text-surface-500 font-mono">{selectedSos.citizenId?.phone || ''}</p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest block">Location</span>
                  <p className="font-semibold text-surface-800 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="h-4 w-4 text-danger-500 flex-shrink-0 mt-0.5" />
                    <span>{selectedSos.location?.address || `${selectedSos.location?.latitude?.toFixed(5)}, ${selectedSos.location?.longitude?.toFixed(5)}`}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-primary-50/50 rounded-xl border border-primary-100">
                    <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest block">Nearest Station</span>
                    <p className="font-bold text-primary-900 mt-0.5">{selectedSos.nearestStationId?.name || '—'}</p>
                    <p className="text-[11px] text-primary-700 font-mono font-semibold mt-0.5">
                      {selectedSos.stationDistanceKm != null ? `${selectedSos.stationDistanceKm} km` : ''}
                    </p>
                  </div>
                  <div className="p-3 bg-success-50/50 rounded-xl border border-success-100">
                    <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest block">Dispatched Officer</span>
                    <p className="font-bold text-success-900 mt-0.5">{selectedSos.assignedOfficerId?.name || 'Unassigned'}</p>
                    {selectedSos.officerDistanceKm != null && (
                      <p className="text-[11px] text-success-700 font-mono font-semibold mt-0.5">{selectedSos.officerDistanceKm} km away</p>
                    )}
                  </div>
                </div>

                {/* Live officer location badge */}
                {selectedSos.assignedOfficerId && (() => {
                  const offKey = String(selectedSos.assignedOfficerId._id || selectedSos.assignedOfficerId);
                  const live = liveOfficerLocations[offKey];
                  return live ? (
                    <div className="flex items-center gap-2 p-2 bg-success-50 border border-success-200 rounded-lg">
                      <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-success-700">
                        {live.name} · LIVE @ {live.lat.toFixed(4)}, {live.lng.toFixed(4)}
                        · {live.updatedAt?.toLocaleTimeString()}
                      </span>
                    </div>
                  ) : null;
                })()}

                {/* Dispatch route badge */}
                {dispatchRoute && dispatchRoute.sosId === selectedSos.sosId && (
                  <div className="flex items-center gap-2 p-2 bg-danger-50 border border-danger-200 rounded-lg">
                    <Navigation className="h-3.5 w-3.5 text-danger-600" />
                    <span className="text-[11px] font-bold text-danger-700">
                      Route active: {dispatchRoute.officer.name} → SOS Location
                    </span>
                    <button onClick={() => setDispatchRoute(null)} className="ml-auto text-danger-400 hover:text-danger-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-surface-100 text-[11px] text-surface-500 font-mono flex justify-between">
                  <span>Triggered: {new Date(selectedSos.createdAt).toLocaleTimeString()}</span>
                  <span>Status: <b className="text-danger-600">{selectedSos.status}</b></span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-surface-400">Select an SOS alert to view telemetry.</div>
            )}
          </div>

          {selectedSos && (
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-surface-100">
              {selectedSos.status === 'ACTIVE' && (
                <button onClick={() => handleAcknowledge(selectedSos._id)}
                  className="btn btn-sm bg-warning-50 text-warning-700 border border-warning-200 hover:bg-warning-100 text-xs flex-1 justify-center">
                  Ack
                </button>
              )}
              {selectedSos.status !== 'RESOLVED' && (
                <>
                  <button onClick={() => setDispatchModalOpen(true)}
                    className="btn btn-primary btn-sm text-xs flex-1 justify-center gap-1">
                    <Radio className="h-3.5 w-3.5" /> Dispatch
                  </button>
                  <button onClick={() => handleEscalate(selectedSos._id)}
                    className="btn btn-sm bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs justify-center">
                    Escalate
                  </button>
                  <button onClick={() => handleResolve(selectedSos._id)}
                    className="btn btn-sm bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 text-xs justify-center">
                    Resolve
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <PoliceMap
            officers={officersForMap}
            sosList={selectedSos ? [selectedSos] : sosList}
            stations={selectedSos?.nearestStationId ? [selectedSos.nearestStationId] : []}
            dispatchRoute={dispatchRoute}
            height="h-[460px]"
            title={
              dispatchRoute
                ? `DISPATCH ROUTE: ${dispatchRoute.officer.name} → ${dispatchRoute.sosId}`
                : selectedSos
                ? `Live SOS GIS Dispatch: ${selectedSos.sosId}`
                : 'Emergency SOS GIS Monitor'
            }
          />
        </div>
      </div>

      {/* ── Live Officers Panel ── */}
      {liveOfficerList.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
            <h3 className="text-sm font-bold text-surface-800">Live Officer Locations</h3>
            <span className="badge badge-success ml-auto">{liveOfficerList.length} tracking</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {liveOfficerList.map((off) => (
              <div key={off.key} className="flex items-center gap-2 p-2 bg-success-50 border border-success-100 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-success-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {off.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-surface-800 truncate">{off.name}</p>
                  <p className="text-[10px] text-success-700 font-mono">{off.lat.toFixed(4)}, {off.lng.toFixed(4)}</p>
                  <p className="text-[9px] text-surface-400">{off.updatedAt?.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SOS Incident Table ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-surface-800">Full SOS Incident Log</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchSOSData} className="p-1.5 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition" title="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="badge badge-gray">{sosList.length} records</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th>SOS ID</th>
                <th>Citizen</th>
                <th>Location</th>
                <th>Station</th>
                <th>Officer</th>
                <th>Status</th>
                <th>Time</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {sosList.length === 0 ? (
                <tr><td colSpan="8" className="py-12">
                  <EmptyState icon={ShieldAlert} message="No emergency SOS alerts" description="All alerts resolved." />
                </td></tr>
              ) : (
                sosList.map((sos) => (
                  <tr
                    key={sos._id}
                    onClick={() => { setSelectedSos(sos); setDispatchRoute(null); }}
                    className={`cursor-pointer transition-colors ${selectedSos?._id === sos._id ? 'bg-danger-50/40' : ''}`}
                  >
                    <td><span className="text-xs font-mono font-bold text-danger-600">{sos.sosId}</span></td>
                    <td className="text-xs">{sos.citizenId?.name || 'Anonymous'}</td>
                    <td className="text-xs text-surface-500 max-w-[140px] truncate">
                      {sos.location?.address || `${sos.location?.latitude?.toFixed(4)}, ${sos.location?.longitude?.toFixed(4)}`}
                    </td>
                    <td className="text-xs">{sos.nearestStationId?.name || '—'}</td>
                    <td className="text-xs">
                      <div className="flex items-center gap-1">
                        {sos.assignedOfficerId?.name || <span className="text-surface-400">Unassigned</span>}
                        {/* Live indicator */}
                        {sos.assignedOfficerId && liveOfficerLocations[String(sos.assignedOfficerId._id)] && (
                          <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" title="Live tracking active" />
                        )}
                      </div>
                    </td>
                    <td><StatusBadge status={sos.status} /></td>
                    <td className="text-xs text-surface-400 font-mono">
                      {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="text-right">
                      {sos.status !== 'RESOLVED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSos(sos); setDispatchModalOpen(true); }}
                          className="btn btn-primary btn-sm text-[11px]"
                        >
                          Dispatch
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dispatch Modal ── */}
      {dispatchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-lg w-full">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger-50 rounded-xl">
                  <Radio className="h-5 w-5 text-danger-600" />
                </div>
                <div>
                  <h2 className="modal-title">Dispatch Officer</h2>
                  <p className="text-sm text-surface-500 mt-0.5">SOS Alert: <b className="text-danger-600">{selectedSos?.sosId}</b></p>
                </div>
              </div>
              <button onClick={() => setDispatchModalOpen(false)} className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteDispatch} className="space-y-4">
              {/* SOS Location Summary */}
              {selectedSos && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-danger-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-danger-800">SOS Location</p>
                      <p className="text-xs text-danger-700">{selectedSos.location?.address || `${selectedSos.location?.latitude?.toFixed(5)}, ${selectedSos.location?.longitude?.toFixed(5)}`}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">Select Officer for Emergency Deployment</label>
                <select
                  value={selectedOfficerUserId}
                  onChange={(e) => setSelectedOfficerUserId(e.target.value)}
                  className="select"
                >
                  <option value="">Auto-assign nearest available officer</option>
                  {/* Live officers first */}
                  {liveOfficerList.length > 0 && (
                    <optgroup label="🟢 Live Officers (GPS Active)">
                      {liveOfficerList.map((lo) => (
                        <option key={lo.key} value={lo.key}>
                          {lo.name} — LIVE ({(lo.status || 'ON_DUTY').replace(/_/g, ' ')})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {/* Available officers from DB */}
                  {availableOfficers.length > 0 && (
                    <optgroup label="📋 Available Officers">
                      {availableOfficers.map((off) => (
                        <option key={off.userId?._id} value={off.userId?._id}>
                          {off.userId?.name} — {off.rank?.replace(/_/g, ' ')} ({off.dutyStatus?.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-xs text-surface-400 mt-1.5">
                  {liveOfficerList.length > 0
                    ? `${liveOfficerList.length} officers with live GPS · ${availableOfficers.length} available from DB`
                    : `${availableOfficers.length} available officers. Select to dispatch with live route tracking.`}
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setDispatchModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={dispatching} className="btn btn-danger">
                  {dispatching ? 'Dispatching...' : '🚨 Confirm Emergency Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSAlerts;
