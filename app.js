// simple in-memory/localStorage data structures
const USER = { username: 'solomonubani1987@gmail.com', password: 'cgames' };
const STORAGE_KEY = 'daytona-games';
const CONTENT_KEY = 'daytona-content';

function $(id) { return document.getElementById(id); }

function loadGames() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}
function saveGames(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadContents() {
    const raw = localStorage.getItem(CONTENT_KEY);
    return raw ? JSON.parse(raw) : {};
}
function saveContents(obj) {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(obj));
}

// login logic
let sessionID = null;
$('login-button').addEventListener('click', () => {
    const u = $('username').value.trim();
    const p = $('password').value;
    if (u === USER.username && p === USER.password) {
        // generate session/game ID at sign-in
        sessionID = 'SID' + Date.now();
        $('session-info').textContent = `Session Game ID: ${sessionID}`;
        showMain();
    } else {
        $('login-error').textContent = 'Invalid credentials';
    }
});

function showMain() {
    $('login-container').classList.add('hidden');
    $('main-container').classList.remove('hidden');
    $('login-error').textContent = '';
    $('username').value = '';
    $('password').value = '';
    renderSavedList();
    renderGames();
}

$('logout-button').addEventListener('click', () => {
    $('main-container').classList.add('hidden');
    $('login-container').classList.remove('hidden');
});

// content editor
$('save-content').addEventListener('click', () => {
    const text = $('playground-content').value;
    if (!text) return;
    const contents = loadContents();
    const id = (sessionID ? sessionID + '-' : '') + 'G' + Date.now();
    contents[id] = text;
    saveContents(contents);
    $('saved-message').textContent = `Saved with Game ID ${id}`;
    $('playground-content').value = '';
    renderSavedList();
});

function renderSavedList() {
    const list = loadContents();
    const ul = $('saved-list');
    ul.innerHTML = '';
    for (const id in list) {
        const li = document.createElement('li');
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', () => {
            alert(`ID: ${id}\n\n${list[id]}`);
        });
        li.textContent = id + ' ';
        li.appendChild(viewBtn);
        ul.appendChild(li);
    }
}

// store logic
$('store-icon').addEventListener('click', () => {
    const store = $('store');
    store.classList.toggle('hidden');
});

$('upload-button').addEventListener('click', () => {
    const fileInput = $('game-file');
    const file = fileInput.files[0];
    if (!file) {
        $('upload-error').textContent = 'Select a file first';
        return;
    }
    const games = loadGames();
    const id = (sessionID ? sessionID + '-' : '') + 'G' + Date.now();
    const url = URL.createObjectURL(file);
    games.push({ id, name: file.name, url });
    saveGames(games);
    renderGames();
    fileInput.value = '';
    $('upload-error').textContent = 'Uploaded';
});

function renderGames() {
    const ul = $('games-list');
    ul.innerHTML = '';
    const games = loadGames();
    if (games.length === 0) {
        ul.textContent = 'No games uploaded yet.';
        return;
    }
    games.forEach(g => {
        const li = document.createElement('li');
        li.textContent = `${g.id} - ${g.name} `;
        // link to download/play the uploaded file
        const playLink = document.createElement('a');
        playLink.href = g.url;
        playLink.textContent = '[Download/Play]';
        playLink.download = g.name;
        playLink.style.marginRight = '8px';
        li.appendChild(playLink);

        const ck = document.createElement('button');
        ck.textContent = 'Checkout (£11)';
        ck.addEventListener('click', () => {
            window.open(`https://www.paypal.com/paypalme/solomonubani1987@gmail.com/11`, '_blank');
        });
        li.appendChild(ck);
        ul.appendChild(li);
    });
}
