const app = {
    playlist: [],
    currentSongIndex: 0,
    audio: new Audio(),

    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.checkPermissions();
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 10000);
    },

    // Étape 1 : Demander la permission
    checkPermissions: function() {
        const permissions = cordova.plugins.permissions;
        // On demande l'accès au stockage (Indispensable pour Android < 13)
        permissions.requestPermission(permissions.READ_EXTERNAL_STORAGE, (status) => {
            if (status.hasPermission) {
                this.scanMusic();
            } else {
                alert("L'app a besoin de la permission pour lire vos musiques.");
            }
        }, () => alert("Erreur de permission"));
    },

    // Étape 2 : Lister les fichiers MP3
    scanMusic: function() {
        // On cherche dans le dossier /Music à la racine du téléphone
        const path = cordova.file.externalRootDirectory + "Music/";

        window.resolveLocalFileSystemURL(path, (dirEntry) => {
            const reader = dirEntry.createReader();
            reader.readEntries((entries) => {
                this.playlist = entries
                    .filter(e => e.isFile && e.name.toLowerCase().endsWith('.mp3'))
                    .map(e => ({
                        title: e.name.replace('.mp3', ''),
                        src: e.nativeURL,
                        artist: "Fichier Local"
                    }));

                if (this.playlist.length > 0) {
                    this.loadSong(0);
                } else {
                    alert("Aucun MP3 trouvé dans le dossier /Music");
                }
            });
        }, (e) => alert("Dossier /Music introuvable"));
    },

    loadSong: function(index) {
        const song = this.playlist[index];
        document.getElementById('song-title').innerText = song.title;
        document.getElementById('song-artist').innerText = song.artist;
        this.audio.src = song.src;
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({ title: song.title, artist: song.artist });
        }
    },

    setupEventListeners: function() {
        document.getElementById('btn-play-pause').addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play();
                this.updateUI(true);
            } else {
                this.audio.pause();
                this.updateUI(false);
            }
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
            this.loadSong(this.currentSongIndex);
            this.audio.play();
            this.updateUI(true);
        });

        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress-fill').style.width = progress + "%";
        });
    },

    updateUI: function(playing) {
        document.getElementById('play-icon').style.display = playing ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = playing ? 'block' : 'none';
        document.getElementById('album-disk').style.animation = playing ? "rotate-disk 20s linear infinite" : "none";
    },

    updateClock: function() {
        const now = new Date();
        document.getElementById('status-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

app.initialize();
