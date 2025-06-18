document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const soundboard = document.getElementById('soundboard');
    const imageboard = document.getElementById('imageboard');
    const exportBtn = document.getElementById('export-btn');
    const jsonOutput = document.getElementById('json-output');
    const paletteContainer = document.getElementById('palette-container');

    // --- Theme & Palette ---
    const colorPalette = [
        { name: "Hero Green", color: "#3a9d55" },
        { name: "Hero Brown", color: "#754c24" },
        { name: "Lush Grass", color: "#76c469" },
        { name: "Dirt Path", color: "#c28b5e" },
        { name: "Enemy Red", color: "#d95757" },
        { name: "Enemy Blue", color: "#5b9ee5" },
        { name: "Accent Gold", color: "#e3a739" },
        { name: "Accent Red", color: "#e43f5a" },
        { name: "Outline Black", color: "#222034" },
    ];

    function renderPalette() {
        paletteContainer.innerHTML = '';
        colorPalette.forEach(swatch => {
            const swatchDiv = document.createElement('div');
            swatchDiv.className = 'color-swatch';
            swatchDiv.style.backgroundColor = swatch.color;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = swatch.name;
            
            swatchDiv.appendChild(nameSpan);
            paletteContainer.appendChild(swatchDiv);
        });
    }

    // Initial Data
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
        { name: 'Dialogue Blip (Female)', file: 'dialogue_blip_female.mp3' },

        // World & Interaction
        { name: 'Open Chest', file: 'open_chest.mp3' },
        { name: 'Puzzle Solved', file: 'puzzle_solved.mp3' },
        { name: 'Secret Revealed', file: 'secret_revealed.mp3' },

        // Combat
        { name: 'Enemy Hit', file: 'enemy_hit.mp3' },
        { name: 'Bomb Explode', file: 'bomb_explode.mp3' },
    ];
    
    const initialImages = [
        { name: 'Hero (T-Pose)', file: 'hero_tpose.png' },
        { name: 'Hero (Walk)', file: 'hero_walk.png' },
        { name: 'Hero (Run)', file: 'hero_run.png' },
        { name: 'Hero (Jump)', file: 'hero_jump.png' },
        { name: 'Hero (Attack)', file: 'hero_attack.png' },
        { name: 'Goomba Enemy', file: 'enemy_goomba.png' },
        { name: 'Slime Enemy', file: 'enemy_slime.png' },
        { name: 'Tree Prop', file: 'prop_tree.png' },
        { name: 'Treasure Chest', file: 'prop_chest.png' },
        { name: 'Grass Tile', file: 'tile_grass.png' },
        { name: 'Dirt Path Tile', file: 'tile_dirt.png' },
        { name: 'Heart Icon', file: 'icon_heart.png' },
        { name: 'Coin Icon', file: 'icon_coin.png' },
        { name: 'Sword Icon', file: 'icon_sword.png' },
    ];

    // Load states from localStorage
    const savedSoundLocks = JSON.parse(localStorage.getItem('soundLockStates')) || {};
    const savedImageLocks = JSON.parse(localStorage.getItem('imageLockStates')) || {};

    // Create mutable state objects
    let soundState = initialSounds.map(sound => ({
        ...sound,
        locked: savedSoundLocks[sound.file] || false,
        deleted: false,
        new_description: null,
    }));
    
    let imageState = initialImages.map(image => ({
        ...image,
        locked: savedImageLocks[image.file] || false,
        deleted: false,
        new_description: null,
    }));

    // --- Audio Handling ---
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioCache = {};

    async function loadSound(url) {
        if (audioCache[url]) return audioCache[url];
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

    // --- Render Functions ---
    function renderSoundboard() {
        soundboard.innerHTML = '';
        soundState.forEach((sound, index) => {
            const card = document.createElement('div');
            card.className = 'sound-card';
            if (sound.deleted) card.classList.add('deleted');
            if (sound.locked) card.classList.add('locked');
            if (sound.new_description) card.classList.add('pending-generation');

            const nameSpan = createEditableNameSpan(sound, index, soundState, renderSoundboard);
            nameSpan.classList.add('sound-name');
            nameSpan.addEventListener('click', () => playSound(sound.file));

            const buttonContainer = createButtonContainer(sound, index, soundState, 'soundLockStates', renderSoundboard);
            
            card.appendChild(nameSpan);
            card.appendChild(buttonContainer);
            soundboard.appendChild(card);
        });
    }

    function renderImageboard() {
        imageboard.innerHTML = '';
        imageState.forEach((image, index) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            if (image.deleted) card.classList.add('deleted');
            if (image.locked) card.classList.add('locked');
            if (image.new_description) card.classList.add('pending-generation');

            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            const img = document.createElement('img');
            img.src = image.file;
            img.alt = image.name;
            img.className = 'image-preview';
            previewContainer.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'image-info';

            const nameSpan = createEditableNameSpan(image, index, imageState, renderImageboard);
            nameSpan.classList.add('image-name');
            
            const buttonContainer = createButtonContainer(image, index, imageState, 'imageLockStates', renderImageboard);
            
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(buttonContainer);
            card.appendChild(previewContainer);
            card.appendChild(infoDiv);
            imageboard.appendChild(card);
        });
    }

    // --- Helper Functions for UI Elements ---
    function createEditableNameSpan(item, index, state, renderFn) {
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;
        nameSpan.addEventListener('dblclick', (e) => {
            if (item.locked) return;
            e.currentTarget.setAttribute('contenteditable', 'true');
            e.currentTarget.focus();
        });
        nameSpan.addEventListener('blur', (e) => {
            e.currentTarget.setAttribute('contenteditable', 'false');
            const newName = e.currentTarget.textContent.trim();
            if (newName && newName !== item.name) {
                state[index].name = newName;
                renderFn();
            } else {
                e.currentTarget.textContent = item.name;
            }
        });
        nameSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
            }
        });
        return nameSpan;
    }

    function createButtonContainer(item, index, state, storageKey, renderFn) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const lockBtn = document.createElement('button');
        lockBtn.className = 'lock-btn';
        lockBtn.innerHTML = item.locked ? '&#128274;' : '&#128275;';
        lockBtn.title = item.locked ? 'Unlock' : 'Lock';
        lockBtn.addEventListener('click', () => {
            item.locked = !item.locked;
            const currentLocks = JSON.parse(localStorage.getItem(storageKey)) || {};
            currentLocks[item.file] = item.locked;
            localStorage.setItem(storageKey, JSON.stringify(currentLocks));
            renderFn();
        });

        const generateBtn = document.createElement('button');
        generateBtn.className = 'generate-btn';
        generateBtn.textContent = 'Gen';
        generateBtn.title = 'Generate new version';
        generateBtn.disabled = item.locked;
        generateBtn.addEventListener('click', () => {
            const newDescription = prompt(`Enter a new description for "${item.name}":`);
            if (newDescription && newDescription.trim() !== '') {
                state[index].new_description = newDescription.trim();
                state[index].deleted = false;
                renderFn();
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Mark for deletion';
        deleteBtn.disabled = item.locked;
        deleteBtn.addEventListener('click', () => {
            state[index].deleted = !state[index].deleted;
            if (state[index].deleted) {
                state[index].new_description = null;
            }
            renderFn();
        });

        buttonContainer.appendChild(lockBtn);
        buttonContainer.appendChild(generateBtn);
        buttonContainer.appendChild(deleteBtn);
        return buttonContainer;
    }
    
    // --- Export Logic ---
    function generateChangesJson() {
        const changes = {
            sounds: [],
            images: []
        };
        
        // Process sound changes
        soundState.forEach((currentState, index) => {
            const initialState = initialSounds[index];
            const change = { file: currentState.file };
            let hasChanged = false;

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
                changes.sounds.push(change);
            }
        });

        // Process image changes
        imageState.forEach((currentState, index) => {
            const initialState = initialImages[index];
            const change = { file: currentState.file };
            let hasChanged = false;

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
                changes.images.push(change);
            }
        });

        jsonOutput.value = JSON.stringify(changes, null, 2);
        jsonOutput.style.height = 'auto';
        jsonOutput.style.height = (jsonOutput.scrollHeight) + 'px';
    }
    
    // --- Initial Render ---
    renderPalette();
    renderSoundboard();
    renderImageboard();
    exportBtn.addEventListener('click', generateChangesJson);
});