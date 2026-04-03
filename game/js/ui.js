export class UI {
    constructor() {
        this.screens = ['screen-start', 'screen-loading', 'screen-auth', 'screen-lobby', 'screen-blocker', 'ui-layer', 'screen-paper', 'screen-keypad'];
        this.currentScreen = 'screen-start';
    }

    showScreen(screenId) {
        this.screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) screen.style.display = (id === screenId) ? 'flex' : 'none';
        });
        this.currentScreen = screenId;
    }

    updateHUD(localPlayer, remotePlayers, gameState, myRole) {
        if (!myRole) return;
        
        // Find fox and panda in players
        const fox = (myRole === 'Fox') ? localPlayer : remotePlayers.find(p => p.role === 'Fox');
        const panda = (myRole === 'Panda') ? localPlayer : remotePlayers.find(p => p.role === 'Panda');
        
        if (fox) {
            const foxColor = fox.hp > 50 ? '#2ecc71' : (fox.hp > 25 ? '#f39c12' : '#e74c3c');
            document.getElementById('hud-p1').innerHTML = `🦊 <span style="color:${foxColor}">${Math.max(0, Math.floor(fox.hp))} HP</span>`;
        }
        
        if (panda) {
            const pandaColor = panda.hp > 50 ? '#2ecc71' : (panda.hp > 25 ? '#f39c12' : '#e74c3c');
            document.getElementById('hud-p2').innerHTML = `🐼 <span style="color:${pandaColor}">${Math.max(0, Math.floor(panda.hp))} HP</span>`;
        }
        
        const topStatus = document.getElementById('top-status');
        if (topStatus) topStatus.innerText = gameState.toUpperCase();
    }

    updateTimer(serverEndTime, gameState) {
        if (!serverEndTime || gameState === 'menu' || gameState === 'finished' || gameState === 'lobby') return;
        
        const leftMs = serverEndTime - Date.now();
        const leftSecs = Math.max(0, Math.floor(leftMs / 1000));
        
        if (gameState === 'countdown') return; 

        const m = Math.floor(leftSecs / 60);
        const s = leftSecs % 60;
        const tStr = `${m}:${s < 10 ? '0' : ''}${s}`;
        
        const topTimer = document.getElementById('top-timer');
        if (topTimer) topTimer.innerText = tStr;

        const blockerTimer = document.getElementById('blocker-timer');
        if (blockerTimer) blockerTimer.innerText = tStr;
    }

    closeOverlays() {
        document.getElementById('screen-paper').style.display = 'none';
        document.getElementById('screen-keypad').style.display = 'none';
    }

    showPaper(safePassword) {
        const paperText = document.getElementById('paper-pwd-text');
        if (paperText) paperText.innerText = safePassword;
        document.getElementById('screen-paper').style.display = 'flex';
    }

    showKeypad(enteredPwd, updatePwdDisplay) {
        const pwdDisp = document.getElementById('pwd-display');
        if (pwdDisp) {
            pwdDisp.style.color = "#2c3e50";
            pwdDisp.style.borderColor = "#bdc3c7";
            pwdDisp.style.background = "#ecf0f1";
        }
        updatePwdDisplay();
        document.getElementById('screen-keypad').style.display = 'flex';
    }

    updatePwdDisplay(enteredPwd) {
        const pwdDisp = document.getElementById('pwd-display');
        if (pwdDisp) pwdDisp.innerText = enteredPwd.padEnd(4, "_").split("").join(" ");
    }
}
