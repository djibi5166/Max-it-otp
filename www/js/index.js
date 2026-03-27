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

    checkPermissions: function() {
        const permissions = cordova.plugins.permissions;
        const list = [permissions.READ_EXTERNAL_STORAGE, permissions.READ_MEDIA_AUDIO];

        permissions.requestPermissions(list, (status) => {
            if (status.hasPermission) {
                this.scanMusic();
            } else {
                this.updateStatus("Permission manquante");
                alert("Activez l'accès Musique dans les réglages.");
            }
        }, () => this.updateStatus("Erreur Permission"));
    },

    scanMusic: function() {
        this.updateStatus("Scan des dossiers...");
        const folders = ["Music/", "Download/"];
        let processed = 0;

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
            }, () => {
                processed++;
                if (processed === folders.length) this.finalizeScan();
            });
        });
    },

    finalizeScan: function() {
        if (this.playlist.length > 0) {
            this.updateStatus(this.playlist.length + " morceaux trouvés");
            this.loadSong(0);
            setTimeout(() => this.updateStatus("Prêt"), 2000);
        } else {
            this.updateStatus("Aucune musique");
        }
    },

    loadSong: function(index) {
        if (this.playlist.length === 0) return;
        
        // Arrêt sécurisé avant chargement
        this.audio.pause();
        this.audio.src = this.playlist[index].src;
        this.audio.load();

        document.getElementById('song-title').innerText = this.playlist[index].title;
        document.getElementById('song-artist').innerText = this.playlist[index].artist;
    },

    playSong: function() {
        // Sécurité pour éviter l'erreur de l'image 51625.png
        this.playPromise = this.audio.play();
        if (this.playPromise !== undefined) {
            this.playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI();
            }).catch(() => {
                console.log("Lecture différée");
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

        this.audio.addEventListener('timeupdate', () => {
            const pos = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress-fill').style.width = pos + "%";
        });
    },

    updateUI: function() {
        document.getElementById('play-icon').style.display = this.isPlaying ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = this.isPlaying ? 'block' : 'none';
        document.getElementById('album-disk').style.animation = this.isPlaying ? "rotate-disk 20s linear infinite" : "none";
    },

    updateClock: function() {
        const now = new Date();
        document.getElementById('status-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

app.initialize();
