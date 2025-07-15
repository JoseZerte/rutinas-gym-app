import React, { useState, useEffect } from 'react';

import './tailwind.css'; 



export default function App() {
  const [gruposel, setgruposel] = useState(null);

// las cajitas con sus series y eso sabe

const [rutinas, setRutinas] = useState(() => {
  const saved = localStorage.getItem('rutinas');
  return saved ? JSON.parse(saved) : {
    'Pecho - Triceps': [
            {
              id: 1,
              nombre: 'Press Banca',
              series: [
                { id: 1, peso: '', reps: '' },
                { id: 2, peso: '', reps: '' }
              ]
            },
            {
              id: 2,
              nombre: 'Press Inclinado',
              series: [{ id: 1, peso: '', reps: '' }]
            }
          ],
          'Espalda - Biceps': [],
          'Pierna': [],
          'Hombro - Triceps': []
        };
  });

  const grupos = Object.keys(rutinas).map((nombre, index) => ({
    id: index + 1,
    nombre
  }));
  

const [nuevoEjercicio, setNuevoEjercicio] = useState('');

//funcion para anadir ejercicio

function agregarEjercicio() {
  if (!nuevoEjercicio.trim()) return;

  const ejerciciosGrupo = rutinas[gruposel] || [];
  const nuevoId = ejerciciosGrupo.length > 0
    ? ejerciciosGrupo[ejerciciosGrupo.length - 1].id + 1
    : 1;

  const ejercicioParaAñadir = {
    id: nuevoId,
    nombre: nuevoEjercicio,
    series: [
      {
        id: 1,
        peso: '',
        reps: ''
      }
    ]
  };

  setRutinas(prev => ({
    ...prev,
    [gruposel]: [...ejerciciosGrupo, ejercicioParaAñadir]
  }));

  setNuevoEjercicio('');
}


//BOTONASO DE CONFIRMACION PELUCON

const [confirmacionVisible, setConfirmacionVisible] = useState(false);

function confirmarRutina() {
  setRutinas(prev => {
    const actualizado = { ...prev };

    for (const grupo in actualizado) {
      actualizado[grupo] = actualizado[grupo].map(ejercicio => ({
        ...ejercicio,
        series: ejercicio.series.map(serie => ({
          peso: serie.nuevoPeso || serie.peso,
          reps: serie.nuevoReps || serie.reps,
          nuevoPeso: '',
          nuevoReps: ''
        }))
      }));
    }

    return actualizado;
  });

  setConfirmacionVisible(true);
  setTimeout(() => setConfirmacionVisible(false), 2000);
}


// usestate para crear rutinitas

const [nuevoGrupo, setNuevoGrupo] = useState('');


useEffect(() => {
  localStorage.setItem('rutinas', JSON.stringify(rutinas));
}, [rutinas]);

//funcion de actualizar (no entiendo na, solo se que los 3 puntos copia los arrays)
function actualizarEjercicio(grupo, index, campo, valor) {
  setRutinas(prev => {
    const copiaGrupo = [...prev[grupo]];
    copiaGrupo[index] = {
      ...copiaGrupo[index],
      [campo]: valor
    };
    return { ...prev, [grupo]: copiaGrupo };
  });
}

function eliminarEjercicio(grupo, idEjercicio) {
  setRutinas(prev => {
    const ejerciciosActualizados = prev[grupo].filter(e => e.id !== idEjercicio);
    return {
      ...prev,
      [grupo]: ejerciciosActualizados
    };
  });
}

//funciones de anadir y eliminar series

function actualizarSerie(grupo, iEjercicio, iSerie, campo, valor) {
  setRutinas(prev => {
    const copiaGrupo = [...prev[grupo]];
    const copiaEjercicio = { ...copiaGrupo[iEjercicio] };
    const copiaSeries = [...copiaEjercicio.series];

    copiaSeries[iSerie] = {
      ...copiaSeries[iSerie],
      [campo]: valor
    };

    copiaEjercicio.series = copiaSeries;
    copiaGrupo[iEjercicio] = copiaEjercicio;

    return {
      ...prev,
      [grupo]: copiaGrupo
    };
  });
}

function agregarSerie(grupo, iEjercicio) {
  setRutinas(prev => {
    const copiaGrupo = [...prev[grupo]];
    const copiaEjercicio = { ...copiaGrupo[iEjercicio] };

    const nuevaSerie = {
      id:
        copiaEjercicio.series.length > 0
          ? copiaEjercicio.series[copiaEjercicio.series.length - 1].id + 1
          : 1,
      peso: '',
      reps: ''
    };

    copiaEjercicio.series = [...copiaEjercicio.series, nuevaSerie];
    copiaGrupo[iEjercicio] = copiaEjercicio;

    return {
      ...prev,
      [grupo]: copiaGrupo
    };
  });
}

function eliminarSerie(grupo, iEjercicio, idSerie) {
  setRutinas(prev => {
    const copiaGrupo = [...prev[grupo]];
    const copiaEjercicio = { ...copiaGrupo[iEjercicio] };

    copiaEjercicio.series = copiaEjercicio.series.filter(
      s => s.id !== idSerie
    );

    copiaGrupo[iEjercicio] = copiaEjercicio;

    return {
      ...prev,
      [grupo]: copiaGrupo
    };
  });
}

// funcion para la creacion de las rutinitas sabe

function crearNuevoGrupo() {
  const nombre = nuevoGrupo.trim();
  if (!nombre) return;

  // Si ya existe ese grupo, no lo añadimos
  if (rutinas[nombre]) {
    alert('Ese grupo ya existe');
    setNuevoGrupo(''); // ← limpiar el input
    return;
  }

  // Añadir al estado rutinas
  setRutinas(prev => ({
    ...prev,
    [nombre]: []
  }));

  // Ya no necesitas setGrupos aquí, porque grupos se calcula desde rutinas

  setNuevoGrupo(''); // ← limpiar el input
}


//funcion para obviamente eliminar las rutinas

function eliminarGrupo(nombreGrupo) {
  if (!window.confirm(`¿Eliminar la rutina "${nombreGrupo}"?`)) return;

  setRutinas(prev => {
    const copia = { ...prev };
    delete copia[nombreGrupo];
    return copia;
  });

  // Por si estás dentro de esa rutina, salir
  if (gruposel === nombreGrupo) {
    setgruposel(null);
  }
}









// esto obviamente returnea y muestra los ejercicios

return (
  <main className="p-4 max-w-2xl mx-auto">
    {gruposel === null ? (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-center mb-4">Selecciona un grupo</h1>
    
    <div className="grid grid-cols-1 gap-3">
    {Object.keys(rutinas).map((grupo, i) => (
  <div key={i} className="flex items-center gap-2">
    <button
      onClick={() => setgruposel(grupo)}
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
    >
      {grupo}
    </button>
    <button
      onClick={() => eliminarGrupo(grupo)}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
    >
      🗑
    </button>
  </div>
))}


    </div>

    {/* Bloque para crear nuevo grupo */}
    <div className="mt-6 space-y-2">
      <input
        type="text"
        placeholder="Nuevo grupo (ej. Pierna)"
        value={nuevoGrupo}
        onChange={e => setNuevoGrupo(e.target.value)}
        className="border rounded px-3 py-2 w-full"
      />
      <button
        onClick={crearNuevoGrupo}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
      >
        ➕ Crear rutina
      </button>
    </div>
  </div>
          
    ) : (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Rutina de {gruposel}</h2>

      
        {rutinas[gruposel].map((ejercicio, i) => (
          <div key={ejercicio.id} className="bg-white shadow-md p-4 rounded space-y-2">
            <h3 className="font-bold text-lg">{ejercicio.nombre}</h3>



            
            {ejercicio.series.map((serie, j) => (
  <div
    key={serie.id}
    className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">


  <label className="flex items-center gap-1 w-full justify-center sm:w-auto sm:justify-start">
  <span className="text-sm font-semibold min-w-[60px]">Peso (kg):</span>
  <input
    type="text"
    value={serie.nuevoPeso}
    onChange={e => actualizarSerie(gruposel, i, j, 'nuevoPeso', e.target.value)}
    className="border rounded px-3 py-1 w-full sm:w-20 text-center"
    placeholder={serie.peso}
  />
</label>

<label className="flex items-center gap-1 w-full justify-center sm:w-auto sm:justify-start">
  <span className="text-sm font-semibold min-w-[60px]">Reps:</span>
  <input
    type="text"
    value={serie.nuevoReps}
    onChange={e => actualizarSerie(gruposel, i, j, 'nuevoReps', e.target.value)}
    className="border rounded px-3 py-1 w-full sm:w-16 text-center"
    placeholder={serie.reps}
  />
</label>


    <button
      onClick={() => eliminarSerie(gruposel, i, serie.id)}
      className="ml-auto px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors duration-200"
    >
      🗑 Eliminar serie
    </button>
  </div>
))}


            <div className="flex gap-2 mt-2">
              <button
                onClick={() => agregarSerie(gruposel, i)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                ➕ Añadir serie
              </button>
              <button
                onClick={() => eliminarEjercicio(gruposel, ejercicio.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                🗑 Eliminar ejercicio
              </button>
            </div>
          </div>
        ))}

        {/* Añadir nuevo ejercicio */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="Nuevo ejercicio"
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={nuevoEjercicio}
            onChange={e => setNuevoEjercicio(e.target.value)}
          />
          <button
            onClick={agregarEjercicio}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            ➕ Añadir ejercicio
          </button>
        </div>

        <div className="flex flex-col gap-4 mt-6">
  <button
    onClick={confirmarRutina}
    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
  >
    Confirmar rutina
  </button>

  <button
    onClick={() => setgruposel(null)}
    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded shadow"
  >
    ← Volver
  </button>
</div>


      </div>
    )}
  </main>
);
}

