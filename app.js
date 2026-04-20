async function nextEpisode(id) {
    const url = '/update?id=' + id;
    const response = await fetch(url, { method: "POST" })
    location.reload()
}

async function prevEpisode(id) {
    const url = '/downdate?id=' + id;
    await fetch(url, { method: "POST" })
    location.reload()
}

async function deleteSerie(id) { //de por si estamos diciendo que va a ser una funcion asincrona, ya que vamos a hacer una solicitud a la base de datos, y queremos esperar a que se complete antes de recargar la página
    const url = '/delete?id=' + id;
    await fetch(url, { method: "DELETE" }) // en si el await es necesario, ya que queremos esperar a que se complete la solicitud antes de recargar la página
    location.reload() //se recarga la pagina 
}

//es decir que una funcion asincrona es una funcion que puede esperar a que se complete una tarea antes de continuar con la siguiente, lo que es especialmente útil cuando se trabaja con operaciones que pueden tardar un tiempo en completarse, como las solicitudes a la base de datos.