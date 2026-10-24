'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Droplets,
  Fuel,
  Gauge,
  IdCard,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  registration: string | null;
  type: string;
  driver: string | null;
  odometer: number | null;
  insuranceUntil: string | null;
  fitnessUntil: string | null;
  status: string;
  fuelMonth: number;
  litresMonth: number;
  otherMonth: number;
}

interface VehicleSummary {
  total: number;
  inService: number;
  fuelMonth: number;
  serviceMonth: number;
  docsExpiring: number;
}

interface VehicleLog {
  id: string;
  vehicleId: string;
  type: string;
  date: string;
  litres: number | null;
  cost: number;
  odometer: number | null;
  vendor: string | null;
  notes: string | null;
  vehicle: { id: string; name: string; registration: string | null } | null;
}

interface LogSummary {
  entries: number;
  fuelCost: number;
  litres: number;
  serviceCost: number;
  totalCost: number;
}

const VEHICLE_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_service: 'bg-amber-50 text-amber-700 border-amber-200',
  retired: 'bg-slate-100 text-slate-600 border-slate-200',
};

const LOG_TYPE_STYLES: Record<string, string> = {
  fuel: 'bg-violet-50 text-violet-700 border-violet-200',
  service: 'bg-sky-50 text-sky-700 border-sky-200',
  repair: 'bg-amber-50 text-amber-700 border-amber-200',
  insurance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
};

const LOG_TYPES = ['all', 'fuel', 'service', 'repair', 'insurance', 'other'];

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function inr(value: number): string {
  return `Rs.${Math.round(value).toLocaleString('en-IN')}`;
}

