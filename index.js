'use strict';

const through = require('through2');
const { Minimatch } = require('minimatch');

module.exports = function(headers) {
	const matches = Object.entries(headers).map(([key, value]) => ({
		path: new Minimatch(key),
		headers: Object.entries(value),
	}));

	return through.obj(function(file, encoding, cb) {
		const { s3 = {
			headers: {},
			path: file.relative.replace(/\\/g, '/'),
		} } = file;
		s3.headers.Metadata = s3.headers.Metadata || {};

		for (const { path, headers } of matches) {
			if (!path.match(file.relative)) {
				continue;
			}

			for (const [key, value] of headers) {
				if (key.startsWith('x-amz-meta-')) {
					const metaKey = key.slice('x-amz-meta-'.length);
					s3.headers.Metadata[metaKey] = value;
				} else {
					s3.headers[key] = value;
				}
			}
		}

		file.s3 = s3;

		require('fancy-log')(file);
		cb(null, file);
	});
};