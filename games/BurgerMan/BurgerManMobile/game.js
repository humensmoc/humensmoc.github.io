// 1. 首先定义所有常量
// 游戏基础设置
const CANVAS_WIDTH = 800;    // 修改画布宽度为更合适的尺寸
const CANVAS_HEIGHT = 1000;   // 修改画布高度以适应手机屏幕
const GRID_SIZE = 80;       // 网格大小
const SNAKE_SIZE = 90;      // 蛇身体块的大小（应小于等于 GRID_SIZE）
const FOOD_SIZE = 140;       // 食物大小（应小于等于 GRID_SIZE）
const GAME_SPEED = 400;     // 游戏速度
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
const DOOR_X = Math.floor(TILE_COUNT_X * 0.9); // 将门移到画布宽度的85%处
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
        x: SAFE_DISTANCE + Math.floor(Math.random() * (DOOR_X - 2 * SAFE_DISTANCE - 1)),
        y: SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE))
    };
    
    while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
           letterFoods.some(existingFood => existingFood.x === food.x && existingFood.y === food.y) ||
           (food.x >= DOOR_X - 1 && food.x <= DOOR_X + 1 && 
            food.y >= DOOR_Y - 1 && food.y <= DOOR_Y + 3)) {
        food.x = SAFE_DISTANCE + Math.floor(Math.random() * (DOOR_X - 2 * SAFE_DISTANCE - 1));
        food.y = SAFE_DISTANCE + Math.floor(Math.random() * (TILE_COUNT_Y - 2 * SAFE_DISTANCE));
    }
    
    food.letter = letter;
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
    
    // 如果动画还在进行中，使用requestAnimationFrame来平滑过渡
    if (animationProgress < 1) {
        animationProgress += 1 / ANIMATION_FRAMES;
        requestAnimationFrame(draw);
        return;
    }
    
    // 保存当前位置用于动画
    lastPositions = snake.map(segment => ({...segment}));
    
    // 立即更新蛇的位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    if (dx === 0 && dy === 0) {
        return;
    }
    
    if (isDoorOpen && head.x === DOOR_X && head.y >= DOOR_Y && head.y <= DOOR_Y + 2) {
        startExitAnimation();
        return;
    }
    
    if (head.x < 0 || head.x >= DOOR_X + 1 || head.y < 0 || head.y >= TILE_COUNT_Y || 
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

    // 在绘制游戏元素时，保持原有的相对位置
    const gridScaleX = CANVAS_WIDTH / TILE_COUNT_X;
    const gridScaleY = CANVAS_HEIGHT / TILE_COUNT_Y;
    
    // 绘制蛇时使用新的网格尺寸
    snake.forEach((segment, index) => {
        let x, y;
        if (animationProgress < 1 && lastPositions[index]) {
            x = lastPositions[index].x + (segment.x - lastPositions[index].x) * animationProgress;
            y = lastPositions[index].y + (segment.y - lastPositions[index].y) * animationProgress;
        } else {
            x = segment.x;
            y = segment.y;
        }

        const drawX = x * gridScaleX + (gridScaleX - SNAKE_SIZE) / 2;
        const drawY = y * gridScaleY + (gridScaleY - SNAKE_SIZE) / 2;

        if (index === 0) {
            ctx.drawImage(burgerImage, drawX, drawY, SNAKE_SIZE, SNAKE_SIZE);
        } else {
            ctx.drawImage(snakeBGImage, drawX, drawY, SNAKE_SIZE, SNAKE_SIZE);
            
            if (index <= currentLetterIndex) {
                ctx.fillStyle = 'white';
                ctx.font = '10px QuinqueFive';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    MESSAGE[index - 1],
                    drawX + SNAKE_SIZE/2,
                    drawY + SNAKE_SIZE/2 + LETTER_Y_OFFSET
                );
            }
        }
    });

    // 绘制食物时也使用新的网格尺寸
    letterFoods.forEach(food => {
        const drawX = food.x * gridScaleX + (gridScaleX - FOOD_SIZE) / 2;
        const drawY = food.y * gridScaleY + (gridScaleY - FOOD_SIZE) / 2;
        
        ctx.drawImage(wordBGImage, drawX, drawY, FOOD_SIZE, FOOD_SIZE);
        
        ctx.fillStyle = 'white';
        ctx.font = '14px QuinqueFive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            food.letter,
            drawX + FOOD_SIZE/2,
            drawY + FOOD_SIZE/2
        );
    });

    // 绘制门
    const doorX = DOOR_X * gridScaleX;
    const doorY = DOOR_Y * gridScaleY;
    ctx.fillStyle = isDoorOpen ? '#4CAF50' : '#666';
    ctx.fillRect(doorX, doorY, gridScaleX, gridScaleY * 3);

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
        mobileControls.style.display = 'none';
        isMobileControlsVisible = false;
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
        
        // 先重置游戏
        resetGame();
        
        // 然后更新canvas尺寸并绘制
        updateCanvasSize();
        draw();
        
        // 添加窗口大小改变时的处理
        window.addEventListener('resize', () => {
            updateCanvasSize();
        });
        
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

// 添加新的变量
const mobileControls = document.getElementById('mobileControls');
let isMobileControlsVisible = false;

// // 修改移动按钮点击事件
// mobileButton.addEventListener('click', () => {
//     isMobileControlsVisible = !isMobileControlsVisible;
//     mobileControls.style.display = isMobileControlsVisible ? 'flex' : 'none';
    
//     // 添加自动滚动到底部的逻辑
//     if (isMobileControlsVisible) {
//         setTimeout(() => {
//             window.scrollTo({
//                 top: document.body.scrollHeight,
//                 behavior: 'smooth'
//             });
//         }, 100);
//     }
// });

// 修改方向按钮事件监听
function handleDirectionButton(direction) {
    if (!isGameRunning || isExiting) return;
    
    switch(direction) {
        case 'up':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'down':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'left':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'right':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
}

// 为每个按钮添加触摸事件
['up', 'down', 'left', 'right'].forEach(direction => {
    const btn = document.querySelector(`.${direction}-btn`);
    
    // 触摸开始时立即响应
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 阻止默认行为
        handleDirectionButton(direction);
    });
    
    // 同时保留点击事件支持
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleDirectionButton(direction);
    });
});

// 防止触摸滑动时触发页面滚动
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

function updateCanvasSize() {
    const container = document.querySelector('.game-container');
    const buttonContainer = document.querySelector('.button-container');
    const mobileControls = document.querySelector('.mobile-controls');
    
    // 计算可用高度（减去按钮和控制器的高度）
    const availableHeight = window.innerHeight - 
        (buttonContainer.offsetHeight + 200); // 为控制器和边距预留200px空间
    
    // 计算可用宽度
    const availableWidth = window.innerWidth * 0.95;
    
    // 计算缩放比例
    const scale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT);
    
    // 设置canvas的显示尺寸
    canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    
    // 保持实际画布分辨率
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // 调整游戏内容区域的宽度以匹配canvas
    const gameContent = document.querySelector('.game-content');
    if (gameContent) {
        gameContent.style.width = `${CANVAS_WIDTH * scale}px`;
    }
    
    // 强制重绘
    if (isGameRunning) {
        draw();
    }
}

// 在游戏开始时显示控制按钮
document.getElementById('startButton').addEventListener('click', function() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('mobileControls').style.display = 'grid';
    // 其他开始游戏的逻辑...
});
