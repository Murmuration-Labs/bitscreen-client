"use strict";
exports.__esModule = true;
var pulumi = require("@pulumi/pulumi");
var file_type_1 = require("file-type");
var aws = require("@pulumi/aws");
var fs_1 = require("fs");
var path_1 = require("path");
// Create an AWS resource (S3 Bucket)
// const bucket = new aws.s3.Bucket('my-bucket', {
//   website: {
//     indexDocument: 'index.html',
//   },
// });
// // Export the name of the bucket
// export const bucketName = bucket.id;
// const bucketObject = new aws.s3.BucketObject('index.html', {
//   acl: 'public-read',
//   contentType: 'text/html',
//   bucket,
//   source: new pulumi.asset.FileAsset('../build/index.html'),
// });
// export const bucketEndpoint = pulumi.interpolate`http://${bucket.websiteEndpoint}`;
//
// Create an S3 bucket
var siteBucket = new aws.s3.Bucket('s3-website-bucket');
var siteDir = '../build'; // directory for content files
var _loop_1 = function (item) {
    var filePath = path_1["default"].join(siteDir, item);
    file_type_1.fileTypeFromFile(filePath).then(function (result) {
        var contentType = undefined;
        if (result) {
            contentType = result.mime;
        }
        var object = new aws.s3.BucketObject(item, {
            bucket: siteBucket,
            source: new pulumi.asset.FileAsset(filePath),
            contentType: contentType
        });
    });
};
// For each file in the directory, create an S3 object stored in `siteBucket`
for (var _i = 0, _a = fs_1["default"].readdirSync(siteDir); _i < _a.length; _i++) {
    var item = _a[_i];
    _loop_1(item);
}
exports.bucketName = siteBucket.bucket; // create a stack export for bucket name
