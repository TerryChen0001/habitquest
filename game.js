// This is the correct, final version of game.js with per-attribute leveling, new XP rules, and updated special days/inventory.
// This script manages the core game logic for HabitQuest, a D&D-style habit-tracking game.

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    // References to various HTML elements for updating the UI
    const heroShieldsInventoryEl = document.getElementById('hero-shields-inventory');

    const habitVitalitySelect = document.getElementById('habit-vitality');
    const habitAgilitySelect = document.getElementById('habit-agility');
    const habitStrengthSelect = document.getElementById('habit-strength');
    const habitWillpowerSelect = document.getElementById('habit-willpower');
    const habitIntelligenceSelect = document.getElementById('habit-intelligence');

    const bossSection = document.getElementById('boss-section');
    const bossNameEl = document.getElementById('boss-name');
    const bossHpEl = document.getElementById('boss-hp');
    const bossAvatarEl = document.getElementById('boss-avatar');

    const commitDayButton = document.getElementById('commit-day-button');
    const specialDayInfoEl = document.getElementById('special-day-info');
    const floorEl = document.getElementById('floor');
    const monthlyThemeEl = document.getElementById('monthly-theme');
    
    const boxWhiteCountEl = document.getElementById('box-white-count');
    const boxGreenCountEl = document.getElementById('box-green-count');
    const boxBlueCountEl = document.getElementById('box-blue-count');
    const doubleXpCountEl = document.getElementById('double-xp-count');
    const levelupCountEl = document.getElementById('levelup-count');
    
    const weeklyBossNameEl = document.getElementById('weekly-boss-name');
    const weeklyBossHpEl = document.getElementById('weekly-boss-hp');
    const weeklyBossWeaknessEl = document.getElementById('weekly-boss-weakness');
    const weeklyBossAvatarEl = document.getElementById('weekly-boss-avatar');

    const messageLogEl = document.getElementById('message-log'); // New: Reference to the message log
    const MAX_MESSAGES = 10; // New: Maximum number of messages to display in the log

    // New: Buttons for token usage
    const useDoubleXpTokenBtn = document.getElementById('use-double-xp-token-btn');
    const useLevelUpTokenBtn = document.getElementById('use-levelup-token-btn');

    // New: Double XP active indicator
    const doubleXpActiveIndicatorEl = document.getElementById('double-xp-active-indicator');

    // --- GAME DATA ---
    // The main object holding all current game state, saved to localStorage.
    let gameData = {};

    // --- CONSTANTS ---
    // Defines the 5 core attributes of the hero.
    const ATTRIBUTES = ["vitality", "agility", "strength", "willpower", "intelligence"];
    // Defines the main bosses, their stats, and whether they are middle/big bosses.
    const BOSSES = [
        { name: "Slime of Sloth", hp: 150, avatar: "images/slime_of_sloth.svg" },
        { name: "Goblin of Gluttony", hp: 200, avatar: "images/goblin_of_gluttony.svg" },
        { name: "Middle Boss: The Doubt Demon", hp: 200, isMiddleBoss: true, avatar: "images/griffin.svg" },
        { name: "Wraith of Laziness", hp: 300, avatar: "images/griffin.svg" },
        { name: "Big Boss: The Procrastination Dragon", hp: 500, isBigBoss: true, avatar: "images/griffin.svg" }
    ];

    // Defines monthly themes, which grant double XP for a specific attribute.
    const MONTHLY_THEMES = [
        { month: 1, theme: "Vitality", attribute: "vitality" },
        { month: 2, theme: "Agility", attribute: "agility" },
        { month: 3, theme: "Vitality", attribute: "vitality" }, // March Theme example
    ];

    // New: Detailed descriptions for each habit's win conditions
    const HABIT_DETAILS = {
        vitality: {
            name: "Vitality (Eating)",
            small: "Records",
            mid: "No night snack",
            big: "Fully comply nutritionist guidance"
        },
        agility: {
            name: "Agility (Career)",
            small: "Cold (outside) or warm (inside) message",
            mid: "CV writing, Youtube",
            big: "Interview simulation"
        },
        strength: {
            name: "Strength (Workout)",
            small: "1 min",
            mid: "5 min",
            big: "10 min"
        },
        willpower: {
            name: "Will Power (Getup)",
            small: "1 min",
            mid: "5 min",
            big: "10 min"
        },
        intelligence: {
            name: "Intelligence (Learning)",
            small: "5 min listening/reading",
            mid: "10 min listening/reading",
            big: "30 min listening/reading, write down 10 words at X account, podcast on LinkedIn and Substack"
        }
    };

    // Default starting game data for a new player.
    const defaultGameData = {
        hero: {
            attributes: {
                vitality: { level: 1, xp: 0 },
                agility: { level: 1, xp: 0 },
                strength: { level: 1, xp: 0 },
                willpower: { level: 1, xp: 0 },
                intelligence: { level: 1, xp: 0 },
            },
            inventory: {
                shields: 10, // Initial shields for new players
                doubleXp: 0,
                levelUp: 0,
                boxes: { white: 10, green: 0, blue: 0 } // Initial white boxes for new players
            }
        },
        currentFloor: 1, // Represents the current week
        currentBossIndex: 0,
        boss: { // Current main boss details
            name: BOSSES[0].name,
            hp: BOSSES[0].hp,
            avatar: BOSSES[0].avatar
        },
        weeklyBoss: { // Current weekly boss details
            name: "Weekly Griffin",
            hp: 150,
            maxHp: 150, // Max HP for resetting weekly boss
            weakness: "vitality", // Randomly assigned weakness
            isDefeated: false,
            avatar: "images/griffin.svg"
        },
        lastLogin: null, // Stores the date of the last login for daily rewards
        lastWeekNumber: 0,
        dailyXpEarned: 0, // New: Tracks XP earned today (for daily cap)
        isDoubleXpActive: false // New: State for Double XP token
    };

    // --- CORE FUNCTIONS ---

    /**
     * Displays a message in the in-game message log.
     * Limits the number of messages to MAX_MESSAGES and scrolls to the latest message.
     * @param {string} message - The message string to display.
     */
    function displayMessage(message) {
        const p = document.createElement('p');
        p.textContent = message;
        messageLogEl.appendChild(p);
        // Remove oldest message if log exceeds MAX_MESSAGES
        while (messageLogEl.children.length > MAX_MESSAGES) {
            messageLogEl.removeChild(messageLogEl.children[0]);
        }
        messageLogEl.scrollTop = messageLogEl.scrollHeight; // Scroll to bottom
    }

    /**
     * Calculates the ISO week number for a given date.
     * Used to determine the current floor/week and reset weekly bosses.
     * @param {Date} d - The date object.
     * @returns {number} The week number.
     */
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    /**
     * Calculates the XP required to reach the next level for an attribute.
     * Rule: Level N needs N * 50 XP.
     * @param {number} level - The current level of the attribute.
     * @returns {number} The XP required for the next level.
     */
    function getXpForNextLevel(level) { return level * 50; }
    
    /**
     * Gets today's date in 'YYYY-MM-DD' format.
     * @returns {string} The formatted date string.
     */
    function getTodayString() { return new Date().toISOString().slice(0, 10); }
    
    /**
     * Saves the current gameData to localStorage.
     */
    function saveData() { localStorage.setItem('habitQuestData', JSON.stringify(gameData)); }

    /**
     * Loads gameData from localStorage or initializes with defaultGameData if no save exists.
     * Handles migrations for older save files and checks for new weekly bosses.
     */
    function loadData() {
        const savedData = localStorage.getItem('habitQuestData');
        if (savedData) {
            gameData = JSON.parse(savedData);
        } else {
            gameData = JSON.parse(JSON.stringify(defaultGameData));
            displayMessage('Welcome, new hero! You begin your journey with 10 Shields and 10 Lucky Boxes!');
        }
        // Migration logic for older save files to ensure new properties exist
        if (!gameData.hero.attributes) { 
            gameData.hero.attributes = JSON.parse(JSON.stringify(defaultGameData.hero.attributes));
        }
        if (!gameData.hero.inventory.boxes) gameData.hero.inventory.boxes = { white: 10, green: 0, blue: 0 };
        if (gameData.hero.inventory.levelUp === undefined) gameData.hero.inventory.levelUp = 0;
        if (!gameData.weeklyBoss) gameData.weeklyBoss = JSON.parse(JSON.stringify(defaultGameData.weeklyBoss));
        if (gameData.dailyXpEarned === undefined) gameData.dailyXpEarned = 0; // New migration for dailyXpEarned
        if (gameData.isDoubleXpActive === undefined) gameData.isDoubleXpActive = false; // New migration for isDoubleXpActive

        const todayStr = getTodayString();
        if (gameData.lastLogin !== todayStr) { // New day, reset daily stats
            gameData.dailyXpEarned = 0;
            gameData.isDoubleXpActive = false; // Double XP effect lasts only one day
            gameData.lastLogin = todayStr; // Update last login date here as well
        }

        // Update current floor based on week number and spawn new weekly boss if week changed
        const currentWeek = getWeekNumber(new Date());
        gameData.currentFloor = currentWeek; // Floor is equivalent to week number
        if (gameData.lastWeekNumber !== currentWeek) {
            gameData.lastWeekNumber = currentWeek;
            spawnNewWeeklyBoss();
        }
    }
    
    /**
     * Resets the weekly boss HP, sets it as undefeated, and assigns a new random weakness.
     * Triggered at the start of a new week.
     */
    function spawnNewWeeklyBoss() {
        gameData.weeklyBoss.hp = gameData.weeklyBoss.maxHp;
        gameData.weeklyBoss.isDefeated = false;
        const randomWeakness = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
        gameData.weeklyBoss.weakness = randomWeakness;
        displayMessage(`A new Weekly Boss has appeared! The ${gameData.weeklyBoss.name} is weak to ${randomWeakness.toUpperCase()} this week!`);
    }

    /**
     * Updates all UI elements to reflect the current gameData state.
     * This includes hero stats, inventory, boss information, floor, and special day messages.
     */
    function updateUI() {
        const { hero, boss, weeklyBoss, currentFloor } = gameData;
        
        // New: Dynamically update habit labels and select options based on HABIT_DETAILS
        ATTRIBUTES.forEach(attr => {
            const habitLabelEl = document.querySelector(`label[for="habit-${attr}"]`);
            const habitSelectEl = document.getElementById(`habit-${attr}`);
            const details = HABIT_DETAILS[attr];

            if (habitLabelEl && details) {
                habitLabelEl.textContent = `${details.name}:`;
            }

            if (habitSelectEl && details) {
                // Assuming options are in order: None (0), Small (1.0), Mid (1.5), Big (2.0), Shield
                // We only update options 1, 2, and 3 which correspond to Small, Mid, and Big Wins.
                if (habitSelectEl.options.length > 1) habitSelectEl.options[1].textContent = `Small Win: ${details.small}`;
                if (habitSelectEl.options.length > 2) habitSelectEl.options[2].textContent = `Mid Win: ${details.mid}`;
                if (habitSelectEl.options.length > 3) habitSelectEl.options[3].textContent = `Big Win: ${details.big}`;
            }
        });

        // Update each attribute's level and XP progress
        for(const attr in hero.attributes) {
            const attrData = hero.attributes[attr];
            const xpForNext = getXpForNextLevel(attrData.level);
            document.getElementById(`stat-${attr}-level`).textContent = attrData.level;
            document.getElementById(`stat-${attr}-xp`).textContent = `${attrData.xp}/${xpForNext}`;
        }
        
        // Update inventory counts
        heroShieldsInventoryEl.textContent = hero.inventory.shields;
        boxWhiteCountEl.textContent = hero.inventory.boxes.white;
        boxGreenCountEl.textContent = hero.inventory.boxes.green;
        boxBlueCountEl.textContent = hero.inventory.boxes.blue;
        doubleXpCountEl.textContent = hero.inventory.doubleXp;
        levelupCountEl.textContent = hero.inventory.levelUp;

        // Show/hide use buttons based on token availability
        useDoubleXpTokenBtn.style.display = gameData.hero.inventory.doubleXp > 0 ? 'inline-block' : 'none';
        useLevelUpTokenBtn.style.display = gameData.hero.inventory.levelUp > 0 ? 'inline-block' : 'none';

        // Show/Hide Main Boss based on Weekly Boss status
        // If Weekly Boss is defeated, show Main Boss section; otherwise, hide it and highlight Weekly Boss.
        if (weeklyBoss.isDefeated) {
            bossSection.style.display = 'block';
            document.getElementById('weekly-boss-section').style.opacity = 0.5; // Dim weekly boss section
        } else {
            bossSection.style.display = 'none';
             document.getElementById('weekly-boss-section').style.opacity = 1; // Full opacity for active weekly boss
        }
        
        // Update Main Boss details
        bossNameEl.textContent = boss.name;
        bossHpEl.textContent = boss.hp;
        bossAvatarEl.src = boss.avatar;
        floorEl.textContent = currentFloor; // Display current floor (week)
        
        // Update Weekly Boss details
        weeklyBossNameEl.textContent = weeklyBoss.name;
        weeklyBossHpEl.textContent = weeklyBoss.isDefeated ? "DEFEATED" : weeklyBoss.hp; // Show "DEFEATED" if applicable
        weeklyBossWeaknessEl.textContent = weeklyBoss.weakness.toUpperCase();
        weeklyBossAvatarEl.src = weeklyBoss.avatar;

        // Determine and display monthly theme
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const currentMonth = today.getMonth() + 1; // Month is 0-indexed
        const theme = MONTHLY_THEMES.find(t => t.month === currentMonth);
        monthlyThemeEl.textContent = theme ? `This month's theme: ${theme.theme} (XP * 2)` : "No theme this month.";
        
        // Determine and display special day messages
        let specialMessage = "Today is a normal day.";
        if (dayOfWeek === 0) specialMessage = "It's Beginning Day! You get 5 Shields!"; // Sunday
        if (dayOfWeek === 1) specialMessage = "It's Log-in Day! Login reward is doubled!"; // Monday
        if (dayOfWeek === 3) specialMessage = "It's Critical Hit Day! A random habit may get a surprise boost!"; // Wednesday
        if (dayOfWeek === 5) specialMessage = "It's Surprising Day! You've earned a Lucky Box (White)!"; // Friday
        specialDayInfoEl.textContent = specialMessage;

        // New: Show/hide Double XP active indicator
        doubleXpActiveIndicatorEl.style.display = gameData.isDoubleXpActive ? 'block' : 'none';
    }
    
    /**
     * Advances to the next main boss in the BOSSES array.
     * Handles end-game condition and awards green boxes for defeating a boss.
     * Also awards big XP for defeating a monthly Big Boss.
     */
    function advanceToNextBoss() {
        gameData.currentBossIndex++;
        if (gameData.currentBossIndex >= BOSSES.length) {
            displayMessage("You have defeated all the main bosses!");
            gameData.currentBossIndex = BOSSES.length - 1; // Cap index to the last boss
        }
        const newBoss = BOSSES[gameData.currentBossIndex];
        gameData.boss.name = newBoss.name;
        gameData.boss.hp = newBoss.hp;
        gameData.boss.avatar = newBoss.avatar; // Ensure avatar is updated for new boss
        let boxColor = 'green', boxQuantity = 1;
        if (newBoss.isBigBoss) boxQuantity = 3; // Big Bosses give more rewards
        displayMessage(`Victory! A new foe appears: ${newBoss.name}! You earned ${boxQuantity} ${boxColor} box(es).`);
        addBoxToInventory(boxColor, boxQuantity);

        // Check if the defeated boss was a monthly Big Boss and award bonus XP
        if (newBoss.isBigBoss) {
            const currentMonth = new Date().getMonth() + 1;
            const theme = MONTHLY_THEMES.find(t => t.month === currentMonth);
            if (theme) {
                const bigBossXpBonus = 100; // Define 'big XP' amount as per rules
                addXpToAttribute(theme.attribute, bigBossXpBonus, true); // True to bypass daily XP cap for boss XP
                displayMessage(`You defeated the Monthly Big Boss and earned ${bigBossXpBonus} XP for ${theme.attribute.toUpperCase()}!`);
            }
        }
    }

    /**
     * Adds a specified quantity of a given box color to the hero's inventory.
     * @param {string} color - The color of the box ('white', 'green', 'blue').
     * @param {number} quantity - The number of boxes to add (defaults to 1).
     */
    function addBoxToInventory(color, quantity = 1) {
        gameData.hero.inventory.boxes[color] += quantity;
    }

    /**
     * Handles daily login rewards and special day bonuses.
     * Awards shields based on the day of the week and potentially a white box on Friday.
     * Ensures login rewards are only given once per day.
     */
    function handleDailyLogin() {
        const todayStr = getTodayString();
        // Check if the hero has already logged in today (this part is now redundant with loadData reset)
        // It is kept for displaying message and awarding shields only.
        if (gameData.lastLogin === todayStr) {
            // Already logged in today, just display info if needed
            // displayMessage("Welcome back! Your daily stats are set.");
            return; // Exit if already logged in for the day
        }

        // This logic is now handled in loadData to ensure consistency on page load
        // gameData.dailyXpEarned = 0;
        // gameData.isDoubleXpActive = false; 
        // gameData.lastLogin = todayStr;
        
        const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        let shieldReward = 1; // Default daily shield

        // Apply special day shield bonuses
        if (dayOfWeek === 0) { // Sunday (Beginning Day)
            shieldReward = 5;
            displayMessage("It's Beginning Day! You get 5 Shields!");
        } else if (dayOfWeek === 1) { // Monday (Log-in Day)
            shieldReward = 2; // Double login reward
            displayMessage("It's Log-in Day! You get 2 Shields!");
        } else {
            displayMessage("Daily Login Bonus! You get 1 shield!");
        }
        gameData.hero.inventory.shields += shieldReward;
        
        // Friday (Surprising Day) bonus
        if (dayOfWeek === 5) { 
            displayMessage("It's Surprising Day! You've earned a Lucky Box (White)!");
            addBoxToInventory('white', 1);
        }
        saveData();
        updateUI();
    }

    /**
     * Opens a specified color of lucky box and grants a random reward based on probabilities.
     * Rewards include shields, XP, Double XP tokens, Level-UP tokens, or Real-world Boxes.
     * @param {string} color - The color of the box to open ('white', 'green', 'blue').
     */
    function openBox(color) {
        if (gameData.hero.inventory.boxes[color] <= 0) return displayMessage(`You don't have any ${color} boxes!`);
        gameData.hero.inventory.boxes[color]--; // Consume one box
        let rewardText = '';
        
        // White Box rewards
        if (color === 'white') {
            const x = Math.random() * 100;
            if (x < 50) { gameData.hero.inventory.shields++; rewardText = "a Shield!"; } // 50%
            else if (x < 70) { addXpToRandomAttr(5); rewardText = "5 XP for a random attribute!"; } // 20%
            else if (x < 90) { addXpToRandomAttr(10); rewardText = "10 XP for a random attribute!"; } // 20%
            else if (x < 95) { gameData.hero.inventory.doubleXp++; rewardText = "a Double XP token!"; } // 5%
            else { rewardText = "a Real-world Box (White)!"; } // 5%
        } 
        // Green Box rewards
        else if (color === 'green') {
            const x = Math.random() * 100;
            if (x < 50) { gameData.hero.inventory.shields += 2; rewardText = "2 Shields!"; } // 50%
            else if (x < 80) { gameData.hero.inventory.shields += 3; rewardText = "3 Shields!"; } // 30%
            else if (x < 90) { gameData.hero.inventory.doubleXp++; rewardText = "a Double XP token!"; } // 10%
            else if (x < 95) { rewardText = "a Real-world Box (White)!"; } // 5%
            else { addBoxToInventory('blue', 1); rewardText = "a Level-UP Box (Blue)!"; } // 5%
        } 
        // Blue Box reward (always a Level-UP Token)
        else if (color === 'blue') {
            gameData.hero.inventory.levelUp++;
            rewardText = "a Level-UP Token! You can use it to level up a chosen attribute instantly.";
        }
        displayMessage(`You open a Lucky Box (${color}) and find... ${rewardText}`);
        saveData();
        updateUI();
    }
    
    /**
     * Adds a specified amount of XP to a randomly chosen attribute.
     * @param {number} amount - The amount of XP to add.
     */
    function addXpToRandomAttr(amount) {
        const randomAttr = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
        addXpToAttribute(randomAttr, amount);
    }

    /**
     * Adds XP to a specific attribute and handles level-ups if enough XP is accumulated.
     * Displays a message when an attribute levels up.
     * Implements daily XP cap of 5 XP, unless double XP is active.
     * @param {string} attribute - The name of the attribute (e.g., 'vitality').
     * @param {number} amount - The amount of XP to add.
     * @param {boolean} [bypassDailyCap=false] - If true, bypasses the daily XP cap.
     */
    function addXpToAttribute(attribute, amount, bypassDailyCap = false) {
        if (!bypassDailyCap && !gameData.isDoubleXpActive && gameData.dailyXpEarned >= 5) {
            displayMessage(`Daily XP cap reached (5 XP). No more XP can be earned today for ${attribute.toUpperCase()}.`);
            return;
        }

        const attr = gameData.hero.attributes[attribute];
        const originalAmount = amount; // Store original amount for daily cap tracking

        // Apply Double XP token effect if active
        if (gameData.isDoubleXpActive && !bypassDailyCap) {
            amount *= 2; // Double the XP if token is active
            displayMessage(`Double XP active! Gaining ${amount} XP for ${attribute.toUpperCase()}.`);
        }

        attr.xp += amount;
        
        // Track daily XP earned, but only if not bypassing cap and not from Double XP token itself
        if (!bypassDailyCap && !gameData.isDoubleXpActive) {
            gameData.dailyXpEarned += originalAmount; // Track original XP before doubling
            if (gameData.dailyXpEarned > 5) { // Cap daily XP at 5
                // This part ensures dailyXpEarned correctly reflects the cap even if an XP gain pushed it over.
                // It doesn't retroactively remove XP from attributes, just stops further gains from daily cap.
                gameData.dailyXpEarned = 5;
            }
        } else if (bypassDailyCap) { // For big boss XP, don't count towards daily cap at all
            // No action needed for dailyXpEarned as it's bypassed
        }

        let xpForNext = getXpForNextLevel(attr.level);
        while (attr.xp >= xpForNext) { // Loop in case of multiple level-ups from one XP gain
            attr.level++;
            attr.xp -= xpForNext; // Deduct XP needed for the level
            xpForNext = getXpForNextLevel(attr.level); // Recalculate XP for the next level
            displayMessage(`${attribute.toUpperCase()} has reached Level ${attr.level}!`);
        }
    }
    
    /**
     * Allows exchanging 10 shields for a random Real-world Box reward.
     * Rewards include gaming time, SPA/Movie/Message coupons.
     */
    function exchangeForRealWorldBox() {
        if (gameData.hero.inventory.shields >= 10) {
            gameData.hero.inventory.shields -= 10;
            const x = Math.random() * 100;
            let rewardText = '';
            // Real-world Box reward probabilities
            if (x < 70) rewardText = "1hr gaming time!"; // 70%
            else if (x < 80) rewardText = "2hr gaming time!"; // 10%
            else if (x < 85) rewardText = "4hr gaming time!"; // 5%
            else if (x < 90) rewardText = "a SPA coupon!"; // 5%
            else if (x < 95) rewardText = "a Movie coupon!"; // 5%
            else rewardText = "a Message coupon!"; // 5%
            displayMessage(`You exchanged 10 shields and got a Real-world reward: ${rewardText}`);
            saveData();
            updateUI();
        } else {
            displayMessage("You need at least 10 shields!");
        }
    }

    /**
     * Activates a Double XP token, applying a 2x XP multiplier for the rest of the day.
     * Consumes one Double XP token from inventory.
     */
    function handleUseDoubleXpToken() {
        if (gameData.hero.inventory.doubleXp <= 0) {
            displayMessage("You don't have any Double XP tokens!");
            return;
        }
        if (gameData.isDoubleXpActive) {
            displayMessage("Double XP is already active!");
            return;
        }
        gameData.hero.inventory.doubleXp--;
        gameData.isDoubleXpActive = true;
        displayMessage("Double XP token activated! All XP gained today will be doubled (off-limit daily cap).");
        saveData();
        updateUI();
    }

    /**
     * Activates a Level-UP token, allowing the player to instantly level up a chosen attribute.
     * Consumes one Level-UP token from inventory.
     */
    function handleUseLevelUpToken() {
        if (gameData.hero.inventory.levelUp <= 0) {
            displayMessage("You don't have any Level-UP tokens!");
            return;
        }

        const chosenAttribute = prompt("Which attribute would you like to level up? (vitality, agility, strength, willpower, intelligence)");
        if (chosenAttribute && ATTRIBUTES.includes(chosenAttribute.toLowerCase())) {
            const attr = gameData.hero.attributes[chosenAttribute.toLowerCase()];
            attr.level++;
            // Optionally, reset XP to 0 or carry over excess from previous level if desired
            attr.xp = 0; 
            gameData.hero.inventory.levelUp--;
            displayMessage(`${chosenAttribute.toUpperCase()} has been instantly leveled up to Level ${attr.level}!`);
            saveData();
            updateUI();
        } else if (chosenAttribute) {
            displayMessage("Invalid attribute. Please choose from vitality, agility, strength, willpower, intelligence.");
        } else {
            displayMessage("Level-UP token usage cancelled.");
        }
    }

    /**
     * Main function to handle the end of a day's habits.
     * Calculates damage to bosses, awards XP for completed habits, and handles special day effects.
     */
    function handleCommitDay() {
        // Define habit selections with their base weights and associated attributes.
        const habitSelections = [
            { el: habitVitalitySelect, weight: 10, name: "Vitality", attribute: "vitality" },
            { el: habitAgilitySelect, weight: 9, name: "Agility", attribute: "agility" },
            { el: habitStrengthSelect, weight: 8, name: "Strength", attribute: "strength" },
            { el: habitWillpowerSelect, weight: 7, name: "Will Power", attribute: "willpower" },
            { el: habitIntelligenceSelect, weight: 6, name: "Intelligence", attribute: "intelligence" }
        ];

        // Process shield usage for habits
        habitSelections.forEach(habit => {
            if (habit.el.value === 'shield') {
                if (gameData.hero.inventory.shields > 0) {
                    gameData.hero.inventory.shields--;
                    habit.el.dataset.value = "2.0"; // Treat shield use as a Big Win (2.0 multiplier)
                } else {
                    displayMessage(`You are out of shields! The ${habit.name} habit will not count.`);
                    habit.el.dataset.value = "0"; // No value if no shields
                }
            } else {
                habit.el.dataset.value = habit.el.value; // Store actual selected value
            }
        });
        
        // Critical Hit Day (Wednesday) effect: Random attribute gets a boost
        if (new Date().getDay() === 3) { // Wednesday
            const randomIndex = Math.floor(Math.random() * 5);
            const randomHabit = habitSelections[randomIndex];
            let currentValue = parseFloat(randomHabit.el.dataset.value);
            if (currentValue > 0) { // Only boost if there was some effort
                let newValue = currentValue + 0.5;
                if (newValue > 2.0) newValue = 2.0; // Cap at Big Win equivalent
                randomHabit.el.dataset.value = newValue.toString();
                displayMessage(`Critical Hit! Your ${randomHabit.name} effort was boosted!`);
            }
        }

        let totalDamage = 0; // Damage to Main Boss
        let weeklyBossDamage = 0; // Damage to Weekly Boss
        
        // Calculate damage for both bosses
        habitSelections.forEach(habit => {
            const value = parseFloat(habit.el.dataset.value);
            const attrLevel = gameData.hero.attributes[habit.attribute].level;
            let damage = habit.weight * value * attrLevel; // Base damage calculation

            // Weekly Boss Weakness Bonus: Triple damage if attribute matches weakness
            if (!gameData.weeklyBoss.isDefeated && habit.attribute === gameData.weeklyBoss.weakness) {
                damage *= 3;
            }
            totalDamage += damage; // Accumulate damage for Main Boss

            // Weekly Boss damage is separate and also considers weakness
            if (habit.attribute === gameData.weeklyBoss.weakness) {
                weeklyBossDamage += damage * 3; // Triple damage if weak to it
            } else {
                weeklyBossDamage += damage;
            }
        });
        
        // Apply damage to bosses
        gameData.boss.hp -= totalDamage;
        if (!gameData.weeklyBoss.isDefeated) {
            gameData.weeklyBoss.hp -= weeklyBossDamage;
        }

        // Get current monthly theme for XP bonus
        const theme = MONTHLY_THEMES.find(t => t.month === (new Date().getMonth() + 1));
        
        // Award XP for habits
        habitSelections.forEach(habit => {
            const value = parseFloat(habit.el.dataset.value);
            if(value > 0) { // Only award XP for actual effort
                let xpGained = 0;
                if (value === 1.0) xpGained = 5;      // Small Win: 5 XP
                else if (value === 1.5) xpGained = 10; // Mid Win: 10 XP
                else if (value === 2.0) xpGained = 20; // Big Win or Shield: 20 XP

                // Apply monthly theme XP bonus
                if (theme && theme.attribute === habit.attribute) {
                    xpGained *= 2;
                }
                addXpToAttribute(habit.attribute, xpGained); // Call new addXpToAttribute with daily cap
            }
        });
        
        displayMessage(`You dealt ${totalDamage.toFixed(0)} damage to the Main Boss and ${weeklyBossDamage.toFixed(0)} damage to the Weekly Boss.`);
        
        // Check for Main Boss defeat
        if (gameData.boss.hp <= 0) {
            gameData.boss.hp = 0; // Ensure HP doesn't go negative in display
            advanceToNextBoss();
        }
        
        // Check for Weekly Boss defeat
        if (gameData.weeklyBoss.hp <= 0 && !gameData.weeklyBoss.isDefeated) {
            gameData.weeklyBoss.isDefeated = true;
            displayMessage(`Congratulations! You have defeated the Weekly Boss and earned a Green Box!`);
            addBoxToInventory('green', 1);
        }
        
        // Reset habit selections after committing
        habitSelections.forEach(habit => {
            habit.el.value = "0";
        });

        saveData();
        updateUI();
    }

    /**
     * Initializes the game by loading data, handling daily login, updating UI,
     * and setting up all event listeners.
     */
    function init() {
        loadData();
        handleDailyLogin(); // Check for daily login rewards on page load
        updateUI();
        // Event listeners for buttons
        commitDayButton.addEventListener('click', handleCommitDay);
        document.querySelectorAll('.open-box-btn').forEach(btn => {
            btn.addEventListener('click', () => openBox(btn.dataset.color));
        });
        document.getElementById('exchange-real-world-box').addEventListener('click', exchangeForRealWorldBox);
        useDoubleXpTokenBtn.addEventListener('click', handleUseDoubleXpToken); // New: Double XP token listener
        useLevelUpTokenBtn.addEventListener('click', handleUseLevelUpToken);   // New: Level-UP token listener
    }
    init(); // Start the game!
});
