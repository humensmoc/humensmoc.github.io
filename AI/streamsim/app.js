let mediaRecorder;
let recordedChunks = [];
let timerInterval;
let startTime;
let stream;
let captureCanvas = document.createElement('canvas');
let captureContext = captureCanvas.getContext('2d');
let aiChatInterval;
let isProcessingAIMessage = false;
let pendingCaptureRequests = 0;
let maxSimultaneousCaptureRequests = 2;
let previousMessages = []; // Store previous AI-generated messages
let previousUsernames = []; // Store previously used usernames
let extraUserMessageForAI = null;  // Holds a user message to include in the next AI prompt check
let uniqueUsernames = new Set(); // Track unique usernames for viewer count
let chatSettings = {
    angry: false,
    memelike: false,
    happy: false,
    botlike: false,
    silly: false,
    sad: false,
    confused: false,
    fan: false,
    muted: false, // New setting for muting chat
    disableDonations: false // New setting for disabling donations
};
let activePoll = null;
let pollTimer = null;
let totalVotes = 0;
let aiCheckInterval = 3.5; // Default interval in seconds
let donationTimer = null;
let streamerUsername = null; // Store the streamer's username

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn'); // 可能不存在，因为被注释了
const downloadBtn = document.getElementById('downloadBtn'); // 可能不存在，因为被注释了
const streamVideoBtn = document.getElementById('streamVideoBtn');
const timer = document.getElementById('timer');
const recordingStatus = document.getElementById('recordingStatus');
const preview = document.getElementById('preview');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const popoutBtn = document.getElementById('popoutBtn');
const createPollBtn = document.getElementById('createPollBtn');
const pollForm = document.getElementById('pollForm');
const activePollContainer = document.getElementById('activePollContainer');

// Event listeners
startBtn.addEventListener('click', startRecording);
if (stopBtn) stopBtn.addEventListener('click', stopRecording);
if (downloadBtn) downloadBtn.addEventListener('click', downloadRecording);
streamVideoBtn.addEventListener('click', streamVideo);
sendBtn.addEventListener('click', sendMessage);
popoutBtn.addEventListener('click', openChatPopup);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Add event listeners for chat settings
document.getElementById('angryViewers').addEventListener('change', updateChatSettings);
document.getElementById('memeViewers').addEventListener('change', updateChatSettings);
document.getElementById('happyViewers').addEventListener('change', updateChatSettings);
document.getElementById('botViewers').addEventListener('change', updateChatSettings);
document.getElementById('sillyViewers').addEventListener('change', updateChatSettings);
document.getElementById('sadViewers').addEventListener('change', updateChatSettings);
document.getElementById('confusedViewers').addEventListener('change', updateChatSettings);
document.getElementById('fanViewers').addEventListener('change', updateChatSettings);
document.getElementById('mutedChat').addEventListener('change', toggleChatMute);
document.getElementById('disableDonations').addEventListener('change', toggleDonations);

// Add event listeners for creating polls
document.getElementById('createPollBtn').addEventListener('click', togglePollForm);
document.getElementById('addOptionBtn').addEventListener('click', addPollOption);
document.getElementById('pollForm').addEventListener('submit', createPoll);

// Add event listener for AI interval selection
document.getElementById('aiIntervalSelect').addEventListener('change', function(e) {
    aiCheckInterval = parseFloat(e.target.value);
    // Restart AI chat generation with new interval if currently active
    if (aiChatInterval) {
        stopAIChatGeneration();
        if ((mediaRecorder && mediaRecorder.state === 'recording') || 
            (preview.src && !preview.srcObject)) {
            startAIChatGeneration();
        }
    }
});

function updateChatSettings(e) {
    const setting = e.target.id.replace('Viewers', '').toLowerCase();
    chatSettings[setting] = e.target.checked;
}

function toggleChatMute(e) {
    chatSettings.muted = e.target.checked;
    
    // Stop or restart AI chat generation based on mute setting
    if (chatSettings.muted) {
        stopAIChatGeneration();
    } else if ((mediaRecorder && mediaRecorder.state === 'recording') || 
               (preview.src && !preview.srcObject)) {
        // Restart AI chat generation if we're recording or streaming a video
        startAIChatGeneration();
    }
}

function toggleDonations(e) {
    chatSettings.disableDonations = e.target.checked;
    
    // Stop or restart donation generation based on setting
    if (chatSettings.disableDonations) {
        stopDonationGeneration();
    } else if ((mediaRecorder && mediaRecorder.state === 'recording') || 
               (preview.src && !preview.srcObject)) {
        // Restart donation generation if we're recording or streaming a video
        startDonationGeneration();
    }
}

