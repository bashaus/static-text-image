const path = require('path');

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

    _load() {
        const options = require(this.fileAbsPath);

        if (options.localFontPath) {
            options.localFontPath = path.resolve(
                path.dirname(this.fileAbsPath), options.localFontPath
            );
        }

        options.output = 'canvas';

        return options;
    }

    _getFileDirectory() {
        return path.dirname(path.relative(
            this.requestProcessor.options.configRoot,
            this.requestProcessor.options.configRoot + '/' + this.filePath
        ));
    }
}