export default function splitPostgresConnectionString(connectionString) {
  const cleanString = connectionString.replace('postgresql://', '');

  const [userHost, hostPortDb] = cleanString.split('@');

  const [username, password] = userHost.split(':');

  const [hostPort, database] = hostPortDb.split('/');
  const [host, port] = hostPort.split(':');

  return {
    username: username,
    password: password,
    host: host,
    port: port,
    database: database,
  };
}
