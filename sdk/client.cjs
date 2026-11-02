const http = require("node:http"),
  crypto = require("node:crypto");
class PluginLabsClient {
  constructor({ token, port = 47632 }) {
    if (typeof token !== "string" || !token.startsWith("plh_"))
      throw Error("Hub içinden istemci anahtarı oluşturun");
    this.token = token;
    this.base = `http://127.0.0.1:${Number(port)}`;
  }
  async request(route, body) {
    const response = await fetch(this.base + route, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(150000),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || `HTTP ${response.status}`);
    return data;
  }
  chat(messages, max_tokens = 256) {
    return this.request("/v1/chat/completions", {
      messages,
      max_tokens,
      model: "mymind-lite",
    });
  }
  invoke(provider, action, input) {
    return this.request("/v1/actions/invoke", { provider, action, input });
  }
  // Kanallar: veri akışı ve uygulamalar arası köprü
  publish(channel, data, { ttlSeconds, share } = {}) {
    return this.request(`/v1/channels/${encodeURIComponent(channel)}`, {
      data,
      ...(ttlSeconds !== undefined && { ttlSeconds }),
      ...(share !== undefined && { share }),
    });
  }
  read(channel) {
    return this.request(`/v1/channels/${encodeURIComponent(channel)}`);
  }
  async channels() {
    return (await this.request("/v1/channels")).channels;
  }
  // Canlı akış: her güncellemede onChange(kayıt) çağrılır. Dönen işlev akışı kapatır.
  subscribe(channels, onChange, onClosed) {
    const abort = new AbortController();
    const query = channels?.length
      ? `?channels=${channels.map(encodeURIComponent).join(",")}`
      : "";
    (async () => {
      const response = await fetch(this.base + "/v1/stream" + query, {
        headers: { Authorization: `Bearer ${this.token}` },
        signal: abort.signal,
      });
      if (!response.ok) throw Error((await response.json()).error);
      const decoder = new TextDecoder();
      let buffer = "";
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let end;
        while ((end = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const event = /^event: (.+)$/m.exec(block)?.[1],
            data = /^data: (.+)$/m.exec(block)?.[1];
          if (!event || !data) continue;
          if (event === "channel") onChange(JSON.parse(data));
          else if (event === "closed") onClosed?.(JSON.parse(data));
        }
      }
    })().catch((e) => {
      if (!abort.signal.aborted) onClosed?.({ error: e.message });
    });
    return () => abort.abort();
  }
  // My Mind hazır görevleri
  mymind = {
    capabilities: () => this.request("/v1/mymind/capabilities"),
    run: (task, input) => this.request("/v1/mymind/run", { task, input }),
  };
}
class ProviderAgent {
  constructor(client, { id, name, actions }) {
    this.client = client;
    this.id = id;
    this.name = name;
    this.actions = actions;
    this.secret = crypto.randomBytes(32).toString("hex");
  }
  async start() {
    this.server = http.createServer(async (req, res) => {
      try {
        if (
          req.headers.origin ||
          req.headers.host !== `127.0.0.1:${this.port}` ||
          req.method !== "POST"
        )
          throw Error("Geçersiz kaynak");
        let n = 0,
          chunks = [];
        for await (const c of req) {
          n += c.length;
          if (n > 150000) throw Error("İstek sınırı");
          chunks.push(c);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());
        let result;
        if (req.url === "/challenge") {
          if (
            typeof body.nonce !== "string" ||
            !/^[a-f0-9]{48}$/.test(body.nonce)
          )
            throw Error("Geçersiz doğrulama");
          result = {
            proof: crypto
              .createHmac("sha256", this.secret)
              .update(body.nonce)
              .digest("hex"),
          };
        } else if (req.url === "/invoke") {
          const auth = req.headers.authorization || "";
          const expected = `Bearer ${this.secret}`;
          if (
            auth.length !== expected.length ||
            !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
          )
            throw Error("Yetkisiz");
          const action = this.actions.find((a) => a.id === body.action);
          if (!action) throw Error("İşlem yok");
          result = await action.run(body.input);
        } else throw Error("Yol yok");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result ?? {}));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Sağlayıcı isteği başarısız" }));
      }
    });
    await new Promise((r, j) => {
      this.server.once("error", j);
      this.server.listen(0, "127.0.0.1", r);
    });
    this.port = this.server.address().port;
    try {
      await this.register();
      this.timer = setInterval(() => this.register().catch(() => {}), 30000);
      this.timer.unref();
      return this;
    } catch (e) {
      await this.close();
      throw e;
    }
  }
  register() {
    return this.client.request("/v1/providers/register", {
      id: this.id,
      name: this.name,
      url: `http://127.0.0.1:${this.port}/`,
      secret: this.secret,
      actions: this.actions.map(({ run, ...a }) => a),
    });
  }
  async close() {
    clearInterval(this.timer);
    if (this.server) {
      this.server.closeAllConnections();
      await new Promise((r) => this.server.close(r));
    }
  }
}
module.exports = { PluginLabsClient, ProviderAgent };
