// DOM Elements
const webcamElement = document.getElementById('webcam');
const overlayCanvas = document.getElementById('overlay');
const emojiDisplay = document.getElementById('emoji-display');
const scoreDisplay = document.getElementById('score');
const resultDisplay = document.getElementById('result');
const detectedEmotionDisplay = document.getElementById('detected-emotion');
const startButton = document.getElementById('start-btn');
const playAgainButton = document.getElementById('play-again-btn');
const loadingScreen = document.getElementById('loading');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

// Game State
let gameActive = false;
let score = 0;
let currentRound = 0;
let detectionInterval;
const totalRounds = 5;
const countdownDuration = 3; // seconds for countdown between rounds

// Emotions and Emojis mapping
const emotionEmojis = {
    'neutral': '😐',
    'happy': '😀',
    'sad': '😢',
    'angry': '😠',
    'surprised': '😮'
};

// Current target emotion
let targetEmotion = '';

// Face detection variables
let faceApiReady = false;
let detectionOptions;

// Initialize face-api.js
async function initFaceAPI() {
    try {
        // Update loading message with progress
        const loadingText = document.querySelector('#loading p');
        loadingText.innerHTML = 'Loading models... <span id="progress">0%</span>';
        const progressElement = document.getElementById('progress');
        
        // Use vladmandic's face-api.js CDN for models
        // This is a maintained fork of the original face-api.js
        const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
        
        // Use Promise.all to load models in parallel with proper error handling
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl).then(() => {
                progressElement.textContent = '50%';
                console.log('TinyFaceDetector model loaded');
            }),
            faceapi.nets.faceExpressionNet.loadFromUri(modelUrl).then(() => {
                progressElement.textContent = '100%';
                console.log('FaceExpressionNet model loaded');
            })
        ]);
        
        // Set up detection options
        detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
        });
        
        // Mark as ready
        faceApiReady = true;
        loadingScreen.style.display = 'none';
        
        console.log('Face API models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api models:', error);
        
        // Try fallback approach - load from GitHub directly
        try {
            loadingScreen.querySelector('p').textContent = 'Trying alternative source...';
            const fallbackUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(fallbackUrl),
                faceapi.nets.faceExpressionNet.loadFromUri(fallbackUrl)
            ]);
            
            // Set up detection options
            detectionOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.5
            });
            
            // Mark as ready
            faceApiReady = true;
            loadingScreen.style.display = 'none';
            
            console.log('Face API models loaded from fallback source');
        } catch (fallbackError) {
            console.error('Standard fallback loading failed:', fallbackError);
            
            // Try additional fallback strategies
            const success = await tryFallbackModelLoading();
            
            if (!success) {
                // Show comprehensive error message if all attempts fail
                loadingScreen.innerHTML = `
                    <div class="loading-container">
                        <h2>Loading Error</h2>
                        <p>Unable to load face detection models. This may be due to:</p>
                        <ul>
                            <li>Internet connection issues</li>
                            <li>Browser security restrictions</li>
                            <li>Ad-blockers or privacy extensions</li>
                            <li>CORS or content security policy issues</li>
                        </ul>
                        <p>Please try:</p>
                        <ul>
                            <li>Checking your connection</li>
                            <li>Refreshing the page</li>
                            <li>Using a different browser</li>
                            <li>Disabling ad-blockers temporarily</li>
                        </ul>
                        <button onclick="location.reload()">Refresh Page</button>
                    </div>
                `;
            }
        }
    }
}

// Initialize webcam
async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        });
        
        webcamElement.srcObject = stream;
        
        return new Promise((resolve) => {
            webcamElement.onloadedmetadata = () => {
                // Set canvas dimensions to match video
                overlayCanvas.width = webcamElement.videoWidth;
                overlayCanvas.height = webcamElement.videoHeight;
                resolve();
            };
        });
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Unable to access webcam. Please ensure you have a webcam and have granted permission.');
    }
}

