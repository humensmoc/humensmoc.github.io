const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const messageDisplay = document.getElementById('messageDisplay');
const letterGuide = document.getElementById('letterGuide');
const gameContent = document.querySelector('.game-content');

// 游戏基础设置
const CANVAS_WIDTH = 800;    // 画布宽度
const CANVAS_HEIGHT = 600;   // 画布高度
const GRID_SIZE = 25;       // 网格大小
const GAME_SPEED = 200;     // 游戏速度
const SAFE_DISTANCE = 2;    // 食物与墙体安全距离
const FOOD_COUNT = 4;       // 场景中的食物数量
const MESSAGE = "FUCK THE WORLD";
const DOOR_WIDTH = GRID_SIZE;
const DOOR_HEIGHT = GRID_SIZE * 3;
const INITIAL_FOOD_PROGRESSION = [1, 2, 3]; // 初始食物数量递增序列

// 计算游戏区域的网格数量
const TILE_COUNT_X = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const TILE_COUNT_Y = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

// 门的位置
const DOOR_X = TILE_COUNT_X - 2;
const DOOR_Y = Math.floor(TILE_COUNT_Y / 2) - 1;

let gameInterval;
let isGameRunning = false;
let snake = [{ x: 10, y: 10 }];
let letterFoods = [];
let currentLetterIndex = 0;
let dx = 0;
let dy = 0;
let isDoorOpen = false;
let isExiting = false;
let exitingTimer = null;
let foodProgressionIndex = 0;

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!isGameRunning || isExiting) return;
    
    switch(e.key.toLowerCase()) {
        case 'w':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 's':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'a':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'd':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

function initializeLetterGuide() {
    letterGuide.innerHTML = '';
    [...MESSAGE].forEach((char, index) => {
        const guideElement = document.createElement('div');
        if (char === ' ') {
            guideElement.className = 'guide-space';
        } else {
            guideElement.className = 'guide-box';
            guideElement.textContent = '';
        }
        guideElement.setAttribute('data-index', index);
        letterGuide.appendChild(guideElement);
    });
}

function getCurrentFoodCount() {
    if (foodProgressionIndex < INITIAL_FOOD_PROGRESSION.length) {
        return INITIAL_FOOD_PROGRESSION[foodProgressionIndex];
    }
    return FOOD_COUNT;
}

// 添加新的辅助函数，检查场景中是否存在特定字母的食物
function hasLetterFood(letter) {
    return letterFoods.some(food => food.letter === letter);
}

function generateNextLetterFoods() {
    // 如果已经收集完所有字母，就不再生成食物
    if (currentLetterIndex >= MESSAGE.length) return;
    
    // 获取当前应该生成的食物总数
    const currentFoodCount = getCurrentFoodCount();
    
    // 如果当前食物数量已经达到上限，不需要生成新食物
    if (letterFoods.length >= currentFoodCount) return;
    
    const nextLetter = MESSAGE[currentLetterIndex];
    
    // 检查场景中是否已经存在下一个需要的字母
    if (!hasLetterFood(nextLetter)) {
        // 如果不存在，生成下一个需要的字母食物
        const correctFood = generateFood(nextLetter);
        letterFoods.push(correctFood);
    } else {
        // 如果已存在，生成一个随机的其他字母
        let availableLetters = MESSAGE.split('').filter(letter => 
            letter !== nextLetter && letter !== ' ' &&
            !hasLetterFood(letter) // 确保不会生成场景中已有的字母
        );
        
        // 如果没有可用的字母了，就不生成新食物
        if (availableLetters.length === 0) return;
        
        const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
        const food = generateFood(randomLetter);
        letterFoods.push(food);
    }
}

function generateFood(letter) {
    const food = {
        x: SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_X - 2 * SAFE_DISTANCE - 2)),
        y: SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE)),
        letter: letter
    };
    
    // 确保食物不会生成在蛇身上、其他食物位置和门的位置
    while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
           letterFoods.some(existingFood => existingFood.x === food.x && existingFood.y === food.y) ||
           (food.x >= DOOR_X - 1 && food.x <= DOOR_X + 1 && 
            food.y >= DOOR_Y - 1 && food.y <= DOOR_Y + 3)) {
        food.x = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_X - 2 * SAFE_DISTANCE - 2));
        food.y = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE));
    }
    
    return food;
}

function startExitAnimation() {
    isExiting = true;
    let displayedText = '';
    let currentIndex = 0;
    
    exitingTimer = setInterval(() => {
        if (snake.length > 0) {
            snake.pop();
        } else if (currentIndex < MESSAGE.length) {
            displayedText += MESSAGE[currentIndex];
            messageDisplay.textContent = displayedText;
            currentIndex++;
        } else {
            clearInterval(exitingTimer);
            setTimeout(() => {
                resetGame();
                messageDisplay.textContent = '';
            }, 2000);
        }
        draw();
    }, 100);
}

