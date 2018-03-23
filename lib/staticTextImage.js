const path = require('path');
const posthtml = require('posthtml');

const DocumentProcessor = require('./processors/DocumentProcessor.js');

module.exports = class {
    constructor(options) {
        this.options = {
            attribute: options.attribute || 'data-text-image',
            configRoot: path.resolve(process.cwd(), options.configRoot || '.'),
            relativeTo: options.relativeTo || 'stylesheet'
        };
    }

    process(filePath, contents) {
        const document = new DocumentProcessor(this, filePath);

        return posthtml([ document.process.bind(document) ])
            .process(contents)
            .then(
                result => {
                    return {
                        contents: result.html,
                        dependencies: document.dependencies
                    };
                },
                err => {
                    throw new Error(err);
                }
            );
    }
};
