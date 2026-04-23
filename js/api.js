// Va a representar toda comunicacion con el backend
// Hay que Cambiar API_URL a URL de servidor de backend cuando se haga deploy

const API_URL = 'https://web-backend-production-1dfb.up.railway.app'; // URL del backend

// GET /series listar con filtros opcionales
async function getSeries(params = {}) { // { q, sort, order, page, limit }
    const query = new URLSearchParams(); // para construir query string de forma segura
    if (params.q)     query.set('q', params.q); // para busqueda por nombre
    if (params.sort)  query.set('sort', params.sort); // para ordenar por campo (id, name, total_episodes)
    if (params.order) query.set('order', params.order); // para ordenar asc o desc
    if (params.page)  query.set('page', params.page); // para paginacion
    if (params.limit) query.set('limit', params.limit); // para paginacion

    const res = await fetch(`${API_URL}/series?${query.toString()}`); // hace la peticion al backend con los query params
    if (!res.ok) throw new Error('Error al obtener series');
    return res.json();
}

// GET /series/:id — obtener una serie  por ID
async function getSerieById(id) {  
    const res = await fetch(`${API_URL}/series/${id}`); // hace la peticion al backend para obtener la serie por ID
    if (res.status === 404) throw new Error('Serie no encontrada'); //si no se encuentra la serie
    if (!res.ok) throw new Error('Error al obtener la serie'); //si da error
    return res.json(); // devuelve la serie obtenida del backend en formato JSON
}

// POST /series — crear nueva serie
async function createSerie(data) {
    const res = await fetch(`${API_URL}/series`, {
        method: 'POST', // indica que es una peticion POST para crear un nuevo recurso
        headers: { 'Content-Type': 'application/json' }, // indica que el body de la peticion es JSON
        body: JSON.stringify(data) // convierte el objeto data a JSON para enviarlo en el body de la peticion
    });
    const json = await res.json(); // obtiene la respuesta del backend en formato JSON
    if (!res.ok) throw new Error(json.error || 'Error al crear serie'); //si da erro
    return json; // 201 con la serie creada
}

// PUT /series/:id — editar serie existente
async function updateSerie(id, data) { // data es un objeto con los campos a actualizar { name, current_episode, total_episodes, cover_url }
    const res = await fetch(`${API_URL}/series/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }, // indica que el body de la peticion es JSON
        body: JSON.stringify(data) // convierte el objeto data a JSON para enviarlo en el body de la peticion
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar serie');
    return json;
}

// DELETE /series/:id — para eliminar serie por ID
async function deleteSerie(id) {
    const res = await fetch(`${API_URL}/series/${id}`, { method: 'DELETE' }); // hace la peticion al backend para eliminar la serie por ID
    if (res.status === 404) throw new Error('Serie no encontrada'); //si no se encuentra la serie
    if (!res.ok) throw new Error('Error al eliminar serie'); //si da error
    // 204 No Content — sin body
}

// Cofigurar episodios — usan updateSerie internamente 
async function incrementarEpisodio(serie) {
    if (serie.current_episode >= serie.total_episodes) return; // no hacer nada si ya se alcanzo el total de episodios
    return updateSerie(serie.id, {
        ...serie,
        current_episode: serie.current_episode + 1
    }); // actualiza la serie incrementando el episodio actual en 1
}

async function decrementarEpisodio(serie) {
    if (serie.current_episode <= 0) return; // no hacer nada si ya se esta en el episodio 0 (no negativo)
    return updateSerie(serie.id, { //por esto es que se hace async por el updateSerie
        ...serie, //... significa que se mantiene el resto de los campos de la serie igual, solo se actualiza current_episode
        current_episode: serie.current_episode - 1
    }); // actualiza la serie restando al episodio actual en 1
}