import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

// Repo for hosting docker images
// const repository = new awsx.ecr.Repository("bitscreen-client");
// const backendImage = repository.buildAndPushImage("../BitScreen-Backend-JS");
// const frontendImage = repository.buildAndPushImage("../bitscreen-client");

// Create an EKS cluster with non-default configuration
const vpc = new awsx.ec2.Vpc("vpc", { subnets: [{ type: "public" }] });
const cluster = new eks.Cluster("bitscreen-deployment", {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    desiredCapacity: 2,
    minSize: 1,
    maxSize: 2,
    storageClasses: "gp2",
    deployDashboard: false,
});

// Export the clusters' kubeconfig.
export const kubeconfig = cluster.kubeconfig;

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(
    "bitscreen",
    {},
    { provider: cluster.provider }
);

// Export the Namespace name
export const namespaceName = ns.metadata.apply((m) => m.name);

// Setup frontend deployment
const frontendName = "frontend";
const frontendAppLabels = { app: frontendName };
const frontendDeployment = new k8s.apps.v1.Deployment(
    frontendName,
    {
        metadata: {
            namespace: namespaceName,
            labels: frontendAppLabels,
        },
        spec: {
            selector: { matchLabels: frontendAppLabels },
            replicas: 1,
            template: {
                metadata: { labels: frontendAppLabels },
                spec: {
                    containers: [
                        {
                            name: "frontend",
                            image: "murmurationlabs/bitscreen-client" ,
                            ports: [{ name: "http", containerPort: 3000 }],
                        },
                    ],
                },
            },
        },
    },
    {
        provider: cluster.provider,
    }
);

export const frontendApp = frontendDeployment.metadata.name;

// Create a LoadBalancer Service for the frontend deployment
const service = new k8s.core.v1.Service(
    "bitscreen-client-listener",
    {
        metadata: {
            labels:  frontendDeployment.metadata.labels ,
            namespace: namespaceName,
        },
        spec: {
            type: "LoadBalancer",
            ports: [{ port: 3000, targetPort: "http" }],
            selector: frontendAppLabels,
            publishNotReadyAddresses: false,
        },
    },
    {
        provider: cluster.provider,
    }
);

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.apply((m) => m.name);
export const serviceHostname = service.status.apply(
    (s) => s.loadBalancer.ingress[0].hostname
);

//
// Create a NGINX Deployment
// const appLabels = { appClass: name };
// const deployment = new k8s.apps.v1.Deployment(
//     name,
//     {
//         metadata: {
//             namespace: namespaceName,
//             labels: appLabels,
//         },
//         spec: {
//             replicas: 1,
//             selector: { matchLabels: appLabels },
//             template: {
//                 metadata: {
//                     labels: appLabels,
//                 },
//                 spec: {
//                     containers: [
//                         {
//                             name: name,
//                             image: "nginx:latest",
//                             ports: [{ name: "http", containerPort: 80 }],
//                         },
//                     ],
//                 },
//             },
//         },
//     },
//     {
//         provider: cluster.provider,
//     }
// );

// // Export the Deployment name
// export const deploymentName = deployment.metadata.apply((m) => m.name);
