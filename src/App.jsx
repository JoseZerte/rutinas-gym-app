import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- ESTILOS GLOBALES DINÁMICOS ---
const GlobalStyles = ({ darkMode }) => (
    <style>{`
    /* --- RESET PARA MÓVIL --- */
    :root {
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    #root {
      width: 100%;
      margin: 0;
      padding: 0;
      text-align: left;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      overflow-x: clip; /* FIX: Permite el sticky pero bloquea el scroll lateral */
      overscroll-behavior-y: none;
    }
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      box-sizing: border-box;
    }
    input {
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    ::placeholder {
      color: #6b7280;
      opacity: 0.5;
    }

    body { 
        background-color: ${darkMode ? '#030507' : '#f8fafc'}; 
        transition: background-color 0.4s ease; 
    }
    .glass-effect {
        background: ${darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)'};
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    }
    .glass-border {
        border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    }
    .glass-nav {
        background: ${darkMode ? 'rgba(5, 7, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
  `}</style>
);

function SerieInput({ serie, index, onChangePeso, onChangeReps, onEliminar, onToggleCheck, darkMode }) {
    const confirmarEliminar = () => { if (window.confirm("¿Borrar esta serie?")) onEliminar(); };

    const containerClasses = serie.completada
        ? 'bg-blue-600/10 border-blue-500/30'
        : 'glass-effect glass-border';

    const bgInput = darkMode ? 'bg-black/30' : 'bg-gray-100/50';
    const textInput = darkMode ? 'text-gray-100' : 'text-gray-900';
    const borderInput = darkMode ? 'border-white/5' : 'border-black/5';

    return (
        <div className={`p-4 rounded-2xl border mb-3 transition-all duration-300 ${containerClasses}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleCheck}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${serie.completada ? 'bg-blue-600 border-blue-600' : 'border-gray-500/50'}`}
                    >
                        {serie.completada && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`flex-none w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black tracking-tighter ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        {index + 1}
                    </span>
                </div>
                <button onClick={confirmarEliminar} className="text-red-500/80 active:text-red-500 p-2 transition-colors rounded-lg active:bg-red-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-gray-500/80 ml-2 mb-1 tracking-widest">Peso</span>
                    <input
                        type="text"
                        value={serie.nuevoPeso ?? ''}
                        onChange={e => onChangePeso(e.target.value)}
                        placeholder={serie.peso || ''}
                        className={`w-full ${bgInput} ${textInput} ${borderInput} border rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-all font-semibold text-lg`}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-gray-500/80 ml-2 mb-1 tracking-widest">Repeticiones</span>
                    <input
                        type="text"
                        value={serie.nuevoReps ?? ''}
                        onChange={e => onChangeReps(e.target.value)}
                        placeholder={serie.reps || ''}
                        className={`w-full ${bgInput} ${textInput} ${borderInput} border rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-all font-semibold text-lg`}
                    />
                </div>
            </div>
        </div>
    );
}

function Ejercicio({ ejercicio, onActualizarSerie, onAgregarSerie, onEliminarEjercicio, darkMode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ejercicio.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.9 : 1 };

    const bgContainer = darkMode ? 'bg-[#0b0e14]/80' : 'bg-white/80';
    const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';

    return (
        <div ref={setNodeRef} style={style} className={`${bgContainer} glass-border rounded-[1.5rem] mb-6 overflow-hidden`}>
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing p-2.5 rounded-xl touch-none ${darkMode ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-black/5'}`}>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    </div>
                    <h3 className={`font-black text-[1.1rem] ${textColor} uppercase tracking-tight truncate`}>{ejercicio.nombre}</h3>
                </div>
                <button onClick={() => { if(window.confirm(`¿Eliminar ejercicio "${ejercicio.nombre}"?`)) onEliminarEjercicio() }} className="text-red-500/80 active:text-red-500 p-2.5 rounded-xl active:bg-red-500/10 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
            <div className="p-4">
                {ejercicio.series.map((serie, index) => (
                    <SerieInput
                        key={serie.id} index={index} serie={serie} darkMode={darkMode}
                        onChangePeso={v => onActualizarSerie(serie.id, 'nuevoPeso', v)}
                        onChangeReps={v => onActualizarSerie(serie.id, 'nuevoReps', v)}
                        onEliminar={() => onActualizarSerie(serie.id, 'eliminar')}
                        onToggleCheck={() => onActualizarSerie(serie.id, 'completada', !serie.completada)}
                    />
                ))}
                <button
                    onClick={onAgregarSerie}
                    className="w-full py-4 mt-1 border border-dashed border-green-500/20 bg-green-500/5 rounded-2xl text-green-500/80 font-black text-[11px] uppercase tracking-widest active:bg-green-500/20 active:text-green-400 active:border-green-500/50 transition-all"
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
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('gymTheme');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [gruposel, setgruposel] = useState(null);
    const [rutinas, setRutinas] = useState(() => JSON.parse(localStorage.getItem('rutinas')) || { 'Pecho - Triceps': [] });

    // --- NUEVO: Estado separado para guardar las fotos de las rutinas sin romper tus datos ---
    const [rutinaImages, setRutinaImages] = useState(() => JSON.parse(localStorage.getItem('rutinaImages')) || {});

    const [nuevoEjercicio, setNuevoEjercicio] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);
    const [tiempo, setTiempo] = useState(0);
    const [timerActivo, setTimerActivo] = useState(false);
    const timerRef = useRef(null);

    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => { localStorage.setItem('rutinas', JSON.stringify(rutinas)); }, [rutinas]);
    useEffect(() => { localStorage.setItem('gymConfig', JSON.stringify(config)); }, [config]);
    useEffect(() => { localStorage.setItem('gymTheme', JSON.stringify(darkMode)); }, [darkMode]);
    useEffect(() => { localStorage.setItem('rutinaImages', JSON.stringify(rutinaImages)); }, [rutinaImages]);

    const onTouchStart = (e) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; }
    const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; }
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        if (touchStart.current - touchEnd.current < -100 && gruposel !== null) setgruposel(null);
    }

    const iniciarTimer = () => {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
        const tiempoFinal = Date.now() + (config.descanso * 1000);
        setTiempo(config.descanso);
        setTimerActivo(true);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const restante = Math.round((tiempoFinal - Date.now()) / 1000);
            if (restante <= 0) {
                clearInterval(timerRef.current);
                setTiempo(0);
                if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification("⏱️ ¡Descanso terminado!", { body: "A por la siguiente serie. ¡Duro!" });
                }
                setTimeout(() => setTimerActivo(false), 2000);
            } else { setTiempo(restante); }
        }, 1000);
    };

    const agregarEjercicio = () => {
        if (!nuevoEjercicio.trim()) return;
        const ejercicio = { id: Date.now(), nombre: nuevoEjercicio, series: [{ id: Date.now() + 1, peso: '', reps: '', nuevoPeso: '', nuevoReps: '', completada: false }] };
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
            copiaEj.series = [...copiaEj.series, { id: Date.now(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '', completada: false }];
            copiaGrupo[idxEj] = copiaEj;
            return { ...prev, [gruposel]: copiaGrupo };
        });
    };

    const confirmarRutina = () => {
        setRutinas(prev => {
            const act = { ...prev };
            for (const g in act) {
                act[g] = act[g].map(ej => ({
                    ...ej, series: ej.series.map(s => ({ ...s, peso: s.nuevoPeso || s.peso, reps: s.nuevoReps || s.reps, nuevoPeso: '', nuevoReps: '', completada: false }))
                }));
            }
            return act;
        });
        setConfirmacionVisible(true);
        setTimeout(() => setConfirmacionVisible(false), 2000);
    };

    // --- LÓGICA DE COMPRESIÓN DE IMÁGENES PARA NO SATURAR EL MÓVIL ---
    const handleImageUpload = (e, grupo) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Recortamos la imagen a 200x200 para que ocupe muy poca memoria
                const size = 200;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // Recorte cuadrado centrado
                const minSize = Math.min(img.width, img.height);
                const startX = (img.width - minSize) / 2;
                const startY = (img.height - minSize) / 2;

                ctx.drawImage(img, startX, startY, minSize, minSize, 0, 0, size, size);

                // Guardamos como JPEG comprimido
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setRutinaImages(prev => ({...prev, [grupo]: dataUrl}));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const borrarRutinaYFoto = (grupo) => {
        if(window.confirm(`¿Borrar "${grupo}"?`)) {
            const c = {...rutinas};
            delete c[grupo];
            setRutinas(c);

            // Borramos también la foto para liberar memoria
            const imgs = {...rutinaImages};
            delete imgs[grupo];
            setRutinaImages(imgs);
        }
    };

    const mainBg = darkMode ? 'bg-gradient-to-br from-[#05070a] via-[#0a0d14] to-[#020305] text-gray-200' : 'bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] text-gray-900';
    const textGradient = 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500';
    const cardBg = darkMode ? 'bg-[#111318]' : 'bg-white';
    const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';

    return (
        <div className={`min-h-screen font-sans pb-32 transition-colors duration-500 ${mainBg}`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <GlobalStyles darkMode={darkMode} />
            <main className="p-5 max-w-xl mx-auto">
                {seccion === 'ajustes' ? (
                    <div className="pt-6 animate-in fade-in duration-500">
                        <h1 className={`text-4xl font-black italic tracking-tighter mb-8 uppercase ${textGradient}`}>AJUSTES</h1>

                        <div className="glass-effect glass-border p-6 rounded-[2rem] mb-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">TIEMPO DE DESCANSO</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[60, 90, 120, 180, 240, 300].map(t => (
                                    <button
                                        key={t} onClick={() => setConfig({...config, descanso: t})}
                                        className={`py-4 rounded-2xl font-black tracking-tight transition-all duration-300 ${config.descanso === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : `${darkMode ? 'bg-black/20 text-gray-400' : 'bg-white/50 text-gray-600'}`}`}
                                    >
                                        {t >= 60 ? `${t/60} MIN` : `${t} SEG`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass-effect glass-border p-6 rounded-[2rem]">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">APARIENCIA</p>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-full py-5 rounded-2xl font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-300 ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}
                            >
                                {darkMode ? '🌙 MODO OSCURO' : '☀️ MODO CLARO'}
                            </button>
                        </div>
                    </div>
                ) : gruposel === null ? (
                    <div className="pt-6 animate-in fade-in duration-500">
                        <div className="text-center mb-10">
                            <h1 className={`text-5xl font-black italic tracking-tighter uppercase mb-2 ${textGradient}`}>GYMZAPP</h1>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Elige tu entrenamiento</p>
                        </div>

                        <div className="space-y-4">
                            {Object.keys(rutinas).map(grupo => (
                                <div key={grupo} className={`flex items-stretch rounded-[1.5rem] overflow-hidden glass-border glass-effect transition-transform active:scale-[0.98]`}>

                                    {/* --- NUEVO: ÁREA DE FOTO DE RUTINA --- */}
                                    <div className={`relative w-24 shrink-0 flex flex-col items-center justify-center overflow-hidden border-r ${darkMode ? 'border-white/5 bg-black/30' : 'border-black/5 bg-gray-100'}`}>
                                        {rutinaImages[grupo] ? (
                                            <img src={rutinaImages[grupo]} alt={grupo} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 opacity-40">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                <span className="text-[8px] font-black uppercase tracking-widest">FOTO</span>
                                            </div>
                                        )}
                                        {/* Input invisible encima para subir foto */}
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, grupo)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>

                                    {/* Botón de seleccionar rutina */}
                                    <button onClick={() => setgruposel(grupo)} className="flex-1 p-5 text-left active:opacity-80">
                                        <span className={`text-[1.2rem] font-black uppercase tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{grupo}</span>
                                    </button>

                                    {/* Botón Eliminar */}
                                    <button onClick={() => borrarRutinaYFoto(grupo)} className={`w-14 flex items-center justify-center text-red-500/80 active:bg-red-500/10 transition-colors border-l ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-500/20 flex gap-3">
                            <input type="text" placeholder="Añadir nueva rutina..." value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)} className={`flex-1 glass-effect glass-border rounded-2xl px-5 py-4 ${darkMode ? 'text-white' : 'text-black'} font-medium outline-none focus:border-blue-500/50`} />
                            <button onClick={() => { if(!nuevoGrupo.trim()) return; setRutinas(p => ({...p, [nuevoGrupo.trim()]: []})); setNuevoGrupo(''); }} className="bg-blue-600 px-7 rounded-2xl font-black text-2xl text-white active:scale-95 transition-transform border-none outline-none">+</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header translúcido pegajoso (Sticky Glass) */}
                        <div className="sticky top-0 z-50 pt-2 pb-4 glass-nav border-b border-gray-500/10 mb-6 -mx-5 px-5 transition-all">
                            <div className="flex items-center gap-4 mb-2 mt-2">
                                <button onClick={() => setgruposel(null)} className={`p-2.5 rounded-xl active:scale-90 transition-transform ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <h2 className={`text-2xl font-black uppercase tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{gruposel}</h2>
                            </div>

                            {timerActivo && (
                                <div className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200">
                                    <span className="text-xs font-black uppercase text-blue-100 tracking-widest opacity-90">Descanso</span>
                                    <span className="text-2xl font-black tabular-nums text-white">{Math.floor(tiempo / 60)}:{(tiempo % 60).toString().padStart(2, '0')}</span>
                                    <button onClick={() => setTimerActivo(false)} className="text-[10px] font-black bg-black/20 text-white px-3 py-1.5 rounded-md uppercase tracking-wider">Saltar</button>
                                </div>
                            )}
                        </div>

                        <div className="animate-in fade-in duration-500">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active, over}) => {
                                if (active.id !== over?.id) {
                                    setRutinas(prev => {
                                        const lista = [...prev[gruposel]];
                                        return { ...prev, [gruposel]: arrayMove(lista, lista.findIndex(e => e.id === active.id), lista.findIndex(e => e.id === over.id)) };
                                    });
                                }
                            }}>
                                <SortableContext items={rutinas[gruposel]} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {rutinas[gruposel].map(ej => (
                                            <Ejercicio key={ej.id} ejercicio={ej} onActualizarSerie={(idS, c, v) => actualizarSerie(ej.id, idS, c, v)} onAgregarSerie={() => agregarSerie(ej.id)} onEliminarEjercicio={() => setRutinas(p => ({...p, [gruposel]: p[gruposel].filter(x => x.id !== ej.id)}))} darkMode={darkMode} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {/* BOTONES MATE SIN SOMBRAS */}
                            <div className="mt-8 space-y-4 pb-8">
                                <div className="flex gap-3">
                                    <input type="text" placeholder="Nombre del ejercicio..." value={nuevoEjercicio} onChange={e => setNuevoEjercicio(e.target.value)} className={`flex-1 glass-effect glass-border rounded-2xl px-5 py-4 ${darkMode ? 'text-white' : 'text-black'} focus:border-blue-500/50 outline-none`} />
                                    <button onClick={agregarEjercicio} className={`font-bold px-6 rounded-xl border border-transparent active:scale-95 transition-all ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-gray-200 text-blue-600'}`}>AÑADIR</button>
                                </div>
                                <button onClick={confirmarRutina} className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all border-none outline-none">GUARDAR ENTRENAMIENTO</button>
                            </div>
                        </div>
                    </>
                )}
                {confirmacionVisible && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur-md text-white px-8 py-4 rounded-full font-black tracking-widest shadow-xl z-[100] animate-in slide-in-from-top-10 fade-in duration-300">¡GUARDADO!</div>}
            </main>

            {gruposel === null && (
                <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-500/10 p-5 z-[100] pb-8">
                    <div className="max-w-xl mx-auto flex justify-around">
                        <button onClick={() => setSeccion('rutinas')} className={`flex flex-col items-center gap-1.5 transition-colors ${seccion === 'rutinas' ? 'text-blue-500' : 'text-gray-500'}`}>
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">RUTINAS</span>
                        </button>
                        <button onClick={() => setSeccion('ajustes')} className={`flex flex-col items-center gap-1.5 transition-colors ${seccion === 'ajustes' ? 'text-blue-500' : 'text-gray-500'}`}>
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest">AJUSTES</span>
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}