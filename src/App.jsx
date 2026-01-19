import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- ESTILOS GLOBALES ---
// He añadido el background-color al body dinámicamente para evitar el flash blanco al cambiar de pantalla
const GlobalStyles = ({ darkMode }) => (
    <style>{`
    * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; user-select: none; }
    input { user-select: text !important; -webkit-user-select: text !important; font-size: 16px !important; }
    body { background-color: ${darkMode ? '#05070a' : '#f0f2f5'}; transition: background-color 0.3s ease; }
    .footer-shadow { box-shadow: 0 -10px 30px rgba(0,0,0,0.5); }
  `}</style>
);

function SerieInput({ serie, index, onChangePeso, onChangeReps, onEliminar, onToggleCheck, darkMode }) {
    const confirmarEliminar = () => {
        if (window.confirm("¿Borrar esta serie?")) onEliminar();
    };

    // Colores dinámicos
    const bgCard = darkMode ? 'bg-[#111318]' : 'bg-white';
    const borderCard = darkMode ? 'border-gray-800' : 'border-gray-200';
    const bgInput = darkMode ? 'bg-[#0a0c10]' : 'bg-gray-50';
    const textInput = darkMode ? 'text-gray-100' : 'text-gray-900';

    return (
        <div className={`p-4 rounded-xl border mb-4 shadow-sm transition-all ${serie.completada ? 'bg-blue-900/10 border-blue-500/40' : `${bgCard} ${borderCard}`}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleCheck}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${serie.completada ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}
                    >
                        {serie.completada && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className="flex-none w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold border border-gray-300">
                        {index + 1}
                    </span>
                </div>
                {/* PAPELERA SIEMPRE ROJA (Móvil) */}
                <button onClick={confirmarEliminar} className="text-red-500 p-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500 ml-1 mb-1 tracking-wider">Peso</span>
                    <input
                        type="text"
                        value={serie.nuevoPeso ?? ''}
                        onChange={e => onChangePeso(e.target.value)}
                        placeholder={serie.peso || ''}
                        className={`w-full ${bgInput} ${textInput} ${borderCard} border rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all font-medium`}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500 ml-1 mb-1 tracking-wider">Repeticiones</span>
                    <input
                        type="text"
                        value={serie.nuevoReps ?? ''}
                        onChange={e => onChangeReps(e.target.value)}
                        placeholder={serie.reps || ''}
                        className={`w-full ${bgInput} ${textInput} ${borderCard} border rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all font-medium`}
                    />
                </div>
            </div>
        </div>
    );
}

function Ejercicio({ ejercicio, onActualizarSerie, onAgregarSerie, onEliminarEjercicio, darkMode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ejercicio.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.8 : 1 };

    // Colores dinámicos
    const bgContainer = darkMode ? 'bg-[#161b22]' : 'bg-white';
    const bgHeader = darkMode ? 'bg-[#0d1117]' : 'bg-gray-100';
    const border = darkMode ? 'border-gray-800' : 'border-gray-200';
    const textColor = darkMode ? 'text-blue-100' : 'text-gray-800';

    return (
        <div ref={setNodeRef} style={style} className={`${bgContainer} border ${border} rounded-2xl mb-8 overflow-hidden shadow-xl`}>
            <div className={`${bgHeader} p-4 border-b ${border} flex items-center justify-between`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-gray-500 bg-black/5 rounded-lg touch-none">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    </div>
                    <h3 className={`font-black text-lg ${textColor} uppercase tracking-tight truncate`}>{ejercicio.nombre}</h3>
                </div>
                {/* PAPELERA ROJA SIEMPRE */}
                <button onClick={() => { if(window.confirm(`¿Eliminar ejercicio "${ejercicio.nombre}"?`)) onEliminarEjercicio() }} className="text-red-500 p-2 rounded-lg transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
            <div className={`p-4 ${bgContainer}`}>
                {ejercicio.series.map((serie, index) => (
                    <SerieInput
                        key={serie.id}
                        index={index}
                        serie={serie}
                        onChangePeso={v => onActualizarSerie(serie.id, 'nuevoPeso', v)}
                        onChangeReps={v => onActualizarSerie(serie.id, 'nuevoReps', v)}
                        onEliminar={() => onActualizarSerie(serie.id, 'eliminar')}
                        onToggleCheck={() => onActualizarSerie(serie.id, 'completada', !serie.completada)}
                        darkMode={darkMode}
                    />
                ))}
                <button
                    onClick={onAgregarSerie}
                    className="w-full py-4 mt-2 border border-dashed border-gray-400 bg-gray-500/10 rounded-xl text-green-400/50 font-bold text-sm tracking-wide active:bg-green-500/10 active:text-green-500 transition-all"
                >
                    + AÑADIR SERIE
                </button>
            </div>
        </div>
    );
}

export default function App() {
    const [seccion, setSeccion] = useState('rutinas');
    const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('gymConfig')) || { descanso: 120 });
    // Nuevo estado para el Tema
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('gymTheme');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [gruposel, setgruposel] = useState(null);
    const [rutinas, setRutinas] = useState(() => JSON.parse(localStorage.getItem('rutinas')) || { 'Pecho - Triceps': [] });
    const [nuevoEjercicio, setNuevoEjercicio] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);
    const [tiempo, setTiempo] = useState(0);
    const [timerActivo, setTimerActivo] = useState(false);
    const timerRef = useRef(null);

    // Refs para el Swipe
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => { localStorage.setItem('rutinas', JSON.stringify(rutinas)); }, [rutinas]);
    useEffect(() => { localStorage.setItem('gymConfig', JSON.stringify(config)); }, [config]);
    useEffect(() => { localStorage.setItem('gymTheme', JSON.stringify(darkMode)); }, [darkMode]);

    // Lógica Swipe Back (Sin flash)
    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    }
    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    }
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance < -100; // Deslizar de izq a derecha > 100px
        if (isLeftSwipe && gruposel !== null) {
            setgruposel(null); // Volver atrás
        }
    }

    const iniciarTimer = () => {
        setTiempo(config.descanso);
        setTimerActivo(true);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTiempo(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setTimeout(() => setTimerActivo(false), 2000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const agregarEjercicio = () => {
        if (!nuevoEjercicio.trim()) return;
        const ejercicio = { id: Date.now() + Math.random(), nombre: nuevoEjercicio, series: [{ id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '', completada: false }] };
        setRutinas(prev => ({ ...prev, [gruposel]: [...(prev[gruposel] || []), ejercicio] }));
        setNuevoEjercicio('');
    };

    const actualizarSerie = (idEj, idS, campo, valor) => {
        if (campo === 'completada' && valor === true) iniciarTimer();
        setRutinas(prev => {
            const copiaGrupo = [...prev[gruposel]];
            const idxEj = copiaGrupo.findIndex(e => e.id === idEj);
            if (idxEj === -1) return prev;
            const copiaEj = { ...copiaGrupo[idxEj] };
            if (campo === 'eliminar') copiaEj.series = copiaEj.series.filter(s => s.id !== idS);
            else copiaEj.series = copiaEj.series.map(s => s.id === idS ? { ...s, [campo]: valor } : s);
            copiaGrupo[idxEj] = copiaEj;
            return { ...prev, [gruposel]: copiaGrupo };
        });
    };

    const agregarSerie = idEj => {
        setRutinas(prev => {
            const copiaGrupo = [...prev[gruposel]];
            const idxEj = copiaGrupo.findIndex(e => e.id === idEj);
            if (idxEj === -1) return prev;
            const copiaEj = { ...copiaGrupo[idxEj] };
            copiaEj.series = [...copiaEj.series, { id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '', completada: false }];
            copiaGrupo[idxEj] = copiaEj;
            return { ...prev, [gruposel]: copiaGrupo };
        });
    };

    const confirmarRutina = () => {
        setRutinas(prev => {
            const actualizado = { ...prev };
            for (const g in actualizado) {
                actualizado[g] = actualizado[g].map(ej => ({
                    ...ej,
                    series: ej.series.map(s => ({
                        ...s,
                        peso: s.nuevoPeso && s.nuevoPeso !== '' ? s.nuevoPeso : (s.peso ?? ''),
                        reps: s.nuevoReps && s.nuevoReps !== '' ? s.nuevoReps : (s.reps ?? ''),
                        nuevoPeso: '', nuevoReps: '', completada: false
                    }))
                }));
            }
            return actualizado;
        });
        setConfirmacionVisible(true);
        setTimeout(() => setConfirmacionVisible(false), 2000);
    };

    // Variables de estilo global según tema
    const mainBg = darkMode ? 'bg-[#05070a] text-gray-200' : 'bg-[#f0f2f5] text-gray-900';
    const cardBg = darkMode ? 'bg-[#111318]' : 'bg-white';
    const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
    const inputBg = darkMode ? 'bg-[#0d1117]' : 'bg-white';

    return (
        <div
            className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${mainBg}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <GlobalStyles darkMode={darkMode} />
            <main className="p-4 max-w-xl mx-auto">
                {seccion === 'ajustes' ? (
                    <div className="pt-8 animate-in fade-in duration-300">
                        <h1 className="text-3xl font-black italic text-blue-500 mb-8 uppercase tracking-tighter">AJUSTES</h1>

                        {/* TIEMPO (NO TOCADO) */}
                        <div className={`${cardBg} p-6 rounded-2xl border ${borderColor} mb-6`}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">TIEMPO DE DESCANSO</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[60, 90, 120, 180, 240, 300].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setConfig({...config, descanso: t})}
                                        className={`py-4 rounded-xl font-bold transition-all ${config.descanso === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : `${darkMode ? 'bg-[#0a0c10]' : 'bg-gray-100'} text-gray-600 border ${borderColor}`}`}
                                    >
                                        {t >= 60 ? `${t/60}m` : `${t}s`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* NUEVO: TEMA CLARO/OSCURO */}
                        <div className={`${cardBg} p-6 rounded-2xl border ${borderColor}`}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">APARIENCIA</p>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-full py-4 rounded-xl font-bold border flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black shadow-sm'}`}
                            >
                                {darkMode ? '🌙 MODO OSCURO' : '☀️ MODO CLARO'}
                            </button>
                        </div>
                    </div>
                ) : gruposel === null ? (
                    <div className="pt-8 animate-in fade-in duration-300">
                        <h1 className="text-4xl font-black italic tracking-tighter text-center mb-1 text-blue-500 uppercase">GYMZAPP</h1>
                        <p className="text-center text-gray-500 mb-8 text-xs font-bold uppercase tracking-widest">SELECCIONA TU RUTINA</p>
                        <div className="space-y-3">
                            {Object.keys(rutinas).map(grupo => (
                                <div key={grupo} className={`flex items-stretch rounded-2xl overflow-hidden shadow-sm border ${borderColor}`}>
                                    <button onClick={() => setgruposel(grupo)} className={`flex-1 ${cardBg} p-6 text-left active:opacity-80`}>
                                        <span className={`text-xl font-black uppercase tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{grupo}</span>
                                    </button>
                                    {/* PAPELERA ROJA SIEMPRE */}
                                    <button onClick={() => { if(window.confirm(`¿Borrar "${grupo}"?`)) { const c = {...rutinas}; delete c[grupo]; setRutinas(c); }}} className={`${cardBg} w-16 flex items-center justify-center text-red-500 border-l ${borderColor}`}>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-800/50' : 'border-gray-300'} flex gap-2`}>
                            <input type="text" placeholder="Nueva rutina..." value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)} className={`flex-1 ${inputBg} border ${borderColor} rounded-xl px-4 py-3 ${darkMode ? 'text-white' : 'text-black'} focus:border-blue-500 outline-none`} />
                            <button onClick={() => { if(!nuevoGrupo.trim()) return; setRutinas(p => ({...p, [nuevoGrupo.trim()]: []})); setNuevoGrupo(''); }} className="bg-blue-600 px-6 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30">+</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`sticky top-0 ${darkMode ? 'bg-[#05070a]/90' : 'bg-[#f0f2f5]/90'} backdrop-blur-md z-50 pt-4 pb-4 border-b ${borderColor} mb-6`}>
                            <div className="flex items-center gap-4 mb-4">
                                <button onClick={() => setgruposel(null)} className={`p-2 rounded-lg active:scale-95 ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-white border border-gray-200 text-gray-600 shadow-sm'}`}>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <h2 className={`text-xl font-black uppercase tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{gruposel}</h2>
                            </div>

                            {timerActivo && (
                                <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200 shadow-xl shadow-blue-500/20">
                                    <span className="text-xs font-black uppercase opacity-70 text-white">Descanso</span>
                                    <span className="text-2xl font-black tabular-nums text-white">{Math.floor(tiempo / 60)}:{(tiempo % 60).toString().padStart(2, '0')}</span>
                                    <button onClick={() => setTimerActivo(false)} className="text-[10px] font-black bg-black/20 text-white px-3 py-1 rounded-md uppercase">Saltar</button>
                                </div>
                            )}
                        </div>

                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active, over}) => {
                                if (active.id !== over?.id) {
                                    setRutinas(prev => {
                                        const lista = [...prev[gruposel]];
                                        return { ...prev, [gruposel]: arrayMove(lista, lista.findIndex(e => e.id === active.id), lista.findIndex(e => e.id === over.id)) };
                                    });
                                }
                            }}>
                                <SortableContext items={rutinas[gruposel]} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-6">
                                        {rutinas[gruposel].map(ej => (
                                            <Ejercicio
                                                key={ej.id}
                                                ejercicio={ej}
                                                onActualizarSerie={(idS, c, v) => actualizarSerie(ej.id, idS, c, v)}
                                                onAgregarSerie={() => agregarSerie(ej.id)}
                                                onEliminarEjercicio={() => setRutinas(p => ({...p, [gruposel]: p[gruposel].filter(x => x.id !== ej.id)}))}
                                                darkMode={darkMode}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            <div className="mt-10 space-y-4 pb-12 text-center">
                                <div className="flex gap-3">
                                    <input type="text" placeholder="Nuevo ejercicio..." value={nuevoEjercicio} onChange={e => setNuevoEjercicio(e.target.value)} className={`flex-1 ${inputBg} border ${borderColor} rounded-xl px-4 py-4 ${darkMode ? 'text-white' : 'text-black'} focus:border-blue-500 outline-none`} />
                                    <button onClick={agregarEjercicio} className={`font-bold px-6 rounded-xl border active:scale-95 transition-all ${darkMode ? 'bg-gray-800 text-blue-400 border-gray-700' : 'bg-white text-blue-600 border-gray-300 shadow-sm'}`}>AÑADIR</button>
                                </div>
                                <button onClick={confirmarRutina} className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all">GUARDAR ENTRENAMIENTO</button>
                            </div>
                        </div>
                    </>
                )}
                {confirmacionVisible && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-black px-8 py-3 rounded-full font-bold shadow-2xl z-[60] animate-bounce">Guardado ✅</div>}
            </main>

            {/* NAV OCULTO SI ESTAMOS EN RUTINA (gruposel !== null) */}
            {gruposel === null && (
                <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-[#0d1117]/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-md border-t p-4 footer-shadow z-[100]`}>
                    <div className="max-w-xl mx-auto flex justify-around">
                        <button onClick={() => setSeccion('rutinas')} className={`flex flex-col items-center gap-1 ${seccion === 'rutinas' ? 'text-blue-500' : 'text-gray-400'}`}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                            <span className="text-[9px] font-bold uppercase">Rutinas</span>
                        </button>
                        <button onClick={() => setSeccion('ajustes')} className={`flex flex-col items-center gap-1 ${seccion === 'ajustes' ? 'text-blue-500' : 'text-gray-400'}`}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                            <span className="text-[9px] font-bold uppercase">Ajustes</span>
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}