// Function to start recording
async function startRecording() {
    recordedChunks = [];
    
    // Try to get the streamer username
    try {
        const user = await window.websim.getUser();
        if (user && user.username) {
            streamerUsername = user.username;
            console.log("Streamer identified as:", streamerUsername);
        }
    } catch (error) {
        console.error("Could not fetch streamer username:", error);
    }
    
    try {
        // Check if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Request permission to record screen with appropriate constraints
        if (isMobile) {
            // Mobile devices mostly support camera recording rather than screen recording
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true
            });
            recordingStatus.textContent = "正在从摄像头直播...";
        } else {
            // Desktop screen recording
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                    cursor: "always",
                    displaySurface: "monitor"
                },
                audio: true
            });
        }
        
        // Add event listener for when the user stops sharing
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            // Treat this the same as clicking the stop button
            stopRecording();
        });
        
        // Set up media recorder
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = function() {
            // Create preview video
            const blob = new Blob(recordedChunks, {
                type: 'video/webm'
            });
            const url = URL.createObjectURL(blob);
            preview.src = url;
            
                    // Update UI
        recordingStatus.textContent = "直播完成";
        if (downloadBtn) downloadBtn.disabled = false;
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        // Start recording
        mediaRecorder.start();
        
            // Update UI
    startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
        if (!isMobile) {
            recordingStatus.textContent = "正在直播...";
        }
        
        // Start timer
        startTime = Date.now();
        startTimer();
        
        // Show preview of what's being recorded
        preview.srcObject = stream;
        
        // Start AI chat based on video content
        startAIChatGeneration();
        
        // Start donation generation
        startDonationGeneration();
        
    } catch (error) {
        console.error("Error starting recording:", error);
        if (error.name === 'NotFoundError' || 
            error.name === 'NotAllowedError' || 
            error.message.includes('getDisplayMedia is not a function')) {
            recordingStatus.textContent = "错误：请允许摄像头/麦克风权限。某些浏览器可能不支持屏幕直播或摄像头直播。";
        } else {
            recordingStatus.textContent = "开始直播失败: " + error.message;
        }
    }
}

// Updated stopRecording function to also handle streamed videos
function stopRecording() {
    // Stop timer and AI chat generation regardless of source type
    clearInterval(timerInterval);
    stopAIChatGeneration();
    stopDonationGeneration();
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    } else if (preview.src && !preview.srcObject) {
        // For video file streaming mode: pause playback and update UI
        preview.pause();
        if (downloadBtn) downloadBtn.disabled = false;
        recordingStatus.textContent = "视频播放完成";
    }
    
    startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

// Function to download recording
function downloadRecording() {
    if (recordedChunks.length === 0) {
        return;
    }
    
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Get current date and time for filename
    const now = new Date();
    const filename = `screen-recording-${now.toISOString().split('T')[0]}-${now.getHours()}-${now.getMinutes()}.webm`;
    
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// Timer function
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const seconds = Math.floor((elapsedTime / 1000) % 60);
        const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
        
        timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Function to start AI chat generation based on screen content
function startAIChatGeneration() {
    // Clear any existing interval
    stopAIChatGeneration();
    
    // Don't start if chat is muted
    if (chatSettings.muted) {
        return;
    }
    
    // Use the selected interval for AI checks
    aiChatInterval = setInterval(() => {
        // Only allow a limited number of capture requests to be pending at once
        if (pendingCaptureRequests < maxSimultaneousCaptureRequests) {
            captureAndGenerateMessages();
        }
    }, aiCheckInterval * 1000);
    
    // Initial capture and message generation
    captureAndGenerateMessages();
}

function stopAIChatGeneration() {
    clearInterval(aiChatInterval);
}

async function captureAndGenerateMessages() {
    if (!preview.srcObject && !preview.src) return;
    
    try {
        pendingCaptureRequests++;
        
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Request AI description of the current frame using AIController
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        if (danmaku && danmaku.length > 0) {
            for (let i = 0; i < danmaku.length; i++) {
                setTimeout(() => {
                    const colorClass = `color-${Math.floor(Math.random() * 6) + 1}`;
                    addMessageToChat(danmaku[i].username, danmaku[i].message, colorClass);
                }, i * 2000);
            }
        }
    } catch (error) {
        console.error("Error generating AI messages:", error);
    } finally {
        pendingCaptureRequests--;
    }
}

// Chat functionality
function addMessageToChat(username, message, colorClass) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <span class="username ${colorClass}">${username}:</span>
        <span class="message-content">${message}</span>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add username to set for viewer count (excluding 'You')
    if (username !== 'You') {
        uniqueUsernames.add(username);
        updateViewerCount();
    }
    
    // Also send to popup if it exists and is open
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'newMessage',
            message: {
                username: username,
                content: message,
                colorClass: colorClass
            }
        }, '*');
    }
}

