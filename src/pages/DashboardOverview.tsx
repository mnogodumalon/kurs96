import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Users, DoorOpen, ClipboardList, TrendingUp, Euro, CheckCircle2, Clock, ArrowRight, CalendarDays } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen, Dozenten, Teilnehmer, Raeume } from '@/types/app';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardOverview() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      LivingAppsService.getKurse(),
      LivingAppsService.getAnmeldungen(),
      LivingAppsService.getDozenten(),
      LivingAppsService.getTeilnehmer(),
      LivingAppsService.getRaeume(),
    ]).then(([k, a, d, t, r]) => {
      setKurse(k);
      setAnmeldungen(a);
      setDozenten(d);
      setTeilnehmer(t);
      setRaeume(r);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const aktiveKurse = kurse.filter(k => {
    const start = k.fields.startdatum ? parseISO(k.fields.startdatum) : null;
    const end = k.fields.enddatum ? parseISO(k.fields.enddatum) : null;
    return start && end && !isAfter(start, today) && !isBefore(end, today);
  });
  const kommendeKurse = kurse.filter(k => {
    const start = k.fields.startdatum ? parseISO(k.fields.startdatum) : null;
    return start && isAfter(start, today);
  });
  const bezahlteAnmeldungen = anmeldungen.filter(a => a.fields.bezahlt === true);
  const umsatz = kurse.reduce((sum, k) => {
    const kursAnmeldungen = anmeldungen.filter(a => a.fields.kurs?.includes(k.record_id));
    return sum + (k.fields.preis ?? 0) * kursAnmeldungen.length;
  }, 0);

  const monthData: Record<string, number> = {};
  anmeldungen.forEach(a => {
    if (a.fields.anmeldedatum) {
      const m = format(parseISO(a.fields.anmeldedatum), 'MMM', { locale: de });
      monthData[m] = (monthData[m] || 0) + 1;
    }
  });
  const chartData = Object.entries(monthData).map(([name, value]) => ({ name, value }));

  const nextCourses = [...kommendeKurse]
    .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Daten werden geladen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl gradient-hero shadow-hero p-8 text-white">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-20 w-64 h-64 rounded-full bg-white translate-y-1/2" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium uppercase tracking-widest mb-1" style={{ color: 'oklch(1 0 0 / 0.65)' }}>
            Willkommen zurück
          </p>
          <h1 className="text-3xl font-bold mb-1">KursManager</h1>
          <p className="text-sm" style={{ color: 'oklch(1 0 0 / 0.65)' }}>
            {format(today, "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
          <div className="mt-6 flex flex-wrap gap-8">
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'oklch(1 0 0 / 0.6)' }}>Aktive Kurse</p>
              <p className="text-4xl font-extrabold">{aktiveKurse.length}</p>
            </div>
            <div className="w-px" style={{ background: 'oklch(1 0 0 / 0.2)' }} />
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'oklch(1 0 0 / 0.6)' }}>Anmeldungen gesamt</p>
              <p className="text-4xl font-extrabold">{anmeldungen.length}</p>
            </div>
            <div className="w-px" style={{ background: 'oklch(1 0 0 / 0.2)' }} />
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'oklch(1 0 0 / 0.6)' }}>Gesamtumsatz</p>
              <p className="text-4xl font-extrabold">
                {umsatz.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Kurse', value: kurse.length, icon: BookOpen, href: '/kurse', iconColor: '#6366f1', bgColor: 'oklch(0.42 0.2 264 / 0.1)' },
          { label: 'Dozenten', value: dozenten.length, icon: GraduationCap, href: '/dozenten', iconColor: '#0891b2', bgColor: 'oklch(0.58 0.18 210 / 0.1)' },
          { label: 'Teilnehmer', value: teilnehmer.length, icon: Users, href: '/teilnehmer', iconColor: '#059669', bgColor: 'oklch(0.62 0.16 160 / 0.1)' },
          { label: 'Räume', value: raeume.length, icon: DoorOpen, href: '/raeume', iconColor: '#d97706', bgColor: 'oklch(0.72 0.15 85 / 0.1)' },
          { label: 'Anmeldungen', value: anmeldungen.length, icon: ClipboardList, href: '/anmeldungen', iconColor: '#dc2626', bgColor: 'oklch(0.65 0.2 30 / 0.1)' },
        ].map(kpi => (
          <Link
            key={kpi.href}
            to={kpi.href}
            className="group bg-card rounded-xl p-4 shadow-card border border-border hover:shadow-md transition-smooth flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: kpi.bgColor }}>
              <kpi.icon size={18} style={{ color: kpi.iconColor }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-smooth self-end" />
          </Link>
        ))}
      </div>

      {/* Chart + Status */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card rounded-xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-base">Anmeldungen nach Monat</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Alle Anmeldungen im Überblick</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <TrendingUp size={12} />
              Gesamt: {anmeldungen.length}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid oklch(0.91 0.008 264)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'oklch(0.42 0.2 264 / 0.05)' }}
                />
                <Bar dataKey="value" name="Anmeldungen" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`oklch(${Math.min(0.42 + i * 0.06, 0.65)} 0.2 264)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Noch keine Anmeldungen vorhanden</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-card rounded-xl p-5 border border-border shadow-card flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.42 0.2 264 / 0.1)' }}>
                <Clock size={16} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Aktive Kurse</p>
                <p className="text-xs text-muted-foreground">Laufen gerade</p>
              </div>
            </div>
            {aktiveKurse.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine aktiven Kurse</p>
            ) : (
              <div className="space-y-2">
                {aktiveKurse.slice(0, 3).map(k => (
                  <div key={k.record_id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="truncate font-medium">{k.fields.titel}</span>
                  </div>
                ))}
                {aktiveKurse.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-3.5">+{aktiveKurse.length - 3} weitere</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-5 border border-border shadow-card flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Bezahlte Anmeldungen</p>
                <p className="text-xs text-muted-foreground">Abgeschlossene Zahlungen</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{bezahlteAnmeldungen.length}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {anmeldungen.length}</span>
            </div>
            {anmeldungen.length > 0 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-smooth"
                  style={{ width: `${(bezahlteAnmeldungen.length / anmeldungen.length) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Courses */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.42 0.2 264 / 0.1)' }}>
              <CalendarDays size={16} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <h2 className="font-bold text-sm">Kommende Kurse</h2>
              <p className="text-xs text-muted-foreground">{kommendeKurse.length} geplant</p>
            </div>
          </div>
          <Link to="/kurse" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: '#6366f1' }}>
            Alle anzeigen <ArrowRight size={12} />
          </Link>
        </div>
        {nextCourses.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">Keine kommenden Kurse geplant</p>
            <Link to="/kurse" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: '#6366f1' }}>
              Kurs erstellen <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {nextCourses.map((k) => {
              const kursAnmeldungen = anmeldungen.filter(a => a.fields.kurs?.includes(k.record_id));
              const maxT = k.fields.max_teilnehmer ?? 0;
              const fillPct = maxT > 0 ? Math.min((kursAnmeldungen.length / maxT) * 100, 100) : 0;
              return (
                <div key={k.record_id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-smooth">
                  <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{k.fields.titel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {k.fields.startdatum ? format(parseISO(k.fields.startdatum), 'dd.MM.yyyy') : '—'}
                      {k.fields.enddatum && ` – ${format(parseISO(k.fields.enddatum), 'dd.MM.yyyy')}`}
                    </p>
                  </div>
                  {maxT > 0 && (
                    <div className="hidden sm:flex flex-col items-end gap-1 text-right">
                      <p className="text-xs font-medium">{kursAnmeldungen.length}/{maxT}</p>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: 'oklch(0.42 0.2 264)' }} />
                      </div>
                    </div>
                  )}
                  {k.fields.preis != null && (
                    <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: '#6366f1', background: 'oklch(0.42 0.2 264 / 0.08)' }}>
                      <Euro size={11} />
                      {k.fields.preis.toLocaleString('de-DE')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
