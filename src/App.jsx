import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './tailwind.css';

function SerieInput({ serie, onChangePeso, onChangeReps, onEliminar }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
      <label className="flex items-center gap-1 w-full justify-center sm:w-auto sm:justify-start">
        <span className="text-sm font-semibold min-w-[60px]">Peso (kg):</span>
        <input
          type="text"
          value={serie.nuevoPeso ?? ''}        // 👈 input SIEMPRE vacío hasta que escribas
          onChange={e => onChangePeso(e.target.value)}
          placeholder={serie.peso || ''} // 👈 tras confirmar, aquí verás lo de la semana pasada
          className="border rounded px-3 py-1 w-full sm:w-20 text-center"
        />
      </label>
      <label className="flex items-center gap-1 w-full justify-center sm:w-auto sm:justify-start">
        <span className="text-sm font-semibold min-w-[60px]">Reps:</span>
        <input
          type="text"
          value={serie.nuevoReps ?? ''}        // 👈 input vacío hasta que escribas
          onChange={e => onChangeReps(e.target.value)}
          placeholder={serie.reps || ''}   // 👈 tras confirmar, queda como placeholder
          className="border rounded px-3 py-1 w-full sm:w-16 text-center"
        />
      </label>
      <button
        onClick={onEliminar}
        className="ml-auto px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors duration-200"
      >
        🗑 Eliminar serie
      </button>
    </div>
  );
}

function Ejercicio({ ejercicio, onActualizarSerie, onAgregarSerie, onEliminarEjercicio }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ejercicio.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white shadow-md p-4 rounded space-y-2 mb-2">
      <h3 className="font-bold text-lg">{ejercicio.nombre}</h3>
      {ejercicio.series.map(serie => (
        <SerieInput
          key={serie.id}
          serie={serie}
          onChangePeso={valor => onActualizarSerie(serie.id, 'nuevoPeso', valor)}
          onChangeReps={valor => onActualizarSerie(serie.id, 'nuevoReps', valor)}
          onEliminar={() => onActualizarSerie(serie.id, 'eliminar')}
        />
      ))}
      <div className="flex gap-2 mt-2">
        <button onClick={onAgregarSerie} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">➕ Añadir serie</button>
        <button
          onClick={() => {
            if (window.confirm(`¿Eliminar el ejercicio "${ejercicio.nombre}"?`)) {
              onEliminarEjercicio();
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          🗑 Eliminar ejercicio
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [gruposel, setgruposel] = useState(null);
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
            { id: 2, nombre: 'Press Inclinado', series: [
              { id: 1, peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }
            ]}
          ],
          'Espalda - Biceps': [],
          'Pierna': [],
          'Hombro - Triceps': []
        };
  });

  const [nuevoEjercicio, setNuevoEjercicio] = useState('');
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);

  // Drag & Drop con delay para no molestar a los inputs
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    localStorage.setItem('rutinas', JSON.stringify(rutinas));
  }, [rutinas]);

  const agregarEjercicio = () => {
    if (!nuevoEjercicio.trim()) return;
    const ejerciciosGrupo = rutinas[gruposel] || [];
    const nuevoId = Date.now() + Math.random();
    const ejercicio = {
      id: nuevoId,
      nombre: nuevoEjercicio,
      series: [{ id: Date.now() + Math.random(), peso: '', reps: '', nuevoPeso: '', nuevoReps: '' }]
    };
    setRutinas(prev => ({ ...prev, [gruposel]: [...ejerciciosGrupo, ejercicio] }));
    setNuevoEjercicio(''); // limpia el input de "Nuevo ejercicio"
  };

  const actualizarSerie = (idEjercicio, idSerie, campo, valor) => {
    setRutinas(prev => {
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
      const copiaGrupo = [...prev[gruposel]];
      const idxEj = copiaGrupo.findIndex(e => e.id === idEjercicio);
      if (idxEj === -1) return prev;
      const copiaEj = { ...copiaGrupo[idxEj] };

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

  // 👇 Al confirmar: pasa lo escrito a placeholder (peso/reps) y limpia inputs (nuevoPeso/nuevoReps)
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
            nuevoPeso: '',   // limpia inputs
            nuevoReps: ''    // limpia inputs
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
    if (!window.confirm(`¿Eliminar la rutina "${nombreGrupo}"?`)) return;
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

  return (
    <main className="p-4 max-w-2xl mx-auto">
      {gruposel === null ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center mb-4">Selecciona un grupo</h1>
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(rutinas).map(grupo => (
              <div key={grupo} className="flex items-center gap-2">
                <button onClick={() => setgruposel(grupo)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">{grupo}</button>
                <button onClick={() => eliminarGrupo(grupo)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded">🗑</button>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <input type="text" placeholder="Nuevo grupo (ej. Pierna)" value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)} className="border rounded px-3 py-2 w-full"/>
            <button onClick={crearNuevoGrupo} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full">➕ Crear rutina</button>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rutinas[gruposel]} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Rutina de {gruposel}</h2>
              {rutinas[gruposel].map(ejercicio => (
                <Ejercicio
                  key={ejercicio.id}
                  ejercicio={ejercicio}
                  onActualizarSerie={(idSerie, campo, valor) => actualizarSerie(ejercicio.id, idSerie, campo, valor)}
                  onAgregarSerie={() => agregarSerie(ejercicio.id)}
                  onEliminarEjercicio={() => eliminarEjercicio(ejercicio.id)} // confirm se hace dentro del botón
                />
              ))}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input type="text" placeholder="Nuevo ejercicio" value={nuevoEjercicio} onChange={e => setNuevoEjercicio(e.target.value)} className="border rounded px-3 py-2 w-full sm:w-auto"/>
                <button onClick={agregarEjercicio} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">➕ Añadir ejercicio</button>
              </div>
              <div className="flex flex-col gap-4 mt-6">
                <button onClick={confirmarRutina} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow">Confirmar rutina</button>
                <button onClick={() => setgruposel(null)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded shadow">← Volver</button>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
      {confirmacionVisible && <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow">Rutina confirmada ✅</div>}
    </main>
  );
}
