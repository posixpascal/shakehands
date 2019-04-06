/**
 * Shortcut to execute a function if the dom is ready for manipulation
 * @param cb {Function} The function you want to execute
 */
export const onReady = (cb) => {
    document.addEventListener("DOMContentLoaded", () => {
        cb();
    });
}

/**
 * Request web camera without audio
 * @param success {Function} A function which is executed if the user gives us permission.
 * This function receives the video stream as its first argument
 * @param error {Function} A function which is executed if the user denies our permission request
 * This function receives an error object as its first argument
 */
export const requestCamera = (success, error) => {
    navigator.getUserMedia(
        {
            video: true,
            audio: false,
        },
        success,
        error
    );
}

/**
 * Show a loading indicator above all other elements
 * @param text {String} The subtitle you want to show
 */
export const startLoading = (text) => {
    document.querySelector(".loader").classList.remove("hidden");
    document.querySelector(".loader-text").innerHTML = text;
}

/**
 * Hides the loading indicator
 */
export const stopLoading = () => {
    document.querySelector(".loader").classList.add("hidden");
}

