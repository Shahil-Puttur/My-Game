import { Game } from './game.js';
import { UI } from './ui.js';
import { Network, db } from './network.js';
import { Player } from './player.js';
import { Bot } from './bot.js';
import { Matchmaking } from './matchmaking.js';
import { Profile } from './profile.js';
import * as utils from './utils.js';

class App {
    constructor() {
        this.TILE_SIZE = 80;
        this.MAP_SIZE = 22;
        this.GAME_VERSION = '2.5';
        
        this.canvas = document.getElementById('gameCanvas');
        this.game = new Game(this.canvas, this.TILE_SIZE, this.MAP_SIZE);
        this.ui = new UI();
        this.network = new Network();
        this.matchmaking = new Matchmaking();
        this.profile = null;
        
        this.localPlayer = null;
        this.remotePlayers = [];
        this.myId = Math.random().toString(36).substr(2, 9);
        this.myName = "Player";
        this.myRole = null;
        this.isHost = false;
        this.roomRef = null;
        
        this.keys = {};
        this.input = { x: 0, y: 0 };
        this.assetsLoaded = 0;
        this.totalAssets = 22; // Approximate
        this.images = {};
        
        this.lastTime = 0;
        this.isOffline = false;
        
        this.setupEventListeners();
        this.init();
    }