function updateViewerCount() {
    const count = Math.floor(uniqueUsernames.size * 1.5);
    document.getElementById('viewerCount').textContent = count;
    
    // Update popup viewer count if open
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'viewerCountUpdate',
            count: count
        }, '*');
    }
}

function sendMessage() {
    const message = chatInput.value.trim();
    
    // Only allow sending messages if recording or streaming is active
    if (!message || ((!mediaRecorder || mediaRecorder.state !== 'recording') && (!preview.src || preview.srcObject))) {
        return;
    }
    
    // Include the sent message in the next AI prompt (only for one check)
    extraUserMessageForAI = message;
    
    // Add message to chat using streamer's username
    addMessageToChat(streamerUsername || 'You', message, 'color-4');
    chatInput.value = '';
    
    // Generate AI responses to user message, passing the username
    generateAIResponseToUserMessage(message, streamerUsername || 'You');
}

// New function to generate AI responses to user messages
async function generateAIResponseToUserMessage(userMessage, username) {
    try {
        // Capture current screen for AI analysis
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use AIController to generate responses
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        // Add the messages to chat with slight delays
        if (danmaku && danmaku.length > 0) {
            danmaku.forEach((msgData, index) => {
                setTimeout(() => {
                    const colorClass = `color-${Math.floor(Math.random() * 6) + 1}`;
                    addMessageToChat(msgData.username, msgData.message, colorClass);
                }, index * 800); // Stagger messages slightly
            });
        }
        
    } catch (error) {
        console.error("Error generating AI response:", error);
    }
}

let chatPopupWindow = null;

function openChatPopup() {
    // Close any existing popup
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.close();
    }
    
    // Create a new popup window
    chatPopupWindow = window.open('popup.html', 'StreamChat', 'width=350,height=600,resizable=yes');
    
    // Set up communication between windows
    window.addEventListener('message', function(event) {
        if (event.data.type === 'newUserMessage') {
            addMessageToChat('You', event.data.message, 'color-4');
        } else if (event.data.type === 'requestPollUpdate' && activePoll) {
            // Send current poll data when popup requests an update
            event.source.postMessage({
                type: activePoll ? 'pollUpdate' : 'pollRemoved',
                poll: activePoll ? JSON.parse(JSON.stringify(activePoll)) : null,
                totalVotes: totalVotes
            }, '*');
        }
    });
    
    // If there's an active poll, send it to the popup
    chatPopupWindow.addEventListener('load', function() {
        // Send viewer count to popup
        chatPopupWindow.postMessage({
            type: 'viewerCountUpdate',
            count: Math.floor(uniqueUsernames.size * 1.5)
        }, '*');
        
        if (activePoll) {
            chatPopupWindow.postMessage({
                type: 'newPoll',
                poll: JSON.parse(JSON.stringify(activePoll))
            }, '*');
            
            chatPopupWindow.postMessage({
                type: 'pollUpdate',
                poll: JSON.parse(JSON.stringify(activePoll)),
                totalVotes: totalVotes
            }, '*');
        }
    });
    
    // If there's an active poll, send it to the popup
}

// Poll functions
function togglePollForm() {
    const formContainer = document.getElementById('pollFormContainer');
    const isHidden = formContainer.style.display === 'none';
    
    formContainer.style.display = isHidden ? 'block' : 'none';
    createPollBtn.textContent = isHidden ? '取消投票' : '创建投票';
    
    // Reset form if hiding
    if (!isHidden) {
        pollForm.reset();
        const optionsContainer = document.getElementById('pollOptions');
        while (optionsContainer.children.length > 2) {
            optionsContainer.removeChild(optionsContainer.lastChild);
        }
    }
}