function day(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function expiryTone(value: string | null): string {
  if (!value) return 'text-slate-400';
  const due = new Date(value).getTime();
  const now = Date.now();
  if (due < now) return 'text-rose-600 font-semibold';
  if (due < now + 30 * 24 * 60 * 60 * 1000) return 'text-amber-600 font-semibold';
  return 'text-slate-600';
}

function FleetView() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'vehicles' | 'costs'>(
    searchParams.get('tab') === 'costs' ? 'costs' : 'vehicles',
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSummary, setVehicleSummary] = useState<VehicleSummary | null>(null);
  const [logs, setLogs] = useState<VehicleLog[]>([]);
  const [logSummary, setLogSummary] = useState<LogSummary | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [logVehicle, setLogVehicle] = useState('all');
  const [logType, setLogType] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const logParams = new URLSearchParams();
      if (logVehicle !== 'all') logParams.set('vehicleId', logVehicle);
      if (logType !== 'all') logParams.set('type', logType);

      const [vehicleRes, logRes] = await Promise.all([
        fetch('/api/fleet/vehicles'),
        fetch(`/api/fleet/logs?${logParams.toString()}`),
      ]);

      if (!vehicleRes.ok) {
        const data = await vehicleRes.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load vehicles');
      }
      if (!logRes.ok) {
        const data = await logRes.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load running costs');
      }

      const vehicleData = await vehicleRes.json();
      const logData = await logRes.json();

      setVehicles(vehicleData.vehicles || []);
      setVehicleSummary(vehicleData.summary || null);
      setLogs(logData.logs || []);
      setLogSummary(logData.summary || null);
      setCanManage(Boolean(vehicleData.canManage ?? logData.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load fleet data');
    } finally {
      setLoading(false);
    }
  }, [logVehicle, logType]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const removeLog = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/fleet/logs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Entry removed');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const removeVehicle = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/fleet/vehicles?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Vehicle removed with its cost history');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const visibleVehicles = vehicles.filter((vehicle) => {
    const needle = vehicleSearch.trim().toLowerCase();
    if (!needle) return true;
    return [vehicle.name, vehicle.registration, vehicle.driver, vehicle.type]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-7xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Fleet
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Vehicles, drivers, statutory dates and the real running cost of every unit
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/operations/fleet/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              <Plus className="h-4 w-4" />
              Add vehicle
            </Link>
            <Link
              href="/operations/fleet/logs/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              <Fuel className="h-4 w-4" />
              Add running cost
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Vehicles',
              value: vehicleSummary ? String(vehicleSummary.total) : '—',
              hint: vehicleSummary ? `${vehicleSummary.inService} in service` : '',
              icon: Car,
              tint: 'from-violet-500 to-purple-600',
            },
            {
              label: 'Fuel this month',
              value: vehicleSummary ? inr(vehicleSummary.fuelMonth) : '—',
              hint: logSummary ? `${logSummary.litres.toLocaleString('en-IN')} litres logged` : '',
              icon: Fuel,
              tint: 'from-sky-500 to-blue-600',
            },
            {
              label: 'Service this month',
              value: vehicleSummary ? inr(vehicleSummary.serviceMonth) : '—',
              hint: 'Repairs, servicing, permits',
              icon: Wallet,
              tint: 'from-amber-500 to-orange-600',
            },
            {
              label: 'Documents expiring',
              value: vehicleSummary ? String(vehicleSummary.docsExpiring) : '—',
              hint: 'Insurance or fitness within 30 days',
              icon: ShieldCheck,
              tint: 'from-rose-500 to-red-600',
            },
          ].map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl p-4 pl-5"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 4px 20px -6px rgb(0 0 0 / 0.08)',
              }}
            >
              <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${card.tint}`} />
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
                {card.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.hint}
              </p>
            </motion.div>
          ))}
        </div>

        <div
          className="rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full gap-1 rounded-xl p-1 lg:w-auto" style={{ background: 'hsl(var(--muted))' }}>
              <button
                type="button"
                onClick={() => setTab('vehicles')}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition lg:flex-none ${
                  tab === 'vehicles' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Vehicles
              </button>
              <button
                type="button"
                onClick={() => setTab('costs')}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition lg:flex-none ${
                  tab === 'costs' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Running costs
              </button>
            </div>

            {tab === 'vehicles' ? (
              <div className="relative lg:w-72">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <input
                  value={vehicleSearch}
                  onChange={(event) => setVehicleSearch(event.target.value)}
                  placeholder="Search vehicle, driver, number"
                  className="glass-input w-full py-2 pl-9 pr-3 text-sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                <select
                  value={logVehicle}
                  onChange={(event) => setLogVehicle(event.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-sm"
                >
                  <option value="all">Any vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration || vehicle.name}
                    </option>
                  ))}
                </select>
                <select
                  value={logType}
                  onChange={(event) => setLogType(event.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-sm"
                >
                  {LOG_TYPES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry === 'all' ? 'Any type' : labelize(entry)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading fleet…
            </div>
          ) : tab === 'vehicles' ? (
            visibleVehicles.length === 0 ? (
              <div className="py-16 text-center">
                <Car className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {vehicles.length === 0 ? 'No vehicles yet' : 'Nothing matches that search'}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {vehicles.length === 0
                    ? 'Add a vehicle to track its documents and running cost.'
                    : 'Try a different name, number or driver.'}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                        <th className="pb-3 pr-3 font-semibold">Vehicle</th>
                        <th className="pb-3 pr-3 font-semibold">Driver</th>
                        <th className="pb-3 pr-3 font-semibold">Odometer</th>
                        <th className="pb-3 pr-3 font-semibold">Insurance</th>
                        <th className="pb-3 pr-3 font-semibold">Fitness</th>
                        <th className="pb-3 pr-3 font-semibold">Month cost</th>
                        <th className="pb-3 pr-3 font-semibold">Status</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleVehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {vehicle.name}
                            </p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {[vehicle.registration, labelize(vehicle.type)].filter(Boolean).join(' · ')}
                            </p>
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {vehicle.driver || '—'}
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {vehicle.odometer !== null ? `${Math.round(vehicle.odometer).toLocaleString('en-IN')} km` : '—'}
                          </td>
                          <td className={`py-3 pr-3 text-sm ${expiryTone(vehicle.insuranceUntil)}`}>{day(vehicle.insuranceUntil)}</td>
                          <td className={`py-3 pr-3 text-sm ${expiryTone(vehicle.fitnessUntil)}`}>{day(vehicle.fitnessUntil)}</td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {inr(vehicle.fuelMonth + vehicle.otherMonth)}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${VEHICLE_STATUS_STYLES[vehicle.status] || VEHICLE_STATUS_STYLES.active}`}>
                              {labelize(vehicle.status)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Link
                                href={`/operations/fleet/logs/new?vehicleId=${vehicle.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                              >
                                <Fuel className="h-3.5 w-3.5" />
                                Log cost
                              </Link>
                              <Link
                                href={`/operations/fleet/${vehicle.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                              {deletingId === vehicle.id ? (
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <button
                                    type="button"
                                    disabled={busyId === vehicle.id}
                                    onClick={() => removeVehicle(vehicle.id)}
                                    className="rounded-lg bg-rose-600 px-2 py-1.5 font-semibold text-white disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId('')}
                                    className="rounded-lg border px-2 py-1.5 font-semibold"
                                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                canManage && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(vehicle.id)}
                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                    aria-label={`Delete ${vehicle.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-3 lg:hidden">
                  {visibleVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="rounded-xl p-3.5"
                      style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {vehicle.name}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {[vehicle.registration, vehicle.driver].filter(Boolean).join(' · ') || labelize(vehicle.type)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${VEHICLE_STATUS_STYLES[vehicle.status] || VEHICLE_STATUS_STYLES.active}`}>
                          {labelize(vehicle.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" />
                          {vehicle.odometer !== null ? `${Math.round(vehicle.odometer).toLocaleString('en-IN')} km` : 'No reading'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="h-3.5 w-3.5" />
                          {inr(vehicle.fuelMonth + vehicle.otherMonth)}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${expiryTone(vehicle.insuranceUntil)}`}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {day(vehicle.insuranceUntil)}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${expiryTone(vehicle.fitnessUntil)}`}>
                          <IdCard className="h-3.5 w-3.5" />
                          {day(vehicle.fitnessUntil)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/operations/fleet/logs/new?vehicleId=${vehicle.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-2 text-xs font-semibold text-violet-700"
                        >
                          <Fuel className="h-3.5 w-3.5" />
                          Log cost
                        </Link>
                        <Link
                          href={`/operations/fleet/${vehicle.id}/edit`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeletingId(vehicle.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                            aria-label={`Delete ${vehicle.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {deletingId === vehicle.id && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                          <span className="flex-1">Delete this vehicle and its costs?</span>
                          <button
                            type="button"
                            disabled={busyId === vehicle.id}
                            onClick={() => removeVehicle(vehicle.id)}
                            className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId('')}
                            className="rounded-md border border-rose-200 px-2 py-1 font-semibold"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Fuel className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No running costs logged
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Log fuel and service bills to see what the fleet actually costs.
              </p>
              <Link
                href="/operations/fleet/logs/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add running cost
              </Link>
            </div>
          ) : (
            <>
              {logSummary && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { label: 'Fuel', value: inr(logSummary.fuelCost) },
                    { label: 'Litres', value: logSummary.litres.toLocaleString('en-IN') },
                    { label: 'Service & repairs', value: inr(logSummary.serviceCost) },
                  ].map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-xl px-3 py-2"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {entry.label}
                      </p>
                      <p className="text-sm font-bold">{entry.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      <th className="pb-3 pr-3 font-semibold">Date</th>
                      <th className="pb-3 pr-3 font-semibold">Vehicle</th>
                      <th className="pb-3 pr-3 font-semibold">Type</th>
                      <th className="pb-3 pr-3 font-semibold">Litres</th>
                      <th className="pb-3 pr-3 font-semibold">Odometer</th>
                      <th className="pb-3 pr-3 font-semibold">Vendor</th>
                      <th className="pb-3 pr-3 font-semibold">Amount</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {day(log.date)}
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.vehicle?.registration || log.vehicle?.name || '—'}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.other}`}>
                            {labelize(log.type)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.litres ? `${log.litres} L` : '—'}
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.odometer ? `${Math.round(log.odometer).toLocaleString('en-IN')} km` : '—'}
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.vendor || '—'}
                        </td>
                        <td className="py-3 pr-3 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {inr(log.cost)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              href={`/operations/fleet/logs/${log.id}/edit`}
                              className="inline-flex items-center rounded-lg border p-1.5 transition hover:bg-black/5"
                              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                              aria-label="Edit entry"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            {deletingId === log.id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <button
                                  type="button"
                                  disabled={busyId === log.id}
                                  onClick={() => removeLog(log.id)}
                                  className="rounded-lg bg-rose-600 px-2 py-1.5 font-semibold text-white disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId('')}
                                  className="rounded-lg border px-2 py-1.5 font-semibold"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingId(log.id)}
                                className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                aria-label="Delete entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 lg:hidden">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl p-3.5"
                    style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.vehicle?.registration || log.vehicle?.name || 'Vehicle'}
                        </p>
                        <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {day(log.date)}
                          {log.vendor ? ` · ${log.vendor}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.other}`}>
                        {labelize(log.type)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        <Wallet className="h-3.5 w-3.5" />
                        {inr(log.cost)}
                      </span>
                      {log.litres ? (
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3.5 w-3.5" />
                          {log.litres} L
                        </span>
                      ) : null}
                      {log.odometer ? (
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" />
                          {Math.round(log.odometer).toLocaleString('en-IN')} km
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/operations/fleet/logs/${log.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeletingId(log.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {deletingId === log.id && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                        <span className="flex-1">Delete this entry?</span>
                        <button
                          type="button"
                          disabled={busyId === log.id}
                          onClick={() => removeLog(log.id)}
                          className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId('')}
                          className="rounded-md border border-rose-200 px-2 py-1 font-semibold"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex h-full items-center justify-center gap-2 p-6 text-sm"
          style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading fleet…
        </div>
      }
    >
      <FleetView />
    </Suspense>
  );
}
