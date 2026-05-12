// 0. CONFIGURACIÓN DINÁMICA DE LA IP
const API_URL = `http://${window.location.hostname}:3000`; 

// 1. SELECCIÓN DE ELEMENTOS DEL DOM
const formBusqueda = document.getElementById('messageForm'); 
const inputId = document.getElementById('userName'); 
const inputTareaDesc = document.getElementById('userMessage'); 
const mensajeError = document.getElementById('userNameError'); 
const tablaTareas = document.getElementById('messagesContainer'); 
const emptyState = document.getElementById('emptyState');
const contadorTexto = document.getElementById('messageCount');

let totalTareas = 0;

// BUSCAR NOMBRE MIENTRA SE ESCRIBE EL ID
inputId.addEventListener('input', function() {
    const id = this.value.trim();
    
    if (id === "") {
        mensajeError.innerText = "";
        return;
    }

    fetch(`${API_URL}/users/${id}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(usuario => {
            mensajeError.innerText = `Usuario encontrado: ${usuario.name}`;
            mensajeError.style.color = "#3498db";
        })
        .catch(() => {
            mensajeError.innerText = "Buscando usuario...";
            mensajeError.style.color = "gray";
        });
});

// 2. EVENTO DE ENVÍO (Validar y Guardar Tarea)
formBusqueda.onsubmit = function(e) {
    e.preventDefault(); 

    const idBuscado = inputId.value.trim();
    const tareaTexto = inputTareaDesc.value.trim();

    if (idBuscado === "" || tareaTexto === "") {
        mensajeError.innerText = "Error: Completa todos los campos.";
        mensajeError.style.color = "red";
        return;
    }

    // PASO 1: Verificar que el usuario existe en el servidor
    fetch(`${API_URL}/users/${idBuscado}`)
        .then(response => {
            if (!response.ok) throw new Error("No existe");
            return response.json();
        })
        .then(usuario => {
            // PASO 2: Crear el objeto de la nueva tarea
            const nuevaTarea = {
                idUsuario: usuario.id,
                nombreUsuario: usuario.name,
                descripcion: tareaTexto,
                estado: "Pendiente"
            };

            // PASO 3: Guardar en db.json usando POST
            return fetch(`${API_URL}/tareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaTarea)
            });
        })
        .then(resPost => resPost.json())
        .then(tareaFinal => {
            // ÉXITO: Actualizar interfaz
            mensajeError.innerText = `¡Tarea registrada para ${tareaFinal.nombreUsuario}!`;
            mensajeError.style.color = "green";

            agregarFilaTabla(tareaFinal.nombreUsuario, tareaFinal.idUsuario, tareaFinal.descripcion, tareaFinal.estado);
            formBusqueda.reset();
        })
        .catch(error => {
            mensajeError.innerText = "Error: Usuario no encontrado o servidor apagado.";
            mensajeError.style.color = "red";
        });
};

// 3. FUNCIÓN PARA AGREGAR FILAS A LA TABLA
function agregarFilaTabla(nombre, id, descripcion, estado) {
    if (emptyState) emptyState.style.display = "none";

    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd;">${id}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${nombre}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${descripcion}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">
            <span style="color: orange; font-weight: bold;">${estado}</span>
        </td>
    `;
    tablaTareas.appendChild(fila);

    totalTareas++;
    if (contadorTexto) {
        contadorTexto.innerText = `${totalTareas} tareas registradas`;
    }
}