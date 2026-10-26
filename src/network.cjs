// Respect the host's explicit proxy configuration, including loopback exclusions.
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  const { EnvHttpProxyAgent, setGlobalDispatcher } = require("undici");
  setGlobalDispatcher(
    new EnvHttpProxyAgent({
      noProxy: process.env.NO_PROXY || "127.0.0.1,localhost,::1",
    }),
  );
}
