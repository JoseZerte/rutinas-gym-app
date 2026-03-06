import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- BASE DE DATOS DE EJERCICIOS ---
const LIBRERIA_EJERCICIOS = [
    { nombre: "Press de Banca", imagen: "/ejercicios/pressbanca.png" },
    { nombre: "Sentadilla", imagen: "/ejercicios/sentadilla.png" },
    { nombre: "Peso Muerto", imagen: "/ejercicios/pesovivo.png" },
    { nombre: "Dominadas", imagen: "/ejercicios/dominadas.png" },
    { nombre: "Curl de Bíceps", imagen: "/ejercicios/curl.png" },
    { nombre: "Remo con Barra", imagen: "/ejercicios/remo.png" },
    { nombre: "Extension de Cuadriceps", imagen: "/ejercicios/extcuadri.png" },
    { nombre: "Press Militar", imagen: "/ejercicios/pressmilitar.png" },
];

const LISTA_MUSCULOS = ["Pecho", "Espalda", "Pierna", "Hombro", "Bíceps", "Tríceps", "Glúteo", "Abdomen", "Cardio"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

// --- LÓGICA DE GAMIFICACIÓN INTELIGENTE (1RM Y RANGOS) ---

// Motor de reconocimiento de palabras clave (LISTA BLANCA VIP)
const analizarMusculo = (nombre) => {
    if (!nombre) return 'desconocido';
    const texto = nombre.toLowerCase();
    const usaMancuerna = texto.includes('mancuerna') || texto.includes('mancuernas');
    const usaBarra = texto.includes('barra');

    // ✅ EJERCICIOS BÁSICOS Y VÁLIDOS PARA 1RM (LISTA BLANCA)

    // PECHO
    if (texto.includes('inclinado')) return usaMancuerna ? 'pecho_inclinado_mancuerna' : 'pecho_inclinado_barra';
    if (texto.includes('banca') || texto.includes('pecho') || texto.includes('pec') || texto.includes('press plano')) return usaMancuerna ? 'pecho_plano_mancuerna' : 'pecho_plano_barra';

    // HOMBRO
    if (texto.includes('militar') || texto.includes('press hombro') || texto.includes('shoulder')) return usaMancuerna ? 'hombro_fuerza_mancuerna' : 'hombro_fuerza_barra';

    // PIERNA & GLÚTEO
    if (texto.includes('sentadilla') || texto.includes('squat') || texto.includes('prensa')) return 'pierna_fuerza';
    if (texto.includes('hip thrust') || texto.includes('puente')) return 'gluteo_fuerza';

    // ESPALDA
    if (texto.includes('muerto') || texto.includes('deadlift')) return 'espalda_fuerza';
    if (texto.includes('dominada') || texto.includes('pull') || texto.includes('remo') || texto.includes('jalon')) return 'espalda_traccion';

    // BÍCEPS (Dos mundos distintos)
    if (texto.includes('bicep') || texto.includes('bícep') || texto.includes('curl')) {
        if (usaMancuerna) return 'biceps_mancuerna';
        if (usaBarra) return 'biceps_barra';
        return 'biceps_general'; // Por si no especificas material
    }

    // TRÍCEPS
    if (texto.includes('tricep') || texto.includes('trícep') || texto.includes('francés') || texto.includes('fondo')) return 'triceps_fuerza';

    // 🛑 Todo lo que NO esté explícitamente en la lista de arriba (accesorios, inventos, tonterías) se ignora
    return 'desconocido';
};

// Promedio entre fórmulas de Epley y Brzycki con ajustes biomecánicos
const calcular1RMInteligente = (peso, reps, ejercicioNombre) => {
    if (!peso || !reps || reps <= 0) return 0;

    let pesoReal = parseFloat(peso);
    const categoria = analizarMusculo(ejercicioNombre);

    const epley = pesoReal * (1 + reps / 30);
    const brzycki = pesoReal * (36 / (37 - reps));
    return Math.round((epley + brzycki) / 2);
};

// Asigna rangos leyendo el texto que hayas escrito
const obtenerRango = (rm, ejercicioNombre) => {
    if (rm === 0) return null;

    const categoria = analizarMusculo(ejercicioNombre);

    // 🛑 SI ES UN EJERCICIO NO BÁSICO O NO LO RECONOCE, NO HAY RANGO
    if (categoria === 'desconocido') return null;

    let multiplicador = 1;
    switch (categoria) {
        case 'pierna_fuerza': multiplicador = 0.6; break;
        case 'espalda_fuerza': multiplicador = 0.5; break;
        case 'gluteo_fuerza': multiplicador = 0.5; break;

        case 'pecho_plano_barra': multiplicador = 1.0; break;
        case 'pecho_plano_mancuerna': multiplicador = 2.1; break; // RM por mano x2 + premio estabilización

        case 'pecho_inclinado_barra': multiplicador = 1.2; break;
        case 'pecho_inclinado_mancuerna': multiplicador = 2.5; break; // RM por mano x2 + premio inclinado

        case 'espalda_traccion': multiplicador = 1.2; break;

        case 'hombro_fuerza_barra': multiplicador = 1.6; break;
        case 'hombro_fuerza_mancuerna': multiplicador = 3.3; break; // RM por mano x2 + premio militar

        case 'triceps_fuerza': multiplicador = 3.0; break;

        case 'biceps_barra': multiplicador = 3.5; break;
        case 'biceps_general': multiplicador = 4.0; break;
        case 'biceps_mancuerna': multiplicador = 5.0; break; // Mucho premio porque el peso se divide y aísla a una mano

        default: multiplicador = 1;
    }

    const score = rm * multiplicador;

    if (score < 45) return { nombre: "NOVATO", color: "text-gray-500", bg: "bg-gray-500/20" };
    if (score < 65) return { nombre: "PRINCIPIANTE", color: "text-green-500", bg: "bg-green-500/20" };
    if (score < 90) return { nombre: "INTERMEDIO", color: "text-blue-500", bg: "bg-blue-500/20" };
    if (score < 120) return { nombre: "AVANZADO", color: "text-purple-500", bg: "bg-purple-500/20" };
    if (score < 155) return { nombre: "ÉLITE", color: "text-red-500", bg: "bg-red-500/20" };
    if (score < 190) return { nombre: "SEMIDIÓS", color: "text-orange-500", bg: "bg-orange-500/20" };
    return { nombre: "OLÍMPICO 👑", color: "text-yellow-500", bg: "bg-yellow-500/20" };
};

const obtenerFechaLocal = () => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset() * 60000;
    return new Date(hoy.getTime() - offset).toISOString().split('T')[0];
};

