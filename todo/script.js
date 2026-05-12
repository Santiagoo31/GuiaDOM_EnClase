// 1. SELECCIÓN DE ELEMENTOS
const formBusqueda = document.getElementById('messageForm'); 
const inputId = document.getElementById('userName'); 
const inputTareaDesc = document.getElementById('userMessage'); 
const mensajeError = document.getElementById('userNameError'); 
const tablaTareas = document.getElementById('messagesContainer'); 
const emptyState = document.getElementById('emptyState');
const contadorTexto = document.getElementById('messageCount');

let totalTareas = 0;

// --- NUEVO: BUSCAR NOMBRE MIENTRAS ESCRIBES EL ID ---
inputId.addEventListener('input', function() {
    const id = this.value.trim();
    
    if (id === "") {
        mensajeError.innerText = "";
        return;
    }

    fetch(`http://localhost:3000/users/${id}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(usuario => {
            // Mostramos el nombre apenas lo encuentra
            mensajeError.innerText = `Usuario: ${usuario.name}`;
            mensajeError.style.color = "#3498db"; // Un azul para diferenciar
        })
        .catch(() => {
            mensajeError.innerText = "Buscando usuario...";
            mensajeError.style.color = "gray";
        });
});

// 2. EVENTO DE ENVÍO (Para registrar la tarea)
formBusqueda.onsubmit = function(e) {
    e.preventDefault(); 

    const idBuscado = inputId.value.trim();
    const tareaTexto = inputTareaDesc.value.trim();

    if (idBuscado === "" || tareaTexto === "") {
        mensajeError.innerText = "Error: Completa todos los campos.";
        mensajeError.style.color = "red";
        return;
    }

    // PASO 1: Validar y obtener datos finales
    fetch(`http://localhost:3000/users/${idBuscado}`)
        .then(response => {
            if (!response.ok) throw new Error("No existe");
            return response.json();
        })
        .then(usuario => {
            const nuevaTarea = {
                idUsuario: usuario.id,
                nombreUsuario: usuario.name,
                descripcion: tareaTexto,
                estado: "Pendiente"
            };

            // PASO 2: Guardar en el servidor
            return fetch('http://localhost:3000/tareas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaTarea)
            });
        })
        .then(resPost => resPost.json())
        .then(tareaFinal => {
            // PASO 3: Mostrar abajo en la tabla y dejarla ahí
            mensajeError.innerText = `¡Tarea registrada para ${tareaFinal.nombreUsuario}!`;
            mensajeError.style.color = "green";

            agregarFilaTabla(tareaFinal.nombreUsuario, tareaFinal.idUsuario, tareaFinal.descripcion, tareaFinal.estado);
            
            formBusqueda.reset();
        })
        .catch(error => {
            mensajeError.innerText = "Error: Usuario no encontrado.";
            mensajeError.style.color = "red";
        });
};

// 3. FUNCIÓN PARA AGREGAR FILAS
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