const path = require('path');

const crypto = require('crypto');
const Entities = new (require('html-entities').AllHtmlEntities)();

const ConfigProcessor = require('./ConfigProcessor.js');

module.exports = class {
    constructor(documentProcessor, tag) {
        this.documentProcessor = documentProcessor;
        this.requestProcessor = documentProcessor.requestProcessor;

        this.tag = tag;
        this.tag.attrs = this.tag.attrs || {};

        this.configProcessor = this._getConfig();
        this.content = this._getContent();
        this.hash = this._getHash();

        this.fileName = this.hash + '.png';
        this.filePath = this._getFilePath();
    }

    _getConfig() {
        return new ConfigProcessor(
            this,
            this.tag.attrs[this.requestProcessor.options.attribute]
        );
    }

    _getContent() {
        return this.tag.content
            .join('\n')
            .split('\n')
            .map(text => text.trim())
            .map(text => Entities.decode(text))
            .filter(x => x != '')
            .join('\n');
    }

    _getHash() {
        return crypto.createHash('sha1')
            .update(
                this.tag.attrs[this.requestProcessor.options.attribute] + '\n' +
                this.content
            )
            .digest('hex');
    }

    process() {
        this.tag.content = this.content;

        // Create the image
        const canvas = this.configProcessor.generateImage(this.tag.content);
        this.documentProcessor.dependencies[this.filePath] = canvas.createPNGStream();

        // Update the target tag
        this.tag.tag = 'img';
        this.tag.attrs.alt = Entities.encode(this.tag.content);
        this.tag.attrs.width = canvas.width;
        this.tag.attrs.height = canvas.height;
        delete this.tag.content;
        delete this.tag.attrs[this.requestProcessor.options.attribute];

        // Output
        return this.tag;
    }

    _getFilePath() {
        switch (this.requestProcessor.options.relativeTo) {
            case 'html':
                return this._getFilePathRelativeToHTML();

            case 'stylesheet':
                return this._getFilePathRelativeToStylesheet();

            default:
                throw new Error(
                    'Unknown relativeTo value: ' +
                    this.requestProcessor.options.relativeTo
                );
        }
    }

    _getFilePathRelativeToHTML() {
        this.tag.attrs.src = this.fileName;

        return path.join(
            this.documentProcessor.fileDirectory,
            this.fileName
        );
    }

    _getFilePathRelativeToStylesheet() {
        const filePath = path.join(
            this.configProcessor.fileDirectory,
            this.fileName
        );

        this.tag.attrs.src = '/' + filePath;

        return filePath;
    }
};
