'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Spieler, Turnier, Tipp, TurnierErgebnis, RUNDEN_NAMEN, Runde, PUNKTE_PRO_RUNDE } from '@/lib/types';

interface TeilnehmerOption {
    name: string;
}

export default function VergleichPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [turnier, setTurnier] = useState<Turnier | null>(null);
    const [teilnehmerListe, setTeilnehmerListe] = useState<TeilnehmerOption[]>([]);
    const [spieler, setSpieler] = useState<{ herren: Spieler[]; damen: Spieler[] } | null>(null);
    const [tipps, setTipps] = useState<Tipp[]>([]);
    const [ergebnisse, setErgebnisse] = useState<TurnierErgebnis[]>([]);

    const [teilnehmerA, setTeilnehmerA] = useState<string>(searchParams.get('a') || '');
    const [teilnehmerB, setTeilnehmerB] = useState<string>(searchParams.get('b') || '');

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

    const tippA = tipps.find(t => t.teilnehmerName === teilnehmerA);
    const tippB = tipps.find(t => t.teilnehmerName === teilnehmerB);

    function getSpielerInfo(id: string) {
        if (!spieler) return { name: id, ranking: 0 };
        const alleSpieler = [...spieler.herren, ...spieler.damen];
        const found = alleSpieler.find(s => s.id === id);
        return found ? { name: found.name, ranking: found.ranking } : { name: id, ranking: 0 };
    }

    function getSpielerStatus(id: string) {
        const ergebnis = ergebnisse.find(e => e.spielerId === id);
        if (!ergebnis) {
            return { runde: null, nochDabei: true, rundenName: null, punkte: 0 };
        }
        return {
            runde: ergebnis.runde,
            nochDabei: ergebnis.out !== true,
            rundenName: RUNDEN_NAMEN[ergebnis.runde as Runde],
            punkte: PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] || 0,
        };
    }

    function berechneKategoriePunkte(spielerIds: string[]) {
        return spielerIds.reduce((sum, id) => {
            const status = getSpielerStatus(id);
            return sum + status.punkte;
        }, 0);
    }

    function isGemeinsam(id: string, andererTipp: Tipp | undefined, kategorie: 'herren' | 'damen') {
        if (!andererTipp) return false;
        return andererTipp[kategorie].includes(id);
    }

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
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="label">Teilnehmer 1</label>
                        <select
                            value={teilnehmerA}
                            onChange={(e) => setTeilnehmerA(e.target.value)}
                            className="input"
                        >
                            <option value="">Auswählen...</option>
                            {teilnehmerMitTipps.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-2xl font-bold text-slate-300 hidden sm:block">vs</div>

                    <div className="flex-1 w-full">
                        <label className="label">Teilnehmer 2</label>
                        <select
                            value={teilnehmerB}
                            onChange={(e) => setTeilnehmerB(e.target.value)}
                            className="input"
                        >
                            <option value="">Auswählen...</option>
                            {teilnehmerMitTipps.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Comparison */}
            {tippA && tippB && (
                <div className="space-y-6">
                    {/* Herren */}
                    <section>
                        <h2 className="section-header">Herren</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Teilnehmer A - Herren */}
                            <Card
                                title={teilnehmerA}
                                subtitle={`${berechneKategoriePunkte(tippA.herren).toFixed(1)} Punkte`}
                            >
                                <div className="space-y-2">
                                    {tippA.herren.map(id => {
                                        const info = getSpielerInfo(id);
                                        const status = getSpielerStatus(id);
                                        const gemeinsam = isGemeinsam(id, tippB, 'herren');
                                        const isSieger = id === tippA.siegerHerren;

                                        return (
                                            <div
                                                key={id}
                                                className={`p-3 rounded-lg flex items-center justify-between text-sm ${gemeinsam ? 'bg-blue-50 border border-blue-200' :
                                                        status.nochDabei ? 'bg-emerald-50 border border-emerald-100' :
                                                            'bg-slate-50 border border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {gemeinsam && <span className="text-blue-500 text-xs">●</span>}
                                                    <span className="text-slate-400 text-xs w-5">{info.ranking}</span>
                                                    <span className={`truncate ${status.nochDabei ? 'font-medium' : 'text-slate-500'}`}>
                                                        {info.name}
                                                    </span>
                                                    {isSieger && <span className="text-amber-500">★</span>}
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                    {status.nochDabei ? (
                                                        <span className="badge badge-green text-xs">
                                                            {status.rundenName || 'Dabei'}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-gray text-xs">
                                                            Out {status.rundenName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Teilnehmer B - Herren */}
                            <Card
                                title={teilnehmerB}
                                subtitle={`${berechneKategoriePunkte(tippB.herren).toFixed(1)} Punkte`}
                            >
                                <div className="space-y-2">
                                    {tippB.herren.map(id => {
                                        const info = getSpielerInfo(id);
                                        const status = getSpielerStatus(id);
                                        const gemeinsam = isGemeinsam(id, tippA, 'herren');
                                        const isSieger = id === tippB.siegerHerren;

                                        return (
                                            <div
                                                key={id}
                                                className={`p-3 rounded-lg flex items-center justify-between text-sm ${gemeinsam ? 'bg-blue-50 border border-blue-200' :
                                                        status.nochDabei ? 'bg-emerald-50 border border-emerald-100' :
                                                            'bg-slate-50 border border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {gemeinsam && <span className="text-blue-500 text-xs">●</span>}
                                                    <span className="text-slate-400 text-xs w-5">{info.ranking}</span>
                                                    <span className={`truncate ${status.nochDabei ? 'font-medium' : 'text-slate-500'}`}>
                                                        {info.name}
                                                    </span>
                                                    {isSieger && <span className="text-amber-500">★</span>}
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                    {status.nochDabei ? (
                                                        <span className="badge badge-green text-xs">
                                                            {status.rundenName || 'Dabei'}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-gray text-xs">
                                                            Out {status.rundenName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Damen */}
                    <section>
                        <h2 className="section-header">Damen</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Teilnehmer A - Damen */}
                            <Card
                                title={teilnehmerA}
                                subtitle={`${berechneKategoriePunkte(tippA.damen).toFixed(1)} Punkte`}
                            >
                                <div className="space-y-2">
                                    {tippA.damen.map(id => {
                                        const info = getSpielerInfo(id);
                                        const status = getSpielerStatus(id);
                                        const gemeinsam = isGemeinsam(id, tippB, 'damen');
                                        const isSieger = id === tippA.siegerDamen;

                                        return (
                                            <div
                                                key={id}
                                                className={`p-3 rounded-lg flex items-center justify-between text-sm ${gemeinsam ? 'bg-blue-50 border border-blue-200' :
                                                        status.nochDabei ? 'bg-emerald-50 border border-emerald-100' :
                                                            'bg-slate-50 border border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {gemeinsam && <span className="text-blue-500 text-xs">●</span>}
                                                    <span className="text-slate-400 text-xs w-5">{info.ranking}</span>
                                                    <span className={`truncate ${status.nochDabei ? 'font-medium' : 'text-slate-500'}`}>
                                                        {info.name}
                                                    </span>
                                                    {isSieger && <span className="text-amber-500">★</span>}
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                    {status.nochDabei ? (
                                                        <span className="badge badge-green text-xs">
                                                            {status.rundenName || 'Dabei'}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-gray text-xs">
                                                            Out {status.rundenName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Teilnehmer B - Damen */}
                            <Card
                                title={teilnehmerB}
                                subtitle={`${berechneKategoriePunkte(tippB.damen).toFixed(1)} Punkte`}
                            >
                                <div className="space-y-2">
                                    {tippB.damen.map(id => {
                                        const info = getSpielerInfo(id);
                                        const status = getSpielerStatus(id);
                                        const gemeinsam = isGemeinsam(id, tippA, 'damen');
                                        const isSieger = id === tippB.siegerDamen;

                                        return (
                                            <div
                                                key={id}
                                                className={`p-3 rounded-lg flex items-center justify-between text-sm ${gemeinsam ? 'bg-blue-50 border border-blue-200' :
                                                        status.nochDabei ? 'bg-emerald-50 border border-emerald-100' :
                                                            'bg-slate-50 border border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {gemeinsam && <span className="text-blue-500 text-xs">●</span>}
                                                    <span className="text-slate-400 text-xs w-5">{info.ranking}</span>
                                                    <span className={`truncate ${status.nochDabei ? 'font-medium' : 'text-slate-500'}`}>
                                                        {info.name}
                                                    </span>
                                                    {isSieger && <span className="text-amber-500">★</span>}
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                    {status.nochDabei ? (
                                                        <span className="badge badge-green text-xs">
                                                            {status.rundenName || 'Dabei'}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-gray text-xs">
                                                            Out {status.rundenName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
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
                    </div>
                </div>
            )}

            {/* No selection */}
            {(!teilnehmerA || !teilnehmerB) && (
                <Card>
                    <div className="empty-state">
                        <p className="empty-state-text">
                            Wähle zwei Teilnehmer aus, um ihre Tipps zu vergleichen.
                        </p>
                    </div>
                </Card>
            )}

            {/* Missing tips */}
            {teilnehmerA && teilnehmerB && (!tippA || !tippB) && (
                <Card>
                    <div className="empty-state">
                        <p className="empty-state-text">
                            {!tippA && `${teilnehmerA} hat keinen Tipp abgegeben.`}
                            {!tippA && !tippB && ' '}
                            {!tippB && `${teilnehmerB} hat keinen Tipp abgegeben.`}
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
