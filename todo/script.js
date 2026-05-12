const API_URL = "http://10.5.225.184:5500/todo/"; 

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

    fetch(`${API_URL}/users/${id}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(usuario => {
            mensajeError.innerText = `Usuario: ${usuario.name}`;
            mensajeError.style.color = "#3498db";
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

    fetch(`${API_URL}/users/${idBuscado}`)
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

            return fetch(`${API_URL}/tareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaTarea)
            });
        })
        .then(resPost => resPost.json())
        .then(tareaFinal => {
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

// --- NUEVO: Guardar y cargar tareas en LocalStorage ---
function guardarTareas() {
    const filas = tablaTareas.querySelectorAll('tr');
    const tareas = [];

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length > 0) {
            tareas.push({
                id: celdas[0].innerText,
                nombre: celdas[1].innerText,
                descripcion: celdas[2].innerText,
                estado: celdas[3].innerText
            });
        }
    });

    localStorage.setItem('tareasGuardadas', JSON.stringify(tareas));
}

function cargarTareas() {
    const tareasGuardadas = JSON.parse(localStorage.getItem('tareasGuardadas')) || [];
    if (tareasGuardadas.length > 0) {
        if (emptyState) emptyState.style.display = "none";
        tareasGuardadas.forEach(t => {
            agregarFilaTabla(t.nombre, t.id, t.descripcion, t.estado);
        });
    }
}

const originalAgregarFila = agregarFilaTabla;
agregarFilaTabla = function(nombre, id, descripcion, estado) {
    originalAgregarFila(nombre, id, descripcion, estado);
    guardarTareas();
};

window.addEventListener('DOMContentLoaded', cargarTareas);
