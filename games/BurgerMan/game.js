// 1. 首先定义所有常量
// 游戏基础设置
const CANVAS_WIDTH = 1300;    // 画布宽度
const CANVAS_HEIGHT = 700;   // 画布高度
const GRID_SIZE = 80;       // 网格大小
const SNAKE_SIZE = 80;      // 蛇身体块的大小（应小于等于 GRID_SIZE）
const FOOD_SIZE = 120;       // 食物大小（应小于等于 GRID_SIZE）
const GAME_SPEED = 300;     // 游戏速度
const SAFE_DISTANCE = 2;    // 食物与墙体安全距离
const FOOD_COUNT = 4;       // 场景中的食物数量
const MESSAGE = "FUCK THE WORLD";
const DOOR_WIDTH = GRID_SIZE;
const DOOR_HEIGHT = GRID_SIZE * 3;
const INITIAL_FOOD_PROGRESSION = [1, 2, 3]; // 初始食物数量递增序列
const ANIMATION_FRAMES = 10;  // 每次移动的动画帧数
const LETTER_Y_OFFSET = 10;   // 字母在蛇身上的垂直偏移量（像素）
const EXIT_MESSAGE_FONT_SIZE = 48; // 退出动画时的字体大小

// 2. 然后获取 DOM 元素并设置画布尺寸
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const messageDisplay = document.getElementById('messageDisplay');
const letterGuide = document.getElementById('letterGuide');
const gameContent = document.querySelector('.game-content');
const buildButton = document.getElementById('buildButton');

// 设置 canvas 元素的实际尺寸
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 设置 canvas 的 CSS 尺寸
canvas.style.width = CANVAS_WIDTH + 'px';
canvas.style.height = CANVAS_HEIGHT + 'px';

// 调整游戏内容容器的尺寸
gameContent.style.width = CANVAS_WIDTH + 'px';

// 3. 计算游戏区域的网格数量
const TILE_COUNT_X = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const TILE_COUNT_Y = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

// 4. 门的位置
const DOOR_X = TILE_COUNT_X - 2;
const DOOR_Y = Math.floor(TILE_COUNT_Y / 2) - 1;

// 5. 其他变量和图片加载
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
let animationProgress = 1;    // 当前动画进度
let lastPositions = [];      // 存储上一次的位置

// 图片加载
const burgerImage = new Image();
const wordBGImage = new Image();
const snakeBGImage = new Image();

function loadImages() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalImages = 3;
        
        function checkAllLoaded() {
            loadedCount++;
            console.log(`Loaded ${loadedCount}/${totalImages} images`);
            if (loadedCount === totalImages) {
                console.log('All images loaded successfully');
                resolve();
            }
        }

        function handleError(e) {
            console.error('Error loading image:', e);
            reject(new Error('Failed to load game images'));
        }

        burgerImage.onload = checkAllLoaded;
        burgerImage.onerror = handleError;
        wordBGImage.onload = checkAllLoaded;
        wordBGImage.onerror = handleError;
        snakeBGImage.onload = checkAllLoaded;
        snakeBGImage.onerror = handleError;

        // 设置图片路径
        try {
            console.log('Starting to load images...');
            burgerImage.src = 'assets/burger.png';
            wordBGImage.src = 'assets/wordBG.png';
            snakeBGImage.src = 'assets/deadwordBG.png';
        } catch (err) {
            handleError(err);
        }
    });
}

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

function hasLetterFood(letter) {
    return letterFoods.some(food => food.letter === letter);
}

