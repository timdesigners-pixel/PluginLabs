const path = require("node:path"),
  os = require("node:os");
const { Hub } = require("./hub.cjs");
(async () => {
  const hub = await new Hub(
    process.env.PLUGINLABS_DATA || path.join(os.homedir(), ".pluginlabs-hub"),
  ).init();
  await hub.startAPI(Number(process.env.PLUGINLABS_PORT || 47632));
  console.log(
    `PluginLabs API: http://127.0.0.1:${hub.port}\nİstemci izinlerini yönetmek için masaüstü uygulamasını kullanın.`,
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, async () => {
      await hub.close();
      process.exit(0);
    });
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