    init() {
        this.ui.showScreen('screen-start');
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            utils.checkOrientation();
        });
        utils.checkOrientation();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        
        document.getElementById('btn-start-game').addEventListener('click', () => this.startLoading());
        document.getElementById('btn-login').addEventListener('click', () => this.handleAuth('login'));
        document.getElementById('btn-register').addEventListener('click', () => this.handleAuth('register'));
        
        document.getElementById('btn-play-online').addEventListener('click', () => this.handleQuickPlay());
        document.getElementById('btn-play-friends').addEventListener('click', () => this.ui.showScreen('screen-join'));
        document.getElementById('btn-play-offline').addEventListener('click', () => this.handleOfflineMode());
        
        document.getElementById('btn-submit-join').addEventListener('click', () => {
            const roomId = document.getElementById('input-room-id').value.toUpperCase();
            if (roomId) this.joinRoom(roomId);
        });
        
        document.getElementById('btn-join-back').addEventListener('click', () => this.ui.showScreen('screen-menu'));
        document.getElementById('btn-leave-room').addEventListener('click', () => this.leaveRoom());
        document.getElementById('btn-fullscreen').addEventListener('click', () => this.enterFullscreen());
    }

    enterFullscreen() {
        let elem = document.documentElement;
        if (elem.requestFullscreen) { elem.requestFullscreen().catch(()=>{}); }
        document.getElementById('btn-fullscreen').style.display = 'none';
    }

    startLoading() {
        this.ui.showScreen('screen-loading');
        this.loadAssets();
    }

    loadAssets() {
        const criticalAssets = { panda: 'assets/images/panda.png', fox: 'assets/images/fox.png', grass: 'assets/images/Tall Grass Patch.png' };
        const secondaryAssets = {
            log: 'assets/images/Hollow Log.png', bush: 'assets/images/bush.png', tree: 'assets/images/tree.png', 
            wall: 'assets/images/Brick Wall Segment.png', fence: 'assets/images/Wooden Fence.png', pillar: 'assets/images/Stone Pillar.png', 
            safe: 'assets/images/Metal Safe.png', crate: 'assets/images/Supply Crate.png'
        };
        
        const allAssets = { ...criticalAssets, ...secondaryAssets };
        this.totalAssets = Object.keys(allAssets).length;
        let loadedCount = 0;

        for (let key in allAssets) {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                this.images[key] = img;
                document.getElementById('loading-bar').style.width = (loadedCount / this.totalAssets * 100) + "%";
                if (loadedCount === this.totalAssets) {
                    this.game.setImages(this.images);
                    this.ui.showScreen('screen-auth');
                }
            };
            img.onerror = img.onload;
            img.src = allAssets[key];
        }
    }

    async handleAuth(type) {
        const username = document.getElementById('input-username').value;
        const password = document.getElementById('input-password').value;
        if (!username || !password) return;

        this.myId = username; // Simplified for now
        this.profile = new Profile(this.myId);
        const data = await this.profile.getProfile();
        
        document.getElementById('profile-name').innerText = data.username;
        document.getElementById('profile-level').innerText = data.level;
        document.getElementById('profile-coins').innerText = data.coins;
        
        this.ui.showScreen('screen-menu');
        this.updateOnlineCount();
    }

    updateOnlineCount() {
        db.ref('rooms').on('value', snap => {
            let count = 0;
            const rooms = snap.val();
            if (rooms) {
                for (let r in rooms) {
                    count += Object.keys(rooms[r].players || {}).length;
                }
            }
            document.getElementById('online-count').innerText = `Players Online: ${count + Math.floor(Math.random() * 5)}`;
        });
    }

    async handleQuickPlay() {
        const roomId = await this.matchmaking.findQuickPlay();
        this.joinRoom(roomId);
    }

    async joinRoom(roomId) {
        try {
            this.roomRef = await this.matchmaking.joinRoom(roomId, {
                id: this.myId,
                name: this.myName,
                role: Math.random() > 0.5 ? 'Fox' : 'Panda',
                ready: false,
                hp: 100,
                x: 200,
                y: 200
            });
            this.roomId = roomId;
            document.getElementById('display-room-id').innerText = roomId;
            this.ui.showScreen('screen-lobby');
            this.setupRoomListeners();
        } catch (e) {
            alert(e.message);
        }
    }

    setupRoomListeners() {
        this.roomRef.on('value', snap => {
            const room = snap.val();
            if (!room) return;
            this.updateLobbyUI(room.players);
            if (room.gameState === 'playing' && this.game.gameState !== 'playing') {
                this.startGame(room);
            }
        });
    }

    updateLobbyUI(players) {
        const list = document.getElementById('player-list');
        list.innerHTML = '';
        let count = 0;
        for (let id in players) {
            count++;
            const p = players[id];
            const div = document.createElement('div');
            div.className = 'player-row';
            div.innerHTML = `<span>${p.name} (${p.role})</span> <span>${p.ready ? '✅ READY' : '⏳ ...'}</span>`;
            list.appendChild(div);
        }
        
        // Host starts game if 4+ players are ready
        if (this.isHost && count >= 4) {
            const allReady = Object.values(players).every(p => p.ready);
            if (allReady) this.roomRef.update({ gameState: 'playing' });
        }
    }

    handleOfflineMode() {
        this.isOffline = true;
        this.myRole = 'Fox';
        this.localPlayer = new Player(100, 100, true, this.myRole, this.images, this.TILE_SIZE, this.game.MAP_PIXEL_SIZE);
        this.remotePlayers = [
            new Bot(500, 500, 'Panda', this.images, this.TILE_SIZE, this.game.MAP_PIXEL_SIZE)
        ];
        this.ui.showScreen('ui-layer');
        this.game.gameState = 'playing';
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    startGame(room) {
        this.game.gameState = 'playing';
        this.ui.showScreen('ui-layer');
        this.localPlayer = new Player(200, 200, true, 'Fox', this.images, this.TILE_SIZE, this.game.MAP_PIXEL_SIZE);
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    gameLoop(timestamp) {
        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.localPlayer) {
            this.localPlayer.update(dt, this.input, this.keys, this.game.gameState, this.myRole, 0, this.game.worldObjects, this.game.decorativeSolids);
            this.game.updateCamera(this.localPlayer, this.canvas.width, this.canvas.height);
            
            // Sync with Firebase every 100ms
            if (!this.isOffline && timestamp - (this.lastSync || 0) > 100) {
                this.lastSync = timestamp;
                this.roomRef.child('players/' + this.myId).update({
                    x: this.localPlayer.x,
                    y: this.localPlayer.y,
                    hp: this.localPlayer.hp,
                    isAiming: this.localPlayer.isAiming,
                    aimDir: this.localPlayer.aimDir
                });
            }
        }

        if (this.isOffline) {
            this.remotePlayers.forEach(bot => bot.update(dt, [this.localPlayer], this.game.worldObjects, this.game.decorativeSolids));
        }

        this.game.draw(this.localPlayer, this.remotePlayers, {}, {}, false, -1);
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    leaveRoom() {
        if (this.roomRef) {
            this.roomRef.child('players/' + this.myId).remove();
            this.roomRef.off();
        }
        this.ui.showScreen('screen-menu');
    }
}

const app = new App();
export default app;
