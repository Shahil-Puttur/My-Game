import { db } from './network.js';

export class Matchmaking {
    constructor() {
        this.roomsRef = db.ref('rooms');
    }

    async findQuickPlay() {
        const snap = await this.roomsRef.orderByChild('gameState').equalTo('lobby').once('value');
        const rooms = snap.val();
        if (rooms) {
            const roomIds = Object.keys(rooms);
            for (let id of roomIds) {
                const room = rooms[id];
                if (Object.keys(room.players || {}).length < 6) {
                    return id;
                }
            }
        }
        return this.createRoom();
    }

    async createRoom() {
        const newRoomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const newRoom = {
            gameState: 'lobby',
            players: {},
            timer: 0,
            mapSeed: Math.floor(Math.random() * 1000000)
        };
        await this.roomsRef.child(newRoomId).set(newRoom);
        return newRoomId;
    }

    async joinRoom(roomId, playerInfo) {
        const roomRef = this.roomsRef.child(roomId);
        const snap = await roomRef.once('value');
        if (snap.exists()) {
            await roomRef.child('players/' + playerInfo.id).set(playerInfo);
            return roomRef;
        }
        throw new Error('Room not found');
    }
}
