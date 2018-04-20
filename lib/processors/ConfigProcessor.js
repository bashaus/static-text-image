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
    constructor(tagProcessor, filePath) {
        this.tagProcessor = tagProcessor;
        this.documentProcessor = tagProcessor.documentProcessor;
        this.requestProcessor = this.documentProcessor.requestProcessor;

        this.filePath = filePath;
        this.fileAbsPath = path.resolve(
            this.requestProcessor.options.configRoot + '/' +
            this.filePath
        );

        this.fileDirectory = this._getFileDirectory();
        this.options = this._load();
    }

    generateImage(content) {
        let backgroundLayer = null;
        let backgroundLayerWidth = 0, backgroundLayerHeight = 0;

        // Generate Background Layer
        // Attach background image to canvas
        if (this.options.backgroundImage) {
            backgroundLayer = new Image();
            backgroundLayer.src = fs.readFileSync(this.options.backgroundImage);
            backgroundLayerWidth = backgroundLayer.width;
            backgroundLayerHeight = backgroundLayer.height;
        }

        // Draw the text
        const textBox = this.options.textBox;
        let textLayer = null;
        let textLayerX = 0, textLayerY = 0;

        if (textBox) {
            textBox.output = 'canvas';

            switch (textBox.textTransform || null) {
                case "uppercase":
                    content = content.toUpperCase();
                    break;

                case "lowercase":
                    content = content.toLowerCase();
                    break;

                case null:
                    break;

                default:
                    throw new Error("Unknown text transform: " + textBox.textTransform);
            }


            textLayer = text2png(content, textBox);
            textLayerX = textBox.x || 0;
            textLayerY = textBox.y || 0;

            if (['N', 'M', 'C', 'S'].indexOf(textBox.registrationPoint) >= 0) {
                textLayerX -= textLayer.width / 2;
            }

            if (['NE', 'E', 'SE'].indexOf(textBox.registrationPoint) >= 0) {
                textLayerX -= textLayer.width;
            }

            if (['E', 'M', 'C', 'W'].indexOf(textBox.registrationPoint) >= 0) {
                textLayerY -= textLayer.height / 2;
            }

            if (['SE', 'S', 'SW'].indexOf(textBox.registrationPoint) >= 0) {
                textLayerY -= textLayer.height;
            }
        }

        // Assemble
        const canvasWidth = Math.max(backgroundLayerWidth, textLayer.width);
        const canvasHeight = Math.max(backgroundLayerHeight, textLayer.height);
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        if (this.options.backgroundImage) {
            ctx.drawImage(backgroundLayer, 0, 0);
        }

        if (textLayer) {
            ctx.drawImage(textLayer, textLayerX, textLayerY);
        }

        return canvas;
    }

    _load() {
        const source = this._readSource();
        const options = _.defaultsDeep(source, defaultConfig);

        if (options.textBox.localFontPath) {
            options.textBox.localFontPath = path.resolve(
                path.dirname(this.fileAbsPath), options.textBox.localFontPath
            );
        }

        if (options.backgroundImage) {
            options.backgroundImage = path.resolve(
                path.dirname(this.fileAbsPath), options.backgroundImage
            );
        }

        return options;
    }

    _readSource() {
        // Load the contents of the file into a string
        const source = fs.readFileSync(this.fileAbsPath, 'utf8');

        // Attempt to open the file depending on its file extension
        if (this.fileAbsPath.endsWith(".yml") || this.fileAbsPath.endsWith(".yaml")) {
            return yaml.safeLoad(source);
        }

        // Attempt to load JSON by default
        return JSON.parse(source);
    }

    _getFileDirectory() {
        return path.dirname(path.relative(
            this.requestProcessor.options.configRoot,
            this.requestProcessor.options.configRoot + '/' + this.filePath
        ));
    }
};
