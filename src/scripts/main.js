import * as handTrack from 'handtrackjs';
import * as Rectangle from "./rectangle";
import {onReady, requestCamera, startLoading, stopLoading} from "./fns";
import {makeVideoPlayer, setVideoSource, setPlayerVolume} from "./player";

/**
 * Stores the distances between hand tracks
 * @type {Array<Number>} A list of numbers which indicate how far a hand has travelled
 */
let movementBuffer = [];

/**
 * The tensorflow model to detect hands later
 */
let model;

/**
 * Last point which stores coordinates of a hand position
 */
let lastPoint;
/**
 * The last distance a hand has travelled, used to indicate progress
 */
let lastDistance;

/**
 * The volume the player will transition to
 * @type {number}
 */
let currentVolume = 50;

/**
 * Updates the volume bar indicator on the top left
 */
const updateVolumeBar = () => {
    const faderBarCurrent = document.querySelector(".fader .bar-current")
    const faderBarInner = document.querySelector(".fader .bar-inner")

    faderBarInner.style.height = `${currentVolume}px`;
    faderBarCurrent.style.height = `${currentVolume}px`;
}

/**
 * Sets various body classes depending on the current volume, can be used to style things
 * @NOTE: This class also removes every other class attached to the body element
 */
const updateBodyClass = () => {
    let bodyClass = "volume-silent";

    if (currentVolume > 5){
        bodyClass = "volume-super-quiet"
    }

    if (currentVolume > 15){
        bodyClass = "volume-almost-quiet"
    }

    if (currentVolume > 30){
        bodyClass = "volume-little-quiet"
    }

    if (currentVolume > 50){
        bodyClass = "volume-okay"
    }

    if (currentVolume > 75){
        bodyClass = "volume-nice"
    }

    if (currentVolume > 90){
        bodyClass = "volume-super-nice"
    }

    document.body.classList.forEach((className) => {
       document.body.classList.remove(className);
    });

    document.body.classList.add(bodyClass);
}


/**
 * Settings of this application
 * @type {{scoreThreshold: number, minDecrease: number, delay: number, maxNumBoxes: number, minIncrease: number, flipHorizontal: boolean, iouThreshold: number, minVolume: number, travelDistance: number, incremental: boolean}}
 */
const settings = {
    flipHorizontal: true, // Flip camera view
    maxNumBoxes: 1,        // only 1 supported at the moment, how many hands should be detected
    iouThreshold: 0.8,
    scoreThreshold: 0.8, // How "much" of a hand it should detect (might target your head as a hand as well if too low)
    delay: 1000, // The amount of time between volume adjustments
    travelDistance: 100, // travel distance to increase volume
    minDecrease: 5, // how much the volume should decrease if it detects a fall
    minIncrease: 4, // how much the volume should at least increase if it detects a spike
    minVolume: 5, // do not go below the provided volume here (number between 0 and 100)
    incremental: true // should "lasting hand shaking" progress increase the volume even further?
}

/**
 * Counts how many times a user has failed in a row
 * @type {number}
 */
let decreaseCounter = 1;

/**
 * Counts how many times a user has succeeded in a row
 * @type {number}
 */
let increaseCounter = 1;

/**
 * Takes a buffer of movements and returns an adjusted volume
 * @param buffer {Array<Number>} A list of numbers which hold general movement distances between rectangles detected
 * by handtrack.js
 * @returns {number} The updated volume
 */
const movementToVolume = (buffer) => {
    const currentMovementTotal = buffer.reduce((cur, prev) => cur + prev, 0);

    let newVolume;
    if (currentMovementTotal > settings.travelDistance){
        decreaseCounter = 1;
        newVolume = currentVolume + (settings.minIncrease + increaseCounter);
        if (settings.incremental){
            increaseCounter++;
        }
    } else {
        increaseCounter = 1;
        newVolume = currentVolume - (settings.minDecrease + decreaseCounter);
        if (settings.incremental){
            decreaseCounter++;
        }
    }

    if (newVolume < settings.minVolume){
        newVolume = settings.minVolume;
    }

    return newVolume;
}

/**
 * TODO: Unneeded at the moment, doesnt do much logic
 * @param buffer
 * @returns {Promise<any>}
 */
const calculateNextVolume = (buffer) => {
    return new Promise((resolve) => {
        resolve(movementToVolume(buffer));
    })
}

/**
 * Attach events to various dom elements and init a player
 */
const initEvents = () => {
    const urlInput = document.querySelector("#urlinput");
    const player = makeVideoPlayer();

    // Youtube URL set
    urlInput.addEventListener("change", () => {
        const youtubeUrl = urlInput.value;

        // TODO: implement error handling and url checking
        setVideoSource(player, youtubeUrl);
        window.location.hash = btoa(youtubeUrl);
    });

    // Implements Youtube URL sharing
    if (window.location.hash){
        setVideoSource(player, atob(window.location.hash.substr(1)));
    }


    // Main application loop
    const loop = () => {
        calculateNextVolume(movementBuffer).then((value) => {
            currentVolume = value;

            movementBuffer = [];
            updateVolumeBar();
            updateBodyClass();
            // updatePlayerSpeed();

            setTimeout(loop, settings.delay);
        });
    }

    // We measure the updated player volume by using our volume bar
    // This allows for a nice fade effect as we'er using transitions anyway
    setInterval(() => {
        setPlayerVolume(player, document.querySelector(".bar-inner").getBoundingClientRect().height / 100);
    }, 1000 / 16);

    loop();
}

/**
 * Boot the primary application
 * This also loads the heavy tensorflow models in the background
 */
const bootShakeHands = () => {
    const video = document.getElementById("video");
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext("2d");

    // Run hand detections on each video frame
    const runDetection = () => {
        model.detect(video).then(predictions => {
            // Render boxes into the video itself
            model.renderPredictions(predictions, canvas, context, video);

            const prediction = predictions[0];

            if (!prediction){
                // TODO: punish or not if no hand was detected in the frame?
                requestAnimationFrame(runDetection);
                return;
            }

            // We need at least 2 detected hands in 2 different frames to play
            if (!lastPoint){
                lastPoint = new Rectangle(prediction.bbox);
                requestAnimationFrame(runDetection);
                return;
            }

            const currentPoint = new Rectangle(prediction.bbox);
            const currentDistance = currentPoint.distanceTo(lastPoint);

            // And we need the last distance between points to continue
            if (!lastDistance){
                lastDistance = currentDistance;
                requestAnimationFrame(runDetection);
                return;
            }

            const diff = Math.abs(Math.abs(currentDistance) - Math.abs(lastDistance));
            movementBuffer.push(diff);

            lastDistance = currentDistance;

            // Rerun the loop after letting JS some spare time to do its things
            requestAnimationFrame(runDetection);
        });
    }

    requestCamera(() => {
        startLoading("Getting ready...")
        handTrack.load(settings).then(handModel => {
            model = handModel;
            startLoading("Loading video");
            handTrack.startVideo(video).then(function (status) {
                stopLoading();
                initEvents();
                runDetection();
            });
        });
    }, () => {
        alert("No cam, no hiphop");
    });
}

onReady(bootShakeHands);
