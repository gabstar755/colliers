import React, { useState, useEffect, useRef } from "react";

const paths = {
  map: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15",
  calendar: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2",
  edit: "M4 20l4-1L20 7l-3-3L5 16z M14 7l3 3",
  lock: "M6 11h12v10H6z M8 11V7a4 4 0 018 0v4",
  notice: "M4 10v5h4l10 4V6L8 10z M8 15l2 6",
  settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
  desk: "M3 9h18v5H3z M5 14v6 M19 14v6 M8 5h8",
  room: "M5 21V3h14v18 M14 12h1 M3 21h18",
  arrow: "M5 12h14 M14 7l5 5-5 5",
  plus: "M12 5v14 M5 12h14",
  close: "M6 6l12 12 M18 6L6 18",
  upload: "M12 16V3 M7 8l5-5 5 5 M4 15v6h16v-6",
  check: "M4 12l5 5L20 6",
  logout: "M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4",
  users:
    "M16 21v-3a4 4 0 00-4-4H6a4 4 0 00-4 4v3 M13 4a4 4 0 010 8 M22 21v-3a4 4 0 00-3-4 M9 3a4 4 0 100 8 4 4 0 000-8",
  clock: "M12 8v5l3 2 M22 12a10 10 0 11-20 0 10 10 0 0120 0",
  trash: "M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7",
  chevron: "M9 5l7 7-7 7",
  info: "M12 11v6 M12 7h.01 M22 12a10 10 0 11-20 0 10 10 0 0120 0",
};
function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.map} />
    </svg>
  );
}
const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
async function api(path, method = "GET", body) {
  if (DEMO) return (await import("./demo-api.js")).demoApi(path, method, body);
  const res = await fetch("/api" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}
const today = () => new Date().toLocaleDateString("en-CA");
const localInput = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const dateLabel = (v) =>
  new Date(v).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const overlap = (a, b, c, d) =>
  new Date(a) < new Date(d) && new Date(c) < new Date(b);
const active = (r) => ["booked", "checked_in"].includes(r.status);
const statusLabels = {
  booked: "Confirmada",
  checked_in: "Check-in feito",
  cancelled: "Cancelada",
  expired: "Expirada",
  available: "Disponível",
  reserved: "Reservado",
  blocked: "Bloqueado",
};
const list = (v) => (Array.isArray(v) ? v.join(", ") : v || "");
function Field({ label, children, ...props }) {
  const labelId = React.useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {children ? (
        React.cloneElement(children, { "aria-labelledby": labelId })
      ) : (
        <input aria-labelledby={labelId} {...props} />
      )}
    </label>
  );
}
function Button({ children, icon, kind = "", ...props }) {
  return (
    <button className={"btn " + kind} {...props}>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </button>
  );
}
function Empty({ title, body, children }) {
  return (
    <div className="empty">
      <Icon name="map" size={36} />
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </div>
  );
}
function Modal({ title, subtitle, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const old = document.activeElement;
    ref.current.showModal();
    return () => old?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="modal-head">
        <div>
          <span className="eyebrow">Workplace</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-btn" aria-label="Fechar" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function SmartForm({ onSubmit, children, submit = "Salvar", danger = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSubmit(
            Object.fromEntries(new FormData(e.currentTarget)),
            e.currentTarget,
          );
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="form-footer">
        <Button
          type="submit"
          kind={danger ? "danger" : "primary"}
          disabled={busy}
        >
          {busy ? "Salvando…" : submit}
        </Button>
      </div>
    </form>
  );
}
function Auth({ session, onLogin }) {
  const [register, setRegister] = useState(false);
  const setup = session.needsSetup && session.setupAllowed !== false;
  const awaitingSetup = session.needsSetup && session.setupAllowed === false;
  const canRegister = session.registrationOpen !== false;
  return (
    <div className="auth-shell" data-layout-scope>
      <section className="auth-brand" data-layout-box>
        <div className="brand-placeholder">[LOGO COLLIERS]</div>
        <div>
          <span className="eyebrow">Pessoas & espaços</span>
          <h1>
            Seu próximo
            <br />
            dia começa
            <br />
            <strong>aqui.</strong>
          </h1>
          <p>
            Um lugar para organizar o escritório.
            <br />E abrir espaço para boas conexões.
          </p>
        </div>
        <small>Workplace · Piloto local</small>
      </section>
      <main className="auth-main" data-layout-box>
        <div className="auth-card">
          <span className="eyebrow">Gestão de espaços</span>
          <h2>
            {awaitingSetup
              ? "Seu escritório está sendo preparado."
              : setup
                ? "Vamos preparar seu escritório."
                : register
                  ? "Crie seu acesso."
                  : "Bom ter você por aqui."}
          </h2>
          <p>
            {awaitingSetup
              ? "O responsável pela implantação está finalizando o acesso. Volte em breve."
              : setup
                ? "Crie a conta de administrador para cadastrar plantas e organizar as reservas."
                : register
                  ? "Sua conta terá acesso às reservas dos espaços publicados."
                  : "Entre para encontrar seu lugar e planejar seu dia."}
          </p>
          {!awaitingSetup && (
            <SmartForm
              submit={
                setup
                  ? "Criar meu ambiente"
                  : register
                    ? "Criar conta"
                    : "Entrar no Workplace"
              }
              onSubmit={async (v) => {
                await api(
                  setup ? "/setup" : register ? "/register" : "/login",
                  "POST",
                  { ...v, demo: v.demo === "on" },
                );
                await onLogin();
              }}
            >
              {(setup || register) && (
                <Field
                  label="Seu nome"
                  name="name"
                  required
                  maxLength={80}
                  autoComplete="name"
                />
              )}
              <Field
                label="E-mail"
                name="email"
                type="email"
                autoComplete="username"
                required
              />
              <Field
                label="Senha"
                name="password"
                type="password"
                minLength={setup || register ? 10 : 1}
                required
                autoComplete={
                  setup || register ? "new-password" : "current-password"
                }
              />
              {(setup || register) && (
                <small className="muted">Use pelo menos 10 caracteres.</small>
              )}
              {setup && (
                <label className="check-field">
                  <input name="demo" type="checkbox" defaultChecked />
                  <span>
                    Incluir uma planta de demonstração para explorar o editor.
                  </span>
                </label>
              )}
            </SmartForm>
          )}
          {!setup && !awaitingSetup && canRegister && (
            <button className="text-btn" onClick={() => setRegister(!register)}>
              {register ? "Já tenho uma conta" : "Primeiro acesso? Criar conta"}
            </button>
          )}
          {!setup && !awaitingSetup && !canRegister && (
            <p className="muted">
              Para receber seu acesso, fale com o administrador do escritório.
            </p>
          )}
          <div className="auth-note">
            <Icon name="info" />
            <p>
              Ambiente de piloto. O acesso corporativo será conectado na
              implantação.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null),
    [data, setData] = useState(null),
    [loadError, setLoadError] = useState(""),
    [view, setView] = useState("map"),
    [floorId, setFloorId] = useState(""),
    [date, setDate] = useState(today()),
    [from, setFrom] = useState("09:00"),
    [until, setUntil] = useState("17:00"),
    [type, setType] = useState("all"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [modal, setModal] = useState(null),
    [tool, setTool] = useState("select"),
    [toast, setToast] = useState(""),
    [audit, setAudit] = useState([]);
  const refresh = async () => {
    const d = await api("/state");
    setData(d);
    setFloorId((old) =>
      old && d.floors.some((f) => f.id === old) ? old : d.floors[0]?.id || "",
    );
    return d;
  };
  const init = async () => {
    setView("map");
    setSelected(null);
    setModal(null);
    setTool("select");
    try {
      const s = await api("/session");
      setSession(s);
      if (s.user) await refresh();
      setLoadError("");
    } catch (e) {
      setLoadError(e.message);
    }
  };
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (!session?.user) return;
    const t = setInterval(() => refresh().catch(() => {}), 30000);
    return () => clearInterval(t);
  }, [session?.user?.id]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    setSelected(null);
    setTool("select");
  }, [view, floorId]);
  const mutate = async (path, method, body, message = "Alterações salvas.") => {
    const r = await api(path, method, body);
    await refresh();
    setToast(message);
    return r;
  };
  const act = async (...args) => {
    try {
      return await mutate(...args);
    } catch (e) {
      setToast(e.message);
    }
  };
  if (loadError)
    return (
      <Empty title="Não foi possível conectar" body={loadError}>
        <Button onClick={init}>Tentar novamente</Button>
      </Empty>
    );
  if (!session) return <div className="loading">Preparando seu espaço…</div>;
  if (!session.user) return <Auth session={session} onLogin={init} />;
  if (!data) return <div className="loading">Carregando seu escritório…</div>;
  const user = session.user,
    admin = user.role === "admin",
    floor = data.floors.find((f) => f.id === floorId),
    editing = view === "editor";
  const start = new Date(`${date}T${from}`).toISOString(),
    end = new Date(`${date}T${until}`).toISOString();
  const allResources = data.resources.filter((r) => r.floorId === floorId);
  const availability = (r) =>
    !r.active ||
    data.blocks.some(
      (b) => b.resourceId === r.id && overlap(b.start, b.end, start, end),
    )
      ? "blocked"
      : data.reservations.some(
            (b) =>
              b.resourceId === r.id &&
              active(b) &&
              overlap(b.start, b.end, start, end),
          )
        ? "reserved"
        : "available";
  const resources = allResources.filter(
    (r) =>
      (type === "all" || r.type === type) &&
      r.name.toLowerCase().includes(search.toLowerCase()),
  );
  const current = allResources.find((r) => r.id === selected);
  const relevantNotices = data.announcements.filter(
    (n) =>
      (!n.scopeFloorId || n.scopeFloorId === floorId) &&
      new Date(n.start) <= new Date() &&
      new Date(n.end) > new Date(),
  );
  const nav = [
    ["map", "Explorar espaços", "map"],
    ["reservations", "Minhas reservas", "calendar"],
    ...(admin
      ? [
          ["editor", "Plantas e espaços", "edit"],
          ["blocks", "Bloqueios", "lock"],
          ["notices", "Comunicados", "notice"],
          ["settings", "Configurações", "settings"],
        ]
      : []),
  ];
  const viewTitle = {
    map: "Encontre seu lugar.",
    editor: "Desenhe as possibilidades.",
    reservations: "Seu dia, organizado.",
    blocks: "Cuide de cada espaço.",
    notices: "Mantenha todos por perto.",
    settings: "Do seu jeito.",
  };
  const openAudit = async () => {
    try {
      setAudit(await api("/audit"));
      setModal({ kind: "audit" });
    } catch (e) {
      setToast(e.message);
    }
  };
  return (
    <div className="app-shell" data-layout-scope>
      <aside className="sidebar" data-layout-box>
        <div className="brand">
          <div className="brand-placeholder">[LOGO COLLIERS]</div>
          <span className="brand-product">Workplace</span>
        </div>
        <div className="nav-caption">Seu escritório</div>
        <nav aria-label="Navegação principal">
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={view === id ? "nav-item active" : "nav-item"}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon name={icon} />
              {label}
              {view === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="pilot-label">
            <span />
            Piloto local
          </div>
          <p>
            Espaços que conectam.
            <br />
            Pessoas que transformam.
          </p>
          <div className="profile">
            <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{admin ? "Administrador" : "Colaborador"}</small>
            </div>
            <button
              className="icon-btn"
              aria-label="Sair"
              onClick={async () => {
                await api("/logout", "POST", {});
                setData(null);
                await init();
              }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace" data-layout-box>
        <header className="topbar">
          <div>
            <span>Workplace</span>
            <Icon name="chevron" size={14} />
            <strong>{nav.find((n) => n[0] === view)?.[1]}</strong>
          </div>
          <div className="topbar-right">
            <button
              className="icon-btn mobile-logout"
              aria-label="Sair da conta"
              onClick={async () => {
                await api("/logout", "POST", {});
                setData(null);
                await init();
              }}
            >
              <Icon name="logout" size={17} />
            </button>
            <span className="timezone">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
            <span className="role-pill">
              {admin ? "Visão de administrador" : "Visão de colaborador"}
            </span>
          </div>
        </header>
        {DEMO && (
          <div className="demo-banner" role="note">
            <span>
              <strong>Demonstração interativa</strong> · Dados somente neste
              navegador. Use plantas fictícias; não há compartilhamento com a
              equipe.
            </span>
            <Button
              onClick={async () => {
                await api("/demo-role", "POST", {
                  role: admin ? "member" : "admin",
                });
                await init();
              }}
            >
              Testar como {admin ? "colaborador" : "administrador"}
            </Button>
          </div>
        )}
        <main className="main" data-layout-scope>
          <section className="page-heading" data-layout-box>
            <div>
              <span className="eyebrow">
                {editing ? "Gestão do escritório" : "Pessoas & espaços"}
              </span>
              <h1>{viewTitle[view]}</h1>
              <p>
                {
                  {
                    map: "Escolha onde trabalhar. Nós cuidamos do espaço para você.",
                    editor:
                      "Cadastre uma planta e posicione salas e assentos com liberdade.",
                    reservations:
                      "Acompanhe suas reservas e faça seu check-in ao chegar.",
                    blocks:
                      "Defina períodos de indisponibilidade para salas e assentos.",
                    notices:
                      "Publique avisos para todo o escritório ou para um andar.",
                    settings:
                      "Defina as regras que fazem sentido para o seu escritório.",
                  }[view]
                }
              </p>
            </div>
            {editing ? (
              <Button
                kind="primary"
                icon="upload"
                onClick={() => setModal({ kind: "floor" })}
              >
                Cadastrar planta
              </Button>
            ) : view === "blocks" ? (
              <Button
                kind="primary"
                icon="plus"
                onClick={() => setModal({ kind: "block" })}
              >
                Novo bloqueio
              </Button>
            ) : view === "notices" ? (
              <Button
                kind="primary"
                icon="plus"
                onClick={() => setModal({ kind: "notice" })}
              >
                Novo comunicado
              </Button>
            ) : view === "reservations" ? (
              <Button kind="primary" icon="plus" onClick={() => setView("map")}>
                Reservar espaço
              </Button>
            ) : view === "settings" ? (
              <Button icon="clock" onClick={openAudit}>
                Histórico de ações
              </Button>
            ) : (
              <div className="heading-date">
                <span>Seu escritório, conectado</span>
                <strong>
                  {new Date().toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                  })}
                </strong>
              </div>
            )}
          </section>
          {(view === "map" || editing) && (
            <>
              {!editing && relevantNotices.length > 0 && (
                <section className="notices-strip" data-layout-box>
                  {relevantNotices.map((n) => (
                    <div key={n.id}>
                      <Icon name="notice" />
                      <p>
                        <strong>{n.title}</strong>
                        <span>{n.body}</span>
                      </p>
                    </div>
                  ))}
                </section>
              )}
              <section className="filterbar" data-layout-box>
                <Field label="Unidade / andar">
                  <select
                    value={floorId}
                    onChange={(e) => setFloorId(e.target.value)}
                    aria-label="Unidade e andar"
                  >
                    {data.floors.length === 0 && (
                      <option value="">Nenhuma planta cadastrada</option>
                    )}
                    {data.floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.unit} · {f.name}
                        {!f.published ? " (rascunho)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                {!editing && (
                  <>
                    <Field
                      label="Data"
                      type="date"
                      value={date}
                      required
                      onChange={(e) =>
                        e.target.value && setDate(e.target.value)
                      }
                      min={today()}
                    />
                    <Field
                      label="Das"
                      type="time"
                      value={from}
                      required
                      onChange={(e) =>
                        e.target.value && setFrom(e.target.value)
                      }
                    />
                    <Field
                      label="Até"
                      type="time"
                      value={until}
                      required
                      onChange={(e) =>
                        e.target.value && setUntil(e.target.value)
                      }
                    />
                  </>
                )}
                {editing && floor && (
                  <div className="publish-controls">
                    <span
                      className={
                        "badge " + (floor.published ? "available" : "reserved")
                      }
                    >
                      {floor.published ? "Publicada" : "Rascunho"}
                    </span>
                    <Button
                      onClick={() => setModal({ kind: "floorEdit", floor })}
                    >
                      Editar dados
                    </Button>
                    <Button
                      kind="primary"
                      icon="check"
                      onClick={() =>
                        act(
                          "/floors/" + floor.id,
                          "PATCH",
                          { published: !floor.published },
                          floor.published
                            ? "Planta retirada das reservas."
                            : "Planta publicada.",
                        )
                      }
                    >
                      {floor.published
                        ? "Retirar de publicação"
                        : "Publicar planta"}
                    </Button>
                  </div>
                )}
              </section>
              {!floor ? (
                <section data-layout-box className="panel">
                  <Empty
                    title="Seu escritório começa com uma planta."
                    body={
                      admin
                        ? "Envie a planta do primeiro andar e escolha onde cada pessoa pode estar."
                        : "O administrador ainda não publicou espaços para reserva."
                    }
                  >
                    {admin && (
                      <Button
                        kind="primary"
                        icon="upload"
                        onClick={() => setModal({ kind: "floor" })}
                      >
                        Cadastrar primeira planta
                      </Button>
                    )}
                  </Empty>
                </section>
              ) : (
                <>
                  {!editing && (
                    <section className="summary-row" data-layout-box>
                      <div>
                        <span className="stat-number">
                          {allResources
                            .filter((r) => availability(r) === "available")
                            .length.toString()
                            .padStart(2, "0")}
                        </span>
                        <span>
                          espaços disponíveis
                          <small>no período selecionado</small>
                        </span>
                      </div>
                      <div>
                        <Icon name="desk" size={25} />
                        <strong>
                          {allResources.filter((r) => r.type === "desk").length}
                        </strong>
                        <span>assentos</span>
                      </div>
                      <div>
                        <Icon name="room" size={25} />
                        <strong>
                          {allResources.filter((r) => r.type === "room").length}
                        </strong>
                        <span>salas de reunião</span>
                      </div>
                      <div className="summary-end">
                        <Icon name="clock" />
                        <span>
                          Check-in em até{" "}
                          <strong>{data.settings.checkinMinutes} min</strong>
                          <small>após o início da reserva</small>
                        </span>
                      </div>
                    </section>
                  )}
                  <section
                    className="map-layout"
                    data-layout-box
                    data-layout-scope
                  >
                    <div className="map-panel panel" data-layout-box>
                      <div className="map-toolbar">
                        <div className="segmented">
                          {editing
                            ? [
                                ["select", "Selecionar"],
                                ["desk", "+ Assento"],
                                ["room", "+ Sala"],
                              ].map(([v, l]) => (
                                <button
                                  key={v}
                                  className={tool === v ? "active" : ""}
                                  onClick={() => setTool(v)}
                                >
                                  {l}
                                </button>
                              ))
                            : [
                                ["all", "Todos"],
                                ["desk", "Assentos"],
                                ["room", "Salas"],
                              ].map(([v, l]) => (
                                <button
                                  key={v}
                                  className={type === v ? "active" : ""}
                                  onClick={() => setType(v)}
                                >
                                  {l}
                                </button>
                              ))}
                        </div>
                        {!editing && (
                          <input
                            className="search-input"
                            placeholder="Buscar espaço…"
                            aria-label="Buscar espaço"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        )}
                        <span className="map-caption">
                          {editing
                            ? tool === "select"
                              ? "Arraste para reposicionar"
                              : "Clique na planta para adicionar"
                            : floor.name}
                        </span>
                      </div>
                      <FloorMap
                        floor={floor}
                        resources={resources}
                        selected={selected}
                        editing={editing}
                        tool={tool}
                        availability={availability}
                        onSelect={setSelected}
                        onPlace={(x, y) =>
                          setModal({ kind: "resource", type: tool, x, y })
                        }
                        onMove={(id, x, y) =>
                          act(
                            "/resources/" + id,
                            "PATCH",
                            { x, y },
                            "Posição atualizada.",
                          )
                        }
                      />
                      <div className="map-footer">
                        <span className="mobile-map-hint">
                          Deslize a planta para explorar →
                        </span>
                        <div className="legend">
                          <span>
                            <i className="available" />
                            Disponível
                          </span>
                          <span>
                            <i className="reserved" />
                            Reservado
                          </span>
                          <span>
                            <i className="blocked" />
                            Bloqueado
                          </span>
                        </div>
                        <span>
                          {floor.image === "/demo-floor.svg"
                            ? "Planta de demonstração · dados fictícios"
                            : "Planta cadastrada pela administração"}
                        </span>
                      </div>
                    </div>
                    <aside className="details panel" data-layout-box>
                      {current ? (
                        <>
                          <div className="detail-icon">
                            <Icon name={current.type} size={30} />
                          </div>
                          <span className="eyebrow">
                            {current.type === "room"
                              ? "Sala de reunião"
                              : "Estação de trabalho"}
                          </span>
                          <h2>{current.name}</h2>
                          <span className={"badge " + availability(current)}>
                            {statusLabels[availability(current)]}
                          </span>
                          <div className="detail-meta">
                            <p>
                              <Icon name="map" />
                              {floor.unit} · {floor.name}
                            </p>
                            <p>
                              <Icon name="users" />
                              {current.capacity}{" "}
                              {current.capacity === 1 ? "pessoa" : "pessoas"}
                            </p>
                            <p>
                              <Icon name="desk" />
                              {list(current.equipment) ||
                                "Sem recursos adicionais"}
                            </p>
                          </div>
                          {editing ? (
                            <>
                              <p className="muted">
                                Arraste o marcador na planta ou ajuste a posição
                                nos detalhes.
                              </p>
                              <Button
                                kind="primary"
                                icon="edit"
                                onClick={() =>
                                  setModal({
                                    kind: "resourceEdit",
                                    resource: current,
                                  })
                                }
                              >
                                Editar espaço
                              </Button>
                              <Button
                                icon="plus"
                                onClick={() =>
                                  setModal({
                                    kind: "resource",
                                    type: current.type,
                                    x: Math.min(current.x + 5, 95),
                                    y: Math.min(current.y + 5, 95),
                                    copy: current,
                                  })
                                }
                              >
                                Duplicar espaço
                              </Button>
                              <Button
                                kind="danger-quiet"
                                icon="trash"
                                onClick={() =>
                                  setModal({
                                    kind: "deleteResource",
                                    resource: current,
                                  })
                                }
                              >
                                Excluir espaço
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="detail-period">
                                <span>
                                  {new Date(date + "T12:00").toLocaleDateString(
                                    "pt-BR",
                                    {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "long",
                                    },
                                  )}
                                </span>
                                <strong>
                                  {from} — {until}
                                </strong>
                              </div>
                              <Button
                                kind="primary"
                                icon="arrow"
                                disabled={
                                  availability(current) !== "available" ||
                                  !floor.published ||
                                  end <= start
                                }
                                onClick={() =>
                                  setModal({
                                    kind: "reserve",
                                    resource: current,
                                  })
                                }
                              >
                                Reservar{" "}
                                {current.type === "room" ? "sala" : "assento"}
                              </Button>
                              {!floor.published && (
                                <p className="muted">
                                  Publique esta planta para habilitar reservas.
                                </p>
                              )}
                              <p className="detail-help">
                                Sua reserva é liberada se o check-in não for
                                feito no prazo.
                              </p>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="detail-icon">
                            <Icon name={editing ? "edit" : "map"} size={30} />
                          </div>
                          <span className="eyebrow">
                            {editing ? "O espaço é seu" : "Faça sua escolha"}
                          </span>
                          <h2>
                            {editing
                              ? "Dê vida à sua planta."
                              : "Um lugar para o seu dia."}
                          </h2>
                          <p>
                            {editing
                              ? "Selecione “+ Assento” ou “+ Sala” e clique no local desejado."
                              : "Selecione um assento ou uma sala na planta para ver os detalhes e reservar."}
                          </p>
                          <div className="detail-tip">
                            <Icon name="info" />
                            <span>
                              {editing
                                ? "Você pode mover os espaços depois. As posições ficam salvas automaticamente."
                                : "A disponibilidade acompanha a data e os horários escolhidos."}
                            </span>
                          </div>
                        </>
                      )}
                    </aside>
                  </section>
                  {editing && (
                    <p className="editing-note" data-layout-box>
                      <Icon name="info" /> Alterações são salvas
                      automaticamente. Para reorganizar sem disponibilizar novas
                      reservas, retire a planta de publicação.
                    </p>
                  )}
                </>
              )}
            </>
          )}
          {view === "reservations" && (
            <Reservations
              data={data}
              user={user}
              act={act}
              setModal={setModal}
            />
          )}
          {view === "blocks" && (
            <section className="panel" data-layout-box>
              <div className="section-title">
                <h2>Bloqueios programados</h2>
                <span>{data.blocks.length} registros</span>
              </div>
              {!data.blocks.length ? (
                <Empty
                  title="Tudo pronto para receber pessoas."
                  body="Crie um bloqueio quando um espaço precisar ficar indisponível."
                />
              ) : (
                <div className="record-list">
                  {data.blocks.map((b) => (
                    <article className="record" key={b.id}>
                      <div className="record-icon">
                        <Icon name="lock" />
                      </div>
                      <div className="record-main">
                        <h3>
                          {data.resources.find((r) => r.id === b.resourceId)
                            ?.name || "Espaço removido"}
                        </h3>
                        <p>{b.reason}</p>
                        <small>
                          {dateLabel(b.start)} → {dateLabel(b.end)}
                        </small>
                      </div>
                      <Button
                        onClick={() =>
                          setModal({ kind: "deleteBlock", block: b })
                        }
                      >
                        Remover bloqueio
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {view === "notices" && (
            <section className="panel" data-layout-box>
              <div className="section-title">
                <h2>Mural de comunicados</h2>
                <span>{data.announcements.length} comunicados</span>
              </div>
              {!data.announcements.length ? (
                <Empty
                  title="Uma boa comunicação aproxima."
                  body="Publique um aviso e escolha quando e onde ele será exibido."
                />
              ) : (
                <div className="record-list">
                  {data.announcements.map((n) => (
                    <article className="record" key={n.id}>
                      <div className="record-icon">
                        <Icon name="notice" />
                      </div>
                      <div className="record-main">
                        <span className="eyebrow">
                          {data.floors.find((f) => f.id === n.scopeFloorId)
                            ?.name || "Todo o escritório"}
                        </span>
                        <h3>{n.title}</h3>
                        <p className="pre-line">{n.body}</p>
                        <small>
                          {dateLabel(n.start)} → {dateLabel(n.end)}
                        </small>
                      </div>
                      <Button
                        icon="trash"
                        onClick={() =>
                          setModal({ kind: "deleteNotice", notice: n })
                        }
                      >
                        Excluir
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {view === "settings" && (
            <section
              className="settings-layout"
              data-layout-box
              data-layout-scope
            >
              <div className="panel settings-panel" data-layout-box>
                <h2>Regras de reserva</h2>
                <p className="muted">
                  Aplicadas às novas reservas de salas e assentos.
                </p>
                <SmartForm
                  onSubmit={(v) =>
                    mutate(
                      "/settings",
                      "PATCH",
                      Object.fromEntries(
                        Object.entries(v).map(([k, v]) => [k, Number(v)]),
                      ),
                    )
                  }
                >
                  <Field
                    label="Prazo de check-in (minutos)"
                    type="number"
                    name="checkinMinutes"
                    min="1"
                    max="120"
                    required
                    defaultValue={data.settings.checkinMinutes}
                  />
                  <Field
                    label="Duração máxima da reserva (minutos)"
                    name="maxDurationMinutes"
                    type="number"
                    min="15"
                    max="1440"
                    required
                    defaultValue={data.settings.maxDurationMinutes}
                  />
                  <Field
                    label="Antecedência máxima (dias)"
                    name="maxAdvanceDays"
                    type="number"
                    min="1"
                    max="365"
                    required
                    defaultValue={data.settings.maxAdvanceDays}
                  />
                </SmartForm>
              </div>
              <aside className="settings-aside" data-layout-box>
                <Icon name="clock" size={34} />
                <h2>
                  Mais disponibilidade.
                  <br />
                  Menos espaços vazios.
                </h2>
                <p>
                  Reservas sem check-in expiram após o prazo definido. O espaço
                  volta a ficar disponível automaticamente.
                </p>
                <p>
                  Os horários usam o fuso do seu navegador. As reservas já
                  criadas mantêm o prazo de check-in original.
                </p>
                <hr />
                <span className="eyebrow">Acesso e identidade</span>
                <p>
                  Contas locais para validar o piloto. Login corporativo e envio
                  de e-mails entram na etapa de implantação.
                </p>
              </aside>
            </section>
          )}
          <footer className="page-footer" data-layout-box>
            <span>Workplace · Gestão de espaços</span>
            <span>Rascunho visual para revisão do Marketing</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="info" />
          <span>{toast}</span>
          <button
            className="icon-btn"
            onClick={() => setToast("")}
            aria-label="Dispensar mensagem"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal title={modalTitle(modal)} onClose={() => setModal(null)}>
          <ModalContent
            modal={modal}
            data={data}
            floorId={floorId}
            start={start}
            end={end}
            mutate={mutate}
            close={() => setModal(null)}
            setFloorId={setFloorId}
            setSelected={setSelected}
            audit={audit}
          />
        </Modal>
      )}
    </div>
  );
}

function FloorMap({
  floor,
  resources,
  selected,
  editing,
  tool,
  availability,
  onSelect,
  onPlace,
  onMove,
}) {
  const ref = useRef(),
    drag = useRef(null),
    [moving, setMoving] = useState(null);
  const point = (e) => {
    const b = ref.current.getBoundingClientRect();
    return {
      x: Math.max(3, Math.min(97, ((e.clientX - b.left) / b.width) * 100)),
      y: Math.max(4, Math.min(96, ((e.clientY - b.top) / b.height) * 100)),
    };
  };
  return (
    <div className="map-scroll">
      <div
        className={
          "floor-map " + (editing && tool !== "select" ? "placing" : "")
        }
        style={{ aspectRatio: `${floor.width || 1000}/${floor.height || 650}` }}
        ref={ref}
        onClick={(e) => {
          if (e.target.closest("button")) return;
          if (editing && tool !== "select") {
            const p = point(e);
            onPlace(p.x, p.y);
          } else onSelect(null);
        }}
      >
        <img
          src={floor.image}
          alt={"Planta de " + floor.name}
          draggable="false"
        />
        {resources.map((r) => {
          const pos = moving?.id === r.id ? moving : r;
          return (
            <button
              key={r.id}
              type="button"
              aria-label={`${r.type === "room" ? "Sala" : "Assento"} ${r.name} — ${statusLabels[availability(r)]}`}
              className={`map-marker ${r.type} ${availability(r)} ${selected === r.id ? "selected" : ""}`}
              style={{ left: pos.x + "%", top: pos.y + "%" }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(r.id);
              }}
              onPointerDown={(e) => {
                if (!editing || tool !== "select") return;
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { id: r.id, x: e.clientX, y: e.clientY };
              }}
              onPointerMove={(e) => {
                if (
                  drag.current?.id === r.id &&
                  Math.hypot(
                    e.clientX - drag.current.x,
                    e.clientY - drag.current.y,
                  ) > 4
                )
                  setMoving({ id: r.id, ...point(e) });
              }}
              onPointerUp={(e) => {
                if (drag.current?.id === r.id) {
                  if (moving?.id === r.id) {
                    const p = point(e);
                    onMove(r.id, p.x, p.y);
                  }
                  drag.current = null;
                  setMoving(null);
                }
              }}
              onPointerCancel={() => {
                drag.current = null;
                setMoving(null);
              }}
            >
              <Icon name={r.type} size={r.type === "room" ? 20 : 16} />
              <span>{r.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Reservations({ data, user, act, setModal }) {
  const [all, setAll] = useState(false);
  const rows = data.reservations
    .filter((r) => all || r.userId === user.id)
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  return (
    <section className="panel" data-layout-box>
      <div className="section-title">
        <h2>{all ? "Todas as reservas" : "Minhas reservas"}</h2>
        {user.role === "admin" && (
          <label className="check-field">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) => setAll(e.target.checked)}
            />
            Ver reservas de todos
          </label>
        )}
      </div>
      {!rows.length ? (
        <Empty
          title="Sua agenda está livre."
          body="Escolha um espaço na planta para fazer a primeira reserva."
        />
      ) : (
        <div className="record-list">
          {rows.map((r) => {
            const resource = data.resources.find((s) => s.id === r.resourceId),
              floor = data.floors.find((f) => f.id === resource?.floorId);
            return (
              <article className="record" key={r.id}>
                <div className="record-icon">
                  <Icon name={resource?.type || "calendar"} />
                </div>
                <div className="record-main">
                  <h3>
                    {resource?.name || "Espaço removido"}
                    {r.title && <span> · {r.title}</span>}
                  </h3>
                  <p>
                    {floor?.unit} · {floor?.name}
                    {all && " · " + (r.userName || r.name || "Colaborador")}
                  </p>
                  <small>
                    {dateLabel(r.start)} → {dateLabel(r.end)}
                  </small>
                </div>
                <div className="record-actions">
                  <span
                    className={
                      "badge " +
                      (r.status === "checked_in"
                        ? "available"
                        : r.status === "booked"
                          ? "reserved"
                          : "blocked")
                    }
                  >
                    {statusLabels[r.status]}
                  </span>
                  {r.status === "booked" &&
                    new Date(r.start) <= new Date() &&
                    new Date(r.end) > new Date() && (
                      <Button
                        kind="primary"
                        icon="check"
                        onClick={() =>
                          act(
                            "/reservations/" + r.id,
                            "PATCH",
                            { action: "checkin" },
                            "Check-in realizado. Bom trabalho!",
                          )
                        }
                      >
                        Fazer check-in
                      </Button>
                    )}
                  {active(r) && (
                    <Button
                      onClick={() =>
                        setModal({ kind: "cancelReservation", reservation: r })
                      }
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
function modalTitle(m) {
  return {
    floor: "Cadastre uma planta",
    floorEdit: "Dados da planta",
    resource: m.type === "room" ? "Adicionar sala" : "Adicionar assento",
    resourceEdit: "Editar espaço",
    reserve: "Reserve seu espaço",
    block: "Programar bloqueio",
    notice: "Novo comunicado",
    audit: "Histórico de ações",
    deleteResource: "Excluir este espaço?",
    deleteBlock: "Remover este bloqueio?",
    deleteNotice: "Excluir este comunicado?",
    cancelReservation: "Cancelar esta reserva?",
  }[m.kind];
}
async function imageFile(file, page = 1) {
  if (!file?.size) throw new Error("Selecione uma planta.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Use um arquivo de até 15 MB.");
  if (file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() })
      .promise;
    try {
      if (page > doc.numPages || page < 1)
        throw new Error(
          `O PDF tem ${doc.numPages} página(s). Escolha uma página válida.`,
        );
      const p = await doc.getPage(page);
      const initial = p.getViewport({ scale: 1 });
      const viewport = p.getViewport({
        scale: Math.min(2, 2400 / initial.width, 2400 / initial.height),
      });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await p.render({ canvasContext: canvas.getContext("2d"), viewport })
        .promise;
      return {
        image: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
      };
    } finally {
      await doc.destroy();
    }
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Use PNG, JPG, WebP ou PDF.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 2400 / img.width, 2400 / img.height);
    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      image: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function ModalContent({
  modal: m,
  data,
  floorId,
  start,
  end,
  mutate,
  close,
  setFloorId,
  setSelected,
  audit,
}) {
  const finish = async (...args) => {
    const r = await mutate(...args);
    close();
    return r;
  };
  if (m.kind === "floor" || m.kind === "floorEdit")
    return (
      <SmartForm
        submit={m.kind === "floor" ? "Cadastrar planta" : "Salvar dados"}
        onSubmit={async (v, form) => {
          let asset = {};
          if (m.kind === "floor")
            asset = await imageFile(
              form.elements.file.files[0],
              Number(v.page),
            );
          const r = await finish(
            "/floors" + (m.floor ? "/" + m.floor.id : ""),
            m.floor ? "PATCH" : "POST",
            { name: v.name, unit: v.unit, ...asset },
          );
          if (!m.floor) {
            const id = r.id || r.floor?.id;
            if (id) setFloorId(id);
          }
        }}
      >
        <div className="form-grid">
          <Field
            label="Unidade"
            name="unit"
            required
            maxLength={100}
            placeholder="Ex.: São Paulo"
            defaultValue={m.floor?.unit}
          />
          <Field
            label="Andar / nome da planta"
            name="name"
            required
            maxLength={100}
            placeholder="Ex.: 8º andar"
            defaultValue={m.floor?.name}
          />
        </div>
        {m.kind === "floor" && (
          <>
            <label className="upload-zone">
              <Icon name="upload" size={30} />
              <strong>Envie sua planta</strong>
              <span>PNG, JPG, WebP ou PDF · até 15 MB</span>
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                required
              />
            </label>
            <Field
              label="Página do PDF (se aplicável)"
              name="page"
              type="number"
              min="1"
              defaultValue="1"
            />
            <p className="muted">
              Cada andar recebe uma planta. PDFs são convertidos em imagem;
              selecione a página que representa o andar.
            </p>
          </>
        )}
      </SmartForm>
    );
  if (["resource", "resourceEdit"].includes(m.kind)) {
    const r = m.resource || m.copy;
    return (
      <SmartForm
        submit={m.resource ? "Salvar espaço" : "Adicionar à planta"}
        onSubmit={(v) =>
          finish(
            "/resources" + (m.resource ? "/" + r.id : ""),
            m.resource ? "PATCH" : "POST",
            {
              floorId,
              type: v.type,
              name: v.name,
              capacity: Number(v.capacity),
              equipment: v.equipment
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
              active: v.active === "on",
              x: Number(v.x),
              y: Number(v.y),
            },
          )
        }
      >
        <div className="form-grid">
          <Field
            label="Nome / número"
            name="name"
            defaultValue={m.resource ? r.name : m.copy ? r.name + " cópia" : ""}
            required
            maxLength={70}
            placeholder="Ex.: Sala Horizonte"
          />
          <Field label="Tipo">
            <select name="type" defaultValue={r?.type || m.type}>
              <option value="desk">Assento</option>
              <option value="room">Sala</option>
            </select>
          </Field>
        </div>
        <Field
          label="Capacidade (pessoas)"
          type="number"
          name="capacity"
          required
          min="1"
          max="100"
          defaultValue={r?.capacity || (m.type === "room" ? 6 : 1)}
        />
        <Field
          label="Recursos (separados por vírgula)"
          name="equipment"
          defaultValue={list(r?.equipment)}
          placeholder="TV, videoconferência, monitor"
          maxLength={300}
        />
        <div className="form-grid">
          <Field
            label="Posição horizontal (%)"
            type="number"
            step="0.01"
            min="3"
            max="97"
            name="x"
            required
            defaultValue={Number(m.resource ? r.x : m.x).toFixed(2)}
          />
          <Field
            label="Posição vertical (%)"
            type="number"
            step="0.01"
            min="4"
            max="96"
            name="y"
            required
            defaultValue={Number(m.resource ? r.y : m.y).toFixed(2)}
          />
        </div>
        <label className="check-field">
          <input
            type="checkbox"
            name="active"
            defaultChecked={r ? r.active : true}
          />
          Espaço ativo para reservas
        </label>
      </SmartForm>
    );
  }
  if (m.kind === "reserve")
    return (
      <SmartForm
        submit="Confirmar reserva"
        onSubmit={(v) =>
          finish(
            "/reservations",
            "POST",
            {
              resourceId: m.resource.id,
              start: v.start ? new Date(v.start).toISOString() : start,
              end: v.end ? new Date(v.end).toISOString() : end,
              title: v.title,
            },
            "Reserva confirmada. Faça seu check-in ao chegar.",
          )
        }
      >
        <div className="reservation-summary">
          <Icon name={m.resource.type} size={28} />
          <div>
            <strong>{m.resource.name}</strong>
            <span>
              {data.floors.find((f) => f.id === m.resource.floorId)?.name}
            </span>
          </div>
        </div>
        <div className="form-grid">
          <Field
            label="Início"
            name="start"
            type="datetime-local"
            defaultValue={localInput(new Date(start))}
            required
          />
          <Field
            label="Fim"
            name="end"
            type="datetime-local"
            defaultValue={localInput(new Date(end))}
            required
          />
        </div>
        <Field
          label="Título (opcional)"
          name="title"
          maxLength={120}
          placeholder="Ex.: Reunião de planejamento"
        />
        <div className="info-box">
          <Icon name="clock" />
          <p>
            Faça check-in até{" "}
            <strong>{data.settings.checkinMinutes} minutos</strong> após o
            início. Sem check-in, a reserva expira automaticamente.
          </p>
        </div>
      </SmartForm>
    );
  if (m.kind === "block")
    return (
      <SmartForm
        submit="Criar bloqueio"
        onSubmit={(v) =>
          finish(
            "/blocks",
            "POST",
            {
              ...v,
              start: new Date(v.start).toISOString(),
              end: new Date(v.end).toISOString(),
            },
            "Bloqueio programado.",
          )
        }
      >
        <Field label="Espaço">
          <select name="resourceId" required>
            <option value="">Selecione um espaço</option>
            {data.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {data.floors.find((f) => f.id === r.floorId)?.name} · {r.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field
            label="Início"
            name="start"
            type="datetime-local"
            defaultValue={localInput()}
            required
          />
          <Field label="Fim" name="end" type="datetime-local" required />
        </div>
        <Field
          label="Motivo"
          name="reason"
          required
          maxLength={300}
          placeholder="Ex.: Manutenção do projetor"
        />
        <div className="info-box">
          <Icon name="info" />
          <p>
            Se houver reservas no período, o bloqueio será impedido. Consulte e
            resolva as reservas antes de continuar.
          </p>
        </div>
      </SmartForm>
    );
  if (m.kind === "notice")
    return (
      <SmartForm
        submit="Salvar comunicado"
        onSubmit={(v) =>
          finish(
            "/announcements",
            "POST",
            {
              ...v,
              scopeFloorId: v.scopeFloorId || null,
              start: new Date(v.start).toISOString(),
              end: new Date(v.end).toISOString(),
            },
            "Comunicado salvo.",
          )
        }
      >
        <Field label="Título" name="title" required maxLength={120} />
        <Field label="Mensagem">
          <textarea name="body" rows="4" maxLength={2000} required />
        </Field>
        <Field label="Exibir em">
          <select name="scopeFloorId">
            <option value="">Todo o escritório</option>
            {data.floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.unit} · {f.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field
            label="Exibir a partir de"
            name="start"
            type="datetime-local"
            defaultValue={localInput()}
            required
          />
          <Field label="Exibir até" name="end" type="datetime-local" required />
        </div>
      </SmartForm>
    );
  if (m.kind === "audit") {
    const entries = Array.isArray(audit)
      ? audit
      : audit.entries || audit.audit || [];
    return (
      <div className="audit-list">
        {entries.length ? (
          entries.map((a, i) => (
            <article key={a.id || i}>
              <strong>{a.action}</strong>
              <p>{a.detail || a.details || a.entityId || a.target || ""}</p>
              <small>
                {a.userName || a.actorName || a.actor || ""} ·{" "}
                {dateLabel(a.createdAt || a.at || a.timestamp)}
              </small>
            </article>
          ))
        ) : (
          <p>Nenhuma ação registrada.</p>
        )}
      </div>
    );
  }
  const remove = {
    deleteResource: [
      "/resources/" + m.resource?.id,
      "DELETE",
      undefined,
      "O espaço será removido. Reservas ativas precisam ser resolvidas antes da exclusão.",
    ],
    deleteBlock: [
      "/blocks/" + m.block?.id,
      "DELETE",
      undefined,
      "O espaço voltará a aceitar reservas para este período.",
    ],
    deleteNotice: [
      "/announcements/" + m.notice?.id,
      "DELETE",
      undefined,
      "O comunicado deixará de ser exibido.",
    ],
    cancelReservation: [
      "/reservations/" + m.reservation?.id,
      "PATCH",
      { action: "cancel" },
      "O espaço ficará disponível para outras pessoas.",
    ],
  }[m.kind];
  if (remove)
    return (
      <SmartForm
        submit="Confirmar"
        danger
        onSubmit={async () => {
          await finish(remove[0], remove[1], remove[2], "Operação concluída.");
          if (m.kind === "deleteResource") setSelected(null);
        }}
      >
        <p>{remove[3]}</p>
      </SmartForm>
    );
  return null;
}
