import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- ESTILOS PARA BLOQUEAR SELECCIÓN Y ZOOM ---
const GlobalStyles = () => (
    <style>{`
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      user-select: none;
    }
    input {
      user-select: text !important;
      -webkit-user-select: text !important;
      font-size: 16px !important; 
    }
  `}</style>
);

function SerieInput({ serie, index, onChangePeso, onChangeReps, onEliminar }) {
    const confirmarEliminar = () => {
        if (window.confirm("¿Borrar esta serie?")) onEliminar();
    };

    return (
        <div className="p-4 bg-[#111318] rounded-xl border border-gray-800 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
        <span className="flex-none w-6 h-6 flex items-center justify-center bg-gray-800 text-gray-400 rounded-full text-[10px] font-bold border border-gray-700">
          {index + 1}
        </span>
                <button onClick={confirmarEliminar} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
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
                        className="w-full bg-[#0a0c10] text-gray-100 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all font-medium"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500 ml-1 mb-1 tracking-wider">Repeticiones</span>
                    <input
                        type="text"
                        value={serie.nuevoReps ?? ''}
                        onChange={e => onChangeReps(e.target.value)}
                        placeholder={serie.reps || ''}
                        className="w-full bg-[#0a0c10] text-gray-100 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all font-medium"
                    />
                </div>
            </div>
        </div>
    );
}

function Ejercicio({ ejercicio, onActualizarSerie, onAgregarSerie, onEliminarEjercicio }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ejercicio.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.8 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="bg-[#161b22] border border-gray-800 rounded-2xl mb-8 overflow-hidden shadow-xl">
            <div className="bg-[#0d1117] p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-gray-600 hover:text-blue-400 bg-gray-800/50 rounded-lg touch-none">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    </div>
                    <h3 className="font-black text-lg text-blue-100 uppercase tracking-tight truncate">{ejercicio.nombre}</h3>
                </div>
                <button onClick={() => { if(window.confirm(`¿Eliminar ejercicio "${ejercicio.nombre}"?`)) onEliminarEjercicio() }} className="text-gray-500 hover:text-red-500 p-2 rounded-lg transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
            <div className="p-4 bg-[#161b22]">
                {ejercicio.series.map((serie, index) => (
                    <SerieInput key={serie.id} index={index} serie={serie} onChangePeso={v => onActualizarSerie(serie.id, 'nuevoPeso', v)} onChangeReps={v => onActualizarSerie(serie.id, 'nuevoReps', v)} onEliminar={() => onActualizarSerie(serie.id, 'eliminar')} />
                ))}
                <button onClick={onAgregarSerie} className="w-full py-4 mt-2 border border-dashed border-gray-700 bg-gray-800/20 rounded-xl text-gray-500 font-bold text-sm tracking-wide active:bg-blue-500/5 active:text-blue-400 transition-all">+ AÑADIR SERIE</button>
            </div>
        </div>
    );
}

export default function App() {
    const [gruposel, setgruposel] = useState(null);
    const [rutinas, setRutinas] = useState(() => JSON.parse(localStorage.getItem('rutinas')) || { 'Pecho - Triceps': [] });
    const [nuevoEjercicio, setNuevoEjercicio] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => { localStorage.setItem('rutinas', JSON.stringify(rutinas)); }, [rutinas]);

    const agregarEjercicio = () => {
        if (!nuevoEjercicio.trim()) return;
        const ejercicio = { id: Date.now() + Math.random(), nombre: nuevoEjercicio, series: [{ id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }] };
        setRutinas(prev => ({ ...prev, [gruposel]: [...(prev[gruposel] || []), ejercicio] }));
        setNuevoEjercicio('');
    };

    const actualizarSerie = (idEj, idS, campo, valor) => {
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
            copiaEj.series = [...copiaEj.series, { id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }];
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
                        nuevoPeso: '', nuevoReps: ''
                    }))
                }));
            }
            return actualizado;
        });
        setConfirmacionVisible(true);
        setTimeout(() => setConfirmacionVisible(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#05070a] text-gray-200 font-sans pb-20">
            <GlobalStyles />
            <main className="p-4 max-w-xl mx-auto">
                {gruposel === null ? (
                    <div className="pt-8 animate-in fade-in duration-300">
                        <h1 className="text-4xl font-black italic tracking-tighter text-center mb-1 text-blue-500 uppercase">GYMZAPP</h1>
                        <p className="text-center text-gray-500 mb-8 text-xs font-bold uppercase tracking-widest">SELECCIONA TU RUTINA</p>
                        <div className="space-y-3">
                            {Object.keys(rutinas).map(grupo => (
                                <div key={grupo} className="flex items-stretch rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                                    <button onClick={() => setgruposel(grupo)} className="flex-1 bg-[#111318] p-6 text-left active:bg-[#1c212c]">
                                        <span className="text-xl font-black text-gray-100 uppercase tracking-tight">{grupo}</span>
                                    </button>
                                    <button onClick={() => { if(window.confirm(`¿Borrar "${grupo}"?`)) { const c = {...rutinas}; delete c[grupo]; setRutinas(c); }}} className="bg-[#111318] w-16 flex items-center justify-center text-gray-600 hover:text-red-500 border-l border-gray-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-800/50">
                            <div className="flex gap-2">
                                <input type="text" placeholder="Nueva rutina..." value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)} className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                                <button onClick={() => { if(!nuevoGrupo.trim()) return; setRutinas(p => ({...p, [nuevoGrupo.trim()]: []})); setNuevoGrupo(''); }} className="bg-blue-600 px-6 rounded-xl font-bold">+</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* EL HEADER FUERA DE LA ANIMACIÓN PARA QUE SEA STICKY REAL */}
                        <div className="sticky top-0 bg-[#05070a] z-50 pt-4 pb-4 border-b border-gray-800 mb-6 flex items-center gap-4">
                            <button onClick={() => setgruposel(null)} className="p-2 bg-gray-800/50 rounded-lg text-gray-300 active:scale-95">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white truncate">{gruposel}</h2>
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
                                            <Ejercicio key={ej.id} ejercicio={ej} onActualizarSerie={(idS, c, v) => actualizarSerie(ej.id, idS, c, v)} onAgregarSerie={() => agregarSerie(ej.id)} onEliminarEjercicio={() => setRutinas(p => ({...p, [gruposel]: p[gruposel].filter(x => x.id !== ej.id)}))} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            <div className="mt-10 space-y-4 pb-12 text-center">
                                <div className="flex gap-3">
                                    <input type="text" placeholder="Nuevo ejercicio..." value={nuevoEjercicio} onChange={e => setNuevoEjercicio(e.target.value)} className="flex-1 bg-[#161b22] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-blue-500 outline-none" />
                                    <button onClick={agregarEjercicio} className="bg-gray-800 text-blue-400 font-bold px-6 rounded-xl border border-gray-700 active:scale-95 transition-all">AÑADIR</button>
                                </div>
                                <button onClick={confirmarRutina} className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all">GUARDAR ENTRENAMIENTO</button>
                            </div>
                        </div>
                    </>
                )}
                {confirmacionVisible && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-black px-8 py-3 rounded-full font-bold shadow-2xl z-[60] animate-bounce">Guardado ✅</div>}
            </main>
        </div>
    );
}