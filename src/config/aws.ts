/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */
export const AWS_CONFIG = {
  region: process.env.EXPO_PUBLIC_AWS_REGION ?? 'ap-northeast-1',

  cognito: {
    userPoolId:     process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '',
    userPoolWebClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '',
  },

  dynamodb: {
    endpoint: process.env.EXPO_PUBLIC_DYNAMODB_ENDPOINT ?? undefined,
    tables: {
      users:    'pairmaker-users',
      matches:  'pairmaker-matches',
      messages: 'pairmaker-messages',
      points:   'pairmaker-points',
    },
  },

  s3: {
    bucket:          process.env.EXPO_PUBLIC_S3_BUCKET ?? 'pairmaker-media',
    accelerateEndpoint: false,
  },

  apiGateway: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    stage:   process.env.EXPO_PUBLIC_API_STAGE ?? 'prod',
  },
};
