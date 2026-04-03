import { Player } from './player.js';

export class Bot extends Player {
    constructor(x, y, role, images, TILE_SIZE, MAP_PIXEL_SIZE) {
        super(x, y, false, role, images, TILE_SIZE, MAP_PIXEL_SIZE);
        this.moveTimer = 0;
        this.moveDir = { x: 0, y: 0 };
        this.targetPlayer = null;
        this.detectRange = 300;
        this.state = 'idle'; // idle, moving, hunting
    }

    update(dt, players, worldObjects, decorativeSolids) {
        if (this.isDead) return;

        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.state = Math.random() > 0.3 ? 'moving' : 'idle';
            if (this.state === 'moving') {
                const angle = Math.random() * Math.PI * 2;
                this.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
            } else {
                this.moveDir = { x: 0, y: 0 };
            }
            this.moveTimer = Math.random() * 2 + 1;
        }

        // Simple player detection
        this.targetPlayer = null;
        players.forEach(p => {
            if (p.isLocal && !p.isDead) {
                const dist = Math.sqrt(Math.pow(this.x - p.x, 2) + Math.pow(this.y - p.y, 2));
                if (dist < this.detectRange) {
                    this.targetPlayer = p;
                    this.state = 'hunting';
                }
            }
        });

        if (this.state === 'hunting' && this.targetPlayer) {
            const dx = this.targetPlayer.x - this.x;
            const dy = this.targetPlayer.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.moveDir = { x: dx / dist, y: dy / dist };
        }

        this.isMoving = (this.moveDir.x !== 0 || this.moveDir.y !== 0);
        
        if (this.isMoving) {
            const angle = Math.atan2(this.moveDir.y, this.moveDir.x) * (180 / Math.PI);
            if (angle > -45 && angle <= 45) { this.frameY = 2; this.facingRight = true; } 
            else if (angle > 45 && angle <= 135) { this.frameY = 0; } 
            else if (angle > 135 || angle <= -135) { this.frameY = 2; this.facingRight = false; } 
            else if (angle > -135 && angle <= -45) { this.frameY = 1; }
        }

        const prevX = this.x; this.x += this.moveDir.x * this.speed * 0.5 * dt; 
        if (this.checkCollision(worldObjects, decorativeSolids)) this.x = prevX; 
        
        const prevY = this.y; this.y += this.moveDir.y * this.speed * 0.5 * dt; 
        if (this.checkCollision(worldObjects, decorativeSolids)) this.y = prevY;

        if (this.isMoving) { 
            this.gameFrame += dt * 60; 
            if (Math.floor(this.gameFrame) % this.staggerFrames === 0) this.frameX = (Math.floor(this.gameFrame / this.staggerFrames)) % 4; 
        } else {
            this.frameX = 0; this.gameFrame = 0;
        }
    }
}
