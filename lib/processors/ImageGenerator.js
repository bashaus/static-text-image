const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const _ = { defaultsDeep: require('lodash.defaultsdeep') };

const text2png = require('text2png');
const { createCanvas, Image } = require('canvas');

const defaultConfig = yaml.safeLoad(
    fs.readFileSync(__dirname + '/../_defaults.yaml')
);

module.exports = class {
    constructor(configProcessor, content) {
        this.configProcessor = configProcessor;
        this.tagProcessor = configProcessor.tagProcessor;
        this.documentProcessor = this.tagProcessor.documentProcessor;
        this.requestProcessor = this.documentProcessor.requestProcessor;
        this.content = content;

        this.canvas = null;
        this.ctx = null;
    }

    generate() {
        // Background layer
        const backgroundLayer = this._generateBackgroundLayer();
        let backgroundLayerWidth = 0, backgroundLayerHeight = 0;

        if (backgroundLayer) {
            backgroundLayerWidth = backgroundLayer.width;
            backgroundLayerHeight = backgroundLayer.height;
        }

        // Text layer
        const textLayer = this._generateTextLayer();

        // Assemble
        const canvasWidth = Math.max(backgroundLayerWidth, textLayer.width);
        const canvasHeight = Math.max(backgroundLayerHeight, textLayer.height);

        this.canvas = createCanvas(canvasWidth, canvasHeight);
        this.ctx = this.canvas.getContext('2d');

        if (this.configProcessor.options.background.src) {
            this.ctx.drawImage(backgroundLayer, 0, 0);
        }

        if (textLayer) {
            const textLayerPosition = this._getPosition(
                this.configProcessor.options.textBox.offset,
                textLayer.width,
                textLayer.height
            );

            this.ctx.drawImage(
                textLayer,
                textLayerPosition.absolute.x,
                textLayerPosition.absolute.y
            );
        }

        this._applySprites();

        return this.canvas;
    }

    _generateBackgroundLayer() {
        if (this.configProcessor.options.background.src) {
            const backgroundLayer = new Image();
            backgroundLayer.src = fs.readFileSync(this.configProcessor.options.background.src);

            return backgroundLayer;
        }

        return null;
    }

    _generateTextLayer() {
        // Draw the text
        const textBox = this.configProcessor.options.textBox;
        let textLayer = null;
        let textLayerX = 0, textLayerY = 0;

        if (textBox) {
            textBox.output = 'canvas';

            switch (textBox.textTransform || null) {
                case 'uppercase':
                    this.content = this.content.toUpperCase();
                    break;

                case 'lowercase':
                    this.content = this.content.toLowerCase();
                    break;

                case null:
                    break;

                default:
                    throw new Error('Invalid textTransform: ' + textBox.textTransform);
            }


            return text2png(this.content, textBox);
        }

        return null;
    }

    _applySprites() {
        this.configProcessor.options.sprites.forEach(sprite => {
            const image = new Image();
            image.src = fs.readFileSync(sprite.src);

            const dimensions = this._ratioAspect(
                image,
                sprite.width,
                sprite.height
            );

            // Apply relative to the registration point
            const position = this._getPosition(
                sprite.offset,
                dimensions.width,
                dimensions.height
            );

            this.ctx.drawImage(
                image,
                position.absolute.x,
                position.absolute.y,
                dimensions.width,
                dimensions.height
            );
        });
    }

    _ratioAspect(image, width, height) {
        const dimensions = { width: 0, height: 0 };

        // Define width
        if (width) {
            dimensions.width = width;
        } else if (height) {
            dimensions.width = image.width * (height / image.height);
        } else {
            dimensions.width = image.width;
        }

        // Define height
        if (height) {
            dimensions.height = height;
        } else if (width) {
            dimensions.height = image.height * (width / image.width);
        } else {
            dimensions.height = image.height;
        }

        return dimensions;
    }

    _getPosition(offset, width, height) {
        const position = {
            relative: { x: 0, y: 0 },
            absolute: { x: 0, y: 0 }
        }

        // Define X Position
        if (offset.left != null) {
            position.relative.x = offset.left;
        } else if (offset.right != null) {
            position.relative.x = this.canvas.width - offset.right;
        };

        // Define Y Position
        if (offset.top != null) {
            position.relative.y = offset.top;
        } else if (offset.bottom != null) {
            position.relative.y = this.canvas.height - offset.bottom;
        };

        position.absolute.x = position.relative.x;
        position.absolute.y = position.relative.y;

        // Set a default registration point based on
        if (!offset.registrationPoint) {
            offset.registrationPoint = '';

            if (offset.bottom != null) {
                offset.registrationPoint += 'S';
            } else {
                offset.registrationPoint += 'N';
            }

            if (offset.right != null) {
                offset.registrationPoint += 'E';
            } else {
                offset.registrationPoint += 'W';
            }
        }

        // Define registration position;
        if (['N', 'M', 'C', 'S'].indexOf(offset.registrationPoint) >= 0) {
            position.absolute.x -= width / 2;
        }

        if (['NE', 'E', 'SE'].indexOf(offset.registrationPoint) >= 0) {
            position.absolute.x -= width;
        }

        if (['E', 'M', 'C', 'W'].indexOf(offset.registrationPoint) >= 0) {
            position.absolute.y -= height / 2;
        }

        if (['SE', 'S', 'SW'].indexOf(offset.registrationPoint) >= 0) {
            position.absolute.y -= height;
        }

        return position;
    }
};
