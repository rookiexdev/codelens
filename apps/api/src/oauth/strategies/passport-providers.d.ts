declare module 'passport-gitlab2' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    baseURL?: string;
    scope?: string | string[];
    scopeSeparator?: string;
    profileFields?: string[];
    state?: string;
  }

  export interface Profile {
    id: string;
    displayName?: string;
    username?: string;
    emails?: { value: string }[];
    photos?: { value: string }[];
    provider?: string;
    _json?: unknown;
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown, info?: unknown) => void,
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown, info?: unknown) => void,
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(
      options: StrategyOptions & { passReqToCallback: true },
      verify: VerifyFunctionWithRequest,
    );
    name: string;
  }
}

declare module 'passport-bitbucket-oauth2' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    scopeSeparator?: string;
    state?: string;
  }

  export interface Profile {
    id: string;
    displayName?: string;
    username?: string;
    emails?: { value: string }[];
    photos?: { value: string }[];
    provider?: string;
    _json?: unknown;
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown, info?: unknown) => void,
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown, info?: unknown) => void,
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(
      options: StrategyOptions & { passReqToCallback: true },
      verify: VerifyFunctionWithRequest,
    );
    name: string;
  }
}
