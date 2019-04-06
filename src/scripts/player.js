const defaultOptions = {
    debug: false,
    autopause: false,
    height: 300,
    width: 300,
    volume: 0,
    controls: [],
    loop: {
        active: true
    }
};

/**
 * Sets the video source of a player instance to a youtube URL
 * @param of {Plyr} A plyr player instance
 * @param to {string} The youtube URL you want to load
 * @param autoplay {boolean} Whether or not the video should auto play afterwards
 */
export const setVideoSource = (of, to, autoplay = true) => {
    of.source = {
        type: 'video',
        sources: [
            {
                src: to,
                provider: 'youtube',
            },
        ],
    };

    if (!autoplay){ return; }

    of.play();
    of.on("ready", () => {
        of.play();
    })
};

/**
 * Set player volume of player to a new value
 * @param of {Plyr} A plyr player instance
 * @param to {Number} The new volume. A number between 0(muted) and 1(max volume)
 */
export const setPlayerVolume = (of, to) => {
    of.volume = to;
}

/**
 * Initialize a new instance of plyr
 * @param options {object} A set of options, @see defaultOptions for all supported configs
 */
export const makeVideoPlayer = (options = {}) => {
    return new Plyr('#youtube', Object.assign(options, defaultOptions));
}
