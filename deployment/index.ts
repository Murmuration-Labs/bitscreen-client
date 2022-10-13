// helm chart
// versioning
import * as pulumi from '@pulumi/pulumi';
import { lookup } from 'mrmime';
import fs from 'node:fs';
import path from 'node:path';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

const siteBucket = new aws.s3.Bucket('s3-website-bucket', {
  website: {
    indexDocument: 'index.html',
  },
});

let siteDir = '../build'; // directory for content files

// stackoverflow
function walkSync(currentDirPath: string, callback: any) {
  fs.readdirSync(currentDirPath).forEach(function (name) {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, currentDirPath);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}

walkSync(siteDir, function (filePath: string, name: any) {
  let contentType = lookup(filePath) || undefined;
  let object = new aws.s3.BucketObject(filePath.substr(9), {
    bucket: siteBucket,
    source: new pulumi.asset.FileAsset(filePath), // use FileAsset to point to a file
    contentType, // set the MIME type of the file
  });
});

// Create an S3 Bucket Policy to allow public read of all objects in bucket
// This reusable function can be pulled out into its own module
function publicReadPolicyForBucket(bucketName: string) {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [
          `arn:aws:s3:::${bucketName}/*`, // policy refers to bucket name explicitly
        ],
      },
    ],
  });
}

// Set the access policy for the bucket so all objects are readable
let bucketPolicy = new aws.s3.BucketPolicy('bucketPolicy', {
  bucket: siteBucket.bucket, // depends on siteBucket -- see explanation below
  policy: siteBucket.bucket.apply(publicReadPolicyForBucket),
  // transform the siteBucket.bucket output property -- see explanation below
});

exports.websiteUrl = siteBucket.websiteEndpoint; // output the endpoint as a stack output

exports.bucketName = siteBucket.bucket; // create a stack export for bucket name

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