// Detect face expressions
async function detectExpressions() {
    if (!faceApiReady || !gameActive) return;
    
    try {
        // Detect faces with expressions
        const detections = await faceapi
            .detectAllFaces(webcamElement, detectionOptions)
            .withFaceExpressions();
        
        // Clear canvas
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        // Process if a face is detected
        if (detections && detections.length > 0) {
            const detection = detections[0];
            
            // Draw face detection box (mirrored)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-overlayCanvas.width, 0);
            
            // Draw rectangle around detected face
            const box = detection.detection.box;
            ctx.strokeStyle = '#4a89dc';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            ctx.restore();
            
            // Get the dominant expression
            const expressions = detection.expressions;
            let dominantExpression = 'neutral';
            let highestScore = 0;
            
            for (const [expression, score] of Object.entries(expressions)) {
                if (score > highestScore && emotionEmojis[expression]) {
                    highestScore = score;
                    dominantExpression = expression;
                }
            }
            
            // Display the detected emotion
            detectedEmotionDisplay.textContent = dominantExpression.charAt(0).toUpperCase() + 
                                                dominantExpression.slice(1);
            
            // Check if detected emotion matches target
            if (dominantExpression === targetEmotion) {
                handleSuccessfulMatch();
            }
        } else {
            detectedEmotionDisplay.textContent = 'No face detected';
        }
    } catch (error) {
        console.error('Error detecting expressions:', error);
    }
}

// Start the game
function startGame() {
    if (!faceApiReady) {
        alert('Face detection is not ready yet. Please wait...');
        return;
    }
    
    // Reset game state
    gameActive = false; // Will be set to true after countdown
    score = 0;
    currentRound = 0;
    scoreDisplay.textContent = '0';
    
    // Update UI
    startButton.disabled = true;
    playAgainButton.disabled = true;
    
    // Don't start detection immediately - it will start after countdown
    
    // Start first round
    startRound();
}

// Initialize the application
async function init() {
    try {
        // Start loading animation
        const stopAnimation = startLoadingAnimation();
        
        // Load FaceAPI models
        await initFaceAPI();
        
        // Complete loading animation
        stopAnimation();
        
        // Setup webcam stream
        await setupWebcam();
        
        // Add event listeners
        startButton.addEventListener('click', startGame);
        playAgainButton.addEventListener('click', startGame);
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        loadingScreen.querySelector('p').textContent = 'Failed to initialize. Please refresh and try again.';
    }
}

// Start a new round
function startRound() {
    // Stop detection if it's running
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Set game to inactive during countdown
    gameActive = false;
    
    // Choose random emotion (different from previous)
    const emotions = Object.keys(emotionEmojis);
    let newEmotion;
    
    do {
        const randomIndex = Math.floor(Math.random() * emotions.length);
        newEmotion = emotions[randomIndex];
    } while (newEmotion === targetEmotion && emotions.length > 1);
    
    targetEmotion = newEmotion;
    emojiDisplay.textContent = emotionEmojis[targetEmotion];
    
    // Reset result
    resultDisplay.textContent = 'Get ready...';
    
    // Start countdown between rounds
    showCountdown(() => {
        // Now start detection after countdown
        gameActive = true;
        
        // Clear previous detection interval if exists
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        
        // Start new detection interval
        detectionInterval = setInterval(detectExpressions, 100);
        
        // Update UI to show active state
        resultDisplay.textContent = 'Mimicking...';
        
        // Set auto-timeout for this round (8 seconds)
        setTimeout(() => {
            // Only proceed if this round is still active
            if (gameActive && targetEmotion !== '') {
                // If still in same round, move to next
                resultDisplay.textContent = 'Moving on...';
                resultDisplay.parentElement.classList.add('incorrect');
                
                setTimeout(() => {
                    resultDisplay.parentElement.classList.remove('incorrect');
                    
                    // Move to next round or end game
                    currentRound++;
                    if (currentRound < totalRounds) {
                        startRound();
                    } else {
                        endGame();
                    }
                }, 1000);
            }
        }, 8000); // 8 seconds to mimic the expression
    });
}

