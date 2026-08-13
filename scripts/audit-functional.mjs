import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  logLevel: "silent",
  environments: { client: { dev: { hot: false } } },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});

try {
  const services = await server.ssrLoadModule("/src/lib/impulzii/services.ts");
  const store = await server.ssrLoadModule("/src/lib/impulzii/store.ts");
  const {
    AuthService,
    ExecutionService,
    MissionService,
    RewardService,
    VenueService,
    WalletService,
  } = services;
  const { getState, resetStore, setState } = store;

  const expectError = (callback, message) => {
    assert.throws(callback, message ? new RegExp(message, "i") : undefined);
  };

  resetStore();
  setState((state) => {
    state.users = state.users.map((user) =>
      user.id === "u_demo" ? { ...user, active: false } : user,
    );
  });
  assert.equal(AuthService.loginAs("u_demo"), null, "Un usuario inactivo no debe iniciar sesión");

  resetStore();
  const available = MissionService.getAvailableMissions("u_demo");
  assert.ok(available.length > 0, "El participante demo debe tener misiones disponibles");
  const training = available.find((mission) => mission.id === "mi_patrimonio_training");
  assert.ok(training, "La capacitación demo debe estar disponible");

  const execution = ExecutionService.accept("u_demo", training.id);
  ExecutionService.start(execution.id);
  expectError(() => ExecutionService.submit(execution.id), "Campo obligatorio");
  ExecutionService.saveDraft(
    execution.id,
    {
      q1: "Nacional",
      q2: ["Carnes"],
      q3: "Recomendar según el gusto del cliente",
    },
    [],
  );
  const submitted = ExecutionService.submit(execution.id);
  assert.equal(submitted.status, "in_review");
  expectError(
    () => ExecutionService.review(execution.id, "u_buena_vida_admin", "approved"),
    "permiso",
  );
  ExecutionService.review(execution.id, "u_auditor", "approved");
  assert.equal(WalletService.balance("u_demo").available, training.rewardPoints);
  expectError(() => ExecutionService.review(execution.id, "u_auditor", "approved"), "revisada");
  assert.equal(
    WalletService.transactions("u_demo").filter(
      (transaction) => transaction.executionId === execution.id,
    ).length,
    1,
    "Una ejecución solo puede acreditar una vez",
  );

  setState((state) => {
    state.venues = state.venues.map((venue) =>
      venue.id === "v_bahia" ? { ...venue, active: false } : venue,
    );
  });
  expectError(() => VenueService.requestMembership("u_demo", "v_bahia"), "inactivo");

  WalletService.adjust("u_demo", 3000, "Saldo de prueba", "u_admin");
  const initialStock = RewardService.byId("r_ctg_buena_vida").stock;
  const redemption = RewardService.redeem("u_demo", "r_ctg_buena_vida");
  assert.equal(RewardService.byId("r_ctg_buena_vida").stock, initialStock - 1);
  assert.equal(RewardService.checkToken(redemption.token, "u_venueadmin").valid, false);
  assert.equal(RewardService.checkToken(redemption.token, "u_buena_vida_admin").valid, true);
  RewardService.consumeToken(redemption.token, "u_buena_vida_admin");
  expectError(
    () => RewardService.consumeToken(redemption.token, "u_buena_vida_admin"),
    "utilizado",
  );

  const expiring = RewardService.redeem("u_demo", "r_ctg_buena_vida");
  const stockReserved = RewardService.byId("r_ctg_buena_vida").stock;
  const balanceReserved = WalletService.balance("u_demo").available;
  setState((state) => {
    state.redemptions = state.redemptions.map((item) =>
      item.id === expiring.id ? { ...item, expiresAt: new Date(0).toISOString() } : item,
    );
  });
  assert.equal(WalletService.balance("u_demo").available, balanceReserved + expiring.points);
  assert.equal(RewardService.byId("r_ctg_buena_vida").stock, stockReserved + 1);
  assert.equal(
    RewardService.redemptions("u_demo").find((item) => item.id === expiring.id).status,
    "cancelled",
  );

  const beforePending = WalletService.balance("u_demo").available;
  setState((state) => {
    state.wallet = [
      ...state.wallet,
      {
        id: "w_pending_audit",
        userId: "u_demo",
        kind: "mission_credit",
        points: 10000,
        concept: "Crédito pendiente de prueba",
        createdAt: new Date().toISOString(),
        status: "pending",
      },
    ];
  });
  assert.equal(WalletService.balance("u_demo").available, beforePending);

  console.log("Auditoría funcional automatizada: 18 controles superados.");
} finally {
  await server.close();
}
