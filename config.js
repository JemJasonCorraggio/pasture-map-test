exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://ladyjem:bestrong9@ds147118.mlab.com:47118/pasture-map';
exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://ladyjem:bestrong9@ds147118.mlab.com:47118/pasture-map-test');
exports.PORT = process.env.PORT || 8080;