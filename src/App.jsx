import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- TEMA OSCURO PURO CON TU LÓGICA ---

function SerieInput({ serie, index, onChangePeso, onChangeReps, onEliminar }) {
    // Solo UI. La lógica viene limpia desde arriba.
    const confirmarEliminar = () => {
        if (window.confirm("¿Borrar esta serie?")) {
            onEliminar();
        }
    };

    return (
        <div className="flex items-center gap-2 p-3 bg-[#111318] rounded-xl border border-gray-800 mb-2 shadow-sm">
            {/* Círculo con número */}
            <span className="flex-none w-6 h-6 flex items-center justify-center bg-gray-800 text-gray-400 rounded-full text-[10px] font-bold border border-gray-700">
        {index + 1}
      </span>

            <div className="flex flex-1 gap-3">
                {/* INPUT PESO (type="text" para tus notas) */}
                <div className="flex flex-col flex-1 min-w-[60px]">
                    <span className="text-[9px] uppercase font-bold text-gray-500 ml-1 tracking-wider">Peso</span>
                    <input
                        type="text"
                        value={serie.nuevoPeso ?? ''}
                        onChange={e => onChangePeso(e.target.value)}
                        placeholder={serie.peso || '-'}
                        className="w-full bg-[#0a0c10] text-gray-100 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-700 transition-all font-medium"
                    />
                </div>

                {/* INPUT REPS */}
                <div className="flex flex-col flex-1 min-w-[60px]">
                    <span className="text-[9px] uppercase font-bold text-gray-500 ml-1 tracking-wider">Reps</span>
                    <input
                        type="text"
                        value={serie.nuevoReps ?? ''}
                        onChange={e => onChangeReps(e.target.value)}
                        placeholder={serie.reps || '-'}
                        className="w-full bg-[#0a0c10] text-gray-100 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-700 transition-all font-medium"
                    />
                </div>
            </div>

            {/* BOTÓN ELIMINAR SERIE (Visible y accesible) */}
            <button
                onClick={confirmarEliminar}
                className="flex-none p-3 bg-red-900/10 text-red-500 hover:bg-red-900/30 rounded-lg border border-red-900/20 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    );
}

function Ejercicio({ ejercicio, onActualizarSerie, onAgregarSerie, onEliminarEjercicio }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ejercicio.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.8 : 1
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-[#161b22] border border-gray-800 rounded-2xl mb-6 overflow-hidden shadow-xl ring-1 ring-white/5">
            {/* Cabecera del Ejercicio */}
            <div className="bg-[#0d1117] p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Asa para arrastrar */}
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-gray-600 hover:text-blue-400 bg-gray-800/50 rounded-lg touch-none">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    </div>
                    <h3 className="font-black text-lg text-blue-100 uppercase tracking-tight truncate">{ejercicio.nombre}</h3>
                </div>

                {/* Botón Eliminar Ejercicio (Rojo suave) */}
                <button
                    onClick={() => { if(window.confirm(`¿Eliminar ejercicio "${ejercicio.nombre}"?`)) onEliminarEjercicio() }}
                    className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>

            <div className="p-3 bg-[#161b22]">
                {ejercicio.series.map((serie, index) => (
                    <SerieInput
                        key={serie.id}
                        index={index}
                        serie={serie}
                        onChangePeso={valor => onActualizarSerie(serie.id, 'nuevoPeso', valor)}
                        onChangeReps={valor => onActualizarSerie(serie.id, 'nuevoReps', valor)}
                        onEliminar={() => onActualizarSerie(serie.id, 'eliminar')}
                    />
                ))}
                <button
                    onClick={onAgregarSerie}
                    className="w-full py-3 mt-2 border border-dashed border-gray-700 bg-gray-800/30 rounded-xl text-gray-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all font-bold text-sm tracking-wide"
                >
                    + AÑADIR SERIE
                </button>
            </div>
        </div>
    );
}

export default function App() {
    const [gruposel, setgruposel] = useState(null);

    // --- INICIALIZACIÓN DE ESTADO (Igual que tu original) ---
    const [rutinas, setRutinas] = useState(() => {
        const saved = localStorage.getItem('rutinas');
        return saved
            ? JSON.parse(saved)
            : {
                'Pecho - Triceps': [
                    { id: 1, nombre: 'Press Banca', series: [
                            { id: 1, peso: '', reps: '', nuevoPeso: '', nuevoReps: '' },
                            { id: 2, peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }
                        ]},
                ],
            };
    });

    const [nuevoEjercicio, setNuevoEjercicio] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);

    // Sensores táctiles (para que vaya fino en móvil)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 200, // Un pelín de delay para diferenciar scroll de drag
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        localStorage.setItem('rutinas', JSON.stringify(rutinas));
    }, [rutinas]);

    // --- TU LÓGICA ORIGINAL (INTACTA) PARA EVITAR BUGS ---
    // He quitado mis inventos de "guardarHistorial" y "callbacks inline".
    // Volvemos a la manipulación segura de arrays.

    const agregarEjercicio = () => {
        if (!nuevoEjercicio.trim()) return;
        const ejerciciosGrupo = rutinas[gruposel] || [];
        const nuevoId = Date.now() + Math.random();
        const ejercicio = {
            id: nuevoId,
            nombre: nuevoEjercicio,
            series: [{ id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }]
        };
        // Copia limpia del array
        setRutinas(prev => ({ ...prev, [gruposel]: [...ejerciciosGrupo, ejercicio] }));
        setNuevoEjercicio('');
    };

    const actualizarSerie = (idEjercicio, idSerie, campo, valor) => {
        setRutinas(prev => {
            // TU LÓGICA DE COPIA PROFUNDA (Segura)
            const copiaGrupo = [...prev[gruposel]];
            const idxEj = copiaGrupo.findIndex(e => e.id === idEjercicio);
            if (idxEj === -1) return prev;
            const copiaEj = { ...copiaGrupo[idxEj] };

            if (campo === 'eliminar') {
                copiaEj.series = copiaEj.series.filter(s => s.id !== idSerie);
            } else {
                copiaEj.series = copiaEj.series.map(s =>
                    s.id === idSerie ? { ...s, [campo]: valor } : s
                );
            }

            copiaGrupo[idxEj] = copiaEj;
            return { ...prev, [gruposel]: copiaGrupo };
        });
    };

    const agregarSerie = idEjercicio => {
        setRutinas(prev => {
            // TU LÓGICA DE COPIA PROFUNDA (Segura)
            const copiaGrupo = [...prev[gruposel]];
            const idxEj = copiaGrupo.findIndex(e => e.id === idEjercicio);
            if (idxEj === -1) return prev;
            const copiaEj = { ...copiaGrupo[idxEj] };

            // Aquí estaba mi cagada anterior. Volvemos a tu método:
            // Crear nueva referencia del array de series
            copiaEj.series = [
                ...copiaEj.series,
                { id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }
            ];

            copiaGrupo[idxEj] = copiaEj;
            return { ...prev, [gruposel]: copiaGrupo };
        });
    };

    const eliminarEjercicio = idEjercicio => {
        setRutinas(prev => ({
            ...prev,
            [gruposel]: prev[gruposel].filter(e => e.id !== idEjercicio)
        }));
    };

    const confirmarRutina = () => {
        setRutinas(prev => {
            const actualizado = { ...prev };
            for (const grupo in actualizado) {
                actualizado[grupo] = actualizado[grupo].map(ejercicio => ({
                    ...ejercicio,
                    series: ejercicio.series.map(serie => ({
                        ...serie,
                        peso:
                            serie.nuevoPeso !== undefined && serie.nuevoPeso !== ''
                                ? serie.nuevoPeso
                                : (serie.peso ?? ''),
                        reps:
                            serie.nuevoReps !== undefined && serie.nuevoReps !== ''
                                ? serie.nuevoReps
                                : (serie.reps ?? ''),
                        nuevoPeso: '',
                        nuevoReps: ''
                    }))
                }));
            }
            return actualizado;
        });

        setConfirmacionVisible(true);
        setTimeout(() => setConfirmacionVisible(false), 2000);
    };

    const crearNuevoGrupo = () => {
        const nombre = nuevoGrupo.trim();
        if (!nombre) return;
        if (rutinas[nombre]) {
            alert('Ese grupo ya existe');
            setNuevoGrupo('');
            return;
        }
        setRutinas(prev => ({ ...prev, [nombre]: [] }));
        setNuevoGrupo('');
    };

    const eliminarGrupo = nombreGrupo => {
        if (!window.confirm(`¿Eliminar la rutina "${nombreGrupo}" y todos sus datos?`)) return;
        setRutinas(prev => {
            const copia = { ...prev };
            delete copia[nombreGrupo];
            return copia;
        });
        if (gruposel === nombreGrupo) setgruposel(null);
    };

    const handleDragEnd = event => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setRutinas(prev => {
                const lista = [...prev[gruposel]];
                const oldIndex = lista.findIndex(e => e.id === active.id);
                const newIndex = lista.findIndex(e => e.id === over.id);
                const nuevaLista = arrayMove(lista, oldIndex, newIndex);
                return { ...prev, [gruposel]: nuevaLista };
            });
        }
    };

    // --- RENDERIZADO (ESTÉTICA MEJORADA) ---

    return (
        <div className="min-h-screen bg-[#05070a] text-gray-200 font-sans pb-20 selection:bg-blue-500/30">
            <main className="p-4 max-w-xl mx-auto">
                {gruposel === null ? (
                    // --- MENÚ PRINCIPAL ---
                    <div className="pt-8 animate-in fade-in zoom-in-95 duration-300">
                        <h1 className="text-4xl font-black italic tracking-tighter text-center mb-1 text-blue-500">GYMZAPP</h1>
                        <p className="text-center text-gray-500 mb-8 text-sm font-medium uppercase tracking-widest">Selecciona tu rutina</p>

                        <div className="space-y-3">
                            {Object.keys(rutinas).map(grupo => (
                                <div key={grupo} className="group relative flex items-stretch shadow-lg rounded-2xl overflow-hidden transition-all hover:shadow-blue-900/10">
                                    {/* Botón Principal de la Rutina */}
                                    <button
                                        onClick={() => setgruposel(grupo)}
                                        className="flex-1 bg-[#111318] border-y border-l border-gray-800 p-5 text-left active:bg-[#1c212c] transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors">{grupo}</span>

                                        </div>
                                    </button>

                                    {/* Botón Borrar Rutina (Integrado pero seguro) */}
                                    <button
                                        onClick={() => eliminarGrupo(grupo)}
                                        className="bg-[#111318] border border-gray-800 w-16 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/5 transition-all border-l-0"
                                        title="Eliminar rutina"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Crear nueva rutina */}
                        <div className="mt-8 pt-6 border-t border-gray-800/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ej: Pierna"
                                    value={nuevoGrupo}
                                    onChange={e => setNuevoGrupo(e.target.value)}
                                    className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                />
                                <button
                                    onClick={crearNuevoGrupo}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 rounded-xl transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- VISTA DETALLE RUTINA ---
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        {/* Header Sticky */}
                        <div className="sticky top-0 bg-[#05070a]/95 backdrop-blur-md z-30 py-4 border-b border-gray-800 mb-6 flex items-center gap-4">
                            <button
                                onClick={() => setgruposel(null)}
                                className="p-2 bg-gray-800/50 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white truncate">{gruposel}</h2>
                        </div>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={rutinas[gruposel]} strategy={verticalListSortingStrategy}>
                                <div className="space-y-6">
                                    {rutinas[gruposel].map(ejercicio => (
                                        <Ejercicio
                                            key={ejercicio.id}
                                            ejercicio={ejercicio}
                                            onActualizarSerie={(idSerie, campo, valor) => actualizarSerie(ejercicio.id, idSerie, campo, valor)}
                                            onAgregarSerie={() => agregarSerie(ejercicio.id)}
                                            onEliminarEjercicio={() => eliminarEjercicio(ejercicio.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Footer con acciones */}
                        <div className="mt-10 space-y-4 pb-10">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Nuevo ejercicio..."
                                    value={nuevoEjercicio}
                                    onChange={e => setNuevoEjercicio(e.target.value)}
                                    className="flex-1 bg-[#161b22] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    onClick={agregarEjercicio}
                                    className="bg-gray-800 hover:bg-gray-700 text-blue-400 font-bold px-6 rounded-xl border border-gray-700 transition-colors"
                                >
                                    AÑADIR
                                </button>
                            </div>

                            <button
                                onClick={confirmarRutina}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                            >
                                TERMINAR ENTRENAMIENTO
                            </button>
                        </div>
                    </div>
                )}

                {confirmacionVisible && (
                    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-black px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce z-50">
                        Datos guardados correctamente ✅
                    </div>
                )}
            </main>
        </div>
    );
}