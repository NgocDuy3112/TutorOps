export function databaseUrlFromEnv(environment = process.env) {
  const user = required(environment, "POSTGRES_DB_USER");
  const password = required(environment, "POSTGRES_DB_PASSWORD");
  const host = required(environment, "POSTGRES_DB_HOST");
  const port = environment.POSTGRES_DB_PORT ?? "5432";
  const database = required(environment, "POSTGRES_DB_NAME");
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

function required(environment: NodeJS.ProcessEnv, name: string) {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
