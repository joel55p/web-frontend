// Este archivo sera para manipular el DOM, mostrar las series, manejar eventos de botones, etc. Se comunicara con api.js para obtener los datos y actualizar la interfaz

function renderSeries(series) {
    const tbody    = document.getElementById('seriesBody'); // tbody donde se mostraran las series
    const emptyMsg = document.getElementById('emptyMsg'); // mensaje que se muestra cuando no hay series, se oculta si hay series. Se muestra si no hay series

    tbody.innerHTML = ''; // limpiar la tabla antes de renderizar las series, para evitar duplicados al recargar la grilla

    if (series.length === 0) { // si no hay series, mostrar mensaje y salir
        emptyMsg.style.display = 'block'; // mostrar mensaje de "No series added yet"
        return;
    }
    emptyMsg.style.display = 'none';

    series.forEach((serie, index) => tbody.appendChild(crearFila(serie, index + 1))); // por cada serie, crear una fila en la tabla con su informacion y botones de accion
}

function crearFila(serie, numero) {
    const tr = document.createElement('tr');

    const progreso = serie.total_episodes > 0
        ? Math.round((serie.current_episode / serie.total_episodes) * 100) // porcentaje de progreso, que esta redondeado al entero mas cercano. Si total_episodes = 0, se considera progreso 0% para evitar division por cero.
        : 0;
    const isDone = serie.current_episode === serie.total_episodes && serie.total_episodes > 0; // la serie se considera completadasi el episodio actual es igual al total de episodios y el total de episodios es mayor que 0 (para evitar marcar como DONE si no se han definido episodios)

    // Imagen o inicial del nombre
    const inicial = serie.name ? serie.name.charAt(0).toUpperCase() : '?'; // si el nombre de la serie esta definido, se toma la primera letra y se convierte a mayuscula. Si no hay nombre, se muestra un signo de interrogacion
    const thumbInner = serie.image_url // Si hay URL de imagen, mostrarla. Si no, mostrar la inicial. Si la imagen no carga, mostrar la inicial (se uso  onerror para reemplazar el img por la inicial)
        ? `<img src="${escapeHtml(serie.image_url)}"
               alt="${escapeHtml(serie.name)}"
               onerror="this.outerHTML='${inicial}'">`
        : inicial;

    // Botones de episodio solo si no esta completada
    const epButtons = isDone ? '' : ` 
        <button class="btn-sm btn-ep"   onclick="accionIncrementar(${serie.id})">+1</button>
        <button class="btn-sm btn-ep-r" onclick="accionDecrementar(${serie.id})">−1</button>`;

    tr.innerHTML = ` 
        <td class="td-num">${numero}</td> 
        <td><div class="thumb">${thumbInner}</div></td>
        <td><div class="name-cell">${escapeHtml(serie.name)}</div></td>
        <td>
            <div class="prog-wrap">
                <div class="prog-bar">
                    <div class="prog-fill ${isDone ? 'done' : ''}" style="width:${progreso}%"></div>
                </div>
                <span class="prog-txt">${serie.current_episode}/${serie.total_episodes}</span>
                ${isDone ? '<span class="badge-done">DONE</span>' : ''}
            </div>
        </td>
        <td class="td-num">${serie.total_episodes}</td>
        <td>
            <div class="actions">
                ${epButtons}
                <button class="btn-sm btn-edit" onclick="abrirEditar(${serie.id})">Edit</button>
                <button class="btn-sm btn-del"  onclick="accionEliminar(${serie.id})">Del</button>
            </div>
        </td>
    `;

    return tr;
}

//El modal se reutiliza tanto para crear como para editar series. Se diferencia por el titulo y por si se carga una serie en los campos o no. 

function abrirCrear() { // prepara el modal para crear una nueva serie, reseteando los campos y mostrando el modal
    document.getElementById('modalTitle').textContent = 'Add Series'; // cambia el titulo del modal a "Add Series"
    document.getElementById('serieId').value = ''; // resetea el campo oculto de ID, para indicar que se esta creando una nueva serie y no editando una existente
    document.getElementById('serieForm').reset();
    document.getElementById('modal').style.display = 'flex'; // muestra el modal, cambiando su display a 'flex' (ya que en CSS el modal esta oculto por defecto con display: none)
}

async function abrirEditar(id) { //prepara el modal para editar una serie existente. Carga la serie por ID, llena los campos del formulario con su informacion y muestra el modal. 
    try {
        const serie = await getSerieById(id);
        document.getElementById('modalTitle').textContent  = 'Edit Series';
        document.getElementById('serieId').value           = serie.id;
        document.getElementById('fieldName').value         = serie.name;
        document.getElementById('fieldCurrent').value      = serie.current_episode;
        document.getElementById('fieldTotal').value        = serie.total_episodes;
        document.getElementById('fieldImage').value        = serie.image_url || '';
        document.getElementById('modal').style.display     = 'flex';
    } catch (err) { //si no se encuentra serie o hay algun otro error
        alert('Could not load series.');
    }
}

function cerrarModal() { // cierra el modal, ocultandolo y reseteando el formulario para que no quede informacion de la serie anterior cuando se abra para crear una nueva serie
    document.getElementById('serieForm').reset(); // resetea el formulario
    document.getElementById('modal').style.display = 'none';
}

function leerFormulario() { // lee los valores de los campos del formulario y los devuelve en un objeto. Se usa tanto para crear como para editar series
    return {
        name:            document.getElementById('fieldName').value.trim(),
        current_episode: parseInt(document.getElementById('fieldCurrent').value) || 0,
        total_episodes:  parseInt(document.getElementById('fieldTotal').value) || 1,
        image_url:       document.getElementById('fieldImage').value.trim(),
    };
}

function escapeHtml(str) { //Basicamente sobre todo para escritura ya que las URLs de las imagenes no deberian contener caracteres especiales, pero por ejemplo el nombre de la serie si podria contener caracteres especiales como <, >, &, " que pueden romper el HTML.
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function accionIncrementar(id) { //evento de click del boton de incrementar episodio
    try {
        const serie = await getSerieById(id);
        await incrementarEpisodio(serie);
        await recargarSeries();
    } catch (err) { alert(err.message); }
}

async function accionDecrementar(id) {//lo mismo pero para decrementar episodio
    try {
        const serie = await getSerieById(id);
        await decrementarEpisodio(serie);
        await recargarSeries();
    } catch (err) { alert(err.message); }
}

async function accionEliminar(id) { //evento de click del boton de eliminar serie
    if (!confirm('Delete this series?')) return;
    try {
        await deleteSerie(id);
        await recargarSeries();
    } catch (err) { alert(err.message); }
}