const modificarNumeroInteligente = (texto, incremento) => {
    if (!texto && texto !== 0) return (incremento > 0 ? incremento : 0).toString();
    const str = texto.toString();
    const regex = /^(.*?)(\d+(?:\.\d+)?)(.*)$/;
    const match = str.match(regex);
    if (match) {
        const prefijo = match[1];
        let numero = parseFloat(match[2]);
        const sufijo = match[3];
        numero += incremento;
        if (numero < 0) numero = 0;
        numero = Math.round(numero * 10) / 10;
        return prefijo + numero + sufijo;
    }
    return (incremento > 0 ? incremento : 0) + " " + str;
};

const GlobalStyles = ({ darkMode }) => (
    <style>{`
    :root { font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    #root { width: 100%; margin: 0; padding: 0; text-align: left; }
    html, body { margin: 0; padding: 0; width: 100%; overflow-x: clip; overscroll-behavior-y: none; }
    * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; box-sizing: border-box; }
    input { user-select: text !important; -webkit-user-select: text !important; }
    ::placeholder { color: #6b7280; opacity: 0.5; }
    body { background-color: ${darkMode ? '#030507' : '#f8fafc'}; transition: background-color 0.4s ease; }
    .glass-effect { background: ${darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
    .glass-border { border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}; }
    .glass-nav { background: ${darkMode ? 'rgba(5, 7, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)'}; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  `}</style>
);

// --- COMPONENTE DE GRÁFICA SVG LIGERA ---
const LineChart = ({ data, darkMode }) => {
    if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500 font-bold text-sm">No hay datos suficientes para este ejercicio.</div>;
    if (data.length === 1) return <div className="p-4 text-center text-gray-500 font-bold text-sm">Registra este ejercicio un día más para ver tu evolución.</div>;

    const paddingX = 30;
    const paddingY = 40;
    const w = 400;
    const h = 200;

    const maxVal = Math.max(...data.map(d => d.rm));
    const minVal = Math.min(...data.map(d => d.rm));

    // Evitar división por cero si todos los valores son iguales
    const range = (maxVal - minVal) === 0 ? 1 : (maxVal - minVal);

    const points = data.map((d, i) => {
        const x = paddingX + (i / (data.length - 1)) * (w - paddingX * 2);
        const y = h - paddingY - ((d.rm - minVal) / range) * (h - paddingY * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full overflow-hidden mt-4">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto drop-shadow-lg">
                <polyline points={points} fill="none" stroke={darkMode ? "#3b82f6" : "#2563eb"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => {
                    const x = paddingX + (i / (data.length - 1)) * (w - paddingX * 2);
                    const y = h - paddingY - ((d.rm - minVal) / range) * (h - paddingY * 2);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="6" fill={darkMode ? "#030507" : "#ffffff"} stroke={darkMode ? "#60a5fa" : "#3b82f6"} strokeWidth="3" />
                            <text x={x} y={y - 15} textAnchor="middle" fill={darkMode ? "#e5e7eb" : "#374151"} fontSize="12" fontWeight="900">{d.rm}kg</text>
                            {/* Mostrar día y mes debajo */}
                            <text x={x} y={h - 10} textAnchor="middle" fill={darkMode ? "#9ca3af" : "#6b7280"} fontSize="10" fontWeight="bold">{d.fecha.split('-').slice(1).reverse().join('/')}</text>
                        </g>
                    )
                })}
            </svg>
        </div>
    );
};

