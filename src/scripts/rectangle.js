/**
 * Simple Rectangle(x, y) class wrapper
 * It's more or less a rectangle to be honest
 */
export default class Rectangle {
    /**
     * Initialize a rect on a grid by passing it an array [x,y,width,height]
     * @param bbox The bounding box provided by handtrack.js
     */
    constructor(bbox){
        this.x = bbox[0];
        this.y = bbox[1];
        this.width = bbox[2];
        this.height = bbox[3];

        this.centerPoint = {
            x: Math.round(this.x + (this.width / 2)),
            y: Math.round(this.y + (this.height / 2))
        }
    }

    /**
     * Compares the center points of 2 given rectangles
     * @param otherPoint {Rectangle} The rect you want to compare to
     * @returns {number} The distance between the two points/rects
     */
    distanceTo(otherPoint){
        return Math.sqrt(
            Math.pow(this.centerPoint.x - otherPoint.centerPoint.x, 2) +
            Math.pow(this.centerPoint.y - otherPoint.centerPoint.y, 2)
        );
    }
}
