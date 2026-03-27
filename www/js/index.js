// --- CONFIGURATION DU LECTEUR ---

// Liste de lecture (Exemple)
const playlist = [
    {
        title: "Rhythm of Mali",
        artist: "Amadou & Mariam",
        src: "https://ia801609.us.archive.org/28/items/Rhythm_Of_Mali_Amadou_Mariam/01_Rhythm_Of_Mali.mp3",
        cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=400"
    },
    {
        title: "Tali Tali",
        artist: "Habib Koité",
        src: "https://ia800702.us.archive.org/1/items/talitali_habibkoite/01_talitali.mp3",
        cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400"
    }
];

let currentSongIndex = 0;
let isPlaying = false;
let shuffleMode = false;
let repeatMode = false;

// Objet Audio HTML5
const audio = new Audio();

// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const elements = {
    app: document.querySelector('.app-container'),
    albumDisk: document.getElementById('album-disk'),
    albumArt: document.getElementById('album-art'),
    songTitle: document.getElementById('song-title'),
    songArtist: document.getElementById('song-artist'),
    currentTime: document.getElementById('current-time'),
    totalTime: document.getElementById('total-time'),
    progressBar: document.getElementById('progress-bar'),
    progressFill: document.getElementById('progress-fill'),
    progressKnob: document.getElementById('progress-knob'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    btnShuffle: document.getElementById('btn-shuffle'),
    btnRepeat: document.getElementById('btn-repeat'),
    statusTime: document.getElementById('status-time'),
    statusBattery: document.getElementById('status-battery')
};

// --- INITIALISATION CORDOVA ---
const app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        console.log("Cordova chargé, lecteur prêt.");
        this.setupStatusBar();
        this.setupEventListeners();
        this.loadSong(currentSongIndex);
        this.startStatusUpdates();
    },

    // Configure la barre de statut pour un design premium (Transparent)
    setupStatusBar: function() {
        if (window.StatusBar) {
            // Rend la barre de statut transparente et étend le design dessous
            StatusBar.overlaysWebView(true);
            StatusBar.styleLightContent(); // Icônes blanches sur fond sombre
            // StatusBar.styleDefault(); // Icônes noires sur fond clair (Pour Neumorphisme clair)
        }
    },

    setupEventListeners: function() {
        // Contrôles UI
        elements.btnPlayPause.addEventListener('click', togglePlayPause);
        elements.btnNext.addEventListener('click', playNext);
        elements.btnPrev.addEventListener('click', playPrev);
        elements.btnShuffle.addEventListener('click', toggleShuffle);
        elements.btnRepeat.addEventListener('click', toggleRepeat);

        // Barre de progression cliquable
        elements.progressBar.addEventListener('click', seekTo);

        // Événements de l'objet Audio
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setTotalTime);
        audio.addEventListener('ended', onSongEnded);
    },

    // Charge un morceau
    loadSong: function(index) {
        const song = playlist[index];
        elements.songTitle.innerText = song.title;
        elements.songArtist.innerText = song.artist;
        elements.albumArt.src = song.cover;
        audio.src = song.src;
        
        // Réinitialise la barre de progression
        elements.progressFill.style.width = "0%";
        elements.currentTime.innerText = "0:00";
        elements.totalTime.innerText = "0:00";
    },

    // Met à jour l'heure et la batterie de la barre de statut simulée
    startStatusUpdates: function() {
        function update() {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            let ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0h devient 12h
            minutes = minutes < 10 ? '0'+minutes : minutes;
            elements.statusTime.innerText = `${hours}:${minutes} ${ampm}`;
            
            // Simulation de batterie
            navigator.getBattery().then(function(battery) {
                elements.statusBattery.innerText = `${Math.floor(battery.level * 100)}%`;
            });
        }
        update();
        setInterval(update, 10000); // Met à jour toutes les 10 secondes
    }
};

// --- FONCTIONS DE CONTRÔLE AUDIO ---

