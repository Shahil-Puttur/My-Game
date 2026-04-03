import { db } from './network.js';

export class Profile {
    constructor(userId) {
        this.userId = userId;
        this.profileRef = db.ref('users/' + userId);
    }

    async getProfile() {
        const snap = await this.profileRef.once('value');
        if (snap.exists()) {
            return snap.val();
        }
        return this.createProfile();
    }

    async createProfile() {
        const newProfile = {
            username: "Player_" + Math.random().toString(36).substr(2, 4),
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            winPercentage: 0,
            level: 1,
            coins: 100
        };
        await this.profileRef.set(newProfile);
        return newProfile;
    }

    async updateStats(won) {
        const profile = await this.getProfile();
        profile.matchesPlayed++;
        if (won) {
            profile.wins++;
            profile.coins += 50;
        } else {
            profile.losses++;
            profile.coins += 10;
        }
        profile.winPercentage = Math.floor((profile.wins / profile.matchesPlayed) * 100);
        profile.level = Math.floor(profile.matchesPlayed / 10) + 1;
        await this.profileRef.update(profile);
        return profile;
    }
}
