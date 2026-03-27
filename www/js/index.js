import { Filesystem, Directory } from '@capacitor/filesystem';

const app = {
    playlist: [],
    currentSongIndex: 0,
    audio: new Audio(),
    isPlaying: false,

    init: async function() {
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 10000);
        
        // Lancement du scan automatique
        await this.scanLocalMusic();
    },

    // SCAN DES DOSSIERS AVEC CAPACITOR
    scanLocalMusic: async function() {
        const statusEl = document.getElementById('loader-status');
        statusEl.innerText = "Recherche de sons...";

        try {
            // On scanne le dossier "Music" du stockage externe
            const result = await Filesystem.readdir({
                path: '',
                directory: Directory.ExternalStorage
            });

            // On filtre les MP3 (Capacitor renvoie des objets)
            this.playlist = result.files
                .filter(file => file.name.toLowerCase().endsWith('.mp3'))
                .map(file => ({
                    name: file.name.replace('.mp3', ''),
                    uri: file.uri // Capacitor donne directement l'URL native
                }));

            if (this.playlist.length > 0) {
                statusEl.innerText = this.playlist.length + " titres trouvés";
                this.loadSong(0);
            } else {
                statusEl.innerText = "Dossier Music vide";
            }
        } catch (e) {
            console.error("Erreur de scan", e);
            statusEl.innerText = "Erreur d'accès au stockage";
        }
    },

    loadSong: function(index) {
        this.currentSongIndex = index;
        const song = this.playlist[index];
        
        // Convertir l'URI Capacitor en URL lisible par la balise Audio
        this.audio.src = Capacitor.convertFileSrc(song.uri);
        
        document.getElementById('song-title').innerText = song.name;
        this.audio.load();
    },

    playPause: function() {
        if (this.audio.paused) {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updateUI();
            });
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
        }
    },

    setupEventListeners: function() {
        document.getElementById('btn-play-pause').addEventListener('click', () => this.playPause());

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
        document.getElementById('play-icon').style.display = this.isPlaying ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = this.isPlaying ? 'block' : 'none';
        document.getElementById('album-disk').style.animation = this.isPlaying ? "rotate-disk 20s linear infinite" : "none";
    },

    updateClock: function() {
        const now = new Date();
        document.getElementById('status-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    formatTime: function(s) {
        if (isNaN(s)) return "0:00";
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return min + ":" + (sec < 10 ? '0' + sec : sec);
    }
};

// On attend que Capacitor soit prêt
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
