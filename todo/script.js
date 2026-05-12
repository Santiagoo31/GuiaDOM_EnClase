// 1. SELECCIÓN DE ELEMENTOS
const formBusqueda = document.getElementById('messageForm'); // Formulario principal
const inputId = document.getElementById('userName'); 
const inputTareaDesc = document.getElementById('userMessage'); 
const mensajeError = document.getElementById('userNameError'); 
const tablaTareas = document.getElementById('messagesContainer'); // Aquí meteremos los <tr>
const emptyState = document.getElementById('emptyState');

// 2. PROCESO 1: BÚSQUEDA DEL USUARIO
formBusqueda.onsubmit = function(e) {
    e.preventDefault(); 

    const idBuscado = inputId.value.trim();
    const tareaTexto = inputTareaDesc.value.trim();

    if (idBuscado === "" || tareaTexto === "") {
        mensajeError.innerText = "Error: Completa todos los campos.";
        mensajeError.style.color = "red";
        return;
    }

    // Consultar el servidor (Transferencia de conocimiento)
    fetch(`http://localhost:3000/users/${idBuscado}`)
        .then(response => {
            if (!response.ok) throw new Error("No existe");
            return response.json();
        })
        .then(usuario => {
            // MOSTRAR DATOS DEL USUARIO ENCONTRADO
            mensajeError.innerText = `Usuario Validado: ${usuario.name}`;
            mensajeError.style.color = "green";

            // PROCESO 3: MANIPULACIÓN DEL DOM (Crear fila de tabla)
            agregarFilaTabla(usuario.name, idBuscado, tareaTexto);
            
            formBusqueda.reset();
        })
        .catch(error => {
            // MENSAJE INFORMATIVO CUANDO NO SE ENCUENTRA
            mensajeError.innerText = "Error: El usuario no está registrado en el sistema.";
            mensajeError.style.color = "red";
        });
};

// 3. FUNCIÓN PARA AGREGAR A LA TABLA (Como pide la guía)
function agregarFilaTabla(nombre, id, descripcion) {
    if (emptyState) emptyState.style.display = "none";

    // Crear elemento dinámicamente
    const fila = document.createElement('tr');
    
    // Estructura de salida según la guía
    fila.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd;">${id}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${nombre}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${descripcion}</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><span style="color: orange;">Pendiente</span></td>
    `;

    // Lo agregamos al contenedor (que debería ser un <tbody> o una tabla)
    tablaTareas.appendChild(fila);
}