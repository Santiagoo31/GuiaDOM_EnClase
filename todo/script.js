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

// RNF-03: Función de retroalimentación centralizada para el usuario
function lanzarNotificacion(texto, color, fondo) {
    mensajeError.style.display = "block"; // Hace visible el contenedor de alertas
    mensajeError.innerText = texto;
    mensajeError.style.color = color;
    mensajeError.style.backgroundColor = fondo;
    mensajeError.style.border = `1px solid ${color}`;
}

// BUSCAR NOMBRE MIENTRAS SE ESCRIBE EL ID
inputId.addEventListener('input', function() {
    const id = this.value.trim();
    
    if (id === "") {
        mensajeError.innerText = "";
        mensajeError.style.backgroundColor = "transparent";
        mensajeError.style.border = "none";
        mensajeError.style.display = "none";
        return;
    }

    // Aseguramos que la verificación inicial maneje el ID correcto
    fetch(`${API_URL}/users/${Number(id)}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(usuario => {
            lanzarNotificacion(`Usuario encontrado: ${usuario.name}`, "#2980b9", "#ebf5fb");
        })
        .catch(() => {
            lanzarNotificacion("Buscando usuario en el sistema...", "gray", "#f5f5f5");
        });
});

// FUNCIÓN PARA CONSULTAR Y REFRESCAR LA TABLA CON UN ID ESPECÍFICO (RF-01 - READ)
function cargarTareasDeUsuario(idUsuario, nombreUsuario) {
    // CORRECCIÓN: Forzamos que idUsuario sea tratado numéricamente en la URL del filtro para json-server
    fetch(`${API_URL}/tareas?idUsuario=${Number(idUsuario)}`)
        .then(res => res.json())
        .then(tareas => {
            tablaTareas.innerHTML = ''; // Limpiamos la tabla por completo
            totalTareas = 0;

            if (tareas.length > 0) {
                tareas.forEach(tarea => {
                    agregarFilaTabla(tarea.id, tarea.nombreUsuario, tarea.idUsuario, tarea.descripcion, tarea.estado);
                });
                lanzarNotificacion(`Visualizando tareas de: ${nombreUsuario}`, "#2980b9", "#ebf5fb");
            } else {
                lanzarNotificacion(`El usuario ${nombreUsuario} no tiene tareas asignadas.`, "#d35400", "#fef9e7");
                actualizarContadorInterfaz();
            }
        })
        .catch(() => {
            lanzarNotificacion("Error al intentar cargar el historial de tareas.", "red", "#fdedec");
        });
}

// 2. RF-02 / RNF-02: EVENTO DE ENVÍO CON DOBLE ACCIÓN INTELIGENTE
formBusqueda.onsubmit = function(e) {
    e.preventDefault(); // RNF-01: Evita recargas de página completas

    // CORRECCIÓN: Convertimos el ID del input directamente a tipo Number
    const idBuscado = inputId.value.trim() !== "" ? Number(inputId.value.trim()) : "";
    const tareaTexto = inputTareaDesc.value.trim();

    // Validación primordial: El campo ID es estrictamente obligatorio para ambas acciones
    if (idBuscado === "") {
        lanzarNotificacion("Error: Por favor ingrese un ID de Usuario para buscar o guardar.", "red", "#fdedec");
        return;
    }

    // --- ACCIÓN A: CONSULTAR TAREAS (Si la descripción está vacía) ---
    if (tareaTexto === "") {
        lanzarNotificacion("Consultando historial en el servidor...", "blue", "#ebf5fb");
        
        fetch(`${API_URL}/users/${idBuscado}`)
            .then(res => {
                if (!res.ok) throw new Error("No existe");
                return res.json();
            })
            .then(usuario => {
                cargarTareasDeUsuario(usuario.id, usuario.name);
            })
            .catch(error => {
                lanzarNotificacion("Error: El ID de usuario especificado no existe en el sistema.", "red", "#fdedec");
                tablaTareas.innerHTML = '';
                totalTareas = 0;
                actualizarContadorInterfaz();
            });
        return; // Detiene la ejecución para que no proceda a crear registros vacíos
    }

    // --- ACCIÓN B: CREAR NUEVA TAREA (Si el ID y la Descripción están diligenciados) ---
    fetch(`${API_URL}/users/${idBuscado}`)
        .then(response => {
            if (!response.ok) throw new Error("No existe");
            return response.json();
        })
        .then(usuario => {
            const nuevaTarea = {
                idUsuario: Number(usuario.id), // Nos aseguramos de guardarlo como Number
                nombreUsuario: usuario.name,
                descripcion: tareaTexto,
                estado: "Pendiente"
            };

            return fetch(`${API_URL}/tareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaTarea)
            });
        })
        .then(resPost => {
            if (!resPost.ok) throw new Error("ErrorServidor");
            return resPost.json();
        })
        .then(tareaFinal => {
            lanzarNotificacion(`¡Tarea registrada exitosamente para ${tareaFinal.nombreUsuario}!`, "green", "#e8f8f5");
            
            // Refrescamos la tabla trayendo todo el historial para asegurar la consistencia del DOM
            cargarTareasDeUsuario(tareaFinal.idUsuario, tareaFinal.nombreUsuario);
            
            inputTareaDesc.value = ''; // Limpiamos la descripción conservando el ID en foco
        })
        .catch(error => {
            if (error.message === "No existe") {
                lanzarNotificacion("Error: No se puede registrar la tarea porque el ID no existe.", "red", "#fdedec");
            } else {
                lanzarNotificacion("Error de Red: No se pudo conectar con el servidor. Verifique su json-server.", "red", "#fdedec");
            }
        });
};

