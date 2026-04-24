// Es el punto de entrada de la app, conecta la UI con la API y maneja los eventos del DOM
// Es decir que conecta los eventos del DOM con las funciones de ui.js y api.js

// --- estado filtros  ----
// Se guarda aca para que recargarSeries() siempre use los filtros activos

let filtrosActivos = { // valores por defecto de los filtros, que se pueden cambiar con los controles de la UI
    q: '',
    sort: 'id',
    order: 'asc',
    page : 1,
    limit : 10
};

// ---- Cargar y tambien  renderizar las series con los filtros actuales----
async function recargarSeries() {
    try {
        const series = await getSeries(filtrosActivos);
        renderSeries(series);
        renderPaginacion(series.length); // renderiza la paginacion segun la cantidad de series que devuelve el backend (que ya esta filtrada y paginada)
    } catch (err) {
        console.error('Error cargando series:', err);
        document.getElementById('seriesBody').innerHTML =
            '<tr><td colspan="6" style="text-align:center;color:#f87171;padding:20px">No se pudo conectar al backend.</td></tr>';
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
        filtrosActivos.page = 1;
        recargarSeries();
    }, 400);

});

// ----- Cambio de ordenamiento ------
document.getElementById('sortSelect').addEventListener('change', (e) => {
    filtrosActivos.sort = e.target.value;
    filtrosActivos.page = 1;
    recargarSeries();
});

document.getElementById('orderSelect').addEventListener('change', (e) => {
    filtrosActivos.order = e.target.value;
    filtrosActivos.page = 1;
    recargarSeries();
});


function renderPaginacion(cantidadRecibida) {
    const wrap = document.getElementById('paginacionWrap');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const pageInfo = document.getElementById('pageInfo');

    // Mostrar el wrap
    wrap.style.display = 'flex';

    // Info de página actual
    pageInfo.textContent = `Page ${filtrosActivos.page}`;

    // Botón anterior — deshabilitado si estamos en página 1
    btnPrev.disabled = filtrosActivos.page === 1;

    // Botón siguiente — deshabilitado si recibimos menos del límite (no hay más)
    btnNext.disabled = cantidadRecibida < filtrosActivos.limit;
}

document.getElementById('btnPrev').addEventListener('click', () => {
    if (filtrosActivos.page > 1) {
        filtrosActivos.page--;
        recargarSeries();
    }
});

document.getElementById('btnNext').addEventListener('click', () => {
    filtrosActivos.page++;
    recargarSeries();
});

// Resetear pagina a 1 cuando cambian los filtros
document.getElementById('searchInput').addEventListener('input', () => {
    filtrosActivos.page = 1;
});
document.getElementById('sortSelect').addEventListener('change', () => {
    filtrosActivos.page = 1;
});
document.getElementById('orderSelect').addEventListener('change', () => {
    filtrosActivos.page = 1;
});




// ----- Para cargar series al abrir la pagina ----
recargarSeries();


