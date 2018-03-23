const path = require('path');

const TagProcessor = require('./TagProcessor.js');

module.exports = class {
    constructor(requestProcessor, filePath) {
        this.requestProcessor = requestProcessor;
        this.filePath = filePath;
        this.fileDirectory = this._getFileDirectory();
        this.dependencies = {};
    }

    process(tree) {
        var search = { attrs: {} };
        search.attrs[this.requestProcessor.options.attribute] = true;

        tree.match(search, tag => {
            const tagProcessor = new TagProcessor(this, tag)
            return tagProcessor.process();
        });

        return tree;
    }

    _getFileDirectory() {
        return path.dirname(this.filePath);
    }
};