function generateNextLetterFoods() {
    if (currentLetterIndex >= MESSAGE.length) return;
    
    const currentFoodCount = getCurrentFoodCount();
    
    if (letterFoods.length >= currentFoodCount) return;
    
    const nextLetter = MESSAGE[currentLetterIndex];
    
    if (!hasLetterFood(nextLetter)) {
        const correctFood = generateFood(nextLetter);
        letterFoods.push(correctFood);
    } else {
        let availableLetters = MESSAGE.split('').filter(letter => 
            letter !== nextLetter && letter !== ' ' &&
            !hasLetterFood(letter)
        );
        
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
            // 在画布中央绘制文字
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            ctx.fillStyle = '#4CAF50';
            ctx.font = `${EXIT_MESSAGE_FONT_SIZE}px QuinqueFive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                displayedText,
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT / 2
            );
            
            currentIndex++;
        } else {
            clearInterval(exitingTimer);
            setTimeout(() => {
                resetGame();
                messageDisplay.textContent = '';
                buildButton.style.display = 'flex';
            }, 2000);
        }
        if (snake.length > 0) {
            draw(); // 只在还有蛇身时调用 draw
        }
    }, 100);
}

function updateGame() {
    if (!isGameRunning || isExiting) return;
    
    // 如果动画还在进行中，不更新位置
    if (animationProgress < 1) {
        animationProgress += 1 / ANIMATION_FRAMES;
        requestAnimationFrame(draw);
        return;
    }
    
    // 保存当前位置用于动画
    lastPositions = snake.map(segment => ({...segment}));
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    if (dx === 0 && dy === 0) {
        return;
    }
    
    if (isDoorOpen && head.x === DOOR_X && head.y >= DOOR_Y && head.y <= DOOR_Y + 2) {
        startExitAnimation();
        return;
    }
    
    if (head.x < 0 || head.x >= TILE_COUNT_X - 1 || head.y < 0 || head.y >= TILE_COUNT_Y || 
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
        (!isDoorOpen && head.x === DOOR_X && head.y >= DOOR_Y && head.y <= DOOR_Y + 2)) {
        resetGame();
        return;
    }

    const isCorrectSpace = MESSAGE[currentLetterIndex] === ' ' && 
                          letterFoods.every(food => food.x !== head.x || food.y !== head.y);
    const correctFoodIndex = letterFoods.findIndex(food => 
        food.x === head.x && 
        food.y === head.y && 
        food.letter === MESSAGE[currentLetterIndex]
    );

    snake.unshift(head);

    if (correctFoodIndex !== -1 || isCorrectSpace) {
        if (correctFoodIndex !== -1) {
            letterFoods.splice(correctFoodIndex, 1);
        }
        
        const guideElement = letterGuide.querySelector(`[data-index="${currentLetterIndex}"]`);
        if (guideElement) {
            if (MESSAGE[currentLetterIndex] === ' ') {
                guideElement.classList.add('collected-space');
            } else {
                guideElement.classList.add('collected');
                guideElement.textContent = MESSAGE[currentLetterIndex];
            }
        }
        
        currentLetterIndex++;
        if (currentLetterIndex === MESSAGE.length) {
            isDoorOpen = true;
            letterFoods = [];
        } else {
            if (foodProgressionIndex < INITIAL_FOOD_PROGRESSION.length) {
                foodProgressionIndex++;
            }
            while (letterFoods.length < getCurrentFoodCount()) {
                generateNextLetterFoods();
            }
        }
    } else if (letterFoods.some(food => food.x === head.x && food.y === head.y)) {
        letterFoods = letterFoods.filter(food => food.x !== head.x || food.y !== head.y);
        while (letterFoods.length < getCurrentFoodCount()) {
            generateNextLetterFoods();
        }
        snake.pop();
    } else {
        snake.pop();
    }

    // 重置动画进度
    animationProgress = 0;
    requestAnimationFrame(draw);
}

function draw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制蛇
    snake.forEach((segment, index) => {
        // 计算插值位置
        let x, y;
        if (animationProgress < 1 && lastPositions[index]) {
            x = lastPositions[index].x + (segment.x - lastPositions[index].x) * animationProgress;
            y = lastPositions[index].y + (segment.y - lastPositions[index].y) * animationProgress;
        } else {
            x = segment.x;
            y = segment.y;
        }

        if (index === 0) {
            // 绘制蛇头
            ctx.drawImage(
                burgerImage,
                x * GRID_SIZE + (GRID_SIZE - SNAKE_SIZE) / 2,
                y * GRID_SIZE + (GRID_SIZE - SNAKE_SIZE) / 2,
                SNAKE_SIZE,
                SNAKE_SIZE
            );
        } else {
            // 绘制蛇身
            ctx.drawImage(
                snakeBGImage,
                x * GRID_SIZE + (GRID_SIZE - SNAKE_SIZE) / 2,
                y * GRID_SIZE + (GRID_SIZE - SNAKE_SIZE) / 2,
                SNAKE_SIZE,
                SNAKE_SIZE
            );
            
            if (index <= currentLetterIndex) {
                ctx.fillStyle = 'white';
                ctx.font = '10px QuinqueFive';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    MESSAGE[index - 1],
                    x * GRID_SIZE + GRID_SIZE/2,
                    y * GRID_SIZE + GRID_SIZE/2 + LETTER_Y_OFFSET // 添加垂直偏移
                );
            }
        }
    });

    // 绘制字母食物（保持原来的背景图片）
    letterFoods.forEach(food => {
        // 绘制食物背景图片
        ctx.drawImage(
            wordBGImage,
            food.x * GRID_SIZE + (GRID_SIZE - FOOD_SIZE) / 2,
            food.y * GRID_SIZE + (GRID_SIZE - FOOD_SIZE) / 2,
            FOOD_SIZE,
            FOOD_SIZE
        );
        
        // 绘制食物上的字母
        ctx.fillStyle = 'white';
        ctx.font = '14px QuinqueFive';
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

    // 如果动画还在进行中，继续请求下一帧
    if (animationProgress < 1) {
        animationProgress += 1 / ANIMATION_FRAMES;
        requestAnimationFrame(draw);
    }
}
function getInitialSnakePosition() {
    let x = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_X - 2 * SAFE_DISTANCE - 2));
    let y = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE));
    
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
    
    if (!isGameRunning) {
        gameContent.style.display = 'none';
        canvas.style.display = 'none';
        startButton.innerHTML = `
            <span>S</span><span>T</span><span>A</span><span>R</span><span>T</span>
            <span class="space"></span>
            <span>G</span><span>A</span><span>M</span><span>E</span>
        `;
        buildButton.style.display = 'none';
        return;
    }
    
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
    
    const guideElements = letterGuide.querySelectorAll('.guide-box, .guide-space');
    guideElements.forEach(element => {
        element.classList.remove('collected', 'collected-space');
        if (!element.classList.contains('guide-space')) {
            element.textContent = '';
        }
    });
    
    if (isGameRunning) {
        generateNextLetterFoods();
        animationProgress = 1;  // 重置动画进度
        lastPositions = [];     // 清空上一次位置
        draw();
        gameInterval = setInterval(updateGame, GAME_SPEED);
    }
}

async function startGame() {
    try {
        console.log('Starting game...');
        startButton.innerHTML = 'Loading...';
        buildButton.style.display = 'none';
        
        await loadImages();
        console.log('Images loaded, initializing game...');
        
        isGameRunning = true;
        canvas.style.display = 'block';
        gameContent.style.display = 'block';
        startButton.innerHTML = `<span>R</span><span>E</span><span>S</span><span>T</span><span>A</span><span>R</span><span>T</span>`;
        initializeLetterGuide();
        resetGame();
    } catch (err) {
        console.error('Game initialization failed:', err);
        startButton.innerHTML = 'Loading failed, please retry';
        isGameRunning = false;
    }
}

startButton.addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    if (!isGameRunning) {
        startGame().catch(err => {
            console.error('Failed to start game:', err);
        });
    } else {
        isGameRunning = false;
        resetGame();
    }
});

// Add new variables
const modal = document.getElementById('customMessageModal');
const customMessageInput = document.getElementById('customMessage');
const createCustomGameBtn = document.getElementById('createCustomGame');
const closeModalBtn = document.getElementById('closeModal');

// Add modal related event handlers
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

createCustomGameBtn.addEventListener('click', async () => {
    const newMessage = customMessageInput.value.trim().toUpperCase();
    if (!newMessage) {
        alert('Please enter what you want to say!');
        return;
    }
    
    try {
        // Create a copy of game code
        const gameCode = await generateCustomGame(newMessage);
        
        // Create and download file
        const blob = new Blob([gameCode], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom_snake_game.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Close modal
        modal.style.display = 'none';
    } catch (err) {
        console.error('Failed to create custom game:', err);
        alert('Failed to generate game, please check if file path is correct!');
    }
});

// Modify generateCustomGame function
async function generateCustomGame(newMessage) {
    try {
        // Get all required file contents
        const htmlResponse = await fetch('./BurgerMan.html');
        if (!htmlResponse.ok) throw new Error('Failed to fetch HTML');
        const htmlContent = await htmlResponse.text();

        const cssResponse = await fetch('./style.css');
        if (!cssResponse.ok) throw new Error('Failed to fetch CSS');
        const cssContent = await cssResponse.text();

        const jsResponse = await fetch('./game.js');
        if (!jsResponse.ok) throw new Error('Failed to fetch JS');
        const gameJsContent = await jsResponse.text();
        
        // Convert images to base64
        const burgerBase64 = await loadImageAsBase64('./assets/burger.png');
        const wordBGBase64 = await loadImageAsBase64('./assets/wordBG.png');
        const deadwordBGBase64 = await loadImageAsBase64('./assets/deadwordBG.png');
        
        // Convert font to base64
        const fontBase64 = await loadFontAsBase64('./assets/fonts/QuinqueFive.woff');
        
        // Modify font and image paths in CSS
        const modifiedCss = cssContent.replace(
            /url\(['"]assets\/fonts\/QuinqueFive\.woff['"]\)/g,
            `url(data:font/woff;base64,${fontBase64})`
        );
        
        // Extract main game code (from start to startButton event listener end)
        let mainGameCode = gameJsContent
            .split('// Add new variables')[0]
            .replace(/const buildButton = document\.getElementById\('buildButton'\);/, '')
            .replace(/buildButton\.style\.display = ['"]none['"];/g, '')
            .replace(/buildButton\.style\.display = ['"]flex['"];/g, '');
        
        // Modify constants and image paths in game code
        mainGameCode = mainGameCode
            .replace(/const MESSAGE = ["'].*?["'];/, `const MESSAGE = "${newMessage}";`)
            .replace(
                /burgerImage\.src = ['"]assets\/burger\.png['"]/,
                `burgerImage.src = '${burgerBase64}'`
            )
            .replace(
                /wordBGImage\.src = ['"]assets\/wordBG\.png['"]/,
                `wordBGImage.src = '${wordBGBase64}'`
            )
            .replace(
                /snakeBGImage\.src = ['"]assets\/deadwordBG\.png['"]/,
                `snakeBGImage.src = '${deadwordBGBase64}'`
            );
        
        // Remove back button and modal related code
        const modifiedHtml = htmlContent
            .replace(/<link rel="stylesheet" href="\.\.\/styles\/web-test\.css">/, '')
            .replace(/<a href="\.\.\/web-test\.html".*?<\/a>/, '')
            .replace(/<div id="customMessageModal".*?<\/div><\/div><\/div>/, '')
            .replace(/<div id="buildButton".*?<\/div>/, '');
        
        // Create standalone HTML file
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>custom_snake_game</title>
    <style>${modifiedCss}</style>
</head>
<body>
    ${modifiedHtml}
    <script>${mainGameCode}</script>
</body>
</html>`.trim();
    } catch (err) {
        console.error('Error generating custom game:', err);
        throw new Error(`Failed to generate game: ${err.message}`);
    }
}

