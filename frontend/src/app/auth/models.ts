type Partial<T> = {
  [P in keyof T]?: T[P];
};

export interface RegisteredUser {
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
}

export type RegisteringUser = Partial<RegisteredUser>;

export interface LoggingUser {
  username: string;
  password: string;
}

export interface LoggedUser {
  message: string;
  access_token: string;
  refresh_token: string;
  username: string;
  status: string;
}

export type LoginPayload = Partial<LoggedUser>;

export interface LogoutPayload {
  msg: string;
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

export interface TokenRefresh {
  access_token: string;
}

export interface UserInfo {
  message: string;
  features?: any;
}

// export class APIPayload<T> {
//   message: string;
//   result: T | T[];
//   status: boolean;
// }