function addPollOption() {
    const optionsContainer = document.getElementById('pollOptions');
    const optionIndex = optionsContainer.children.length + 1;
    
    const optionContainer = document.createElement('div');
    optionContainer.className = 'option-container';
    
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.name = `option${optionIndex}`;
    optionInput.placeholder = `Option ${optionIndex}`;
    optionInput.required = true;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', function() {
        optionsContainer.removeChild(optionContainer);
    });
    
    optionContainer.appendChild(optionInput);
    optionContainer.appendChild(removeBtn);
    optionsContainer.appendChild(optionContainer);
}

function createPoll(e) {
    e.preventDefault();
    
    // If there's already an active poll, don't create a new one
    if (activePoll) {
        return;
    }
    
    const formData = new FormData(pollForm);
    const title = formData.get('pollTitle');
    const duration = parseInt(formData.get('duration'), 10);
    
    const options = [];
    let i = 1;
    while (formData.has(`option${i}`)) {
        const optionText = formData.get(`option${i}`).trim();
        if (optionText) {
            options.push({
                text: optionText,
                votes: 0
            });
        }
        i++;
    }
    
    // Need at least 2 options
    if (options.length < 2) {
        return;
    }
    
    // Create the poll
    activePoll = {
        title,
        options,
        duration,
        startTime: Date.now(),
        endTime: Date.now() + duration * 1000,
        isActive: true
    };
    
    totalVotes = 0;
    
    // Hide form and update button
    togglePollForm();
    
    // Show the active poll
    updateActivePoll();
    
    // Start the timer
    startPollTimer();
    
    // Notify the popout window about the new poll
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'newPoll',
            poll: JSON.parse(JSON.stringify(activePoll))
        }, '*');
    }
    
    // Generate AI messages about the poll
    generatePollMessages(title, options);
}

function updateActivePoll() {
    if (!activePoll) {
        activePollContainer.innerHTML = '';
        return;
    }
    
    // Calculate time remaining
    const timeRemaining = Math.max(0, activePoll.endTime - Date.now());
    const secondsRemaining = Math.ceil(timeRemaining / 1000);
    
    // Create the poll UI
    let pollHTML = `
        <div class="active-poll">
            <div class="active-poll-title">${activePoll.title}</div>
            <div class="poll-options">
    `;
    
    // Add options
    activePoll.options.forEach((option, index) => {
        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        
        pollHTML += `
            <div class="poll-option" onclick="voteOnPoll(${index})">
                <div class="poll-option-bar" style="width: ${percentage}%"></div>
                <div class="poll-option-text">
                    <span>${option.text}</span>
                    <span>${percentage}%</span>
                </div>
            </div>
        `;
    });
    
    pollHTML += `
            </div>
            <div class="poll-timer">
                <div class="poll-timer-bar" style="width: ${(timeRemaining / (activePoll.duration * 1000)) * 100}%"></div>
            </div>
            <div class="poll-votes">
                <span>${totalVotes} 票</span>
                <span>剩余 ${secondsRemaining} 秒</span>
            </div>
    `;
    
    // Add close button only for active polls
    if (activePoll.isActive) {
        pollHTML += `<button class="poll-close-btn" onclick="endPoll()">结束投票</button>`;
    } else {
        const winningText = activePoll.winningOption ? 
            `投票结束，"${activePoll.winningOption.text}"获胜！` : 
            "投票结束";
        pollHTML += `<div class="poll-status">${winningText}</div>`;
    }
    
    pollHTML += `</div>`;
    
    activePollContainer.innerHTML = pollHTML;
    
    // Update popout window
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'pollUpdate',
            poll: JSON.parse(JSON.stringify(activePoll)),
            totalVotes: totalVotes
        }, '*');
    }
}

function voteOnPoll(optionIndex) {
    if (!activePoll || !activePoll.isActive) return;
    
    // Increment votes for the selected option
    activePoll.options[optionIndex].votes++;
    totalVotes++;
    
    // Update UI
    updateActivePoll();
    
    // Update popout window
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'pollUpdate',
            poll: JSON.parse(JSON.stringify(activePoll)),
            totalVotes: totalVotes
        }, '*');
    }
    
    // Generate AI chat reactions to voting
    generatePollVoteMessage(activePoll.options[optionIndex].text);
}

function getRandomUsername() {
    const usernames = [
        'StreamFan', 'PixelGamer', 'TwitchViewer', 'ChatEnjoyer', 'StreamNinja',
        'GamingWizard', 'ViewerX', 'StreamLover', 'PogChampion', 'ChatMaster',
        'LurkerPro', 'StreamFollower', 'EmoteSpammer', 'SubScriber', 'TwitchPrime'
    ];
    
    // Generate a random username and add random numbers
    const baseUsername = usernames[Math.floor(Math.random() * usernames.length)];
    return `${baseUsername}${Math.floor(Math.random() * 1000)}`;
}