// 3. RF-01: FUNCIÓN PARA CONSTRUIR LA REPRESENTACIÓN DINÁMICA MEDIANTE EL DOM
function agregarFilaTabla(idTarea, nombre, idUsuario, descripcion, estado) {
    const fila = document.createElement('tr');
    fila.dataset.id = idTarea; 

    fila.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${idUsuario}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${nombre}</td>
        <td style="padding: 10px; border: 1px solid #ddd;" class="descripcion-celda">${descripcion}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">
            <span style="color: #e67e22; font-weight: bold;">${estado}</span>
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
            <button class="btn-editar">Editar</button>
            <button class="btn-eliminar">Eliminar</button>
        </td>
    `;

    fila.querySelector('.btn-editar').onclick = () => actualizarTarea(idTarea, fila);
    fila.querySelector('.btn-eliminar').onclick = () => eliminarTarea(idTarea, fila);

    tablaTareas.appendChild(fila);
    totalTareas++;
    actualizarContadorInterfaz();
}

// 4. RF-01: CONSULTAR LA INFORMACIÓN TOTAL DE LA API AL INICIAR LA APLICACIÓN
function cargarTareasIniciales() {
    fetch(`${API_URL}/tareas`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(tareas => {
            tablaTareas.innerHTML = '';
            totalTareas = 0;
            if (tareas.length > 0) {
                tareas.forEach(tarea => {
                    agregarFilaTabla(tarea.id, tarea.nombreUsuario, tarea.idUsuario, tarea.descripcion, tarea.estado);
                });
            } else {
                actualizarContadorInterfaz();
            }
        })
        .catch(() => {
            console.log("Servidor vacío o desconectado. Esperando interacciones.");
        });
}

// 5. RF-04: ELIMINACIÓN DE TAREAS (DELETE) CON CONFIRMACIÓN PREVIA
function eliminarTarea(id, filaHTML) {
    let confirmacionCliente = confirm("¿Está completamente seguro de que desea eliminar esta tarea asociada?");
    if (!confirmacionCliente) return;

    fetch(`${API_URL}/tareas/${id}`, { method: 'DELETE' })
    .then(res => {
        if (!res.ok) throw new Error();
        filaHTML.remove();
        lanzarNotificacion("¡Tarea eliminada de la base de datos correctamente!", "green", "#e8f8f5");
        totalTareas--;
        actualizarContadorInterfaz();
    })
    .catch(() => {
        lanzarNotificacion("Error: Ocurrió un inconveniente de red al intentar eliminar la tarea.", "red", "#fdedec");
    });
}

// 6. RF-03: ACTUALIZACIÓN DE TAREAS (UPDATE) MEDIANTE SOLICITUD PATCH
function actualizarTarea(id, filaHTML) {
    const celdaTexto = filaHTML.querySelector('.descripcion-celda');
    let modificacionTexto = prompt("Modifique la descripción actual de la tarea:", celdaTexto.innerText);
    
    if (modificacionTexto === null) return;
    if (modificacionTexto.trim() === '') {
        lanzarNotificacion("Error: No puede dejar la descripción vacía al actualizar.", "red", "#fdedec");
        return;
    }

    fetch(`${API_URL}/tareas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: modificacionTexto.trim() })
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(tareaActualizada => {
        celdaTexto.innerText = tareaActualizada.descripcion;
        lanzarNotificacion("¡La tarea ha sido actualizada con éxito en el servidor!", "green", "#e8f8f5");
    })
    .catch(() => {
        lanzarNotificacion("Error: No se pudo salvar la actualización en la API RESTful.", "red", "#fdedec");
    });
}

// CONTROLADOR ACCESORIO DEL CONTADOR E INTERFAZ VACÍA
function actualizarContadorInterfaz() {
    if (contadorTexto) {
        contadorTexto.innerText = `${totalTareas} tareas registradas`;
    }
    
    if (totalTareas === 0) {
        tablaTareas.innerHTML = `
            <tr id="emptyState">
                <td colspan="5" style="text-align: center; color: gray; padding: 20px;">
                    No hay tareas registradas en el sistema.
                </td>
            </tr>
        `;
    }
}

// CARGA DE EJECUCIÓN INICIAL DEL SISTEMA
cargarTareasIniciales();