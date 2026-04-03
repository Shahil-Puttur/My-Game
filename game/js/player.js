export class Player {
    constructor(x, y, isLocal, role, images, TILE_SIZE, MAP_PIXEL_SIZE) {
        this.x = x; this.y = y; this.targetX = x; this.targetY = y;
        this.width = 100; this.height = 100; this.speed = 420; this.hitboxW = 30; this.hitboxH = 25; 
        this.hp = 100; this.isDead = false; this.role = role || "";
        this.frameX = 0; this.frameY = 0; this.gameFrame = 0; this.staggerFrames = 5; 
        this.facingRight = true; this.isMoving = false; 
        this.aimDir = { x: 1, y: 0 }; this.isAiming = false; this.isLocal = isLocal;
        this.images = images;
        this.TILE_SIZE = TILE_SIZE;
        this.MAP_PIXEL_SIZE = MAP_PIXEL_SIZE;
    }

    update(dt, input, keys, gameState, myRole, foxFrozenUntil, worldObjects, decorativeSolids) {
        if(this.isDead) return;
        if (this.isLocal) {
            if (myRole === 'Fox' && Date.now() < foxFrozenUntil) {
                this.isMoving = false; this.frameX = 0; this.gameFrame = 0; return;
            }
            
            let dx = 0; let dy = 0;
            if (input.x !== 0 || input.y !== 0) { dx = input.x; dy = input.y; } 
            else {
                if (keys['KeyW'] || keys['ArrowUp']) dy -= 1; if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
                if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1; if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
            }
            
            if(gameState !== 'hiding' && gameState !== 'playing') { dx = 0; dy = 0; }
            if(gameState === 'hiding' && this.role === 'Panda') { dx = 0; dy = 0; }

            this.isMoving = (dx !== 0 || dy !== 0);
            if (this.isMoving) { 
                let len = Math.sqrt(dx * dx + dy * dy); dx /= len; dy /= len; 
                this.aimDir.x = dx; this.aimDir.y = dy;
                let angle = Math.atan2(dy, dx) * (180 / Math.PI);
                if (angle > -45 && angle <= 45) { this.frameY = 2; this.facingRight = true; } 
                else if (angle > 45 && angle <= 135) { this.frameY = 0; } 
                else if (angle > 135 || angle <= -135) { this.frameY = 2; this.facingRight = false; } 
                else if (angle > -135 && angle <= -45) { this.frameY = 1; }
            }

            let moveSpeed = this.isAiming ? this.speed * 0.4 : this.speed; 
            let prevX = this.x; this.x += dx * moveSpeed * dt; if (this.checkCollision(worldObjects, decorativeSolids)) this.x = prevX; 
            let prevY = this.y; this.y += dy * moveSpeed * dt; if (this.checkCollision(worldObjects, decorativeSolids)) this.y = prevY; 
        } else {
            let dx = this.targetX - this.x; let dy = this.targetY - this.y;
            this.isMoving = (Math.abs(dx) > 2 || Math.abs(dy) > 2);
            
            if (Math.abs(dx) > this.TILE_SIZE * 3 || Math.abs(dy) > this.TILE_SIZE * 3) { this.x = this.targetX; this.y = this.targetY; } 
            else { this.x += dx * 10 * dt; this.y += dy * 10 * dt; }
            
            if (this.isMoving && !this.isAiming) {
                let angle = Math.atan2(dy, dx) * (180 / Math.PI);
                if (angle > -45 && angle <= 45) { this.frameY = 2; this.facingRight = true; } 
                else if (angle > 45 && angle <= 135) { this.frameY = 0; } 
                else if (angle > 135 || angle <= -135) { this.frameY = 2; this.facingRight = false; } 
                else if (angle > -135 && angle <= -45) { this.frameY = 1; }
            }
        }

        if (this.isMoving && !this.isAiming) { 
            this.gameFrame += dt * 60; 
            if (Math.floor(this.gameFrame) % this.staggerFrames === 0) this.frameX = (Math.floor(this.gameFrame / this.staggerFrames)) % 4; 
        } else if(this.isAiming) { this.frameX = 0; }
        else { this.frameX = 0; this.gameFrame = 0; }
    }

    checkCollision(worldObjects, decorativeSolids) {
        let pBox = { left: this.x - this.hitboxW/2, right: this.x + this.hitboxW/2, top: this.y + 10, bottom: this.y + 10 + this.hitboxH };
        if(pBox.left < 0 || pBox.right > this.MAP_PIXEL_SIZE || pBox.top < 0 || pBox.bottom > this.MAP_PIXEL_SIZE) return true;
        for (let i = 0; i < worldObjects.length; i++) {
            let obj = worldObjects[i];
            if (obj.hiddenUntil && Date.now() < obj.hiddenUntil) continue;
            if ((obj.isSolid || decorativeSolids.includes(obj.type)) && 
                pBox.right > obj.x && pBox.left < obj.x + obj.size && 
                pBox.bottom > obj.y + (obj.size*0.5) && pBox.top < obj.y + obj.size) return true;
        }
        return false;
    }

    draw(ctx) {
        if(this.isDead || !this.role) return;
        ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(this.x, this.y + 40, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
        let img = this.images[this.role === 'Fox' ? 'fox' : 'panda'];
        
        if (img && img.complete && img.naturalWidth > 0) {
            let spriteW = img.width / 4; let spriteH = img.height / 3;
            ctx.save(); ctx.translate(this.x, this.y);
            if (!this.facingRight && this.frameY === 2) ctx.scale(-1, 1); 
            if (this.isMoving && !this.isAiming) ctx.translate(0, Math.sin(this.gameFrame*0.5)*2);
            ctx.drawImage(img, this.frameX * spriteW, this.frameY * spriteH, spriteW, spriteH, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.save(); ctx.translate(this.x, this.y);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.fillStyle = this.role === 'Fox' ? '#e67e22' : '#ecf0f1';
            ctx.beginPath(); ctx.arc(0, -10, this.width * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }
}