async function generatePollVoteMessage(optionText) {
    try {
        // Capture current screen for AI analysis
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use AIController to generate a single response
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        if (danmaku && danmaku.length > 0) {
            // Use the first message as a reaction to the vote
            const colorClass = `color-${Math.floor(Math.random() * 6) + 1}`;
            addMessageToChat(danmaku[0].username, danmaku[0].message, colorClass);
        }
        
    } catch (error) {
        console.error("Error generating poll reaction:", error);
    }
}

function startPollTimer() {
    // Clear any existing timer
    if (pollTimer) {
        clearInterval(pollTimer);
    }
    
    // Update the poll every second
    pollTimer = setInterval(() => {
        if (!activePoll) {
            clearInterval(pollTimer);
            return;
        }
        
        // Check if the poll has ended
        if (activePoll.isActive && Date.now() >= activePoll.endTime) {
            endPoll();
        } else {
            updateActivePoll();
            
            // Add AI votes periodically during active polls
            if (activePoll.isActive && Math.random() < 0.5) { // 50% chance each tick to add votes
                // Generate 1-3 votes each time
                const votesToAdd = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < votesToAdd; i++) {
                    simulateAIVote();
                }
            }
        }
    }, 1000);
}

function simulateAIVote() {
    if (!activePoll || !activePoll.isActive) return;
    
    // Randomly select an option to vote for
    const optionIndex = Math.floor(Math.random() * activePoll.options.length);
    
    // Increment votes for that option
    activePoll.options[optionIndex].votes++;
    totalVotes++;
    
    // Update UI
    updateActivePoll();
    
    // Update popout window
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'pollUpdate',
            poll: JSON.parse(JSON.stringify(activePoll)),
            totalVotes: totalVotes
        }, '*');
    }
    
    // Occasionally have an AI chatter mention their vote
    if (Math.random() < 0.2) { // 20% chance to announce the vote
        generatePollVoteMessage(activePoll.options[optionIndex].text);
    }
}

function endPoll() {
    if (!activePoll) return;
    
    activePoll.isActive = false;
    activePoll.endTime = Date.now();
    
    // Find winning option
    let winningOption = activePoll.options[0];
    let winningIndex = 0;
    
    activePoll.options.forEach((option, index) => {
        if (option.votes > winningOption.votes) {
            winningOption = option;
            winningIndex = index;
        }
    });
    
    // Add winning option to poll data
    activePoll.winningOption = winningOption;
    activePoll.winningIndex = winningIndex;
    
    updateActivePoll();
    
    // Clear timer
    clearInterval(pollTimer);
    
    // Notify popup
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'pollEnded',
            poll: JSON.parse(JSON.stringify(activePoll)),
            totalVotes: totalVotes
        }, '*');
    }
    
    // Generate messages about poll results
    generatePollResultMessages(winningOption, winningIndex);
    
    // After 10 seconds, remove the poll
    setTimeout(() => {
        activePoll = null;
        updateActivePoll();
        
        // Notify popup
        if (chatPopupWindow && !chatPopupWindow.closed) {
            chatPopupWindow.postMessage({
                type: 'pollRemoved'
            }, '*');
        }
    }, 10000);
}

async function generatePollMessages(title, options) {
    try {
        // Capture current screen for AI analysis
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use AIController to generate responses
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        // Display messages with delays
        if (danmaku && danmaku.length > 0) {
            danmaku.forEach((msgData, index) => {
                setTimeout(() => {
                    const colorClass = `color-${Math.floor(Math.random() * 6) + 1}`;
                    addMessageToChat(msgData.username, msgData.message, colorClass);
                }, 500 + index * 1500 + Math.random() * 1000);
            });
        }
    } catch (error) {
        console.error("Error generating poll reactions:", error);
    }
}

async function generatePollResultMessages(winningOption, winningIndex) {
    try {
        // Capture current screen for AI analysis
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use AIController to generate responses
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        // Display messages with delays
        if (danmaku && danmaku.length > 0) {
            danmaku.forEach((msgData, index) => {
                setTimeout(() => {
                    const colorClass = `color-${Math.floor(Math.random() * 6) + 1}`;
                    addMessageToChat(msgData.username, msgData.message, colorClass);
                }, 500 + index * 1500 + Math.random() * 1000);
            });
        }
    } catch (error) {
        console.error("Error generating poll result reactions:", error);
    }
}

