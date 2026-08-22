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

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },

    smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "DevFlow <no-reply@devflow.app>",
  },

    anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
  },

  isProduction: process.env.NODE_ENV === "production",
};

// Guards against accidentally deploying with a placeholder secret still
// in place — the .env.example file ships with a literal string like
// "replace_with_a_long_random_secret", and it's a real, easy mistake to
// copy .env.example to .env and forget to actually replace that value.
if (env.isProduction) {
  const placeholderPatterns = ["replace_with", "changeme", "your_secret_here"];
  const secretsToCheck = { JWT_ACCESS_SECRET: env.jwt.accessSecret, JWT_REFRESH_SECRET: env.jwt.refreshSecret };

  for (const [name, value] of Object.entries(secretsToCheck)) {
    if (placeholderPatterns.some((p) => value.toLowerCase().includes(p))) {
      throw new Error(
        `${name} still contains a placeholder value. Generate a real secret with: openssl rand -base64 64`
      );
    }
  }
}


module.exports = { env };