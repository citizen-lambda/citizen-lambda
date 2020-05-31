import { User, Contact, UserFeatures } from './user.model';

export interface APIPayload /* <T> */ {
  message: string;
  /*
  result: T | T[];
  status: boolean;
 */
}

export interface UserLogin extends User {
  username: string;
  password: string;
}

export interface UserRegistration extends UserLogin, Contact {
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
}

export type RegisteringUser = Partial<UserRegistration>;

/* TODO: mv auth to feature module
  export abstract class AuthProvider {
    public abstract loggedIn: boolean;
    public abstract redirectUrl: string;
    public abstract login(): Promise<void>;
    public abstract logout(): void;
  } */

export interface Authentification {
  refresh_token: string;
}

export interface AuthorizationPayload {
  access_token: string;
}

export interface RegistrationPayload
  extends APIPayload,
    User,
    Authentification,
    AuthorizationPayload {
  message: string;
  username: string;
  refresh_token: string;
  access_token: string;
}

export type LoginPayload = Partial<RegistrationPayload>;

export interface LogoutPayload extends APIPayload {
  message: string;
}

export interface UserFeaturesPayload extends APIPayload, UserFeatures {
  message: string;
  features?: UserFeatures;
}

export interface JWT {
  header: {
    typ: string;
    alg: string;
  };
  payload: JWTPayload;
}

export interface JWTPayload {
  iat: number;
  nbf: number;
  jti: string;
  exp: number;
  identity: string;
  fresh: boolean;
  type: string;
}

export interface Badge {
  alt: string;
  img: string;
}

export interface RewardsApiPayload {
  badges: Badge[];
  rewards: string[];
}
