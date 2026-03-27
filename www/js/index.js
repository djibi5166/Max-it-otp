const app = {
    playlist: [],
    currentSongIndex: 0,
    audio: new Audio(),
    isPlaying: false,

    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.checkPermissions();
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 10000);
    },

    // 1. DEMANDE DE PERMISSIONS
    checkPermissions: function() {
        const permissions = cordova.plugins.permissions;
        const list = [
            permissions.READ_EXTERNAL_STORAGE,
            permissions.READ_MEDIA_AUDIO
        ];

        permissions.requestPermissions(list, (status) => {
            if (status.hasPermission) {
                this.scanMusic();
            } else {
                console.log("Permission refusée, tentative manuelle...");
                this.scanMusic(); // On tente quand même
            }
        }, () => console.error("Erreur Permission"));
    },

    // 2. SCAN DES DOSSIERS MUSIC ET DOWNLOAD
    scanMusic: function() {
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
                            src: e.nativeURL, // Chemin natif pour Android
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
            this.loadSong(0);
        } else {
            document.getElementById('song-title').innerText = "Aucun MP3 trouvé";
        }
    },

    // 3. CHARGEMENT ET LECTURE
    loadSong: function(index) {
        this.currentSongIndex = index;
        const song = this.playlist[index];
        document.getElementById('song-title').innerText = song.title;
        document.getElementById('song-artist').innerText = song.artist;
        
        this.audio.src = song.src;
        this.audio.load();

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist
            });
        }
    },

    setupEventListeners: function() {
        document.getElementById('btn-play-pause').addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updateUI();
                }).catch(e => alert("Erreur lecture: " + e));
            } else {
                this.audio.pause();
                this.isPlaying = false;
                this.updateUI();
            }
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
            this.loadSong(this.currentSongIndex);
            this.audio.play();
            this.isPlaying = true;
            this.updateUI();
        });

        this.audio.addEventListener('timeupdate', () => {
            const pos = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress-fill').style.width = pos + "%";
            document.getElementById('current-time').innerText = this.formatTime(this.audio.currentTime);
        });
    },

    updateUI: function() {
        const disk = document.getElementById('album-disk');
        document.getElementById('play-icon').style.display = this.isPlaying ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = this.isPlaying ? 'block' : 'none';
        disk.style.animation = this.isPlaying ? "rotate-disk 20s linear infinite" : "none";
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
