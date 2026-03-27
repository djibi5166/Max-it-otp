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

    // 1. GESTION DES PERMISSIONS ANDROID 13+
    checkPermissions: function() {
        const permissions = cordova.plugins.permissions;
        
        // Liste des permissions nécessaires selon la version d'Android
        const permissionsList = [
            permissions.READ_EXTERNAL_STORAGE,
            permissions.READ_MEDIA_AUDIO // Requis pour Android 13+
        ];

        permissions.requestPermissions(permissionsList, (status) => {
            if (status.hasPermission) {
                this.scanMultipleFolders();
            } else {
                alert("L'app a besoin de l'autorisation 'Musique et audio' pour fonctionner.");
            }
        }, () => alert("Erreur lors de la demande de permission"));
    },

    // 2. SCAN DES DOSSIERS MUSIC ET DOWNLOAD
    scanMultipleFolders: function() {
        const folders = ["Music/", "Download/"];
        let foldersScanned = 0;

        folders.forEach(folderName => {
            const path = cordova.file.externalRootDirectory + folderName;
            
            window.resolveLocalFileSystemURL(path, (dirEntry) => {
                const reader = dirEntry.createReader();
                reader.readEntries((entries) => {
                    const foundFiles = entries
                        .filter(e => e.isFile && e.name.toLowerCase().endsWith('.mp3'))
                        .map(e => ({
                            title: e.name.replace('.mp3', ''),
                            src: e.nativeURL,
                            artist: folderName.replace('/', '') // Affiche le dossier d'origine
                        }));

                    this.playlist = this.playlist.concat(foundFiles);
                    foldersScanned++;

                    // Une fois tous les dossiers scannés, on charge la première musique
                    if (foldersScanned === folders.length) {
                        if (this.playlist.length > 0) {
                            this.loadSong(0);
                        } else {
                            alert("Aucun MP3 trouvé dans Music ou Download.");
                        }
                    }
                });
            }, (err) => {
                foldersScanned++;
                if (foldersScanned === folders.length && this.playlist.length === 0) {
                    alert("Dossiers introuvables ou vides.");
                }
            });
        });
    },

    loadSong: function(index) {
        if (this.playlist.length === 0) return;
        const song = this.playlist[index];
        document.getElementById('song-title').innerText = song.title;
        document.getElementById('song-artist').innerText = song.artist;
        this.audio.src = song.src;
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({ 
                title: song.title, 
                artist: song.artist,
                artwork: [{ src: 'img/logo.png', sizes: '512x512', type: 'image/png' }]
            });
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

        document.getElementById('btn-prev').addEventListener('click', () => {
            this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadSong(this.currentSongIndex);
            this.audio.play();
            this.updateUI(true);
        });

        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress-fill').style.width = progress + "%";
            document.getElementById('current-time').innerText = this.formatTime(this.audio.currentTime);
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
    },

    formatTime: function(s) {
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return min + ":" + (sec < 10 ? '0' + sec : sec);
    }
};

app.initialize();