function SerieInput({ serie, index, onChangePeso, onChangeReps, onEliminar, onToggleCheck, darkMode, showConfirm, ejercicioNombre, mostrar1RM }) {
    const confirmarEliminar = () => { showConfirm("Borrar Serie", "¿Estás seguro de que quieres borrar esta serie?", onEliminar); };

    const containerClasses = serie.completada ? 'bg-blue-600/10 border-blue-500/30' : 'glass-effect glass-border';
    const bgInput = darkMode ? 'bg-black/30' : 'bg-gray-100/50';
    const textInput = darkMode ? 'text-gray-100' : 'text-gray-900';
    const borderInput = darkMode ? 'border-white/5' : 'border-black/5';

    const handleStepPeso = (inc) => onChangePeso(modificarNumeroInteligente(serie.nuevoPeso || serie.peso || "0", inc));
    const handleStepReps = (inc) => onChangeReps(modificarNumeroInteligente(serie.nuevoReps || serie.reps || "0", inc));

    // Cálculos en vivo de Gamificación (Llamando al nuevo RM Inteligente)
    const pesoCalc = parseFloat(serie.nuevoPeso || serie.peso || 0);
    const repsCalc = parseFloat(serie.nuevoReps || serie.reps || 0);
    const rm = calcular1RMInteligente(pesoCalc, repsCalc, ejercicioNombre);
    const rango = obtenerRango(rm, ejercicioNombre);

    return (
        <div className={`p-4 rounded-2xl border mb-3 transition-all duration-300 ${containerClasses}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <button onClick={onToggleCheck} className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${serie.completada ? 'bg-blue-600 border-blue-600' : 'border-gray-500/50'}`}>
                        {serie.completada && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`flex-none w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black tracking-tighter shrink-0 ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        {index + 1}
                    </span>
                    {/* INSIGNIA DE RANGO Y 1RM EN VIVO (Muestra solo si está activado en Ajustes) */}
                    {mostrar1RM && rango && (
                        <div className={`ml-1 px-2.5 py-1 rounded-lg ${rango.bg} ${rango.color} text-[9px] font-black uppercase tracking-widest truncate animate-in zoom-in duration-200`}>
                            {rango.nombre} <span className="opacity-50 mx-1">•</span> 1RM: {rm}KG
                        </div>
                    )}
                </div>
                <button onClick={confirmarEliminar} className="text-red-500/80 active:text-red-500 p-2 transition-colors rounded-lg active:bg-red-500/10 shrink-0 ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-gray-500/80 ml-2 mb-1 tracking-widest">Peso</span>
                    <div className="flex gap-2">
                        <input type="text" value={serie.nuevoPeso ?? ''} onChange={e => onChangePeso(e.target.value)} placeholder={serie.peso || ''} className={`flex-1 min-w-0 ${bgInput} ${textInput} ${borderInput} border rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-all font-semibold text-lg`} />
                        <button onClick={() => handleStepPeso(-1)} className="w-12 shrink-0 rounded-xl bg-red-500/10 text-red-500 active:bg-red-500/20 font-black text-2xl flex items-center justify-center transition-colors">-</button>
                        <button onClick={() => handleStepPeso(1)} className="w-12 shrink-0 rounded-xl bg-green-500/10 text-green-500 active:bg-green-500/20 font-black text-2xl flex items-center justify-center transition-colors">+</button>
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-gray-500/80 ml-2 mb-1 tracking-widest">Repeticiones</span>
                    <div className="flex gap-2">
                        <input type="text" value={serie.nuevoReps ?? ''} onChange={e => onChangeReps(e.target.value)} placeholder={serie.reps || ''} className={`flex-1 min-w-0 ${bgInput} ${textInput} ${borderInput} border rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-all font-semibold text-lg`} />
                        <button onClick={() => handleStepReps(-1)} className="w-12 shrink-0 rounded-xl bg-red-500/10 text-red-500 active:bg-red-500/20 font-black text-2xl flex items-center justify-center transition-colors">-</button>
                        <button onClick={() => handleStepReps(1)} className="w-12 shrink-0 rounded-xl bg-green-500/10 text-green-500 active:bg-green-500/20 font-black text-2xl flex items-center justify-center transition-colors">+</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Ejercicio({ ejercicio, onActualizarSerie, onAgregarSerie, onEliminarEjercicio, onEditarNombre, darkMode, showConfirm, mostrar1RM }) {
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

                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEditarNombre(ejercicio.id, ejercicio.nombre)} className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'text-blue-400 active:bg-blue-400/10' : 'text-blue-600 active:bg-blue-600/10'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => showConfirm("Eliminar Ejercicio", `¿Borrar "${ejercicio.nombre}"?`, onEliminarEjercicio)} className="text-red-500/80 active:text-red-500 p-2.5 rounded-xl active:bg-red-500/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
            <div className="p-4">
                {ejercicio.series.map((serie, index) => (
                    <SerieInput
                        key={serie.id} index={index} serie={serie} darkMode={darkMode} showConfirm={showConfirm} ejercicioNombre={ejercicio.nombre} mostrar1RM={mostrar1RM}
                        onChangePeso={v => onActualizarSerie(serie.id, 'nuevoPeso', v)}
                        onChangeReps={v => onActualizarSerie(serie.id, 'nuevoReps', v)}
                        onEliminar={() => onActualizarSerie(serie.id, 'eliminar')}
                        onToggleCheck={() => onActualizarSerie(serie.id, 'completada', !serie.completada)}
                    />
                ))}
                <button
                    onClick={onAgregarSerie}
                    className="w-full py-4 mt-1 border border-dashed border-green-500/20 bg-green-500/5 rounded-2xl text-green-500/80 font-black text-[11px] uppercase tracking-widest active:bg-green-500/20 active:text-green-400 active:border-green-500/50 transition-colors"
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
    const [darkMode, setDarkMode] = useState(() => { const saved = localStorage.getItem('gymTheme'); return saved !== null ? JSON.parse(saved) : true; });
    const [mostrar1RM, setMostrar1RM] = useState(() => { const saved = localStorage.getItem('gymMostrar1RM'); return saved !== null ? JSON.parse(saved) : true; });

    const [gruposel, setgruposel] = useState(null);
    const [rutinas, setRutinas] = useState(() => JSON.parse(localStorage.getItem('rutinas')) || { 'Pecho - Triceps': [] });
    const [rutinaImages, setRutinaImages] = useState(() => JSON.parse(localStorage.getItem('rutinaImages')) || {});
    const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('gymHistorial')) || {});

    const [nuevoEjercicio, setNuevoEjercicio] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);
    const [tiempo, setTiempo] = useState(0);
    const [timerActivo, setTimerActivo] = useState(false);

    // Controles Modales
    const [mostrarLibreria, setMostrarLibreria] = useState(false);
    const [mostrarCreadorRutinas, setMostrarCreadorRutinas] = useState(false);
    const [musculosSeleccionados, setMusculosSeleccionados] = useState([]);
    const [mostrarGraficas, setMostrarGraficas] = useState(false);
    const [ejercicioGrafica, setEjercicioGrafica] = useState('');

    // Controles Calculadora 1RM Aislada (Ajustes)
    const [calcPeso, setCalcPeso] = useState('');
    const [calcReps, setCalcReps] = useState('');
    const [calcEj, setCalcEj] = useState('Press de Banca');

    // Controles Calendario Progreso
    const [fechaCalendario, setFechaCalendario] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaLocal());

    const timerRef = useRef(null);
    const [modal, setModal] = useState({ show: false, type: '', title: '', message: '', inputValue: '', onConfirm: null });

    const showPrompt = (title, defaultValue, onConfirmCallback) => setModal({ show: true, type: 'prompt', title, message: '', inputValue: defaultValue, onConfirm: onConfirmCallback });
    const showConfirm = (title, message, onConfirmCallback) => setModal({ show: true, type: 'confirm', title, message, inputValue: '', onConfirm: onConfirmCallback });
    const closeModal = () => setModal({ ...modal, show: false });

    const touchStart = useRef(null);
    const touchEnd = useRef(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => { localStorage.setItem('rutinas', JSON.stringify(rutinas)); }, [rutinas]);
    useEffect(() => { localStorage.setItem('gymConfig', JSON.stringify(config)); }, [config]);
    useEffect(() => { localStorage.setItem('gymTheme', JSON.stringify(darkMode)); }, [darkMode]);
    useEffect(() => { localStorage.setItem('gymMostrar1RM', JSON.stringify(mostrar1RM)); }, [mostrar1RM]);
    useEffect(() => { localStorage.setItem('rutinaImages', JSON.stringify(rutinaImages)); }, [rutinaImages]);
    useEffect(() => { localStorage.setItem('gymHistorial', JSON.stringify(historial)); }, [historial]);

    const onTouchStart = (e) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; }
    const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; }
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        if (touchStart.current - touchEnd.current < -100 && gruposel !== null && !mostrarLibreria && !mostrarCreadorRutinas && !mostrarGraficas) setgruposel(null);
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

    const editarNombreRutinaMain = (nombreViejo) => {
        showPrompt("Editar Rutina", nombreViejo, (nuevoNombre) => {
            const nombreFinal = nuevoNombre.trim();
            if (!nombreFinal || nombreFinal === nombreViejo) return;
            if (rutinas[nombreFinal]) { alert("Ese nombre ya existe."); return; }
            setRutinas(prev => { const copia = { ...prev }; copia[nombreFinal] = copia[nombreViejo]; delete copia[nombreViejo]; return copia; });
            setRutinaImages(prev => { const copia = { ...prev }; if (copia[nombreViejo]) { copia[nombreFinal] = copia[nombreViejo]; delete copia[nombreViejo]; } return copia; });
            if (gruposel === nombreViejo) setgruposel(nombreFinal);
        });
    };

    const editarNombreEjercicio = (idEj, nombreActual) => {
        showPrompt("Editar Ejercicio", nombreActual, (nuevoNombre) => {
            const finalNombre = nuevoNombre.trim();
            if (!finalNombre || finalNombre === nombreActual) return;
            setRutinas(prev => {
                const copiaGrupo = [...prev[gruposel]];
                const idxEj = copiaGrupo.findIndex(e => e.id === idEj);
                if (idxEj === -1) return prev;
                copiaGrupo[idxEj] = { ...copiaGrupo[idxEj], nombre: finalNombre };
                return { ...prev, [gruposel]: copiaGrupo };
            });
        });
    };

    const agregarEjercicio = () => {
        if (!nuevoEjercicio.trim()) return;
        const ejercicio = { id: Date.now(), nombre: nuevoEjercicio, series: [{ id: Date.now() + 1, peso: '', reps: '', nuevoPeso: '', nuevoReps: '', completada: false }] };
        setRutinas(prev => ({ ...prev, [gruposel]: [...(prev[gruposel] || []), ejercicio] }));
        setNuevoEjercicio('');
    };

    const agregarEjercicioLibreria = (nombre) => {
        const ejercicio = { id: Date.now(), nombre: nombre, series: [{ id: Date.now() + 1, peso: '', reps: '', nuevoPeso: '', nuevoReps: '', completada: false }] };
        setRutinas(prev => ({ ...prev, [gruposel]: [...(prev[gruposel] || []), ejercicio] }));
        setMostrarLibreria(false);
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
        const rutinaActualizada = rutinas[gruposel].map(ej => ({
            ...ej, series: ej.series.map(s => ({ ...s, peso: s.nuevoPeso || s.peso, reps: s.nuevoReps || s.reps, nuevoPeso: '', nuevoReps: '', completada: false }))
        }));
        const fechaLocal = obtenerFechaLocal();
        setHistorial(prev => {
            const nuevo = { ...prev };
            nuevo[fechaLocal] = [...(nuevo[fechaLocal] || []), { nombre: gruposel, ejercicios: JSON.parse(JSON.stringify(rutinaActualizada)) }];
            return nuevo;
        });
        setRutinas(prev => {
            const act = { ...prev };
            for (const g in act) { act[g] = act[g].map(ej => ({ ...ej, series: ej.series.map(s => ({ ...s, peso: s.nuevoPeso || s.peso, reps: s.nuevoReps || s.reps, nuevoPeso: '', nuevoReps: '', completada: false })) })); }
            return act;
        });
        setConfirmacionVisible(true);
        setTimeout(() => setConfirmacionVisible(false), 2000);
    };

    const handleImageUpload = (e, grupo) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 200;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                const minSize = Math.min(img.width, img.height);
                ctx.drawImage(img, (img.width - minSize) / 2, (img.height - minSize) / 2, minSize, minSize, 0, 0, size, size);
                setRutinaImages(prev => ({...prev, [grupo]: canvas.toDataURL('image/jpeg', 0.6)}));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const borrarRutinaYFoto = (grupo) => {
        showConfirm("Eliminar Rutina", `¿Borrar toda la rutina de "${grupo}"?`, () => {
            setRutinas(prev => { const c = {...prev}; delete c[grupo]; return c; });
            setRutinaImages(prev => { const c = {...prev}; delete c[grupo]; return c; });
        });
    };

    const renderCalendario = () => {
        const year = fechaCalendario.getFullYear();
        const month = fechaCalendario.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay;
        const dias = [];
        for (let i = 1; i < firstDay; i++) dias.push(<div key={`empty-${i}`} className="p-2"></div>);
        const fechaHoyStr = obtenerFechaLocal();

        for (let d = 1; d <= daysInMonth; d++) {
            const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const entrenos = historial[currentStr];
            const isSelected = fechaSeleccionada === currentStr;
            const isHoy = fechaHoyStr === currentStr;

            let colorClase = darkMode ? 'text-gray-400' : 'text-gray-500';
            let bgClase = 'bg-transparent border-2 border-transparent';

            if (entrenos && entrenos.length > 0) {
                colorClase = 'text-green-500 font-black';
                bgClase = darkMode ? 'bg-green-500/10 border-2 border-transparent' : 'bg-green-500/20 border-2 border-transparent';
            } else if (isHoy) {
                colorClase = 'text-blue-500 font-black';
                bgClase = darkMode ? 'bg-blue-500/10 border-2 border-transparent' : 'bg-blue-500/20 border-2 border-transparent';
            }

            if (isSelected) bgClase = bgClase.replace('border-transparent', 'border-blue-500');

            dias.push(
                <button key={d} onClick={() => setFechaSeleccionada(currentStr)} className={`aspect-square flex items-center justify-center rounded-xl text-sm transition-colors outline-none ${colorClase} ${bgClase}`}>
                    {d}
                </button>
            );
        }
        return dias;
    };

    // --- OBTENER DATOS PARA LA GRÁFICA ---
    const obtenerDatosGrafica = (nombreEj) => {
        if (!nombreEj) return [];
        const datosMap = {}; // Guardar solo el RM más alto de cada día

        Object.keys(historial).forEach(fecha => {
            historial[fecha].forEach(entreno => {
                entreno.ejercicios.forEach(ej => {
                    if (ej.nombre === nombreEj) {
                        let maxRmDia = 0;
                        ej.series.forEach(s => {
                            const rm = calcular1RMInteligente(parseFloat(s.peso || 0), parseFloat(s.reps || 0), ej.nombre);
                            if (rm > maxRmDia) maxRmDia = rm;
                        });
                        if (maxRmDia > 0) {
                            if (!datosMap[fecha] || maxRmDia > datosMap[fecha]) datosMap[fecha] = maxRmDia;
                        }
                    }
                });
            });
        });

        // Convertir a array ordenado por fecha
        return Object.keys(datosMap).sort().map(fecha => ({ fecha, rm: datosMap[fecha] }));
    };

    // 🛑 Filtramos los ejercicios no básicos para que no salgan en el selector de gráficas
    const listaEjerciciosHistoricos = [...new Set(Object.values(historial).flatMap(dia => dia.flatMap(e => e.ejercicios.map(ej => ej.nombre))))]
        .filter(nombre => analizarMusculo(nombre) !== 'desconocido');

    // Calculadora Aislada logic
    const rmCalcAislada = calcular1RMInteligente(parseFloat(calcPeso || 0), parseFloat(calcReps || 0), calcEj);
    const rangoCalcAislada = obtenerRango(rmCalcAislada, calcEj);

    const mainBg = darkMode ? 'bg-gradient-to-br from-[#05070a] via-[#0a0d14] to-[#020305] text-gray-200' : 'bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] text-gray-900';
    const textGradient = 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500';

    return (
        <div className={`min-h-screen font-sans pb-32 transition-colors duration-500 ${mainBg}`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <GlobalStyles darkMode={darkMode} />

            {/* --- MODAL CONFIRM --- */}
            {modal.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${darkMode ? 'bg-[#111318] border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modal.title}</h3>
                        {modal.type === 'confirm' && <p className="text-gray-500 font-medium mb-6 text-sm">{modal.message}</p>}
                        {modal.type === 'prompt' && (
                            <input type="text" value={modal.inputValue} onChange={(e) => setModal({...modal, inputValue: e.target.value})} className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors font-semibold text-lg mb-6 ${darkMode ? 'bg-black/30 text-gray-100 border-white/5' : 'bg-gray-100/50 text-gray-900 border-black/5'}`} autoFocus />
                        )}
                        <div className="flex gap-3">
                            <button onClick={closeModal} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs ${darkMode ? 'bg-gray-800 text-gray-300 active:bg-gray-700' : 'bg-gray-200 text-gray-700 active:bg-gray-300'}`}>Cancelar</button>
                            <button onClick={() => { modal.onConfirm(modal.inputValue); closeModal(); }} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-blue-600 text-white active:bg-blue-700">Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL LIBRERÍA --- */}
            {mostrarLibreria && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${darkMode ? 'bg-[#111318] border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className={`p-5 flex items-center justify-between border-b shrink-0 ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                            <h2 className={`text-xl font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-gray-900'}`}>LIBRERÍA</h2>
                            <button onClick={() => setMostrarLibreria(false)} className={`p-2 rounded-full outline-none active:scale-90 transition-transform ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                {LIBRERIA_EJERCICIOS.map((ej, index) => (
                                    <button key={index} onClick={() => agregarEjercicioLibreria(ej.nombre)} className="flex flex-col items-center gap-3 active:scale-95 transition-transform outline-none group">
                                        <div className={`w-full aspect-square rounded-2xl overflow-hidden border ${darkMode ? 'border-white/5 bg-black/30' : 'border-black/5 bg-gray-50'}`}>
                                            <img src={ej.imagen} alt={ej.nombre} className="w-full h-full object-cover opacity-90 group-active:opacity-70 transition-opacity" />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-tight text-center px-1 leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ej.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CREADOR MÚSCULOS --- */}
            {mostrarCreadorRutinas && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden ${darkMode ? 'bg-[#111318] border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className={`p-5 flex items-center justify-between border-b ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                            <h2 className={`text-xl font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-gray-900'}`}>MÚSCULOS</h2>
                            <button onClick={() => setMostrarCreadorRutinas(false)} className={`p-2 rounded-full outline-none active:scale-90 transition-transform ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-wrap gap-3 mb-8">
                                {LISTA_MUSCULOS.map(musculo => {
                                    const isSelected = musculosSeleccionados.includes(musculo);
                                    return (
                                        <button key={musculo} onClick={() => setMusculosSeleccionados(prev => isSelected ? prev.filter(m => m !== musculo) : [...prev, musculo])} className={`px-4 py-3 rounded-xl font-bold tracking-wide transition-colors outline-none ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : darkMode ? 'bg-white/5 text-gray-300 active:bg-white/10' : 'bg-black/5 text-gray-700 active:bg-black/10'}`}>
                                            {musculo}
                                        </button>
                                    )
                                })}
                            </div>
                            <button onClick={() => {
                                if (musculosSeleccionados.length === 0) return;
                                const nombreFinal = musculosSeleccionados.join(' - ');
                                if (rutinas[nombreFinal]) { alert("Ya existe una rutina con estos músculos."); return; }
                                setRutinas(prev => ({...prev, [nombreFinal]: []}));
                                setMostrarCreadorRutinas(false);
                            }}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-colors outline-none ${musculosSeleccionados.length > 0 ? 'bg-green-500 text-white active:bg-green-600' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}
                            >
                                {musculosSeleccionados.length > 0 ? `CREAR: ${musculosSeleccionados.join(' - ')}` : 'SELECCIONA MÚSCULOS'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL GRÁFICAS DE EVOLUCIÓN --- */}
            {mostrarGraficas && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden ${darkMode ? 'bg-[#111318] border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className={`p-5 flex items-center justify-between border-b ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                            <h2 className={`text-xl font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-gray-900'}`}>EVOLUCIÓN 1RM</h2>
                            <button onClick={() => setMostrarGraficas(false)} className={`p-2 rounded-full outline-none active:scale-90 transition-transform ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {listaEjerciciosHistoricos.length === 0 ? (
                                <p className="text-center text-gray-500 font-bold">Guarda entrenamientos primero para ver tus gráficas.</p>
                            ) : (
                                <>
                                    <select
                                        value={ejercicioGrafica}
                                        onChange={(e) => setEjercicioGrafica(e.target.value)}
                                        className={`w-full p-4 rounded-xl border outline-none font-bold uppercase tracking-tight mb-4 appearance-none ${darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-gray-100 border-black/5 text-gray-900'}`}
                                    >
                                        <option value="" disabled>Selecciona un ejercicio...</option>
                                        {listaEjerciciosHistoricos.map(ej => <option key={ej} value={ej}>{ej}</option>)}
                                    </select>

                                    {ejercicioGrafica && (
                                        <LineChart data={obtenerDatosGrafica(ejercicioGrafica)} darkMode={darkMode} />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="p-5 max-w-xl mx-auto">
                {seccion === 'progreso' ? (
                    <div className="pt-6 animate-in fade-in duration-300 pb-10">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className={`text-4xl font-black italic tracking-tighter uppercase ${textGradient}`}>PROGRESO</h1>
                            <button onClick={() => { setMostrarGraficas(true); if(listaEjerciciosHistoricos.length > 0 && !ejercicioGrafica) setEjercicioGrafica(listaEjerciciosHistoricos[0]); }} className={`p-3 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            </button>
                        </div>

                        {/* CALENDARIO */}
                        <div className="glass-effect glass-border p-6 rounded-[2rem] mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={() => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() - 1, 1))} className={`p-2 rounded-xl outline-none active:bg-black/10 ${darkMode ? 'text-white active:bg-white/10' : 'text-gray-800'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                                <h2 className={`text-lg font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {MESES[fechaCalendario.getMonth()]} {fechaCalendario.getFullYear()}
                                </h2>
                                <button onClick={() => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() + 1, 1))} className={`p-2 rounded-xl outline-none active:bg-black/10 ${darkMode ? 'text-white active:bg-white/10' : 'text-gray-800'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                                {DIAS_SEMANA.map(d => <span key={d} className="text-[10px] font-black text-gray-500">{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                                {renderCalendario()}
                            </div>
                        </div>

                        {/* DETALLE DEL FEED */}
                        <div className="mb-4">
                            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 ml-2 text-gray-500`}>
                                ENTRENOS DEL {fechaSeleccionada.split('-').reverse().join('/')}
                            </h3>

                            {(!historial[fechaSeleccionada] || historial[fechaSeleccionada].length === 0) ? (
                                <div className={`p-8 rounded-[2rem] border border-dashed text-center ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-300 text-gray-400'}`}>
                                    <p className="font-bold text-sm">Día de descanso. 🔋</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historial[fechaSeleccionada].map((entreno, idx) => (
                                        <div key={idx} className="glass-effect glass-border p-6 rounded-[1.5rem]">
                                            <h4 className={`text-xl font-black uppercase tracking-tight mb-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{entreno.nombre}</h4>
                                            <div className="space-y-5">
                                                {entreno.ejercicios.map((ej, ejIdx) => (
                                                    <div key={ejIdx}>
                                                        <span className={`text-[11px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ej.nombre}</span>
                                                        <div className="mt-2 space-y-1.5 pl-1">
                                                            {ej.series.map((s, sIdx) => {
                                                                // Gamificación en el feed histórico
                                                                const rmHist = calcular1RMInteligente(parseFloat(s.peso||0), parseFloat(s.reps||0), ej.nombre);
                                                                const rangoHist = mostrar1RM ? obtenerRango(rmHist, ej.nombre) : null;
                                                                return (
                                                                    <div key={sIdx} className={`flex items-center justify-between text-[12px] font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${darkMode ? 'bg-white/5 text-gray-500' : 'bg-black/5 text-gray-400'}`}>{sIdx + 1}</span>
                                                                            <span>{s.peso || '0'} kg</span>
                                                                            <span className="opacity-50">×</span>
                                                                            <span>{s.reps || '0'} reps</span>
                                                                        </div>
                                                                        {rangoHist && (
                                                                            <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider ${rangoHist.bg} ${rangoHist.color}`}>1RM: {rmHist}kg</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                ) : seccion === 'ajustes' ? (
                    <div className="pt-6 animate-in fade-in duration-300 pb-10">
                        <h1 className={`text-4xl font-black italic tracking-tighter mb-8 uppercase ${textGradient}`}>AJUSTES</h1>

                        {/* --- BOTÓN ACTIVAR/DESACTIVAR GAMIFICACIÓN --- */}
                        <div className="glass-effect glass-border p-6 rounded-[2rem] mb-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">GAMIFICACIÓN Y RANGOS</p>
                            <button onClick={() => setMostrar1RM(!mostrar1RM)} className={`w-full py-4 rounded-2xl font-black tracking-widest uppercase flex items-center justify-between px-5 transition-colors duration-300 ${mostrar1RM ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : (darkMode ? 'bg-white/5 text-gray-500 border border-transparent' : 'bg-black/5 text-gray-400 border border-transparent')}`}>
                                <span>Cálculo de 1RM</span>
                                <span className={`text-xs ${mostrar1RM ? 'text-blue-500' : 'text-gray-500'}`}>{mostrar1RM ? 'ACTIVADO' : 'DESACTIVADO'}</span>
                            </button>
                        </div>

                        {/* --- NUEVA CALCULADORA 1RM AISLADA --- */}
                        {mostrar1RM && (
                            <div className={`glass-effect glass-border p-6 rounded-[2rem] mb-6 relative overflow-hidden ${darkMode ? 'bg-[#0f172a]/40' : 'bg-blue-50/50'}`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.83L17.17 10H6.83L12 4.83z"/></svg>
                                </div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 relative z-10">🧮 CALCULADORA 1RM AISLADA</p>

                                <select value={calcEj} onChange={(e) => setCalcEj(e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-bold uppercase tracking-tight mb-3 text-sm appearance-none relative z-10 ${darkMode ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'}`}>
                                    {LIBRERIA_EJERCICIOS.map(ej => <option key={ej.nombre} value={ej.nombre}>{ej.nombre}</option>)}
                                </select>

                                <div className="flex gap-3 mb-4 relative z-10">
                                    <input type="number" placeholder="Peso (kg)" value={calcPeso} onChange={(e) => setCalcPeso(e.target.value)} className={`w-1/2 p-3 rounded-xl border outline-none font-bold text-center ${darkMode ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'}`} />
                                    <input type="number" placeholder="Reps" value={calcReps} onChange={(e) => setCalcReps(e.target.value)} className={`w-1/2 p-3 rounded-xl border outline-none font-bold text-center ${darkMode ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'}`} />
                                </div>

                                <div className="flex flex-col items-center justify-center pt-2 relative z-10">
                                    {analizarMusculo(calcEj) !== 'desconocido' ? (
                                        <>
                                            <span className={`text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tu Repetición Máxima es</span>
                                            <div className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>{rmCalcAislada} <span className="text-xl text-gray-500">KG</span></div>
                                            {rangoCalcAislada && (
                                                <div className={`mt-2 px-4 py-1.5 rounded-full ${rangoCalcAislada.bg} ${rangoCalcAislada.color} text-xs font-black uppercase tracking-widest`}>
                                                    RANGO: {rangoCalcAislada.nombre}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className={`text-center p-3 rounded-xl border border-dashed w-full ${darkMode ? 'border-gray-700 bg-black/20 text-gray-400' : 'border-gray-300 bg-white/50 text-gray-500'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">EJERCICIO NO BÁSICO</span>
                                            <span className="text-xs font-semibold">El 1RM no aplica o no está soportado.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="glass-effect glass-border p-6 rounded-[2rem] mb-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">TIEMPO DE DESCANSO</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[60, 90, 120, 180, 240, 300].map(t => (
                                    <button key={t} onClick={() => setConfig({...config, descanso: t})} className={`py-4 rounded-2xl font-black tracking-tight transition-all duration-300 ${config.descanso === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : `${darkMode ? 'bg-black/20 text-gray-400' : 'bg-white/50 text-gray-600'}`}`}>
                                        {t >= 60 ? `${t/60} MIN` : `${t} SEG`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass-effect glass-border p-6 rounded-[2rem]">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">APARIENCIA</p>
                            <button onClick={() => setDarkMode(!darkMode)} className={`w-full py-5 rounded-2xl font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-colors duration-300 ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
                                {darkMode ? '🌙 MODO OSCURO' : '☀️ MODO CLARO'}
                            </button>
                        </div>
                    </div>
                ) : gruposel === null ? (
                    <div className="pt-6 animate-in fade-in duration-300">
                        <div className="text-center mb-10">
                            <h1 className={`text-5xl font-black italic tracking-tighter uppercase mb-2 ${textGradient}`}>GYMZAPP</h1>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Elige tu entrenamiento</p>
                        </div>

                        <div className="space-y-4">
                            {Object.keys(rutinas).map(grupo => (
                                <div key={grupo} className={`flex items-stretch rounded-[1.5rem] overflow-hidden glass-border glass-effect transition-transform active:scale-[0.98]`}>
                                    <div className={`relative w-18 shrink-0 flex flex-col items-center justify-center overflow-hidden border-r ${darkMode ? 'border-white/5 bg-black/30' : 'border-black/5 bg-gray-100'}`}>
                                        {rutinaImages[grupo] ? (
                                            <button onClick={() => { if(window.confirm("¿Eliminar la foto de esta rutina?")) { const imgs = {...rutinaImages}; delete imgs[grupo]; setRutinaImages(imgs); } }} className="absolute inset-0 w-full h-full block">
                                                <img src={rutinaImages[grupo]} alt={grupo} className="w-full h-full object-cover" />
                                            </button>
                                        ) : (
                                            <>
                                                <div className="flex flex-col items-center gap-1 opacity-40">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                                </div>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, grupo)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </>
                                        )}
                                    </div>
                                    <button onClick={() => setgruposel(grupo)} className="flex-1 p-5 text-left active:opacity-80 overflow-hidden outline-none">
                                        <span className={`block w-full text-[1.1rem] font-black uppercase tracking-tight truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{grupo}</span>
                                    </button>
                                    <button onClick={() => editarNombreRutinaMain(grupo)} className={`w-12 flex items-center justify-center transition-colors border-l ${darkMode ? 'border-white/5 text-blue-400 active:bg-blue-400/10' : 'border-black/5 text-blue-600 active:bg-blue-600/10'} outline-none`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => borrarRutinaYFoto(grupo)} className={`w-12 flex items-center justify-center text-red-500/80 active:bg-red-500/10 transition-colors border-l ${darkMode ? 'border-white/5' : 'border-black/5'} outline-none`}>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-500/20 space-y-4">
                            <button onClick={() => { setMostrarCreadorRutinas(true); setMusculosSeleccionados([]); }} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 ${darkMode ? 'bg-indigo-600/20 text-indigo-400 active:bg-indigo-600/30' : 'bg-indigo-100 text-indigo-600 active:bg-indigo-200'} border-none outline-none`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                CREAR POR MÚSCULOS
                            </button>
                            <div className="flex gap-3 relative">
                                <input type="text" placeholder="O escribe el nombre a mano..." value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)} className={`flex-1 glass-effect glass-border rounded-2xl px-5 py-4 ${darkMode ? 'text-white' : 'text-black'} font-medium outline-none focus:border-blue-500/50`} />
                                <button onClick={() => { if(!nuevoGrupo.trim()) return; setRutinas(p => ({...p, [nuevoGrupo.trim()]: []})); setNuevoGrupo(''); }} className="bg-blue-600 px-7 rounded-2xl font-black text-2xl text-white active:scale-95 border-none outline-none">+</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        <div className="sticky top-0 z-50 pt-2 pb-4 glass-nav border-b border-gray-500/10 mb-6 -mx-5 px-5">
                            <div className="flex items-center justify-between mb-2 mt-2">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <button onClick={() => setgruposel(null)} className={`outline-none p-2.5 rounded-xl active:scale-90 transition-transform flex-shrink-0 ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                    </button>
                                    <h2 className={`text-2xl font-black uppercase tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{gruposel}</h2>
                                </div>
                                <button onClick={() => editarNombreRutinaMain(gruposel)} className={`outline-none p-2.5 rounded-xl transition-colors flex-shrink-0 ${darkMode ? 'text-gray-400 active:bg-white/10' : 'text-gray-500 active:bg-black/5'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                            </div>

                            {timerActivo && (
                                <div className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200">
                                    <span className="text-xs font-black uppercase text-blue-100 tracking-widest opacity-90">Descanso</span>
                                    <span className="text-2xl font-black tabular-nums text-white">{Math.floor(tiempo / 60)}:{(tiempo % 60).toString().padStart(2, '0')}</span>
                                    <button onClick={() => setTimerActivo(false)} className="text-[10px] font-black bg-black/20 text-white px-3 py-1.5 rounded-md uppercase tracking-wider outline-none">Saltar</button>
                                </div>
                            )}
                        </div>

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
                                        <Ejercicio key={ej.id} ejercicio={ej} onActualizarSerie={(idS, c, v) => actualizarSerie(ej.id, idS, c, v)} onAgregarSerie={() => agregarSerie(ej.id)} onEliminarEjercicio={() => setRutinas(p => ({...p, [gruposel]: p[gruposel].filter(x => x.id !== ej.id)}))} onEditarNombre={editarNombreEjercicio} darkMode={darkMode} showConfirm={showConfirm} mostrar1RM={mostrar1RM} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <div className="mt-10 space-y-4 pb-8 border-t border-white/5 pt-8">
                            <button onClick={() => setMostrarLibreria(true)} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 ${darkMode ? 'bg-indigo-600/20 text-indigo-400 active:bg-indigo-600/30' : 'bg-indigo-100 text-indigo-600 active:bg-indigo-200'} border-none outline-none`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                EXPLORAR LIBRERÍA
                            </button>
                            <div className="flex gap-3 relative mt-2">
                                <input type="text" placeholder="O escribe uno manual..." value={nuevoEjercicio} onChange={e => setNuevoEjercicio(e.target.value)} className={`flex-1 glass-effect glass-border rounded-2xl px-5 py-4 ${darkMode ? 'text-white' : 'text-black'} focus:border-blue-500/50 outline-none`} />
                                <button onClick={agregarEjercicio} className={`font-bold px-6 rounded-xl border border-transparent active:scale-95 ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-gray-200 text-blue-600'}`}>AÑADIR</button>
                            </div>
                            <button onClick={confirmarRutina} className="w-full py-5 mt-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all border-none outline-none">GUARDAR ENTRENAMIENTO</button>
                        </div>
                    </div>
                )}
                {confirmacionVisible && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur-md text-white px-8 py-4 rounded-full font-black tracking-widest shadow-xl z-[100] animate-in slide-in-from-top-10 fade-in duration-300 pointer-events-none">¡GUARDADO!</div>}
            </main>

            {gruposel === null && (
                <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-500/10 p-5 z-[100] pb-8">
                    <div className="max-w-xl mx-auto flex justify-around items-center">
                        <button onClick={() => setSeccion('rutinas')} className={`outline-none flex flex-col items-center gap-1.5 transition-colors ${seccion === 'rutinas' ? 'text-blue-500' : 'text-gray-500'}`}>
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">RUTINAS</span>
                        </button>

                        <button onClick={() => setSeccion('progreso')} className={`outline-none flex flex-col items-center gap-1.5 transition-colors ${seccion === 'progreso' ? 'text-blue-500' : 'text-gray-500'}`}>
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">PROGRESO</span>
                        </button>

                        <button onClick={() => setSeccion('ajustes')} className={`outline-none flex flex-col items-center gap-1.5 transition-colors ${seccion === 'ajustes' ? 'text-blue-500' : 'text-gray-500'}`}>
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest">AJUSTES</span>
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}