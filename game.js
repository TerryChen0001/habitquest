// This is the correct, final version of game.js as of the latest request.

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const heroLevelEl = document.getElementById('hero-level');
    const heroXpEl = document.getElementById('hero-xp');
    const xpToNextLevelEl = document.getElementById('xp-to-next-level');
    const heroShieldsInventoryEl = document.getElementById('hero-shields-inventory');

    const statVitalityEl = document.getElementById('stat-vitality');
    const statAgilityEl = document.getElementById('stat-agility');
    const statStrengthEl = document.getElementById('stat-strength');
    const statWillpowerEl = document.getElementById('stat-willpower');
    const statIntelligenceEl = document.getElementById('stat-intelligence');

    const habitVitalitySelect = document.getElementById('habit-vitality');
    const habitAgilitySelect = document.getElementById('habit-agility');
    const habitStrengthSelect = document.getElementById('habit-strength');
    const habitWillpowerSelect = document.getElementById('habit-willpower');
    const habitIntelligenceSelect = document.getElementById('habit-intelligence');

    const bossNameEl = document.getElementById('boss-name');
    const bossHpEl = document.getElementById('boss-hp');

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

    // --- GAME DATA ---
    let gameData = {};

    // --- CONSTANTS ---
    const ATTRIBUTES = ["vitality", "agility", "strength", "willpower", "intelligence"];
    const BOSSES = [
        { name: "Slime of Sloth", hp: 150 },
        { name: "Goblin of Gluttony", hp: 200 },
        { name: "Middle Boss: The Doubt Demon", hp: 200, isMiddleBoss: true },
        { name: "Wraith of Laziness", hp: 300 },
        { name: "Big Boss: The Procrastination Dragon", hp: 500, isBigBoss: true }
    ];

    const MONTHLY_THEMES = [
        { month: 1, theme: "Vitality", attribute: "vitality" },
        { month: 2, theme: "Agility", attribute: "agility" },
        { month: 3, theme: "Strength", attribute: "strength" },
    ];

    const defaultGameData = {
        hero: {
            level: 1,
            xp: 0,
            stats: { vitality: 1, agility: 1, strength: 1, willpower: 1, intelligence: 1 },
            inventory: {
                shields: 20,
                doubleXp: 0,
                levelUp: 0,
                boxes: { white: 10, green: 0, blue: 0 }
            }
        },
        currentFloor: 1,
        currentBossIndex: 0,
        boss: {
            name: BOSSES[0].name,
            hp: BOSSES[0].hp
        },
        weeklyBoss: {
            name: "Weekly Griffin",
            hp: 150,
            maxHp: 150,
            weakness: "vitality",
            isDefeated: false
        },
        lastLogin: null,
        lastWeekNumber: 0
    };

    // --- CORE FUNCTIONS ---

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    function getXpForNextLevel(level) { return 50; }
    function getTodayString() { return new Date().toISOString().slice(0, 10); }
    function saveData() { localStorage.setItem('habitQuestData', JSON.stringify(gameData)); }

    function loadData() {
        const savedData = localStorage.getItem('habitQuestData');
        if (savedData) {
            gameData = JSON.parse(savedData);
        } else {
            gameData = JSON.parse(JSON.stringify(defaultGameData));
            alert('Welcome, new hero! You begin your journey with 20 Shields and 10 Lucky Boxes!');
        }
        if (!gameData.hero.inventory.boxes) gameData.hero.inventory.boxes = { white: 10, green: 0, blue: 0 };
        if (gameData.hero.inventory.levelUp === undefined) gameData.hero.inventory.levelUp = 0;
        if (!gameData.weeklyBoss) gameData.weeklyBoss = JSON.parse(JSON.stringify(defaultGameData.weeklyBoss));

        const currentWeek = getWeekNumber(new Date());
        gameData.currentFloor = currentWeek;
        if (gameData.lastWeekNumber !== currentWeek) {
            gameData.lastWeekNumber = currentWeek;
            spawnNewWeeklyBoss();
        }
    }
    
    function spawnNewWeeklyBoss() {
        gameData.weeklyBoss.hp = gameData.weeklyBoss.maxHp;
        gameData.weeklyBoss.isDefeated = false;
        const randomWeakness = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
        gameData.weeklyBoss.weakness = randomWeakness;
        alert(`A new Weekly Boss has appeared! The ${gameData.weeklyBoss.name} is weak to ${randomWeakness.toUpperCase()} this week!`);
    }

    function updateUI() {
        const { hero, boss, weeklyBoss, currentFloor } = gameData;
        heroLevelEl.textContent = hero.level;
        heroXpEl.textContent = hero.xp;
        xpToNextLevelEl.textContent = getXpForNextLevel(hero.level);
        heroShieldsInventoryEl.textContent = hero.inventory.shields;

        for(const stat in hero.stats) {
            document.getElementById(`stat-${stat}`).textContent = hero.stats[stat];
        }

        bossNameEl.textContent = boss.name;
        bossHpEl.textContent = boss.hp;
        floorEl.textContent = currentFloor;
        
        weeklyBossNameEl.textContent = weeklyBoss.name;
        weeklyBossHpEl.textContent = weeklyBoss.isDefeated ? "DEFEATED" : weeklyBoss.hp;
        weeklyBossWeaknessEl.textContent = weeklyBoss.weakness.toUpperCase();

        const today = new Date();
        const dayOfWeek = today.getDay();
        const currentMonth = today.getMonth() + 1;
        const theme = MONTHLY_THEMES.find(t => t.month === currentMonth);
        monthlyThemeEl.textContent = theme ? `This month's theme: ${theme.theme} (XP * 2)` : "No theme this month.";
        
        let specialMessage = "Today is a normal day.";
        if (dayOfWeek === 0) specialMessage = "It's Beginning Day! You get 5 Shields!";
        if (dayOfWeek === 1) specialMessage = "It's Log-in Day! Login reward is doubled!";
        if (dayOfWeek === 3) specialMessage = "It's Critical Hit Day! A random habit may get a surprise boost!";
        if (dayOfWeek === 5) specialMessage = "It's Surprising Day! You've earned a Lucky Box (White)!";
        specialDayInfoEl.textContent = specialMessage;

        boxWhiteCountEl.textContent = hero.inventory.boxes.white;
        boxGreenCountEl.textContent = hero.inventory.boxes.green;
        boxBlueCountEl.textContent = hero.inventory.boxes.blue;
        doubleXpCountEl.textContent = hero.inventory.doubleXp;
        levelupCountEl.textContent = hero.inventory.levelUp;
    }
    
    function advanceToNextBoss() {
        gameData.currentBossIndex++;
        if (gameData.currentBossIndex >= BOSSES.length) {
            alert("You have defeated all the main bosses!");
            gameData.currentBossIndex = BOSSES.length - 1;
        }
        const newBoss = BOSSES[gameData.currentBossIndex];
        gameData.boss.name = newBoss.name;
        gameData.boss.hp = newBoss.hp;
        let boxColor = 'green', boxQuantity = 1;
        if (newBoss.isBigBoss) boxQuantity = 3;
        alert(`Victory! A new foe appears: ${newBoss.name}! You earned ${boxQuantity} ${boxColor} box(es).`);
        addBoxToInventory(boxColor, boxQuantity);
    }

    function addBoxToInventory(color, quantity = 1) {
        gameData.hero.inventory.boxes[color] += quantity;
    }

    function handleDailyLogin() {
        const todayStr = getTodayString();
        if (gameData.lastLogin !== todayStr) {
            gameData.lastLogin = todayStr;
            const dayOfWeek = new Date().getDay();
            let shieldReward = 1;
            
            if (dayOfWeek === 0) { // Sunday
                shieldReward = 5;
                alert("It's Beginning Day! You get 5 Shields!");
            } else if (dayOfWeek === 1) { // Monday
                shieldReward = 2;
                alert("It's Log-in Day! You get 2 Shields!");
            } else {
                alert("Daily Login Bonus! You get 1 shield!");
            }
            gameData.hero.inventory.shields += shieldReward;
            
            if (dayOfWeek === 5) { // Friday
                alert("It's Surprising Day! You've earned a Lucky Box (White)!");
                addBoxToInventory('white', 1);
            }
            saveData();
            updateUI();
        }
    }

    function openBox(color) {
        if (gameData.hero.inventory.boxes[color] <= 0) return alert(`You don't have any ${color} boxes!`);
        gameData.hero.inventory.boxes[color]--;
        let rewardText = '';
        if (color === 'white') {
            const x = Math.random() * 100;
            if (x < 50) { gameData.hero.inventory.shields++; rewardText = "a Shield!"; }
            else if (x < 70) { gameData.hero.xp += 5; rewardText = "5 XP!"; }
            else if (x < 90) { gameData.hero.xp += 10; rewardText = "10 XP!"; }
            else if (x < 95) { gameData.hero.inventory.doubleXp++; rewardText = "a Double XP token!"; }
            else { rewardText = "a Real-world Box (White)!"; }
        } else if (color === 'green') {
            const x = Math.random() * 100;
            if (x < 50) { gameData.hero.inventory.shields += 2; rewardText = "2 Shields!"; }
            else if (x < 80) { gameData.hero.inventory.shields += 3; rewardText = "3 Shields!"; }
            else if (x < 90) { gameData.hero.inventory.doubleXp++; rewardText = "a Double XP token!"; }
            else if (x < 95) { rewardText = "a Real-world Box (White)!"; }
            else { addBoxToInventory('blue', 1); rewardText = "a Level-UP Box (Blue)!"; }
        } else if (color === 'blue') {
            gameData.hero.inventory.levelUp++;
            rewardText = "a Level-UP Token! You can use it to level up instantly.";
        }
        alert(`You open a Lucky Box (${color}) and find... ${rewardText}`);
        saveData();
        updateUI();
    }
    
    function exchangeForRealWorldBox() {
        if (gameData.hero.inventory.shields >= 10) {
            gameData.hero.inventory.shields -= 10;
            const x = Math.random() * 100;
            let rewardText = '';
            if (x < 70) rewardText = "1hr gaming time!";
            else if (x < 80) rewardText = "2hr gaming time!";
            else if (x < 85) rewardText = "4hr gaming time!";
            else if (x < 90) rewardText = "a SPA coupon!";
            else if (x < 95) rewardText = "a Movie coupon!";
            else rewardText = "a Massage coupon!";
            alert(`You exchanged 10 shields and got a Real-world reward: ${rewardText}`);
            saveData();
            updateUI();
        } else {
            alert("You need at least 10 shields!");
        }
    }

    function handleCommitDay() {
        const habitSelections = [
            { el: habitVitalitySelect, weight: 10, name: "Vitality", attribute: "vitality" },
            { el: habitAgilitySelect, weight: 9, name: "Agility", attribute: "agility" },
            { el: habitStrengthSelect, weight: 8, name: "Strength", attribute: "strength" },
            { el: habitWillpowerSelect, weight: 7, name: "Will Power", attribute: "willpower" },
            { el: habitIntelligenceSelect, weight: 6, name: "Intelligence", attribute: "intelligence" }
        ];

        habitSelections.forEach(habit => {
            if (habit.el.value === 'shield') {
                if (gameData.hero.inventory.shields > 0) {
                    gameData.hero.inventory.shields--;
                    habit.el.dataset.value = "2.0"; // temp store value
                } else {
                    alert(`You are out of shields! The ${habit.name} habit will not count.`);
                    habit.el.dataset.value = "0";
                }
            } else {
                habit.el.dataset.value = habit.el.value;
            }
        });
        
        if (new Date().getDay() === 3) {
            const randomIndex = Math.floor(Math.random() * 5);
            const randomHabit = habitSelections[randomIndex];
            let currentValue = parseFloat(randomHabit.el.dataset.value);
            if (currentValue > 0) {
                let newValue = currentValue + 0.5;
                if (newValue > 2.0) newValue = 2.0;
                randomHabit.el.dataset.value = newValue.toString();
                alert(`Critical Hit! Your ${randomHabit.name} effort was boosted!`);
            }
        }

        let totalDamage = 0;
        let weeklyBossDamage = 0;
        habitSelections.forEach(habit => {
            const value = parseFloat(habit.el.dataset.value);
            let damage = habit.weight * value;
            totalDamage += damage;

            if (habit.attribute === gameData.weeklyBoss.weakness) {
                weeklyBossDamage += damage * 3;
            } else {
                weeklyBossDamage += damage;
            }
        });
        
        gameData.boss.hp -= totalDamage;
        if (!gameData.weeklyBoss.isDefeated) {
            gameData.weeklyBoss.hp -= weeklyBossDamage;
        }

        const theme = MONTHLY_THEMES.find(t => t.month === (new Date().getMonth() + 1));
        let xpGained = habitSelections.reduce((acc, habit) => {
            let xp = 0;
            if(parseFloat(habit.el.dataset.value) > 0) {
                xp = 5;
                if (theme && theme.attribute === habit.attribute) xp *= 2;
            }
            return acc + xp;
        }, 0);
        
        if (xpGained > 0 && gameData.hero.inventory.doubleXp > 0) {
            if(confirm("You have a Double XP token! Use it now?")) {
                gameData.hero.inventory.doubleXp--;
                xpGained *= 2;
                alert(`XP has been doubled to ${xpGained}!`);
            }
        }
        gameData.hero.xp += xpGained;
        let xpForNext = getXpForNextLevel(gameData.hero.level);
        while (gameData.hero.xp >= xpForNext) {
            gameData.hero.level++;
            gameData.hero.xp -= xpForNext;
            xpForNext = getXpForNextLevel(gameData.hero.level);
            alert(`Congratulations! You've reached Level ${gameData.hero.level}!`);
        }
        
        alert(`You dealt ${totalDamage} damage to the Main Boss and ${weeklyBossDamage} damage to the Weekly Boss. You gained ${xpGained} XP!`);
        
        if (gameData.boss.hp <= 0) {
            gameData.boss.hp = 0;
            advanceToNextBoss();
        }
        
        if (gameData.weeklyBoss.hp <= 0 && !gameData.weeklyBoss.isDefeated) {
            gameData.weeklyBoss.isDefeated = true;
            alert(`Congratulations! You have defeated the Weekly Boss and earned a Green Box!`);
            addBoxToInventory('green', 1);
        }
        
        // Reset dropdowns
        habitSelections.forEach(habit => {
            habit.el.value = "0";
        });

        saveData();
        updateUI();
    }

    function init() {
        loadData();
        handleDailyLogin();
        updateUI();
        commitDayButton.addEventListener('click', handleCommitDay);
        document.querySelectorAll('.open-box-btn').forEach(btn => {
            btn.addEventListener('click', () => openBox(btn.dataset.color));
        });
        document.getElementById('exchange-real-world-box').addEventListener('click', exchangeForRealWorldBox);
    }
    init();
});