// Handle successful emotion match
function handleSuccessfulMatch() {
    if (!gameActive) return;
    
    // Set game inactive to prevent multiple matches
    gameActive = false;
    
    // Clear detection interval
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Update score
    score++;
    scoreDisplay.textContent = score;
    resultDisplay.textContent = 'Correct!';
    resultDisplay.parentElement.classList.add('correct');
    
    // Save current expression for reference (prevents duplicate success detection)
    const matchedEmotion = targetEmotion;
    targetEmotion = '';
    
    setTimeout(() => {
        resultDisplay.parentElement.classList.remove('correct');
        
        // Move to next round or end game
        currentRound++;
        if (currentRound < totalRounds) {
            startRound();
        } else {
            endGame();
        }
    }, 1000);
}

// Update loading animation
function startLoadingAnimation() {
    const loadingEmoji = document.getElementById('loading-emoji');
    const emojis = ['😐', '😀', '😢', '😠', '😮'];
    let emojiIndex = 0;
    
    // Start emoji animation
    const emojiInterval = setInterval(() => {
        loadingEmoji.textContent = emojis[emojiIndex];
        emojiIndex = (emojiIndex + 1) % emojis.length;
    }, 800);
    
    // Start progress bar animation
    const progressBar = document.querySelector('.loading-progress');
    if (progressBar) {
        progressBar.style.width = '0%';
        
        // Simulate progress
        let width = 0;
        const progressInterval = setInterval(() => {
            width += 2;
            if (width >= 90) {
                clearInterval(progressInterval);
            }
            progressBar.style.width = `${width}%`;
        }, 100);
    }
    
    return () => {
        clearInterval(emojiInterval);
        if (progressBar) progressBar.style.width = '100%';
    };
}

// Show countdown between rounds
function showCountdown(onComplete) {
    let count = countdownDuration;
    countdownNumber.textContent = count;
    countdownOverlay.classList.add('active');
    
    const countInterval = setInterval(() => {
        count--;
        
        if (count <= 0) {
            clearInterval(countInterval);
            countdownOverlay.classList.remove('active');
            if (onComplete) onComplete();
            return;
        }
        
        countdownNumber.textContent = count;
    }, 1000);
}

// Function to try different model loading strategies
async function tryFallbackModelLoading() {
    const loadingText = document.querySelector('#loading p');
    loadingText.textContent = 'Trying local models...';
    
    try {
        // Try loading from local models directory
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
            faceapi.nets.faceExpressionNet.loadFromUri('./models')
        ]);
        
        faceApiReady = true;
        loadingScreen.style.display = 'none';
        console.log('Face API models loaded from local directory');
        return true;
    } catch (error) {
        console.error('Local model loading failed:', error);
        
        // Try one more CDN as last resort
        try {
            loadingText.textContent = 'Trying one more source...';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
            ]);
            
            faceApiReady = true;
            loadingScreen.style.display = 'none';
            console.log('Face API models loaded from original repo demo');
            return true;
        } catch (finalError) {
            console.error('All loading attempts failed:', finalError);
            return false;
        }
    }
}

// Function has been removed as we no longer use a timer bar

// End the game
function endGame() {
    gameActive = false;
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Update UI
    resultDisplay.textContent = `Game Over! Final Score: ${score}/${totalRounds}`;
    detectedEmotionDisplay.textContent = 'None';
    
    // Show appropriate message based on score
    if (score === totalRounds) {
        emojiDisplay.textContent = '🏆';
    } else if (score >= Math.floor(totalRounds / 2)) {
        emojiDisplay.textContent = '👍';
    } else {
        emojiDisplay.textContent = '👎';
    }
    
    // Enable play again button
    playAgainButton.disabled = false;
}

// Start initialization when page loads
window.addEventListener('DOMContentLoaded', init);