function togglePlayPause() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function playSong() {
    isPlaying = true;
    audio.play();
    updateUIPlayState();
    updateMusicControls();
}

function pauseSong() {
    isPlaying = false;
    audio.pause();
    updateUIPlayState();
    updateMusicControls();
}

function playNext() {
    if (shuffleMode) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
    }
    app.loadSong(currentSongIndex);
    playSong();
}

function playPrev() {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    app.loadSong(currentSongIndex);
    playSong();
}

function toggleShuffle() {
    shuffleMode = !shuffleMode;
    elements.btnShuffle.classList.toggle('active', shuffleMode);
}

function toggleRepeat() {
    repeatMode = !repeatMode;
    elements.btnRepeat.classList.toggle('active', repeatMode);
}

function onSongEnded() {
    if (repeatMode) {
        playSong();
    } else {
        playNext();
    }
}

// --- MISE À JOUR DE L'INTERFACE (UI) ---

function updateUIPlayState() {
    if (isPlaying) {
        // Affiche l'icône pause, cache l'icône play
        document.getElementById('play-icon').style.display = 'none';
        document.getElementById('pause-icon').style.display = 'block';
        // Active la rotation du disque
        elements.albumDisk.style.animation = "rotate-disk 20s linear infinite";
    } else {
        // Affiche l'icône play, cache l'icône pause
        document.getElementById('play-icon').style.display = 'block';
        document.getElementById('pause-icon').style.display = 'none';
        // Arrête la rotation du disque
        elements.albumDisk.style.animation = "none";
    }
}

// Met à jour la barre de progression
function updateProgress() {
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        elements.progressFill.style.width = `${progressPercent}%`;
        elements.progressKnob.style.left = `${progressPercent}%`;
        elements.currentTime.innerText = formatTime(audio.currentTime);
    }
}

// Définit le temps total une fois chargé
function setTotalTime() {
    elements.totalTime.innerText = formatTime(audio.duration);
}

// Aller à un moment précis en cliquant sur la barre
function seekTo(e) {
    const barWidth = elements.progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / barWidth) * duration;
}

// Formate les secondes en M:SS
function formatTime(seconds) {
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    if (sec < 10) { sec = `0${sec}`; }
    return `${min}:${sec}`;
}

// --- GESTION DES CONTRÔLES DE NOTIFICATION (PLUGIN) ---

function updateMusicControls() {
    // Si le plugin n'est pas installé, on ne fait rien
    if (!window.MusicControls) return;

    const song = playlist[currentSongIndex];

    MusicControls.create({
        track       : song.title,        // Titre du morceau
        artist      : song.artist,       // Artiste
        cover       : song.cover,        // Image (URL)
        isPlaying   : isPlaying,        // État (lecture/pause)
        dismissable : true,              // Notification supprimable

        // Contrôles disponibles
        hasPrev   : true,      
        hasNext   : true,      
        hasClose  : true,       

        // Icônes
        playIcon  : 'media_play',
        pauseIcon : 'media_pause',
        prevIcon  : 'media_previous',
        nextIcon  : 'media_next',
        closeIcon : 'media_close',
        notificationIcon: 'notification'
    }, onSuccess, onError);

    // Écoute les actions depuis la notification
    function events(action) {
        const message = JSON.parse(action).message;
        switch(message) {
            case 'music-controls-next':
                playNext();
                break;
            case 'music-controls-previous':
                playPrev();
                break;
            case 'music-controls-pause':
                pauseSong();
                break;
            case 'music-controls-play':
                playSong();
                break;
            case 'music-controls-destroy':
                pauseSong();
                break;
            default:
                break;
        }
    }

    MusicControls.subscribe(events);
    MusicControls.listen(); 

    function onSuccess() { console.log('Notification créée avec succès'); }
    function onError(e) { console.log('Erreur création notification', e); }
}

// --- LANCEMENT DE L'APPLICATION ---
app.initialize();
