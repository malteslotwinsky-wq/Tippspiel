'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Spieler, Turnier, Tipp, TurnierErgebnis, RUNDEN_NAMEN, Runde, PUNKTE_PRO_RUNDE } from '@/lib/types';

interface TeilnehmerOption {
    name: string;
}

export default function VergleichPage() {
    const [loading, setLoading] = useState(true);
    const [turnier, setTurnier] = useState<Turnier | null>(null);
    const [teilnehmerListe, setTeilnehmerListe] = useState<TeilnehmerOption[]>([]);
    const [spieler, setSpieler] = useState<{ herren: Spieler[]; damen: Spieler[] } | null>(null);
    const [tipps, setTipps] = useState<Tipp[]>([]);
    const [ergebnisse, setErgebnisse] = useState<TurnierErgebnis[]>([]);

    // Dynamic array of selected participants
    const [selectedTeilnehmer, setSelectedTeilnehmer] = useState<string[]>(['', '']);

    useEffect(() => {
        async function loadData() {
            try {
                const [turnierRes, teilnehmerRes, spielerRes, tippsRes, ergebnisseRes] = await Promise.all([
                    fetch('/api/turnier'),
                    fetch('/api/teilnehmer'),
                    fetch('/api/spieler'),
                    fetch('/api/tipps'),
                    fetch('/api/turnier/ergebnisse'),
                ]);

                const turniere = await turnierRes.json();
                const aktivTurnier = turniere.find((t: Turnier) => t.aktiv);
                setTurnier(aktivTurnier || null);

                const teilnehmer = await teilnehmerRes.json();
                setTeilnehmerListe(teilnehmer);

                setSpieler(await spielerRes.json());

                const alleTipps = await tippsRes.json();
                if (aktivTurnier) {
                    setTipps(alleTipps.filter((t: Tipp) => t.turnierId === aktivTurnier.id));
                }

                const alleErgebnisse = await ergebnisseRes.json();
                if (aktivTurnier) {
                    setErgebnisse(alleErgebnisse.filter((e: TurnierErgebnis) => e.turnierId === aktivTurnier.id));
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
        loadData();
    }, []);

    function getSpielerInfo(id: string) {
        if (!spieler) return { name: id, ranking: 0 };
        const alleSpieler = [...spieler.herren, ...spieler.damen];
        const found = alleSpieler.find(s => s.id === id);
        return found ? { name: found.name, ranking: found.ranking } : { name: id, ranking: 0 };
    }

    function getSpielerStatus(id: string) {
        const ergebnis = ergebnisse.find(e => e.spielerId === id);
        if (!ergebnis) {
            return { runde: null, nochDabei: true, rundenName: null, punkte: 0, isSieger: false };
        }

        // Basispunkte für die Runde
        let punkte = PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] || 0;

        // Sieger-Bonus: +1 wenn im Finale (runde 7) und NICHT ausgeschieden
        const isSieger = ergebnis.runde === 7 && ergebnis.out !== true;
        if (isSieger) {
            punkte += 1;
        }

        return {
            runde: ergebnis.runde,
            nochDabei: ergebnis.out !== true,
            rundenName: RUNDEN_NAMEN[ergebnis.runde as Runde],
            punkte,
            isSieger,
        };
    }

    function berechneKategoriePunkte(spielerIds: string[]) {
        return spielerIds.reduce((sum, id) => {
            const status = getSpielerStatus(id);
            return sum + status.punkte;
        }, 0);
    }

    function isGemeinsam(id: string, otherTipps: (Tipp | undefined)[], kategorie: 'herren' | 'damen') {
        return otherTipps.filter(t => t).some(t => t![kategorie].includes(id));
    }

    function addTeilnehmer() {
        setSelectedTeilnehmer([...selectedTeilnehmer, '']);
    }

    function removeTeilnehmer(index: number) {
        if (selectedTeilnehmer.length > 2) {
            setSelectedTeilnehmer(selectedTeilnehmer.filter((_, i) => i !== index));
        }
    }

    function updateTeilnehmer(index: number, value: string) {
        const updated = [...selectedTeilnehmer];
        updated[index] = value;
        setSelectedTeilnehmer(updated);
    }

    const selectedTipps = selectedTeilnehmer.map(name => tipps.find(t => t.teilnehmerName === name));
    const hasValidSelection = selectedTeilnehmer.filter(n => n).length >= 2;
    const allTippsExist = selectedTeilnehmer.filter(n => n).every(name => tipps.find(t => t.teilnehmerName === name));

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-8 w-48"></div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="skeleton h-12"></div>
                    <div className="skeleton h-12"></div>
                </div>
                <div className="skeleton h-96"></div>
            </div>
        );
    }

    if (!turnier) {
        return (
            <Card>
                <div className="empty-state">
                    <p className="empty-state-title">Kein aktives Turnier</p>
                    <Link href="/rangliste" className="btn-secondary btn-sm mt-4">
                        Zur Rangliste
                    </Link>
                </div>
            </Card>
        );
    }

    const teilnehmerMitTipps = teilnehmerListe.filter(t =>
        tipps.some(tipp => tipp.teilnehmerName === t.name)
    );

    // Grid columns based on number of participants
    const gridCols = selectedTeilnehmer.length === 2 ? 'md:grid-cols-2' :
        selectedTeilnehmer.length === 3 ? 'md:grid-cols-3' :
            'md:grid-cols-2 lg:grid-cols-4';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="page-header">
                <Link href="/rangliste" className="link text-sm">
                    ← Zurück zur Rangliste
                </Link>
                <h1 className="page-title mt-2">Tipp-Vergleich</h1>
                <p className="page-subtitle">{turnier.name} {turnier.jahr}</p>
            </div>

            {/* Selector */}
            <Card>
                <div className="space-y-4">
                    <div className={`grid gap-4 ${gridCols}`}>
                        {selectedTeilnehmer.map((selected, index) => (
                            <div key={index} className="relative">
                                <label className="label">Teilnehmer {index + 1}</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selected}
                                        onChange={(e) => updateTeilnehmer(index, e.target.value)}
                                        className="input flex-1"
                                    >
                                        <option value="">Auswählen...</option>
                                        {teilnehmerMitTipps.map(t => (
                                            <option key={t.name} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    {selectedTeilnehmer.length > 2 && (
                                        <button
                                            onClick={() => removeTeilnehmer(index)}
                                            className="btn-ghost btn-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                                            title="Entfernen"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add more button */}
                    <button
                        onClick={addTeilnehmer}
                        className="btn-secondary btn-sm w-full sm:w-auto"
                    >
                        <span className="mr-2">+</span>
                        Weiteren Teilnehmer hinzufügen
                    </button>
                </div>
            </Card>

            {/* Comparison */}
            {hasValidSelection && allTippsExist && (
                <div className="space-y-6">
                    {/* Herren */}
                    <section>
                        <h2 className="section-header">Herren</h2>
                        <div className={`grid gap-4 ${gridCols}`}>
                            {selectedTeilnehmer.map((name, index) => {
                                const tipp = selectedTipps[index];
                                if (!name || !tipp) return null;

                                const otherTipps = selectedTipps.filter((_, i) => i !== index);

                                return (
                                    <Card
                                        key={`herren-${index}`}
                                        title={name}
                                        subtitle={`${berechneKategoriePunkte(tipp.herren).toFixed(1)} Punkte`}
                                    >
                                        <div className="space-y-2">
                                            {tipp.herren.map(id => {
                                                const info = getSpielerInfo(id);
                                                const status = getSpielerStatus(id);
                                                const gemeinsam = isGemeinsam(id, otherTipps, 'herren');
                                                const isSieger = id === tipp.siegerHerren;

                                                return (
                                                    <div
                                                        key={id}
                                                        className={`p-2.5 rounded-lg flex items-center justify-between text-sm ${gemeinsam ? 'bg-blue-50 border border-blue-200' :
                                                            status.nochDabei ? 'bg-emerald-50 border border-emerald-100' :
                                                                'bg-slate-50 border border-slate-100'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {gemeinsam && <span className="text-blue-500 text-xs">●</span>}
                                                            <span className="text-slate-400 text-xs w-4">{info.ranking}</span>
                                                            <span className={`truncate ${status.nochDabei ? 'font-medium' : 'text-slate-500'}`}>
                                                                {info.name}
                                                            </span>
                                                            {isSieger && <span className="text-amber-500 text-sm">★</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                                                            <span className={`font-semibold text-xs tabular-nums ${status.punkte > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {status.punkte.toFixed(1)}
                                                            </span>
                                                            {status.nochDabei ? (
                                                                <span className="badge badge-green text-xs">
                                                                    {status.rundenName || 'Dabei'}
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-gray text-xs">
                                                                    Out
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    {/* Damen */}
                    <section>
                        <h2 className="section-header">Damen</h2>
                        <div className={`grid gap-4 ${gridCols}`}>
                            {selectedTeilnehmer.map((name, index) => {
                                const tipp = selectedTipps[index];
                                if (!name || !tipp) return null;

                                const otherTipps = selectedTipps.filter((_, i) => i !== index);

                                return (
                                    <Card
                                        key={`damen-${index}`}
                                        title={name}
                                        subtitle={`${berechneKategoriePunkte(tipp.damen).toFixed(1)} Punkte`}
                                    >
                                        <div className="space-y-2">
                                            {tipp.damen.map(id => {
                                                const info = getSpielerInfo(id);
                                                const status = getSpielerStatus(id);
                                                const gemeinsam = isGemeinsam(id, otherTipps, 'damen');
                                                const isSieger = id === tipp.siegerDamen;

                                                return (
                                                    <div
                                                        key={id}
                                                        className={`p-2.5 rounded-lg flex items-center justify-between text-sm ${gemeinsam ? 'bg-blue-50 border border-blue-200' :
                                                            status.nochDabei ? 'bg-emerald-50 border border-emerald-100' :
                                                                'bg-slate-50 border border-slate-100'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {gemeinsam && <span className="text-blue-500 text-xs">●</span>}
                                                            <span className="text-slate-400 text-xs w-4">{info.ranking}</span>
                                                            <span className={`truncate ${status.nochDabei ? 'font-medium' : 'text-slate-500'}`}>
                                                                {info.name}
                                                            </span>
                                                            {isSieger && <span className="text-amber-500 text-sm">★</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                                                            <span className={`font-semibold text-xs tabular-nums ${status.punkte > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {status.punkte.toFixed(1)}
                                                            </span>
                                                            {status.nochDabei ? (
                                                                <span className="badge badge-green text-xs">
                                                                    {status.rundenName || 'Dabei'}
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-gray text-xs">
                                                                    Out
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    {/* Legende */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
                            <span>Gemeinsamer Pick</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-amber-500">★</span>
                            <span>Siegertipp</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-600">4.0</span>
                            <span>Punkte</span>
                        </div>
                    </div>
                </div>
            )}

            {/* No selection */}
            {!hasValidSelection && (
                <Card>
                    <div className="empty-state">
                        <p className="empty-state-text">
                            Wähle mindestens zwei Teilnehmer aus, um ihre Tipps zu vergleichen.
                        </p>
                    </div>
                </Card>
            )}

            {/* Missing tips */}
            {hasValidSelection && !allTippsExist && (
                <Card>
                    <div className="empty-state">
                        <p className="empty-state-text">
                            Einer oder mehrere Teilnehmer haben keinen Tipp abgegeben.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
