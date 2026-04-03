export class Game {
    constructor(canvas, TILE_SIZE, MAP_SIZE) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.TILE_SIZE = TILE_SIZE;
        this.MAP_SIZE = MAP_SIZE;
        this.MAP_PIXEL_SIZE = MAP_SIZE * TILE_SIZE;
        this.camera = { x: 0, y: 0, shakeTime: 0, shakeIntensity: 0 };
        this.explosions = [];
        this.worldObjects = [];
        this.gameState = 'menu';
        this.images = {};
        
        this.solidCover = ['tree', 'wall', 'fence', 'pillar', 'well', 'statue', 'vending', 'tent', 'sign', 'cart', 'stall'];
        this.destructibles = ['safe', 'barrel', 'crate', 'sack', 'log'];
        this.hidingSpots = ['bush', 'grass'];
        this.decorativeSolids = ['shroom', 'fire'];
        this.validHidingContainers = ['barrel', 'crate', 'sack', 'log', 'vending', 'tent', 'cart', 'stall', 'bush', 'grass', 'tree'];
        
        this.gridCanvas = document.createElement('canvas');
        this.gridCanvas.width = TILE_SIZE * 2;
        this.gridCanvas.height = TILE_SIZE * 2;
        const gctx = this.gridCanvas.getContext('2d');
        gctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        gctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gctx.fillRect(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.gridPattern = this.ctx.createPattern(this.gridCanvas, 'repeat');
    }

    setImages(images) {
        this.images = images;
    }

    updateCamera(player, width, height) {
        let targetX = player.x - width / 2;
        let targetY = player.y - height / 2;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;

        if (this.camera.shakeTime > 0) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shakeIntensity;
            this.camera.y += (Math.random() - 0.5) * this.camera.shakeIntensity;
            this.camera.shakeTime--;
        }
    }

    draw(localPlayer, remotePlayers, mapItems, freezeTraps, safeUnlocked, safeObjIndex) {
        const { ctx, canvas, camera, TILE_SIZE, MAP_PIXEL_SIZE, gridPattern, worldObjects, images } = this;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Draw Grid
        ctx.fillStyle = gridPattern;
        ctx.fillRect(0, 0, MAP_PIXEL_SIZE, MAP_PIXEL_SIZE);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, MAP_PIXEL_SIZE, MAP_PIXEL_SIZE);

        const renderQueue = [];

        // Add Players to Render Queue
        if (!localPlayer.isDead) renderQueue.push({ y: localPlayer.y, type: 'player', obj: localPlayer });
        remotePlayers.forEach(p => {
            if (!p.isDead && p.role) renderQueue.push({ y: p.y, type: 'player', obj: p });
        });

        // Add World Objects to Render Queue
        worldObjects.forEach((obj, index) => {
            if (obj.hiddenUntil && Date.now() < obj.hiddenUntil) return;
            renderQueue.push({ y: obj.y + obj.size * 0.8, type: 'world', obj: obj, index: index });
        });

        // Sort by Y for depth
        renderQueue.sort((a, b) => a.y - b.y);

        // Render everything
        renderQueue.forEach(item => {
            if (item.type === 'player') {
                item.obj.draw(ctx);
            } else {
                this.drawWorldObject(ctx, item.obj, item.index, mapItems, freezeTraps, safeUnlocked, safeObjIndex);
            }
        });

        // Draw Explosions
        this.explosions.forEach((exp, i) => {
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${exp.life * 0.5})`;
            ctx.fill();
            exp.radius += (exp.maxRadius - exp.radius) * 0.2;
            exp.life -= 0.05;
            if (exp.life <= 0) this.explosions.splice(i, 1);
        });

        ctx.restore();
    }

    drawWorldObject(ctx, obj, index, mapItems, freezeTraps, safeUnlocked, safeObjIndex) {
        const { images, TILE_SIZE } = this;
        let img = images[obj.type];
        if (!img) return;

        // Shadow
        const noShadowObjects = ['tree', 'stall', 'tent', 'statue', 'pillar', 'sign'];
        if (!noShadowObjects.includes(obj.type)) {
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.beginPath();
            ctx.ellipse(obj.x + obj.size / 2, obj.y + obj.size * 0.85, obj.size * 0.4, obj.size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Object
        ctx.drawImage(img, obj.x, obj.y, obj.size, obj.size);

        // Indicators for local player if needed (e.g. if they found something)
        // This part would be expanded based on game logic
    }
}
