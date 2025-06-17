document.addEventListener('DOMContentLoaded', () => {
    const soundboard = document.getElementById('soundboard');

    const sounds = [
        // Player
        { name: 'Collect Item', file: 'collect_item.mp3' },
        { name: 'Collect Key Item', file: 'collect_key_item.mp3' },
        { name: 'Player Hurt', file: 'player_hurt.mp3' },
        { name: 'Player Jump', file: 'player_jump.mp3' },
        { name: 'Swing Miss', file: 'sword_swing_miss.mp3' },
        { name: 'Swing Hit', file: 'sword_swing_hit.mp3' },
        { name: 'Swing Crit', file: 'sword_swing_crit.mp3' },
        { name: 'Low Health Beep', file: 'low_health_beep.mp3' },
        { name: 'Player Death', file: 'player_death.mp3' },
        { name: 'Step', file: 'step.mp3' },
        
        // UI
        { name: 'Menu Navigate', file: 'menu_navigate.mp3' },
        { name: 'Menu Select', file: 'menu_select.mp3' },
        { name: 'Menu Cancel', file: 'menu_cancel.mp3' },
        { name: 'Dialogue Blip', file: 'dialogue_blip.mp3' },
        { name: 'Dialogue Blip (Male)', file: 'dialogue_blip_male.mp3' },
        { name: 'Dialogue Blip (Female)', file: 'dialogue_blip_female.mp3' },

        // World & Interaction
        { name: 'Open Chest', file: 'open_chest.mp3' },
        { name: 'Puzzle Solved', file: 'puzzle_solved.mp3' },
        { name: 'Secret Revealed', file: 'secret_revealed.mp3' },

        // Combat
        { name: 'Enemy Hit', file: 'enemy_hit.mp3' },
        { name: 'Enemy Die', file: 'enemy_die.mp3' },
        { name: 'Bomb Explode', file: 'bomb_explode.mp3' },
    ];

    sounds.forEach(sound => {
        const btn = document.createElement('button');
        btn.classList.add('sound-btn');
        btn.innerText = sound.name;
        btn.addEventListener('click', () => {
            playSound(sound.file);
        });
        soundboard.appendChild(btn);
    });

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioCache = {};

    async function loadSound(url) {
        if (audioCache[url]) {
            return audioCache[url];
        }
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioCache[url] = audioBuffer;
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading sound: ${url}`, error);
        }
    }
    
    // Preload sounds for faster playback on first click
    sounds.forEach(sound => loadSound(sound.file));

    function playSound(url) {
        loadSound(url).then(audioBuffer => {
            if (!audioBuffer) return;
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        }).catch(error => console.error("Could not play sound", error));
    }
});