async function streamVideo() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/*';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Stop any ongoing screen recording if active
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    stopRecording();
                }
                
                // Reset state and UI for video file streaming
                recordedChunks = [];
                clearInterval(timerInterval);
                startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                if (downloadBtn) downloadBtn.disabled = true;
                recordingStatus.textContent = "正在播放视频...";
                
                // Clear previous chat history when switching videos
                previousMessages = [];
                previousUsernames = [];
                uniqueUsernames.clear(); // Reset unique usernames
                updateViewerCount(); // Reset viewer count
                
                // Create object URL for the selected video file
                const videoURL = URL.createObjectURL(file);
                
                // Use the preview element for video playback
                preview.srcObject = null;
                preview.src = videoURL;
                preview.muted = false; // Enable sound for video files
                
                preview.onloadedmetadata = () => {
                    startTime = Date.now();
                    startTimer();
                    preview.play();
                    startAIChatGeneration();
                    preview.onended = () => {
                        stopRecording();
                        recordingStatus.textContent = "视频播放完成";
                    };
                };
            } catch (error) {
                console.error("Error streaming video:", error);
                recordingStatus.textContent = "播放视频失败: " + error.message;
            }
        }
    };
    
    fileInput.click();
}

function startDonationGeneration() {
    // Clear any existing interval
    stopDonationGeneration();
    
    // Don't start if donations are disabled
    if (chatSettings.disableDonations) {
        return;
    }
    
    donationTimer = setInterval(() => {
        if (Math.random() < 0.08) { 
            generateDonation();
        }
    }, 2000);
}

function stopDonationGeneration() {
    clearInterval(donationTimer);
}

async function generateDonation() {
    try {
        // Capture current screen for AI analysis
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use AIController to generate donation content
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        if (danmaku && danmaku.length > 0) {
            // Use the first message as a donation
            const donation = {
                username: danmaku[0].username,
                amount: Math.random() < 0.5 ? `${Math.floor(Math.random() * 100) + 1} bits` : `$${Math.floor(Math.random() * 50) + 1}`,
                message: danmaku[0].message,
                type: danmaku[0].message.includes('bits') ? 'bits' : 'dollars'
            };
            
            // Add the donation to chat
            addDonationToChat(donation.username, donation.amount, donation.message, donation.type);
            
            // Generate chat reactions to the donation
            generateDonationReactions(donation.username, donation.amount, donation.type);
        }
        
    } catch (error) {
        console.error("Error generating donation:", error);
    }
}

async function generateDonationReactions(donorUsername, amount, donationType) {
    try {
        // Capture current screen for AI analysis
        captureCanvas.width = preview.videoWidth;
        captureCanvas.height = preview.videoHeight;
        captureContext.drawImage(preview, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use AIController to generate responses
        const danmaku = await window.aiController.getDanmakuFromImage(imageDataUrl);
        
        // Add the messages to chat with slight delays
        if (danmaku && danmaku.length > 0) {
            danmaku.forEach((msgData, index) => {
                setTimeout(() => {
                    const colorClass = `color-${Math.floor(Math.random() * 6) + 1}`;
                    addMessageToChat(msgData.username, msgData.message, colorClass);
                }, index * 1200 + 800); 
            });
        }
        
    } catch (error) {
        console.error("Error generating donation reactions:", error);
    }
}

function addDonationToChat(username, amount, message, type) {
    const donationElement = document.createElement('div');
    donationElement.className = 'donation-message';
    
    // Set appropriate CSS class based on donation type
    if (type === "bits") {
        donationElement.classList.add('bits-donation');
    } else {
        donationElement.classList.add('dollars-donation');
    }
    
    donationElement.innerHTML = `
        <div>
            <span class="donation-amount">${amount}</span>
            <span class="donation-username">${username}</span>
        </div>
        <div class="donation-text">${message}</div>
    `;
    
    chatMessages.appendChild(donationElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add username to set for viewer count (excluding 'You')
    if (username !== 'You') {
        uniqueUsernames.add(username);
        updateViewerCount();
    }
    
    // Also send to popup if it exists and is open
    if (chatPopupWindow && !chatPopupWindow.closed) {
        chatPopupWindow.postMessage({
            type: 'newDonation',
            donation: {
                username: username,
                amount: amount,
                message: message,
                type: type
            }
        }, '*');
    }
}