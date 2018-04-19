const fs = require('fs');
const path = require('path');

const text2png = require('text2png');
const { createCanvas, Image } = require('canvas');

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
        const img = new Image;

        // Attach background image to canvas
        if (this.options.backgroundImage) {
            const backgroundImage = fs.readFileSync(this.options.backgroundImage);
            img.src = backgroundImage;
        }

        // Create base canvas
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        // Draw the text
        const textBox = this.options.textBox;
        if (textBox) {
            textBox.output = 'canvas';

            const text = text2png(content, textBox);
            let x = textBox.x;
            let y = textBox.y;

            if (['N', 'M', 'C', 'S'].indexOf(textBox.registrationPoint) >= 0) {
                x -= text.width / 2;
            }

            if (['NE', 'E', 'SE'].indexOf(textBox.registrationPoint) >= 0) {
                x -= text.width;
            }

            if (['E', 'M', 'C', 'W'].indexOf(textBox.registrationPoint) >= 0) {
                y -= text.height / 2;
            }

            if (['SE', 'S', 'SW'].indexOf(textBox.registrationPoint) >= 0) {
                y -= text.height;
            }

            ctx.drawImage(text, x, y);
        }

        return canvas;
    }

    _load() {
        const options = JSON.parse(fs.readFileSync(this.fileAbsPath, 'utf8'));

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

        options.textBox.registrationPoint = options.textBox.registrationPoint || 'NW';

        return options;
    }

    _getFileDirectory() {
        return path.dirname(path.relative(
            this.requestProcessor.options.configRoot,
            this.requestProcessor.options.configRoot + '/' + this.filePath
        ));
    }
};
