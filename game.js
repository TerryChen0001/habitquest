// HabitQuest Game Logic - Phase 3 Complete

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const heroLevelEl = document.getElementById('hero-level');
    const heroXpEl = document.getElementById('hero-xp');
    const xpToNextLevelEl = document.getElementById('xp-to-next-level');
    const heroShieldsEl = document.getElementById('hero-shields');
    const heroUnbreakableShieldsEl = document.getElementById('hero-unbreakable-shields');

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

    // --- GAME DATA ---
    let gameData = {};

    // --- CONSTANTS ---
    const BOSSES = [
        { name: "Slime of Sloth", hp: 150 },
        { name: "Goblin of Gluttony", hp: 200 },
        { name: "Middle Boss: The Doubt Demon", hp: 200, isMiddleBoss: true }, // Feb week 2
        { name: "Wraith of Laziness", hp: 300 },
        { name: "Big Boss: The Procrastination Dragon", hp: 500, isBigBoss: true } // Feb final
        // We can add all 52 floors of bosses here
    ];

    const MONTHLY_THEMES = [
        { month: 1, theme: "Vitality", attribute: "vitality" }, // January
        { month: 2, theme: "Agility", attribute: "agility" }, // February
        // ... and so on for all 12 months
    ];

    const defaultGameData = {
        hero: {
            level: 1,
            xp: 0,
            stats: {
                vitality: 1,
                agility: 1,
                strength: 1,
                willpower: 1,
                intelligence: 1,
            },
            inventory: {
                shields: 0,
                unbreakableShields: 0,
                doubleXp: 0,
            }
        },
        currentFloor: 1,
        currentBossIndex: 0,
        boss: {
            name: BOSSES[0].name,
            hp: BOSSES[0].hp
        },
        lastLogin: null, // YYYY-MM-DD format
        loginDaysThisMonth: 0
    };

    // --- CORE FUNCTIONS ---

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        return weekNo;
    }

    function getXpForNextLevel(level) {
        return level * 100;
    }

    function getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function saveData() {
        localStorage.setItem('habitQuestData', JSON.stringify(gameData));
        console.log('Game data saved!');
    }

    function loadData() {
        const savedData = localStorage.getItem('habitQuestData');
        if (savedData) {
            gameData = JSON.parse(savedData);
            console.log('Game data loaded!');
        } else {
            gameData = JSON.parse(JSON.stringify(defaultGameData)); // Deep copy
            console.log('No saved data found. Initializing new game.');
            gameData.hero.inventory.unbreakableShields = 10;
            alert('Welcome, new hero! You have received 10 Unbreakable Shields for starting your journey!');
        }
        gameData.currentFloor = getWeekNumber(new Date());
    }

    function updateUI() {
        const { hero, boss, currentFloor } = gameData;
        heroLevelEl.textContent = hero.level;
        heroXpEl.textContent = hero.xp;
        xpToNextLevelEl.textContent = getXpForNextLevel(hero.level);
        heroShieldsEl.textContent = hero.inventory.shields;
        heroUnbreakableShieldsEl.textContent = hero.inventory.unbreakableShields;

        statVitalityEl.textContent = hero.stats.vitality;
        statAgilityEl.textContent = hero.stats.agility;
        statStrengthEl.textContent = hero.stats.strength;
        statWillpowerEl.textContent = hero.stats.willpower;
        statIntelligenceEl.textContent = hero.stats.intelligence;

        bossNameEl.textContent = boss.name;
        bossHpEl.textContent = boss.hp;
        floorEl.textContent = currentFloor;

        const today = new Date();
        const dayOfWeek = today.getDay();
        const currentMonth = today.getMonth() + 1;
        const theme = MONTHLY_THEMES.find(t => t.month === currentMonth);
        monthlyThemeEl.textContent = theme ? `This month's theme: ${theme.theme} (XP * 2)` : "No theme this month.";
        
        let specialMessage = "Today is a normal day.";
        if (dayOfWeek === 1) specialMessage = "It's Log-in Day! Rewards are doubled.";
        if (dayOfWeek === 3) specialMessage = "It's Critical Hit Day! A random habit may get a surprise boost!";
        if (dayOfWeek === 5) specialMessage = "It's Surprising Day! You've earned a Lucky Box (White)!";
        specialDayInfoEl.textContent = specialMessage;
    }
    
    function advanceToNextBoss() {
        gameData.currentBossIndex++;
        if (gameData.currentBossIndex >= BOSSES.length) {
            alert("You have defeated all the bosses! More will be added soon.");
            gameData.currentBossIndex = BOSSES.length - 1;
        }
        const newBoss = BOSSES[gameData.currentBossIndex];
        gameData.boss.name = newBoss.name;
        gameData.boss.hp = newBoss.hp;
        
        let reward = "a Green Box";
        if (newBoss.isMiddleBoss) reward = "a Green Box!";
        if (newBoss.isBigBoss) reward = "3 Green Boxes!";
        alert(`A new foe appears! You defeated the boss and earned ${reward}. Now you face the ${newBoss.name}!`);
        openBox('green', newBoss.isBigBoss ? 3 : 1);
    }


    function handleDailyLogin() {
        const todayStr = getTodayString();
        if (gameData.lastLogin !== todayStr) {
            gameData.lastLogin = todayStr;
            gameData.loginDaysThisMonth = (gameData.loginDaysThisMonth || 0) + 1;
            let shieldReward = 1;
            const dayOfWeek = new Date().getDay();
            if (dayOfWeek === 1) {
                shieldReward = 2;
                alert(`It's Log-in Day! You get ${shieldReward} shields!`);
            } else {
                alert(`Daily Login Bonus! You get ${shieldReward} shield!`);
            }
            gameData.hero.inventory.shields += shieldReward;
            
            if (dayOfWeek === 5) {
                openBox('white', 1);
            }

            saveData();
            updateUI();
        }
    }
    
    function openBox(color, quantity = 1) {
        for (let i = 0; i < quantity; i++) {
            let rewardText = '';
            if (color === 'white') {
                const x = Math.floor(Math.random() * 100);
                if (x < 50) {
                    gameData.hero.inventory.shields++;
                    rewardText = "a Shield!";
                } else if (x < 70) {
                    gameData.hero.xp += 5;
                    rewardText = "5 XP!";
                } else if (x < 90) {
                    gameData.hero.xp += 10;
                    rewardText = "10 XP!";
                } else if (x < 95) {
                    gameData.hero.inventory.doubleXp = (gameData.hero.inventory.doubleXp || 0) + 1;
                    rewardText = "a Double XP token!";
                } else {
                    rewardText = "a Real-world Box (White)!";
                }
            } else if (color === 'green') {
                 const x = Math.floor(Math.random() * 100);
                if (x < 50) {
                    gameData.hero.inventory.shields += 2;
                    rewardText = "2 Shields!";
                } else if (x < 80) {
                    gameData.hero.inventory.shields += 3;
                    rewardText = "3 Shields!";
                } else if (x < 90) {
                     gameData.hero.inventory.doubleXp = (gameData.hero.inventory.doubleXp || 0) + 1;
                    rewardText = "a Double XP token!";
                } else if (x < 95) {
                    rewardText = "a Real-world Box (White)!";
                } else {
                    rewardText = "a Level-UP Box (Blue)!";
                }
            }
             alert(`You open a Lucky Box (${color}) and find... ${rewardText}`);
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

        document.querySelectorAll('.use-shield-cb').forEach((cb, index) => {
            if (cb.checked) {
                if (gameData.hero.inventory.unbreakableShields > 0) {
                    gameData.hero.inventory.unbreakableShields--;
                    habitSelections[index].el.value = "2.0"; 
                    cb.checked = false;
                } else {
                    alert("You don't have any Unbreakable Shields!");
                }
            }
        });
        
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 3) {
            const randomIndex = Math.floor(Math.random() * 5);
            const randomHabit = habitSelections[randomIndex];
            const currentValue = parseFloat(randomHabit.el.value);
            if (currentValue > 0) {
                let newValue = currentValue + 0.5;
                if (newValue > 2.0) newValue = 2.0;
                randomHabit.el.value = newValue.toString();
                alert(`Critical Hit! Your ${randomHabit.name} effort was boosted!`);
            }
        }

        const v = parseFloat(habitVitalitySelect.value);
        const a = parseFloat(habitAgilitySelect.value);
        const s = parseFloat(habitStrengthSelect.value);
        const w = parseFloat(habitWillpowerSelect.value);
        const i = parseFloat(habitIntelligenceSelect.value);

        const damageDealt = (10 * v) + (9 * a) + (8 * s) + (7 * w) + (6 * i);
        
        gameData.boss.hp -= damageDealt;
        
        // --- Calculate & Add XP ---
        const currentMonth = new Date().getMonth() + 1;
        const theme = MONTHLY_THEMES.find(t => t.month === currentMonth);

        let xpGained = 0;
        habitSelections.forEach(habit => {
            const value = parseFloat(habit.el.value);
            if (value > 0) {
                let xp = 5;
                if (theme && theme.attribute === habit.attribute) {
                    xp *= 2;
                }
                xpGained += xp;
            }
        });
        
        gameData.hero.xp += xpGained;

        let xpForNext = getXpForNextLevel(gameData.hero.level);
        while (gameData.hero.xp >= xpForNext) {
            gameData.hero.level++;
            gameData.hero.xp -= xpForNext;
            xpForNext = getXpForNextLevel(gameData.hero.level);
            alert(`Congratulations! You've reached Level ${gameData.hero.level}!`);
        }
        
        alert(`You dealt ${damageDealt} damage to the boss and gained ${xpGained} XP!`);

        if (gameData.boss.hp <= 0) {
            alert(`Victory! You have defeated the ${gameData.boss.name}!`);
            gameData.boss.hp = 0;
            advanceToNextBoss();
        }

        saveData();
        updateUI();
    }

    function init() {
        loadData();
        handleDailyLogin();
        updateUI();
        commitDayButton.addEventListener('click', handleCommitDay);
    }

    init();
});
