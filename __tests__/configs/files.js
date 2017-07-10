const { env } = process;

module.exports = {
  amqp: {
    transport: {
      queue: 'files',
    },
  },
  transport: [{
    options: {
      gce: {
        projectId: env.GCLOUD_PROJECT_ID,
        credentials: {
          client_email: env.GCLOUD_PROJECT_EMAIL,
          private_key: env.GCLOUD_PROJECT_PK,
        },
      },
      bucket: {
        name: env.GCLOUD_PROJECT_BUCKET,
        metadata: {
          location: env.GCLOUD_BUCKET_LOCATION || 'EUROPE-WEST1',
          dra: true,
        },
      },
      // test for direct public URLs
    },
    // its not a public name!
    cname: 'gce',
  }],
};
