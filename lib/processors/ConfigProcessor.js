const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const _ = { defaultsDeep: require('lodash.defaultsdeep') };

const text2png = require('text2png');
const { createCanvas, Image } = require('canvas');
const ImageGenerator = require('./ImageGenerator.js');

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
        const generator = new ImageGenerator(this, content);
        return generator.generate();
    }

    _load() {
        const source = this._readSource();
        const options = _.defaultsDeep(source, defaultConfig);

        // Background layer
        if (options.background.src) {
            options.background.src = path.resolve(
                path.dirname(this.fileAbsPath), options.background.src
            );
        }

        // Text box layer
        if (options.textBox.localFontPath) {
            options.textBox.localFontPath = path.resolve(
                path.dirname(this.fileAbsPath), options.textBox.localFontPath
            );
        }

        // Sprites
        options.sprites.map(sprite => {
            sprite.src = path.resolve(
                path.dirname(this.fileAbsPath), sprite.src
            );

            return sprite;
        });

        return options;
    }

    _readSource() {
        // Load the contents of the file into a string
        const source = fs.readFileSync(this.fileAbsPath, 'utf8');

        // Attempt to open the file depending on its file extension
        if (this.fileAbsPath.endsWith('.yml') || this.fileAbsPath.endsWith('.yaml')) {
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