function updateGame() {
    if (!isGameRunning || isExiting) return;
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 如果蛇没有移动，直接返回
    if (dx === 0 && dy === 0) {
        return;
    }
    
    // 检查是否到达开启的门
    if (isDoorOpen && head.x === DOOR_X && head.y >= DOOR_Y && head.y <= DOOR_Y + 2) {
        startExitAnimation();
        return;
    }
    
    // 碰撞检测
    if (head.x < 0 || head.x >= TILE_COUNT_X - 1 || head.y < 0 || head.y >= TILE_COUNT_Y || 
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
        (!isDoorOpen && head.x === DOOR_X && head.y >= DOOR_Y && head.y <= DOOR_Y + 2)) {
        resetGame();
        return;
    }

    // 检查是否吃到正确的食物或在正确位置吃到空格
    const isCorrectSpace = MESSAGE[currentLetterIndex] === ' ' && 
                          letterFoods.every(food => food.x !== head.x || food.y !== head.y);
    const correctFoodIndex = letterFoods.findIndex(food => 
        food.x === head.x && 
        food.y === head.y && 
        food.letter === MESSAGE[currentLetterIndex]
    );

    // 先移动蛇头
    snake.unshift(head);

    if (correctFoodIndex !== -1 || isCorrectSpace) {
        // 吃到正确的食物，不移除尾部（这样蛇就会变长）
        if (correctFoodIndex !== -1) {
            letterFoods.splice(correctFoodIndex, 1);
        }
        
        // 更新指引显示
        const guideElement = letterGuide.querySelector(`[data-index="${currentLetterIndex}"]`);
        if (guideElement) {
            if (MESSAGE[currentLetterIndex] === ' ') {
                guideElement.classList.add('collected-space');
            } else {
                guideElement.classList.add('collected');
            }
        }
        
        currentLetterIndex++;
        if (currentLetterIndex === MESSAGE.length) {
            isDoorOpen = true;
        } else {
            if (foodProgressionIndex < INITIAL_FOOD_PROGRESSION.length) {
                foodProgressionIndex++;
            }
            // 尝试生成新食物，直到达到当前阶段的食物数量
            while (letterFoods.length < getCurrentFoodCount()) {
                generateNextLetterFoods();
            }
        }
    } else if (letterFoods.some(food => food.x === head.x && food.y === head.y)) {
        // 吃到错误的食物
        letterFoods = letterFoods.filter(food => food.x !== head.x || food.y !== head.y);
        // 尝试生成新食物
        while (letterFoods.length < getCurrentFoodCount()) {
            generateNextLetterFoods();
        }
        snake.pop(); // 吃到错误食物时移除尾部
    } else {
        // 没有吃到任何食物，移除尾部
        snake.pop();
    }

    draw();
}

function draw() {
    // 清空画布
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index < currentLetterIndex) {
            // 已经吃到的字母显示在蛇
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
            
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                MESSAGE[index],
                segment.x * GRID_SIZE + GRID_SIZE/2,
                segment.y * GRID_SIZE + GRID_SIZE/2
            );
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    });

    // 绘制字母食物
    letterFoods.forEach(food => {
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            food.letter,
            food.x * GRID_SIZE + GRID_SIZE/2,
            food.y * GRID_SIZE + GRID_SIZE/2
        );
    });

    // 绘制门
    ctx.fillStyle = isDoorOpen ? '#4CAF50' : '#666';
    ctx.fillRect(DOOR_X * GRID_SIZE, DOOR_Y * GRID_SIZE, DOOR_WIDTH, DOOR_HEIGHT);
}

function getInitialSnakePosition() {
    // 确保蛇的初始位置不会在门和食物附近
    let x = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_X - 2 * SAFE_DISTANCE - 2));
    let y = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE));
    
    // 确保不会生成在门附近
    while (x >= DOOR_X - 2 && x <= DOOR_X + 1 && 
           y >= DOOR_Y - 1 && y <= DOOR_Y + 3) {
        x = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_X - 2 * SAFE_DISTANCE - 2));
        y = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE));
    }
    
    return { x, y };
}

function resetGame() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    if (exitingTimer) {
        clearInterval(exitingTimer);
    }
    
    // 如果不是游戏运行状态，隐藏游戏内容
    if (!isGameRunning) {
        gameContent.style.display = 'none';
        canvas.style.display = 'none';
        startButton.innerHTML = `
            <span>S</span><span>T</span><span>A</span><span>R</span><span>T</span>
            <span class="space"></span>
            <span>G</span><span>A</span><span>M</span><span>E</span>
        `;
        return;
    }
    
    // 获取安全的初始位置并生成蛇身
    const initialPos = getInitialSnakePosition();
    snake = [{ x: initialPos.x, y: initialPos.y }];
    
    dx = 0;
    dy = 0;
    foodProgressionIndex = 0;
    currentLetterIndex = 0;
    letterFoods = [];
    isDoorOpen = false;
    isExiting = false;
    messageDisplay.textContent = '';
    
    // 重置指引显示
    const guideElements = letterGuide.querySelectorAll('.guide-box, .guide-space');
    guideElements.forEach(element => {
        element.classList.remove('collected', 'collected-space');
        if (!element.classList.contains('guide-space')) {
            element.textContent = '';
        }
    });
    
    if (isGameRunning) {
        // 先生成食物
        generateNextLetterFoods();
        // 立即绘制一次，确保蛇身可见
        draw();
        // 然后开始游戏循环
        gameInterval = setInterval(updateGame, GAME_SPEED);
    }
}

function startGame() {
    isGameRunning = true;
    canvas.style.display = 'block';
    gameContent.style.display = 'block';  // 显示游戏内容
    // 更紧凑的重启按钮布局
    startButton.innerHTML = `<span>R</span><span>E</span><span>S</span><span>T</span><span>A</span><span>R</span><span>T</span>`;
    initializeLetterGuide();
    resetGame();
}

startButton.addEventListener('click', () => {
    if (!isGameRunning) {
        startGame();
    } else {
        isGameRunning = false;
        resetGame();
    }
});