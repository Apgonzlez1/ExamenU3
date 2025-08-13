const socket = io();

// Verificar si hay cookie con JWT
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const token = getCookie('token');

if(token) {
    // Usuario autenticado, mostrar tablero
    document.getElementById('login').style.display = 'none';
    document.getElementById('tablero').style.display = 'block';
} else {
    // No autenticado, mostrar login
    document.getElementById('login').style.display = 'block';
    document.getElementById('tablero').style.display = 'none';
}

// Enviar una nueva idea
document.getElementById('formIdea')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idea = document.getElementById('idea').value.trim();
    if (idea !== "") {
        socket.emit('nueva_idea', idea);
        document.getElementById('idea').value = '';
    }
});

// Recibir y mostrar la lista de ideas
socket.on('ideas', (lista) => {
    const contenedor = document.getElementById('listaIdeas');
    contenedor.innerHTML = '';
    lista.forEach(idea => {
        const li = document.createElement('li');
        li.textContent = idea;
        contenedor.appendChild(li);
    });
});
