import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_USE_MOCK_API: z
    .string()
    .optional()
    .transform((val) => val !== 'false'),
  NEXT_PUBLIC_ENABLE_STUDENT_PORTAL: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_ENABLE_FUTURE_MODULES: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional().default(''),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(customEnv?: Record<string, string | undefined>): AppEnv {
  const rawEnv = customEnv ?? {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API,
    NEXT_PUBLIC_ENABLE_STUDENT_PORTAL: process.env.NEXT_PUBLIC_ENABLE_STUDENT_PORTAL,
    NEXT_PUBLIC_ENABLE_FUTURE_MODULES: process.env.NEXT_PUBLIC_ENABLE_FUTURE_MODULES,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  };

  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    return envSchema.parse({});
  }
  return parsed.data;
}

export const env = parseEnv();