// Add helper function: convert image to base64
async function loadImageAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error('Error loading image:', url, err);
        throw new Error(`Failed to load image ${url}: ${err.message}`);
    }
}

// Add helper function: convert font file to base64
async function loadFontAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch font: ${url}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error('Error loading font:', url, err);
        throw new Error(`Failed to load font ${url}: ${err.message}`);
    }
}

buildButton.addEventListener('click', () => {
    modal.style.display = 'block';
});

// Add new variables
const buildModal = document.createElement('div');
buildModal.className = 'modal';
buildModal.innerHTML = `
    <div class="modal-content">
        <h2>Congratulations!</h2>
        <p>Create your own version:</p>
        <input type="text" id="buildCustomMessage" placeholder="Enter what you want to say!" maxlength="30">
        <div class="modal-buttons">
            <button id="buildCreateGame">Create</button>
            <button id="buildCloseModal">Close</button>
        </div>
    </div>
`;
document.querySelector('.game-container').appendChild(buildModal);

const buildCustomMessageInput = document.getElementById('buildCustomMessage');
const buildCreateGameBtn = document.getElementById('buildCreateGame');
const buildCloseModalBtn = document.getElementById('buildCloseModal');

// Build button click event
buildButton.addEventListener('click', () => {
    buildModal.style.display = 'block';
});

// Close modal
buildCloseModalBtn.addEventListener('click', () => {
    buildModal.style.display = 'none';
});

// Create custom game
buildCreateGameBtn.addEventListener('click', async () => {
    const newMessage = buildCustomMessageInput.value.trim().toUpperCase();
    if (!newMessage) {
        alert('Please enter what you want to say!');
        return;
    }
    
    try {
        // Create a copy of game code
        const gameCode = await generateCustomGame(newMessage);
        
        // Create and download file
        const blob = new Blob([gameCode], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom_snake_game.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Close modal
        buildModal.style.display = 'none';
    } catch (err) {
        console.error('Failed to create custom game:', err);
        alert('Failed to generate game, please check if file path is correct!');
    }
});

// Click outside modal to close
buildModal.addEventListener('click', (e) => {
    if (e.target === buildModal) {
        buildModal.style.display = 'none';
    }
});
