const TextImage = require('../staticTextImage.js');
const fs = require('fs');

module.exports = function(options) {
    const textImage = new TextImage(options);

    return function (files, metalsmith, done) {
        const promises = [];

        Object.keys(files).forEach(function (filePath) {
            promises.push(
                textImage.process(
                    filePath,
                    files[filePath].contents.toString()
                ).then(translate => {
                    // Apply file contents
                    files[filePath].contents = Buffer.from(translate.contents, 'utf-8');

                    // Absorb additional dependencies
                    Object.keys(translate.dependencies).forEach(imagePath => {
                        files['/' + imagePath] = {
                            contents: translate.dependencies[imagePath]
                        };
                    });
                })
            );
        });

        Promise.all(promises).then(() => done())
    };
};
