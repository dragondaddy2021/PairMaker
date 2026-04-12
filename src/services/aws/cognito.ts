/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * AWS Cognito — 用戶認證服務
 * 使用 amazon-cognito-identity-js（不需 AWS SDK，支援 React Native）
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ISignUpResult,
} from 'amazon-cognito-identity-js';
import { AWS_CONFIG } from '../../config/aws';

const userPool = new CognitoUserPool({
  UserPoolId: AWS_CONFIG.cognito.userPoolId,
  ClientId:   AWS_CONFIG.cognito.userPoolWebClientId,
});

// ── 註冊 ────────────────────────────────────────────────────────────────────

export function signUp(
  email: string,
  password: string,
  nickname: string,
): Promise<ISignUpResult> {
  const attrs = [
    new CognitoUserAttribute({ Name: 'email',    Value: email }),
    new CognitoUserAttribute({ Name: 'nickname', Value: nickname }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attrs, [], (err, result) => {
      if (err || !result) return reject(err ?? new Error('signUp failed'));
      resolve(result);
    });
  });
}

// ── 驗證 Email OTP ─────────────────────────────────────────────────────────

export function confirmSignUp(email: string, code: string): Promise<void> {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ── 登入 ────────────────────────────────────────────────────────────────────

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  const authDetails = new AuthenticationDetails({ Username: email, Password: password });
  const user = new CognitoUser({ Username: email, Pool: userPool });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure:  (err)     => reject(err),
      newPasswordRequired: () => reject(new Error('NEW_PASSWORD_REQUIRED')),
    });
  });
}

// ── 登出 ────────────────────────────────────────────────────────────────────

export function signOut(): void {
  userPool.getCurrentUser()?.signOut();
}

// ── 取得目前 Session（含 JWT Token）────────────────────────────────────────

export function getCurrentSession(): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error('NO_CURRENT_USER'));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) return reject(err ?? new Error('NO_SESSION'));
      resolve(session);
    });
  });
}

export async function getIdToken(): Promise<string> {
  const session = await getCurrentSession();
  return session.getIdToken().getJwtToken();
}

// ── 忘記密碼流程 ────────────────────────────────────────────────────────────

export function forgotPassword(email: string): Promise<void> {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure:  (err) => reject(err),
    });
  });
}

export function confirmNewPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  return new Promise((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure:  (err) => reject(err),
    });
  });
}
