document.addEventListener('DOMContentLoaded', () => {
    const soundboard = document.getElementById('soundboard');
    const exportBtn = document.getElementById('export-btn');
    const jsonOutput = document.getElementById('json-output');

    const initialSounds = [
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

    // Create a mutable state object with additional properties
    let soundState = initialSounds.map(sound => ({
        ...sound,
        locked: false,
        deleted: false,
        new_description: null,
    }));

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
    initialSounds.forEach(sound => loadSound(sound.file));

    function playSound(url) {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        loadSound(url).then(audioBuffer => {
            if (!audioBuffer) return;
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        }).catch(error => console.error("Could not play sound", error));
    }

    function renderSoundboard() {
        soundboard.innerHTML = '';
        soundState.forEach((sound, index) => {
            const card = document.createElement('div');
            card.classList.add('sound-card');
            card.dataset.index = index;
            if (sound.deleted) card.classList.add('deleted');
            if (sound.locked) card.classList.add('locked');
            if (sound.new_description) card.classList.add('pending-generation');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('sound-name');
            nameSpan.textContent = sound.name;
            nameSpan.addEventListener('click', () => playSound(sound.file));
            nameSpan.addEventListener('dblclick', (e) => {
                if (sound.locked) return;
                e.currentTarget.setAttribute('contenteditable', 'true');
                e.currentTarget.focus();
            });
            nameSpan.addEventListener('blur', (e) => {
                e.currentTarget.setAttribute('contenteditable', 'false');
                const newName = e.currentTarget.textContent.trim();
                if (newName && newName !== sound.name) {
                    soundState[index].name = newName;
                    renderSoundboard(); // Re-render to ensure consistency
                } else {
                    e.currentTarget.textContent = sound.name; // Revert if empty or unchanged
                }
            });
            nameSpan.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                }
            });

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const lockBtn = document.createElement('button');
            lockBtn.classList.add('lock-btn');
            lockBtn.innerHTML = sound.locked ? '&#128274;' : '&#128275;'; // Lock/Unlock emoji
            lockBtn.title = sound.locked ? 'Unlock' : 'Lock';
            lockBtn.addEventListener('click', () => {
                soundState[index].locked = !soundState[index].locked;
                renderSoundboard();
            });
            
            const generateBtn = document.createElement('button');
            generateBtn.classList.add('generate-btn');
            generateBtn.textContent = 'Gen';
            generateBtn.title = 'Generate new version';
            generateBtn.disabled = sound.locked;
            generateBtn.addEventListener('click', () => {
                const newDescription = prompt('Enter a new description for this sound:');
                if (newDescription && newDescription.trim() !== '') {
                    soundState[index].new_description = newDescription.trim();
                    soundState[index].deleted = false; // Override deletion
                    renderSoundboard();
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Mark for deletion';
            deleteBtn.disabled = sound.locked;
            deleteBtn.addEventListener('click', () => {
                soundState[index].deleted = !soundState[index].deleted;
                if(soundState[index].deleted) {
                    soundState[index].new_description = null; // Deletion overrides generation
                }
                renderSoundboard();
            });

            card.appendChild(nameSpan);
            buttonContainer.appendChild(lockBtn);
            buttonContainer.appendChild(generateBtn);
            buttonContainer.appendChild(deleteBtn);
            card.appendChild(buttonContainer);
            soundboard.appendChild(card);
        });
    }

    function generateChangesJson() {
        const changes = [];
        soundState.forEach((currentState, index) => {
            const initialState = initialSounds[index];
            const change = { file: currentState.file };
            let hasChanged = false;

            // Precedence: Generate > Delete > Rename
            if (currentState.new_description) {
                change.action = 'generate';
                change.description = currentState.new_description;
                hasChanged = true;
            } else if (currentState.deleted) {
                change.action = 'delete';
                hasChanged = true;
            }

            if (currentState.name !== initialState.name) {
                change.name = currentState.name;
                hasChanged = true;
            }

            if (hasChanged) {
                changes.push(change);
            }
        });

        jsonOutput.value = JSON.stringify(changes, null, 2);
        jsonOutput.style.height = 'auto';
        jsonOutput.style.height = (jsonOutput.scrollHeight) + 'px';
    }
    
    renderSoundboard();
    exportBtn.addEventListener('click', generateChangesJson);
});