// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJSpiM9JezegPH0LkXInfgbyPWyzs6Epk",
    authDomain: "hideandhunt.firebaseapp.com",
    databaseURL: "https://hideandhunt-default-rtdb.firebaseio.com/", 
    projectId: "hideandhunt",
    storageBucket: "hideandhunt.firebasestorage.app",
    messagingSenderId: "613687870413",
    appId: "1:613687870413:web:4053277053fbbd4f05ba84"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
export const db = firebase.database();

export class Network {
    constructor() {
        this.serverTimeOffset = 0;
        this.setupConnectionMonitoring();
    }

    setupConnectionMonitoring() {
        db.ref('.info/serverTimeOffset').on('value', snap => {
            this.serverTimeOffset = snap.val() || 0;
        });

        db.ref('.info/connected').on('value', snap => {
            const statText = document.getElementById('lobby-status-text');
            if (statText) {
                if (snap.val() === true) {
                    statText.innerText = "Connected! Waiting for players...";
                    statText.style.color = "#2ecc71";
                } else {
                    statText.innerText = "Connecting to Server...";
                    statText.style.color = "#e74c3c";
                }
            }
        });
    }

    getSyncTime() {
        return Date.now() + this.serverTimeOffset;
    }

    async joinRoom(roomId, playerInfo) {
        const roomRef = db.ref('rooms/' + roomId);
        await roomRef.child('players/' + playerInfo.id).set(playerInfo);
        return roomRef;
    }

    updatePlayerStatus(roomRef, playerId, status) {
        roomRef.child('players/' + playerId).update(status);
    }
}
