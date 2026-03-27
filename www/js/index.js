const app = {
    playlist: [],
    currentSongIndex: 0,
    audio: new Audio(),
    isPlaying: false,
    playPromise: null,

    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.updateStatus("Vérification des accès...");
        this.checkPermissions();
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 10000);
    },

    updateStatus: function(msg) {
        const el = document.getElementById('loader-status');
        if (el) el.innerText = msg;
    },

    // 1. GESTION DES PERMISSIONS (MODE FORCEUR)
    checkPermissions: function() {
        const permissions = cordova.plugins.permissions;
        const list = [
            permissions.READ_EXTERNAL_STORAGE,
            permissions.READ_MEDIA_AUDIO
        ];

        // On lance le scan immédiatement car tu as déjà autorisé dans les réglages
        this.scanMusic(); 

        // On vérifie quand même proprement en arrière-plan
        permissions.checkPermission(permissions.READ_MEDIA_AUDIO, (status) => {
            if (!status.hasPermission) {
                permissions.requestPermissions(list, (s) => {
                    if (s.hasPermission) this.scanMusic();
                });
            }
        }, null);
    },

    // 2. SCAN DES DOSSIERS MP3
    scanMusic: function() {
        this.updateStatus("Recherche de MP3...");
        const folders = ["Music/", "Download/"];
        let processed = 0;
        this.playlist = []; // On vide pour éviter les doublons

        folders.forEach(folder => {
            const path = cordova.file.externalRootDirectory + folder;
            window.resolveLocalFileSystemURL(path, (dirEntry) => {
                const reader = dirEntry.createReader();
                reader.readEntries((entries) => {
                    const mp3s = entries
                        .filter(e => e.isFile && e.name.toLowerCase().endsWith('.mp3'))
                        .map(e => ({
                            title: e.name.replace('.mp3', ''),
                            src: e.nativeURL,
                            artist: folder.replace('/', '')
                        }));
                    
                    this.playlist = this.playlist.concat(mp3s);
                    processed++;
                    if (processed === folders.length) this.finalizeScan();
                });
            }, (err) => {
                processed++;
                if (processed === folders.length) this.finalizeScan();
            });
        });
    },

    finalizeScan: function() {
        if (this.playlist.length > 0) {
            this.updateStatus(this.playlist.length + " morceaux chargés");
            this.loadSong(0);
            setTimeout(() => this.updateStatus("Prêt"), 2000);
        } else {
            this.updateStatus("Aucun MP3 trouvé");
        }
    },

    // 3. CHARGEMENT ET SÉCURITÉ LECTURE
    loadSong: function(index) {
        if (this.playlist.length === 0) return;
        
        this.audio.pause();
        this.currentSongIndex = index;
        const song = this.playlist[index];
        
        document.getElementById('song-title').innerText = song.title;
        document.getElementById('song-artist').innerText = song.artist;
        
        this.audio.src = song.src;
        this.audio.load();
    },

    playSong: function() {
        // Sécurité anti-AbortError (interruption play/pause)
        this.playPromise = this.audio.play();

        if (this.playPromise !== undefined) {
            this.playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI();
            }).catch(error => {
                console.log("Lecture différée ou annulée");
            });
        }
    },

    pauseSong: function() {
        if (this.playPromise !== undefined) {
            this.playPromise.then(() => {
                this.audio.pause();
                this.isPlaying = false;
                this.updateUI();
            });
        }
    },

    // 4. ÉVÉNEMENTS INTERFACE
    setupEventListeners: function() {
        document.getElementById('btn-play-pause').addEventListener('click', () => {
            if (this.audio.paused) this.playSong();
            else this.pauseSong();
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
            this.loadSong(this.currentSongIndex);
            this.playSong();
        });

        document.getElementById('btn-prev').addEventListener('click', () => {
            this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadSong(this.currentSongIndex);
            this.playSong();
        });

        this.audio.addEventListener('timeupdate', () => {
            const pos = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress-fill').style.width = pos + "%";
            document.getElementById('current-time').innerText = this.formatTime(this.audio.currentTime);
        });

        this.audio.addEventListener('ended', () => {
            document.getElementById('btn-next').click();
        });
    },

    updateUI: function() {
        document.getElementById('play-icon').style.display = this.isPlaying ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = this.isPlaying ? 'block' : 'none';
        document.getElementById('album-disk').style.animation = this.isPlaying ? "rotate-disk 20s linear infinite" : "none";
    },

    updateClock: function() {
        const now = new Date();
        const timeEl = document.getElementById('status-time');
        if (timeEl) timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    formatTime: function(s) {
        if (isNaN(s)) return "0:00";
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return min + ":" + (sec < 10 ? '0' + sec : sec);
    }
};

app.initialize();
