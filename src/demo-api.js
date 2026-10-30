// Deliberately browser-only demo. No authentication or cross-device sharing.
const DB_NAME = "workplace-browser-demo-v1";
const active = (r) => ["booked", "checked_in"].includes(r.status);
const overlaps = (a, b) => a.start < b.end && b.start < a.end;
const uid = () => crypto.randomUUID();
const profiles = {
  admin: {
    id: "demo-admin",
    name: "Administrador demo",
    email: "admin@example.test",
    role: "admin",
  },
  member: {
    id: "demo-member",
    name: "Colaborador demo",
    email: "member@example.test",
    role: "member",
  },
};
const fail = (message) => {
  throw new Error(message);
};
function seed() {
  const floor = {
    id: uid(),
    name: "Andar de exemplo",
    unit: "Unidade de demonstração",
    image: "/demo-floor.svg",
    width: 1000,
    height: 650,
    published: true,
  };
  const resources = [];
  let n = 0;
  for (const y of [35, 50, 65])
    for (const x of [22, 32, 42, 52])
      resources.push({
        id: uid(),
        floorId: floor.id,
        name: `Mesa ${String(++n).padStart(2, "0")}`,
        type: "desk",
        x,
        y,
        capacity: 1,
        equipment: ["Monitor"],
        active: true,
      });
  for (const [i, y] of [35, 65].entries())
    resources.push({
      id: uid(),
      floorId: floor.id,
      name: `Sala ${i + 1}`,
      type: "room",
      x: 80,
      y,
      capacity: i ? 8 : 4,
      equipment: ["TV", "Videoconferência"],
      active: true,
    });
  return {
    role: "admin",
    floors: [floor],
    resources,
    reservations: [],
    blocks: [],
    announcements: [],
    audit: [],
    settings: {
      checkinMinutes: 15,
      maxDurationMinutes: 480,
      maxAdvanceDays: 30,
    },
  };
}
function validRange(body) {
  const a = new Date(body.start),
    b = new Date(body.end);
  if (!Number.isFinite(+a) || !Number.isFinite(+b) || a >= b)
    fail("Informe início e fim válidos, com o fim após o início.");
  return { start: a.toISOString(), end: b.toISOString() };
}
function number(n, min, max, label) {
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
    fail(`${label}: valor inválido.`);
  return n;
}
function text(s, label, max = 120) {
  if (typeof s !== "string" || !s.trim() || s.length > max)
    fail(`${label}: preencha um texto válido.`);
  return s.trim();
}
function execute(s, path, method, body = {}) {
  const now = new Date().toISOString(),
    user = profiles[s.role] || profiles.admin;
  const admin = () => {
    if (user.role !== "admin") fail("Esta ação exige acesso de administrador.");
  };
  const find = (table, id) =>
    s[table].find((x) => x.id === id) || fail("Registro não encontrado.");
  const audit = (action, target) =>
    s.audit.unshift({ id: uid(), at: now, actor: user.name, action, target });
  for (const r of s.reservations)
    if (r.status === "booked" && r.expiresAt <= now) {
      r.status = "expired";
      audit("Reserva expirada sem check-in", r.id);
    }
  if (path === "/session")
    return {
      user,
      needsSetup: false,
      setupAllowed: false,
      registrationOpen: false,
    };
  if (path === "/demo-role" && method === "POST") {
    if (!profiles[body.role]) fail("Perfil inválido.");
    s.role = body.role;
    return { ok: true };
  }
  if (path === "/logout") {
    s.role = s.role === "admin" ? "member" : "admin";
    return { ok: true };
  }
  if (path === "/state") {
    const floors = s.floors.filter((f) => user.role === "admin" || f.published),
      resources = s.resources.filter(
        (r) =>
          floors.some((f) => f.id === r.floorId) &&
          (user.role === "admin" || r.active),
      );
    return {
      ...s,
      user,
      floors,
      resources,
      audit: undefined,
      reservations: s.reservations.map((r) =>
        user.role === "admin" || r.userId === user.id
          ? r
          : { ...r, userId: null, userName: "Colaborador", title: "Reservado" },
      ),
    };
  }
  if (path === "/audit") {
    admin();
    return s.audit.slice(0, 500);
  }
  const [, table, id] = path.split("/");
  if (table === "settings" && method === "PATCH") {
    admin();
    const m = { ...s.settings, ...body };
    number(m.checkinMinutes, 1, 120, "Prazo de check-in");
    number(m.maxDurationMinutes, 15, 1440, "Duração");
    number(m.maxAdvanceDays, 1, 365, "Antecedência");
    if (Object.values(m).some((v) => !Number.isInteger(v)))
      fail("Informe números inteiros.");
    s.settings = m;
    audit("Regras atualizadas", "settings");
    return m;
  }
  if (
    ![
      "floors",
      "resources",
      "reservations",
      "blocks",
      "announcements",
    ].includes(table)
  )
    fail("Operação indisponível na demonstração.");
  if (table !== "reservations") admin();
  if (method === "DELETE") {
    const old = find(table, id);
    if (
      table === "resources" &&
      s.reservations.some((r) => r.resourceId === id)
    )
      fail("Há histórico de reservas. Desative o espaço para preservá-lo.");
    if (!["resources", "blocks", "announcements"].includes(table))
      fail("Exclusão indisponível.");
    s[table] = s[table].filter((x) => x.id !== id);
    if (table === "resources")
      s.blocks = s.blocks.filter((b) => b.resourceId !== id);
    audit("Registro excluído", old.id);
    return { ok: true };
  }
  if (!["POST", "PATCH"].includes(method)) fail("Operação indisponível.");
  const existing = id ? find(table, id) : null;
  let item = { ...existing, ...body, id: existing?.id || uid() };
  if (table === "floors") {
    item.name = text(item.name, "Andar", 80);
    item.unit = text(item.unit, "Unidade", 80);
    item.published = Boolean(item.published);
    if (!existing) {
      if (
        typeof item.image !== "string" ||
        !(
          item.image === "/demo-floor.svg" ||
          /^data:image\/(png|jpeg|webp);base64,/.test(item.image)
        )
      )
        fail("Envie uma planta válida.");
      number(item.width, 1, 20000, "Largura");
      number(item.height, 1, 20000, "Altura");
    }
    if (
      !item.published &&
      s.reservations.some(
        (r) =>
          active(r) &&
          r.end > now &&
          s.resources.some(
            (x) => x.id === r.resourceId && x.floorId === item.id,
          ),
      )
    )
      fail("Cancele as reservas futuras antes de retirar a publicação.");
  }
  if (table === "resources") {
    find("floors", item.floorId);
    item.name = text(item.name, "Nome do espaço", 80);
    if (!["desk", "room"].includes(item.type)) fail("Tipo de espaço inválido.");
    number(item.x, 0, 100, "Posição horizontal");
    number(item.y, 0, 100, "Posição vertical");
    item.capacity =
      item.type === "desk" ? 1 : number(item.capacity, 1, 500, "Capacidade");
    item.active = item.active !== false;
    item.equipment = item.equipment || [];
    if (
      s.resources.some(
        (r) =>
          r.id !== item.id &&
          r.floorId === item.floorId &&
          r.name.toLowerCase() === item.name.toLowerCase(),
      )
    )
      fail("Já existe um espaço com esse nome neste andar.");
    if (
      existing &&
      (!item.active ||
        item.type !== existing.type ||
        item.floorId !== existing.floorId) &&
      s.reservations.some(
        (r) => r.resourceId === id && active(r) && r.end > now,
      )
    )
      fail(
        "Cancele as reservas futuras antes de desativar ou alterar este espaço.",
      );
  }
  if (table === "reservations") {
    if (existing) {
      if (user.role !== "admin" && existing.userId !== user.id)
        fail("Você só pode alterar suas reservas.");
      if (!active(existing) || existing.end <= now)
        fail("Esta reserva já foi encerrada.");
      if (body.action === "cancel") item = { ...existing, status: "cancelled" };
      else if (body.action === "checkin") {
        if (existing.status !== "booked" || existing.start > now)
          fail("O check-in fica disponível a partir do início.");
        item = { ...existing, status: "checked_in", checkedInAt: now };
      } else fail("Ação inválida.");
    } else {
      const resource = find("resources", body.resourceId),
        floor = find("floors", resource.floorId),
        range = validRange(body);
      if (!resource.active || !floor.published)
        fail("Este espaço não está disponível.");
      if (range.start < now) fail("Escolha um horário futuro.");
      if (
        Date.parse(range.end) - Date.parse(range.start) >
        s.settings.maxDurationMinutes * 60000
      )
        fail(`A duração máxima é de ${s.settings.maxDurationMinutes} minutos.`);
      if (
        Date.parse(range.start) >
        Date.now() + s.settings.maxAdvanceDays * 86400000
      )
        fail("O horário excede a antecedência permitida.");
      if (
        s.reservations.some(
          (r) =>
            r.resourceId === resource.id && active(r) && overlaps(r, range),
        )
      )
        fail("O espaço já está reservado neste período.");
      if (
        s.blocks.some((b) => b.resourceId === resource.id && overlaps(b, range))
      )
        fail("O espaço está bloqueado neste período.");
      item = {
        id: item.id,
        resourceId: resource.id,
        resourceName: resource.name,
        floorId: floor.id,
        userId: user.id,
        userName: user.name,
        title: body.title || "Reserva de espaço",
        ...range,
        status: "booked",
        createdAt: now,
        expiresAt: new Date(
          Math.min(
            Date.parse(range.start) + s.settings.checkinMinutes * 60000,
            Date.parse(range.end),
          ),
        ).toISOString(),
      };
    }
  }
  if (table === "blocks") {
    find("resources", item.resourceId);
    const range = validRange(body);
    if (range.end <= now) fail("O bloqueio deve terminar no futuro.");
    if (
      s.reservations.some(
        (r) =>
          r.resourceId === item.resourceId && active(r) && overlaps(r, range),
      )
    )
      fail("Há reservas neste período. Cancele-as antes de bloquear.");
    if (
      s.blocks.some(
        (b) =>
          b.id !== item.id &&
          b.resourceId === item.resourceId &&
          overlaps(b, range),
      )
    )
      fail("Já existe um bloqueio no período.");
    item = { ...item, ...range, reason: text(body.reason, "Motivo", 500) };
  }
  if (table === "announcements") {
    const range = validRange(body);
    if (range.end <= now) fail("O comunicado deve terminar no futuro.");
    if (item.scopeFloorId) find("floors", item.scopeFloorId);
    item = {
      ...item,
      ...range,
      title: text(item.title, "Título"),
      body: text(item.body, "Mensagem", 3000),
    };
  }
  if (existing) s[table] = s[table].map((x) => (x.id === id ? item : x));
  else s[table].push(item);
  audit("Atualização de " + table, item.id);
  return item;
}
let connection;
function open() {
  return (connection ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("state");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error("Não foi possível abrir o armazenamento do navegador."));
  }));
}
export async function demoApi(path, method = "GET", body) {
  const db = await open();
  return new Promise((resolve, reject) => {
    // One read/write transaction serializes updates even from concurrent tabs.
    const tx = db.transaction("state", "readwrite"),
      store = tx.objectStore("state"),
      req = store.get("app");
    let result, error;
    req.onsuccess = () => {
      try {
        const state = req.result || seed();
        result = execute(state, path, method, body);
        store.put(state, "app");
      } catch (e) {
        error = e;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(structuredClone(result));
    tx.onabort = () =>
      reject(
        error ||
          new Error(
            "Não foi possível salvar. Verifique o espaço disponível no navegador.",
          ),
      );
    tx.onerror = () => {};
  });
}
