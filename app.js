// account management and simple VNC playground starter
const ACCOUNTS_KEY = 'convacation-accounts';
const GAMES_KEY = 'convacation-games';
let currentGameID = null;
let pendingVncUrl = null; // url parsed from hash to use when first connecting

function $(id) { return document.getElementById(id); }

function loadAccounts() {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
}
function saveAccounts(obj) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(obj));
}

function ensureDefaultAccount() {
    const accounts = loadAccounts();
    // primary management accounts
    if (!accounts['convacation']) {
        accounts['convacation'] = { password: 'convacation', email: '' };
    }
    if (!accounts['cgames']) {
        // solomon's account used for submissions/pay gating
        accounts['cgames'] = { password: 'cgames', email: 'solomonubani1987@gmail.com' };
    }
    saveAccounts(accounts);
}

function loadGames() {
    const raw = localStorage.getItem(GAMES_KEY);
    return raw ? JSON.parse(raw) : [];
}
function saveGames(arr) {
    localStorage.setItem(GAMES_KEY, JSON.stringify(arr));
}

function showLogin() {
    // stop any playing audio when returning to login
    const audio = $('start-audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    $('login-container').classList.remove('hidden');
    $('signup-container').classList.add('hidden');
    $('main-container').classList.add('hidden');
    $('nav-bar').classList.add('hidden');
    $('login-error').textContent = '';
}
function showSignup() {
    $('login-container').classList.add('hidden');
    $('signup-container').classList.remove('hidden');
    $('main-container').classList.add('hidden');
    $('nav-bar').classList.add('hidden');
    $('signup-error').textContent = '';
}
function showMain() {
    $('login-container').classList.add('hidden');
    $('signup-container').classList.add('hidden');
    $('main-container').classList.remove('hidden');
    $('nav-bar').classList.remove('hidden');
    // ensure playground tab active
    $('tab-playground').classList.add('active');
    $('tab-submit').classList.remove('active');
    $('game-page').classList.add('hidden');
    // if there was a VNC URL from the address bar, use it, otherwise default
    startVNC(pendingVncUrl);
    pendingVncUrl = null;
    renderGameList();
    // start background audio after signin
    const audio = $('start-audio');
    if (audio) {
        audio.play().catch(err => {
            console.warn('could not play start audio:', err);
        });
    }
}

$('login-button').addEventListener('click', () => {
    const gameid = $('gameid').value.trim();
    const pwd = $('password').value;
    const accounts = loadAccounts();
    if (!gameid) {
        $('login-error').textContent = 'Enter a Game ID';
        return;
    }
    if (!pwd) {
        $('login-error').textContent = 'Enter a password';
        return;
    }
    if (accounts[gameid] && accounts[gameid].password === pwd) {
        currentGameID = gameid;
        showMain();
    } else {
        $('login-error').textContent = 'Invalid Game ID or password';
    }
});

$('signup-button').addEventListener('click', () => {
    const gameid = $('new-gameid').value.trim();
    const pwd = $('new-password').value;
    const email = $('new-email').value.trim();
    if (!gameid) {
        $('signup-error').textContent = 'Game ID required';
        return;
    }
    if (!pwd) {
        $('signup-error').textContent = 'Password required';
        return;
    }
    const accounts = loadAccounts();
    if (accounts[gameid]) {
        $('signup-error').textContent = 'Game ID already exists';
        return;
    }
    accounts[gameid] = { password: pwd, email };
    saveAccounts(accounts);
    $('signup-error').textContent = 'Account created! Please sign in.';
});

$('show-signup').addEventListener('click', e => {
    e.preventDefault();
    showSignup();
});
$('show-login').addEventListener('click', e => {
    e.preventDefault();
    showLogin();
});

$('logout-button').addEventListener('click', () => {
    currentGameID = null;
    showLogin();
});

// toolbar actions
$('convacation-icon').addEventListener('click', () => {
    if (currentGameID === 'convacation') {
        $('game-page').classList.remove('hidden');
        $('main-container').classList.add('hidden');
    }
});
$('cancel-upload').addEventListener('click', () => {
    $('game-page').classList.add('hidden');
    $('main-container').classList.remove('hidden');
});

// startVNC can take a custom websocket URL (e.g. ws://host:port) or will fall back to the default
function startVNC(url) {
    const container = $('vnc-placeholder');
    const target = url || 'ws://localhost:6080';
    container.textContent = 'Starting VNC playground (octacat) for ' + currentGameID + ' ...';
    // check for noVNC library
    if (typeof RFB === 'undefined') {
        container.textContent = 'VNC initialization failed: noVNC library (RFB) not loaded. Using stub, no real connection will occur.';
        console.warn('RFB is undefined; ensure noVNC script is included or reachable');
        return;
    }

    // initialize noVNC client inside #vnc-container
    const vncDiv = $('vnc-container');
    if (!vncDiv) return;
    // clean previous session if any (including any iframe)
    vncDiv.innerHTML = '';
    // create a canvas element required by noVNC
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    vncDiv.appendChild(canvas);
    // configure RFB connection to the provided websocket url
    try {
        const rfb = new RFB(canvas, target);
        let connected = false;
        rfb.addEventListener('connect', () => {
            connected = true;
            container.textContent = 'Connected to octacat environment (' + target + ').';
        });
        rfb.addEventListener('disconnect', () => {
            container.textContent = 'Disconnected from octacat environment.';
        });
        // optionally authenticate automatically
        rfb.sendPassword('');
        // store rfb instance so other functions can send keys/commands if needed
        window.currentRFB = rfb;
        // if connection doesn't happen within 5s, show helpful message
        setTimeout(() => {
            if (!connected) {
                container.textContent = 'Unable to reach VNC server at ' + target + '. Make sure websockify and a VNC server are running.';
            }
        }, 5000);
        // update the browser address bar for visibility
        if (target !== 'ws://localhost:6080') {
            history.replaceState({}, '', '#vnc=' + encodeURIComponent(target));
        }
    } catch (err) {
        container.textContent = 'VNC initialization failed: ' + err;
    }
}

// helper to load an arbitrary URL inside the VNC container by overlaying an iframe
function loadUrlInVNC(url) {
    const vncDiv = $('vnc-container');
    if (!vncDiv) return;
    // remove existing VNC canvas if any, but remember to reconnect later on close
    vncDiv.innerHTML = '';
    // create iframe to show the URL
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    vncDiv.appendChild(iframe);
    // provide a close button to return to VNC
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '8px';
    closeBtn.style.zIndex = '1000';
    closeBtn.addEventListener('click', () => {
        startVNC();
    });
    vncDiv.appendChild(closeBtn);
}


// render list of games for convacation
function renderGameList() {
    const container = $('games-list-container');
    container.innerHTML = '';
    if (currentGameID !== 'convacation') return;
    const games = loadGames();
    if (games.length === 0) {
        container.textContent = 'No games submitted yet.';
        return;
    }
    const ul = document.createElement('ul');
    games.forEach((g, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${g.title}</strong> - ${g.description} `;
        const imgElem = document.createElement('img');
        imgElem.src = g.imageUrl;
        imgElem.style.width = '48px';
        imgElem.style.verticalAlign = 'middle';
        li.appendChild(imgElem);
        // determine if payment required
        const requiresPay = g.ownerEmail === 'solomonubani1987@gmail.com';
        if (requiresPay && !g.purchased) {
            // show purchase button only
            const buy = document.createElement('button');
            buy.textContent = 'Buy (£11)';
            buy.addEventListener('click', () => {
                window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&currency_code=GBP&amount=11&business=send.counting770@8shield.net', '_blank');
                // mark purchased locally
                g.purchased = true;
                saveGames(games);
                renderGameList();
            });
            li.appendChild(buy);
        } else {
            // show either a download link or an "Open" button for URL games
            if (g.webUrl) {
                const openBtn = document.createElement('button');
                openBtn.textContent = 'Open';
                openBtn.style.marginLeft = '8px';
                openBtn.addEventListener('click', () => {
                    // if the URL looks like a VNC websocket endpoint, reconnect
                    if (/^wss?:\/\//.test(g.webUrl)) {
                        startVNC(g.webUrl);
                    } else {
                        // otherwise show it in an iframe overlay inside the container
                        loadUrlInVNC(g.webUrl);
                    }
                });
                li.appendChild(openBtn);
            } else if (g.fileUrl) {
                const dl = document.createElement('a');
                dl.href = g.fileUrl;
                dl.textContent = 'Download';
                dl.style.marginLeft = '8px';
                dl.style.color = '#0af';
                dl.setAttribute('download', g.title);
                li.appendChild(dl);
            }
            // also show buy button optionally for convenience
            const buy = document.createElement('button');
            buy.textContent = 'Buy (£11)';
            buy.addEventListener('click', () => {
                window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&currency_code=GBP&amount=11&business=send.counting770@8shield.net', '_blank');
            });
            li.appendChild(buy);
        }
        // save icon
        const saveIcon = document.createElement('img');
        saveIcon.src = 'asset_saWW29EArUf6991TMhAvbHbz.jpg';
        saveIcon.style.width = '24px';
        saveIcon.style.cursor = 'pointer';
        saveIcon.title = 'Save';
        li.appendChild(saveIcon);
        // cancel icon
        const cancelIcon = document.createElement('img');
        cancelIcon.src = 'asset_Ws8iFz5fkenTSpS6wSgqQoXh.jpg';
        cancelIcon.style.width = '24px';
        cancelIcon.style.cursor = 'pointer';
        cancelIcon.title = 'Cancel';
        cancelIcon.addEventListener('click', () => {
            // maybe remove
            const idx = games.indexOf(g);
            if (idx !== -1) {
                games.splice(idx,1);
                saveGames(games);
                renderGameList();
            }
        });
        li.appendChild(cancelIcon);
        ul.appendChild(li);
    });
    container.appendChild(ul);
}

// handle game upload form
$('game-form').addEventListener('submit', e => {
    e.preventDefault();
    const title = $('game-title').value.trim();
    const desc = $('game-desc').value.trim();
    const imgFile = $('game-image').files[0];
    const gameFile = $('game-file').files[0];
    const webUrl = $('game-url').value.trim();
    // at least one of file or URL must be provided
    if (!title || !desc || !imgFile || (!gameFile && !webUrl)) {
        $('upload-message').textContent = 'Title, description, image and either file or URL required';
        return;
    }
    const games = loadGames();
    const imgUrl = URL.createObjectURL(imgFile);
    const fileUrl = gameFile ? URL.createObjectURL(gameFile) : '';
    const accounts = loadAccounts();
    const ownerEmail = accounts[currentGameID]?.email || '';
    // track whether user has paid for this game (used for solomon account)
    games.push({ title, description: desc, imageUrl: imgUrl, fileUrl, webUrl, ownerEmail, purchased: false });
    saveGames(games);
    $('upload-message').textContent = 'Uploaded';
    $('game-form').reset();
    // clear previews
    const previewImg = $('image-preview');
    if (previewImg) previewImg.remove();
    const fileInfo = $('file-info');
    if (fileInfo) fileInfo.remove();
    renderGameList();
});

window.addEventListener('load', () => {
    ensureDefaultAccount();
    // look for a vnc URL encoded in the hash (e.g. #vnc=ws%3A%2F%2Fhost%3A5902)
    const m = location.hash.match(/vnc=(.*)/);
    if (m) {
        pendingVncUrl = decodeURIComponent(m[1]);
    }
    showLogin();

    // preview handlers for upload form
    const imgInput = $('game-image');
    if (imgInput) {
        imgInput.addEventListener('change', () => {
            const file = imgInput.files[0];
            let existing = $('image-preview');
            if (existing) existing.remove();
            if (file) {
                const img = document.createElement('img');
                img.id = 'image-preview';
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '100px';
                img.style.display = 'block';
                img.style.marginTop = '10px';
                imgInput.parentNode.appendChild(img);
            }
        });
    }
    const gameInput = $('game-file');
    if (gameInput) {
        gameInput.addEventListener('change', () => {
            let info = $('file-info');
            if (info) info.remove();
            const file = gameInput.files[0];
            if (file) {
                info = document.createElement('p');
                info.id = 'file-info';
                info.textContent = `Selected file: ${file.name}`;
                gameInput.parentNode.appendChild(info);
            }
        });
    }

    // tab navigation
    $('tab-playground').addEventListener('click', () => {
        // show main container
        $('main-container').classList.remove('hidden');
        $('game-page').classList.add('hidden');
        $('tab-playground').classList.add('active');
        $('tab-submit').classList.remove('active');
    });
    $('tab-submit').addEventListener('click', () => {
        if (currentGameID === 'convacation' || currentGameID === 'cgames') {
            $('main-container').classList.add('hidden');
            $('game-page').classList.remove('hidden');
            $('tab-submit').classList.add('active');
            $('tab-playground').classList.remove('active');
        }
    });
});
