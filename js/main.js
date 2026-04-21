// Es el punto de entrada de la app, conecta la UI con la API y maneja los eventos del DOM
// Es decir que conecta los eventos del DOM con las funciones de ui.js y api.js

// --- estado filtros  ----
// Se guarda aca para que recargarSeries() siempre use los filtros activos

let filtrosActivos = { // valores por defecto de los filtros, que se pueden cambiar con los controles de la UI
    q: '',
    sort: 'id',
    order: 'asc',
};

// ---- Cargar y tambien  renderizar las series con los filtros actuales----
async function recargarSeries() {
    try {
        const series = await getSeries(filtrosActivos);
        renderSeries(series);
    } catch (err) {
        console.error('Error cargando series:', err);
        document.getElementById('seriesGrid').innerHTML =
            '<p style="color:#c2185b;text-align:center;margin-top:40px">No se pudo conectar al backend. ¿Se esta  corriendo en localhost:8080?</p>';
    }
}

//---- Se envia   formulario ya sea para  crear o editar------
document.getElementById('serieForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // prevenir recarga de pagina

    const id = document.getElementById('serieId').value; // si tiene ID es una edicion, sino es una creacion nueva
    const datos = leerFormulario(); // lee los datos del formulario y los devuelve en un objeto { name, current_episode, total_episodes, image_url }

    try {
        if (id) {
            // Tiene ID entonces  es una edicion con PUT
            await updateSerie(id, datos);
        } else {
            // Sin ID entonces  es una creacion nueva con POST
            await createSerie(datos);
        }
        cerrarModal();
        await recargarSeries(); // refrescar la grid
    } catch (err) {
        mostrarError(err.message); // el mensaje viene del backend (es validacion server-side) oses que va a validar al backend
    }
});

// ----- Boton de  "Agregar Serie" en el header -----
document.getElementById('btnNueva').addEventListener('click', abrirCrear);

// ----- Boton de  cancelar en el modal -----
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);

// ----- Ahora cerrar el modal si se hace click fuera -----
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) cerrarModal();
});

// ------ busqueda en tiempo real (400ms para no spam al backend) -----
let debounceTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        filtrosActivos.q = e.target.value.trim();
        recargarSeries();
    }, 400);
});

// ----- Cambio de ordenamiento ------
document.getElementById('sortSelect').addEventListener('change', (e) => {
    filtrosActivos.sort = e.target.value;
    recargarSeries();
});

document.getElementById('orderSelect').addEventListener('change', (e) => {
    filtrosActivos.order = e.target.value;
    recargarSeries();
});

// ----- Para cargar series al abrir la pagina ----
recargarSeries();