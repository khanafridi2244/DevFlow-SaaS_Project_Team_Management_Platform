const dotenv = require("dotenv");

dotenv.config();

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",

  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },

  cookies: {
    accessTokenName: process.env.ACCESS_TOKEN_COOKIE ?? "devflow_at",
    refreshTokenName: process.env.REFRESH_TOKEN_COOKIE ?? "devflow_rt",
  },

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),

  isProduction: process.env.NODE_ENV === "production",
};

module.exports = { env };