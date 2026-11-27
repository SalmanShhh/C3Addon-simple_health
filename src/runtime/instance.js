import { id, properties as PROPERTY_DEFS } from "../../config.caw.js";

// Property id -> index in _getInitProperties(). Read only through prop("id"): a string key
// survives Advanced minification, which renames dotted properties such as PROP.maxHealth.
const PROP_INDEX = Object.fromEntries(PROPERTY_DEFS.map((p, i) => [p.id, i]));

// Combo keys. ACEs pass the 0-based index, scripts may pass the key. Append only: indices are saved.
const STATUS_UNITS = ["seconds", "turns"];
const STATUS_PERIODIC_TYPES = ["none", "damage", "heal"];
const STATUS_REAPPLY_MODES = ["refresh", "extend", "keep"];
const STATUS_EVENTS = ["applied", "reapplied", "ticked", "expired", "removed"];
const STATUS_MODIFIERS = ["pool_absorption"];
const STATUS_TRIGGERS = ["OnStatus", "OnAnyStatus"]; // named trigger first, then the "any" one

const UNIT_SECONDS = 0, UNIT_TURNS = 1;
const PERIODIC_NONE = 0, PERIODIC_DAMAGE = 1, PERIODIC_HEAL = 2;
const REAPPLY_REFRESH = 0, REAPPLY_EXTEND = 1;
const EV_APPLIED = 0, EV_REAPPLIED = 1, EV_TICKED = 2, EV_EXPIRED = 3, EV_REMOVED = 4;
const EPS = 1e-6;              // float tolerance so a tick due exactly at expiry is never lost
const MAX_TICKS_PER_STEP = 8;  // per status per frame/turn: caps tiny intervals and huge dt

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      const props = this._getInitProperties();
      const prop = (key) => props[PROP_INDEX[key]];

      this._debugMode = prop("debugMode") ?? false;
      this._maxHealth = prop("maxHealth");
      this._invulnerable = prop("invulnerable");
      this._destroyOnDeath = prop("destroyOnDeath");
      this._clearStatusesOnDeath = prop("clearStatusesOnDeath") ?? true;
      this._enabled = prop("enabled") ?? true;

      // Health
      this._currentHealth = this._maxHealth;
      this._isDead = false;
      this._lastDamage = 0;               // damage that last reached real health
      this._lastHeal = 0;
      this._lastDamageStatus = "";        // status behind _lastDamage ("" = direct)
      this._lastHealStatus = "";          // status behind _lastHeal ("" = direct)
      this._healthAbsorptionRate = 1;     // multiplier on damage reaching real health

      // Health pools: name -> { amount, decayRate, absorptionRate, lastAbsorbed, priority }
      this._tempHealthPools = new Map();
      this._lastTriggerTempType = "";     // pool that fired the last pool trigger
      this._lastTempDamageAbsorbed = 0;
      this._poolAbsorptionMultiplier = 1; // scales every pool's rate without changing it

      // Statuses: lowercased name -> record. Records stay (inactive) after ending so config is kept.
      this._statuses = new Map();
      this._activeOrder = [];             // active status keys, in activation order
      this._statusStepId = 0;             // +1 per frame or turn step
      this._lastStatus = "";              // status that fired the last status trigger
      this._lastStatusEvent = -1;         // its STATUS_EVENTS index
      this._lastTickAmount = 0;

      this._setTicking(true);
    }

    // ─── Construct lifecycle ─────────────────────────────────────────────────

    _tick() {
      if (!this._enabled) return; // disabled pauses pool decay and status timers
      if (this._tempHealthPools.size > 0) this._tickPoolDecay();
      // Per-instance dt follows the object's time scale; fall back to global dt if missing
      if (this._activeOrder.length > 0) this._stepStatuses(UNIT_SECONDS, this.instance.dt ?? this.runtime.dt);
    }

    _trigger(method) {
      super._trigger(self.C3.Behaviors[id].Cnds[method]);
    }

    // Fires several triggers in order
    _fire(...methods) {
      for (const method of methods) this._trigger(method);
    }

    // Keys are quoted so savegames survive minification. Never rename them: older saves use them.
    _saveToJson() {
      return {
        "mh": this._maxHealth, "ch": this._currentHealth, "inv": this._invulnerable,
        "dod": this._destroyOnDeath, "dead": this._isDead, "en": this._enabled,
        "ld": this._lastDamage, "lh": this._lastHeal, "lds": this._lastDamageStatus, "lhs": this._lastHealStatus,
        "har": this._healthAbsorptionRate, "pam": this._poolAbsorptionMultiplier,
        "thp": [...this._tempHealthPools].map(([k, p]) => ({ k, a: p.amount, dr: p.decayRate, ar: p.absorptionRate, la: p.lastAbsorbed, pr: p.priority })),
        "lttt": this._lastTriggerTempType, "ltda": this._lastTempDamageAbsorbed,
        "st": [...this._statuses.values()].map((s) => ({
          "k": s.key, "n": s.name, "s": s.stacks, "u": s.unit, "d": s.duration, "r": s.remaining,
          "i": s.interval, "tp": s.tickProgress, "pt": s.periodicType, "pa": s.amountPerStack,
          "ms": s.maxStacks, "rm": s.reapplyMode, "sl": s.stacksLostPerTick, "pm": s.poolAbsorptionMultiplier,
        })),
        "so": [...this._activeOrder], "csd": this._clearStatusesOnDeath,
        "ls": this._lastStatus, "lse": this._lastStatusEvent, "lta": this._lastTickAmount,
        "sv": 2,
      };
    }

    // Missing keys fall back to defaults, so saves from older versions load cleanly
    _loadFromJson(o) {
      this._maxHealth = o["mh"] ?? this._maxHealth;
      this._currentHealth = o["ch"] ?? this._currentHealth;
      this._invulnerable = o["inv"] ?? this._invulnerable;
      this._destroyOnDeath = o["dod"] ?? this._destroyOnDeath;
      this._isDead = o["dead"] ?? false;
      this._enabled = o["en"] ?? true;
      this._lastDamage = o["ld"] ?? 0;
      this._lastHeal = o["lh"] ?? 0;
      this._lastDamageStatus = o["lds"] ?? "";
      this._lastHealStatus = o["lhs"] ?? "";
      this._healthAbsorptionRate = o["har"] ?? 1;
      this._poolAbsorptionMultiplier = o["pam"] ?? 1;

      this._tempHealthPools.clear();
      for (const e of o["thp"] || []) {
        this._tempHealthPools.set(e.k, { amount: e.a ?? 0, decayRate: e.dr ?? 0, absorptionRate: e.ar ?? 1, lastAbsorbed: e.la ?? 0, priority: e.pr ?? 0 });
      }
      this._lastTriggerTempType = o["lttt"] ?? "";
      this._lastTempDamageAbsorbed = o["ltda"] ?? 0;

      this._statuses.clear();
      for (const e of o["st"] || []) {
        const s = this._createStatusRecord(e["k"], e["n"] ?? e["k"]);
        Object.assign(s, {
          stacks: e["s"] ?? 0, unit: e["u"] ?? UNIT_SECONDS, duration: e["d"] ?? 0, remaining: e["r"] ?? 0,
          interval: e["i"] ?? 1, tickProgress: e["tp"] ?? 0, periodicType: e["pt"] ?? PERIODIC_NONE,
          amountPerStack: e["pa"] ?? 0, maxStacks: e["ms"] ?? -1, reapplyMode: e["rm"] ?? REAPPLY_REFRESH,
          stacksLostPerTick: e["sl"] ?? 0, poolAbsorptionMultiplier: e["pm"] ?? 1,
        });
        this._statuses.set(s.key, s);
      }
      // Rebuild the active order from the records, so a partial save can't desync them
      this._activeOrder = (o["so"] || []).filter((k) => this._statuses.get(k)?.stacks > 0);
      for (const s of this._statuses.values()) {
        if (s.stacks > 0 && !this._activeOrder.includes(s.key)) this._activeOrder.push(s.key);
      }
      this._clearStatusesOnDeath = o["csd"] ?? this._clearStatusesOnDeath;
      this._lastStatus = o["ls"] ?? "";
      this._lastStatusEvent = o["lse"] ?? -1;
      this._lastTickAmount = o["lta"] ?? 0;
    }

    _getDebuggerProperties() {
      const name = "$" + this.behaviorType.name;
      const clamp0 = (v) => Math.max(0, v);
      return [{
        title: name,
        properties: [
          { name: "$debugMode", value: this._debugMode, onedit: (v) => (this._debugMode = !!v) },
          { name: "$enabled", value: this._enabled, onedit: (v) => this.setEnabled(v) },
          { name: "$destroyOnDeath", value: this._destroyOnDeath, onedit: (v) => (this._destroyOnDeath = v) },
          { name: "$maxHealth", value: this._maxHealth, onedit: (v) => (this._maxHealth = v) },
          { name: "$CurrentHealth", value: this._currentHealth, onedit: (v) => (this._currentHealth = v) },
          { name: "$Invulnerable", value: this._invulnerable, onedit: (v) => (this._invulnerable = v) },
          { name: "$isDead", value: this._isDead, onedit: (v) => (this._isDead = v) },
          { name: "$lastDamage", value: this._lastDamage, onedit: (v) => (this._lastDamage = v) },
          { name: "$lastHeal", value: this._lastHeal, onedit: (v) => (this._lastHeal = v) },
          { name: "$healthAbsorptionRate", value: this._healthAbsorptionRate, onedit: (v) => (this._healthAbsorptionRate = clamp0(v)) },
          { name: "$poolAbsorptionMultiplier", value: this._poolAbsorptionMultiplier, onedit: (v) => this.setPoolAbsorptionMultiplier(v) },
          { name: "$effectivePoolAbsorptionMultiplier", value: this.getPoolAbsorptionMultiplier() },
          { name: "$lastPoolName", value: this._lastTriggerTempType },
          ...[...this._tempHealthPools].flatMap(([t, p]) => [
            { name: `$pool[${t}].amount`, value: p.amount, onedit: (v) => (p.amount = clamp0(v)) },
            { name: `$pool[${t}].decayRate`, value: p.decayRate, onedit: (v) => (p.decayRate = clamp0(v)) },
            { name: `$pool[${t}].absorptionRate`, value: p.absorptionRate, onedit: (v) => (p.absorptionRate = clamp0(v)) },
            { name: `$pool[${t}].priority`, value: p.priority, onedit: (v) => (p.priority = v) },
          ]),
        ],
      }, {
        title: name + " - Statuses",
        properties: [
          { name: "$clearStatusesOnDeath", value: this._clearStatusesOnDeath, onedit: (v) => (this._clearStatusesOnDeath = !!v) },
          { name: "$lastStatus", value: this._lastStatus },
          { name: "$lastDamageStatus", value: this._lastDamageStatus },
          ...this._activeOrder.map((key) => this._statuses.get(key)).flatMap((s) => [
            { name: `$${s.name}.stacks`, value: s.stacks, onedit: (v) => this._setStatusStacks(s, v) },
            { name: `$${s.name}.remaining`, value: s.duration < 0 ? "permanent" : `${clamp0(s.remaining).toFixed(2)} ${STATUS_UNITS[s.unit]}` },
          ]),
        ],
      }];
    }

    // ─── Debug Mode ──────────────────────────────────────────────────────────

    // Writes to the console only with Debug Mode on, tagged with the UID to tell instances apart
    _debugLog(level, message) {
      if (!this._debugMode) return;
      const text = `[Simple Health UID ${this.instance ? this.instance.uid : "?"}] ${message}`;
      if (level === "error") console.error(text);
      else if (level === "warn") console.warn(text);
      else console.log(text);
    }

    // Logs why an action did nothing. Returns undefined so callers can `return this._ignored(...)`
    _ignored(action, reason) {
      this._debugLog("warn", `${action} ignored: ${reason}.`);
    }

    // Why gameplay changes are refused right now, or "" if they are allowed
    _blockedReason() {
      if (!this._enabled) return "the behavior is disabled";
      return this._isDead ? "the instance is dead" : "";
    }

    _fromStatus(sourceStatus) {
      return sourceStatus ? ` from status "${sourceStatus}"` : "";
    }

    // ─── Health ──────────────────────────────────────────────────────────────

    // sourceStatus: the status dealing this damage ("" = direct hit)
    takeDamage(amount, sourceStatus = "") {
      const action = `'Take damage' ${amount}`;
      if (!this._enabled) return this._ignored(action, "the behavior is disabled");
      if (amount <= 0) return this._ignored(action, "the amount must be greater than 0");
      if (this._isDead) return this._ignored(action, "the instance is dead");
      if (this._invulnerable) return this._debugLog("info", `Damage ${amount} blocked: the instance is invulnerable.`);

      const leftover = this._absorbWithPools(amount);
      if (leftover <= 0) return;

      const realDamage = leftover * this._healthAbsorptionRate;
      this._lastDamage = realDamage;
      this._lastDamageStatus = sourceStatus;
      this._currentHealth = Math.max(0, this._currentHealth - realDamage);
      this._debugLog("info", `Took ${realDamage} damage${this._fromStatus(sourceStatus)} (health ${this._currentHealth}/${this._maxHealth}).`);

      if (this._currentHealth <= 0) this._die();
      else this._fire("OnDamaged", "OnHealthChanged");
    }

    // sourceStatus: the status doing this heal ("" = direct heal)
    heal(amount, sourceStatus = "") {
      const blocked = this._blockedReason();
      if (blocked) return this._ignored(`'Heal' ${amount}`, blocked);

      this._lastHeal = amount;
      this._lastHealStatus = sourceStatus;
      this._currentHealth = Math.min(this._currentHealth + amount, this._maxHealth);
      this._debugLog("info", `Healed ${amount}${this._fromStatus(sourceStatus)} (health ${this._currentHealth}/${this._maxHealth}).`);
      this._fire("OnHealed", "OnHealthChanged");
    }

    setHealth(amount) {
      if (this._isDead) return this._ignored(`'Set health' ${amount}`, "the instance is dead. Use 'Revive' first");

      const oldHealth = this._currentHealth;
      this._currentHealth = Math.max(0, Math.min(amount, this._maxHealth));
      const change = this._currentHealth - oldHealth;
      if (change === 0) return;

      if (change < 0) {
        this._lastDamage = -change;
        this._lastDamageStatus = "";
        if (this._currentHealth <= 0 && oldHealth > 0) return this._die();
        this._fire("OnDamaged", "OnHealthChanged");
      } else {
        this._lastHeal = change;
        this._lastHealStatus = "";
        this._fire("OnHealed", "OnHealthChanged");
      }
    }

    // Shared by every lethal path. Statuses clear before On health changed and the destroy.
    _die() {
      this._isDead = true;
      this._debugLog("info", "Died.");
      this._trigger("OnDeath");
      if (this._clearStatusesOnDeath) this.clearAllStatuses();
      this._trigger("OnHealthChanged");
      if (this._destroyOnDeath) this.instance.destroy();
    }

    setMaxHealth(amount) {
      this._maxHealth = Math.max(1, amount);
      if (this._currentHealth <= this._maxHealth) return;
      this._currentHealth = this._maxHealth;
      this._trigger("OnHealthChanged");
    }

    revive(amount = -1) {
      this._isDead = false;
      this._currentHealth = amount > 0 ? Math.min(amount, this._maxHealth) : this._maxHealth;
      this._debugLog("info", `Revived (health ${this._currentHealth}/${this._maxHealth}).`);
      this._fire("OnRevived", "OnHealthChanged");
    }

    // Rate 0 also turns on invulnerability; any other rate turns it off
    setHealthAbsorptionRate(rate) {
      this._healthAbsorptionRate = Math.max(0, rate);
      this._invulnerable = this._healthAbsorptionRate === 0;
    }

    // Disabled ignores damage, healing, new statuses and turn advances, and pauses timers.
    // Direct setters, removals and every read still work.
    setEnabled(state) {
      this._enabled = !!state;
      this._debugLog("info", this._enabled ? "Enabled." : "Disabled.");
    }

    setInvulnerable(state) { this._invulnerable = state; }
    getHealthAbsorptionRate() { return this._healthAbsorptionRate; }
    isEnabled() { return this._enabled; }
    isDead() { return this._isDead; }
    isAlive() { return !this._isDead; }
    isInvulnerable() { return this._invulnerable; }
    getCurrentHealth() { return this._currentHealth; }
    getMaxHealth() { return this._maxHealth; }
    getHealthPercent() { return (this._currentHealth / this._maxHealth) * 100; }
    getLastDamage() { return this._lastDamage; }
    getLastHeal() { return this._lastHeal; }

    // ─── Health pools (named "Temporary Health" before 1.3; method names kept for scripts) ──

    // Runs damage through the pools in absorption order and returns what is left for real health
    _absorbWithPools(damage) {
      const pools = this._sortedPools();
      const multiplier = pools.length > 0 ? this.getPoolAbsorptionMultiplier() : 1;
      for (const [type, pool] of pools) {
        if (pool.amount <= 0 || damage <= 0) continue;
        const rate = pool.absorptionRate * multiplier; // pool health spent per 1 damage; 0 = never depletes
        const absorbed = Math.min(damage, rate > 0 ? pool.amount / rate : Number.MAX_VALUE);
        pool.amount = Math.max(0, pool.amount - absorbed * rate);
        pool.lastAbsorbed = absorbed;
        damage -= absorbed;

        this._lastTriggerTempType = type;
        this._lastTempDamageAbsorbed = absorbed;
        this._debugLog("info", `Pool "${type}" absorbed ${absorbed} damage (${pool.amount} left).`);
        this._trigger("OnTempHealthAbsorbed");
        if (pool.amount <= 0) this._trigger("OnTempHealthDepleted");
      }
      return damage;
    }

    // Decay uses global dt, as in 1.2.x (switching to instance dt would change existing games)
    _tickPoolDecay() {
      const depleted = [];
      for (const [type, pool] of this._sortedPools()) {
        if (pool.amount <= 0 || pool.decayRate <= 0) continue;
        pool.amount = Math.max(0, pool.amount - pool.decayRate * this.runtime.dt);
        if (pool.amount <= 0) depleted.push(type);
      }
      for (const type of depleted) {
        this._lastTriggerTempType = type;
        this._debugLog("info", `Pool "${type}" decayed to 0.`);
        this._trigger("OnTempHealthDepleted");
      }
    }

    // Absorption order: ascending priority, ties in creation order (the sort is stable)
    _sortedPools() {
      return [...this._tempHealthPools].sort((a, b) => a[1].priority - b[1].priority);
    }

    // Gets or creates a pool, so pool actions work on names that don't exist yet
    _getPool(type) {
      if (!this._tempHealthPools.has(type)) {
        this._tempHealthPools.set(type, { amount: 0, decayRate: 0, absorptionRate: 1, lastAbsorbed: 0, priority: 0 });
      }
      return this._tempHealthPools.get(type);
    }

    _poolIncreased(type) {
      this._lastTriggerTempType = type;
      this._trigger("OnTempHealthAdded");
    }

    addTempHealth(type, amount) {
      if (amount <= 0) return;
      this._getPool(type).amount += amount;
      this._poolIncreased(type);
    }

    setTempHealth(type, amount) {
      const pool = this._getPool(type);
      const increased = Math.max(0, amount) > pool.amount;
      pool.amount = Math.max(0, amount);
      if (increased) this._poolIncreased(type);
    }

    setupTempHealthPool(type, amount, decayRate, absorptionRate, priority = 0) {
      Object.assign(this._getPool(type), {
        amount: Math.max(0, amount), decayRate: Math.max(0, decayRate),
        absorptionRate: Math.max(0, absorptionRate), priority,
      });
    }

    setTempHealthRates(type, decayRate, absorptionRate) {
      const pool = this._getPool(type);
      pool.decayRate = Math.max(0, decayRate);
      pool.absorptionRate = Math.max(0, absorptionRate);
    }

    clearTempHealth(type) {
      const pool = this._tempHealthPools.get(type);
      if (pool) pool.amount = 0;
    }

    clearAllTempHealth() {
      for (const pool of this._tempHealthPools.values()) pool.amount = 0;
    }

    setTempHealthDecayRate(type, rate) { this._getPool(type).decayRate = Math.max(0, rate); }
    setTempHealthAbsorptionRate(type, rate) { this._getPool(type).absorptionRate = Math.max(0, rate); }
    setTempHealthPriority(type, priority) { this._getPool(type).priority = priority; }

    // 1 = normal, 2 = pools drain twice as fast, 0 = pools never deplete from damage
    setPoolAbsorptionMultiplier(multiplier) {
      this._poolAbsorptionMultiplier = Math.max(0, Number(multiplier) || 0);
    }

    // What damage actually uses: the global multiplier times every active status modifier
    getPoolAbsorptionMultiplier() {
      let m = this._poolAbsorptionMultiplier;
      for (const key of this._activeOrder) m *= this._statuses.get(key).poolAbsorptionMultiplier;
      return m;
    }

    // Index follows absorption order (priority, then creation), including empty pools
    getPoolByIndex(index) {
      return this._sortedPools()[Math.floor(Number(index))]?.[0] ?? "";
    }

    getPoolCount() { return this._tempHealthPools.size; }
    getTempHealth(type) { return this._tempHealthPools.get(type)?.amount ?? 0; }
    getTempHealthDecayRate(type) { return this._tempHealthPools.get(type)?.decayRate ?? 0; }
    getTempHealthAbsorptionRate(type) { return this._tempHealthPools.get(type)?.absorptionRate ?? 1; }
    getTempHealthPriority(type) { return this._tempHealthPools.get(type)?.priority ?? 0; }
    hasTempHealth(type) { return this.getTempHealth(type) > 0; }
    hasAnyTempHealth() { return [...this._tempHealthPools.values()].some((p) => p.amount > 0); }
    getLastTempDamageAbsorbed() { return this._lastTempDamageAbsorbed; }
    getLastTriggerTempType() { return this._lastTriggerTempType; }
    isTempHealthType(type) { return this._lastTriggerTempType === type; }

    // ─── Statuses: internals ─────────────────────────────────────────────────

    _statusKey(name) {
      return String(name).toLowerCase();
    }

    // Combo value from an ACE (index) or a script (key string); unknown values fall back to 0
    _comboIndex(value, keys) {
      const i = typeof value === "string" ? keys.indexOf(value.toLowerCase()) : Math.floor(Number(value));
      return i >= 0 && i < keys.length ? i : 0;
    }

    _createStatusRecord(key, name) {
      return {
        key, name,
        stacks: 0,                   // 0 = inactive
        unit: UNIT_SECONDS,
        duration: 0,                 // last applied duration; -1 = permanent
        remaining: 0,                // units left; -1 when permanent
        interval: 1,                 // tick every N units; 0 = never ticks
        tickProgress: 0,             // units toward the next tick, kept on reapply
        periodicType: PERIODIC_NONE,
        amountPerStack: 0,
        maxStacks: -1,               // -1 = unlimited
        reapplyMode: REAPPLY_REFRESH,
        stacksLostPerTick: 0,
        poolAbsorptionMultiplier: 1, // applies to every pool while active
        appliedStep: -1,             // step of the last activation; never advances in that step
      };
    }

    // Gets or creates a status record (inactive until applied)
    _getStatus(name) {
      const key = this._statusKey(name);
      if (!this._statuses.has(key)) this._statuses.set(key, this._createStatusRecord(key, String(name)));
      return this._statuses.get(key);
    }

    _findActiveStatus(name) {
      const s = this._statuses.get(this._statusKey(name));
      return s && s.stacks > 0 ? s : null;
    }

    _capStacks(s, stacks) {
      return s.maxStacks < 0 ? stacks : Math.min(stacks, s.maxStacks);
    }

    _describeTime(s) {
      return s.duration < 0 ? "permanent" : `${s.remaining} ${STATUS_UNITS[s.unit]}`;
    }

    // Fires On status then On any status. The filters read these fields, which a nested
    // trigger may overwrite, so they are set again before the second trigger.
    _fireStatusTrigger(s, event) {
      for (const method of STATUS_TRIGGERS) {
        this._lastStatus = s.name;
        this._lastStatusEvent = event;
        this._trigger(method);
      }
    }

    // expired = ran out of time or stacks (fires expired, then removed); otherwise removed only
    _deactivateStatus(s, expired) {
      const index = this._activeOrder.indexOf(s.key);
      if (index === -1) return;
      this._activeOrder.splice(index, 1);
      s.stacks = s.remaining = s.tickProgress = 0;
      this._debugLog("info", `Status "${s.name}" ${expired ? "expired" : "removed"}.`);
      if (expired) this._fireStatusTrigger(s, EV_EXPIRED);
      this._fireStatusTrigger(s, EV_REMOVED);
    }

    // Debugger edit: sets stacks directly, and 0 removes the status
    _setStatusStacks(s, value) {
      const stacks = Math.floor(Number(value));
      if (!(stacks > 0)) this._deactivateStatus(s, false);
      else if (s.stacks > 0) s.stacks = this._capStacks(s, stacks);
    }

    // One step for every active status of a unit: each frame (seconds, real dt) or turn (dt = 1).
    // Iterates a copy because triggers may apply or remove statuses mid-step.
    _stepStatuses(unit, dt) {
      if (this._isDead || this._activeOrder.length === 0) return;
      const stepId = ++this._statusStepId;
      for (const key of this._activeOrder.slice()) {
        if (this._isDead) return; // a death stops the whole step, not just one status
        const s = this._statuses.get(key);
        if (s && s.stacks > 0 && s.unit === unit && s.appliedStep !== stepId) this._stepStatus(s, dt, stepId);
      }
    }

    // Advances one status: ticks it (capped per step), drains stacks, then expires it if time is up
    _stepStatus(s, dt, stepId) {
      // Still alive and the same activation (not removed, or removed and re-applied, by a trigger)
      const isCurrent = () => !this._isDead && s.stacks > 0 && s.appliedStep !== stepId;
      const interval = s.unit === UNIT_TURNS ? Math.ceil(s.interval) : s.interval;
      s.tickProgress += dt;
      if (s.duration >= 0) s.remaining -= dt;

      for (let ticks = 0; interval > 0 && s.tickProgress >= interval - EPS; ticks++) {
        if (ticks === MAX_TICKS_PER_STEP) { s.tickProgress %= interval; break; } // drop backlog, keep phase
        s.tickProgress -= interval;
        this._applyTick(s);
        if (!isCurrent()) return;
        this._debugLog("info", `Status "${s.name}" ticked (${STATUS_PERIODIC_TYPES[s.periodicType]} ${this._lastTickAmount}, ${s.stacks} stack(s)).`);
        this._fireStatusTrigger(s, EV_TICKED);
        if (!isCurrent()) return;
        if (s.stacksLostPerTick > 0 && (s.stacks -= s.stacksLostPerTick) <= 0) return this._deactivateStatus(s, true);
      }
      if (isCurrent() && s.duration >= 0 && s.remaining <= EPS) this._deactivateStatus(s, true);
    }

    // One tick's damage or healing. Heals skip at full health and cap to the missing health.
    _applyTick(s) {
      const amount = s.amountPerStack * s.stacks;
      this._lastStatus = s.name;
      this._lastTickAmount = s.periodicType === PERIODIC_NONE ? 0 : amount;
      if (amount <= 0) return;
      if (s.periodicType === PERIODIC_DAMAGE) this.takeDamage(amount, s.name);
      else if (s.periodicType === PERIODIC_HEAL && this._currentHealth < this._maxHealth) {
        this.heal(Math.min(amount, this._maxHealth - this._currentHealth), s.name);
      }
    }

    // ─── Statuses: public API ────────────────────────────────────────────────

    // unit: 0/"seconds" or 1/"turns". duration < 0 = permanent.
    applyStatus(name, duration, unit = UNIT_SECONDS, stacks = 1) {
      const action = `'Apply status' "${name}"`;
      const blocked = this._blockedReason();
      if (blocked) return this._ignored(action, blocked);
      duration = Number(duration);
      if (Number.isNaN(duration) || duration === 0) return this._ignored(action, "the duration must not be 0 (use -1 for permanent)");
      stacks = Math.floor(Number(stacks));
      if (!(stacks >= 1)) return this._ignored(action, "stacks must be at least 1");
      if (duration < 0) duration = -1;
      unit = this._comboIndex(unit, STATUS_UNITS);

      const s = this._getStatus(name);
      const wasActive = s.stacks > 0;
      s.stacks = this._capStacks(s, (wasActive ? s.stacks : 0) + stacks);

      if (!wasActive || unit !== s.unit) {
        // New activation, or a unit switch: start the timers over
        Object.assign(s, { unit, duration, remaining: duration, tickProgress: 0 });
      } else if (s.reapplyMode === REAPPLY_REFRESH) {
        s.duration = s.remaining = duration;
      } else if (s.reapplyMode === REAPPLY_EXTEND) {
        if (duration < 0 || s.duration < 0) s.duration = s.remaining = -1;
        else { s.remaining += duration; s.duration = Math.max(s.duration, s.remaining); }
      } // keep: duration unchanged. Tick progress is kept in every reapply mode.

      if (wasActive) {
        this._debugLog("info", `Status "${s.name}" reapplied: ${s.stacks} stack(s), ${this._describeTime(s)}${s.duration < 0 ? "" : " left"}.`);
        return this._fireStatusTrigger(s, EV_REAPPLIED);
      }
      s.appliedStep = this._statusStepId;
      this._activeOrder.push(s.key);
      this._debugLog("info", `Status "${s.name}" applied: ${s.stacks} stack(s), ${this._describeTime(s)}.`);
      this._fireStatusTrigger(s, EV_APPLIED);
    }

    removeStatus(name) {
      const s = this._findActiveStatus(name);
      if (s) this._deactivateStatus(s, false);
    }

    removeStatusStacks(name, count) {
      count = Math.floor(Number(count));
      const s = this._findActiveStatus(name);
      if (!s || !(count >= 1)) return;
      if (s.stacks > count) s.stacks -= count;
      else this._deactivateStatus(s, false);
    }

    // value < 0 = permanent, 0 = expire now, > 0 = time left (raises duration so bars stay 0-100%)
    setStatusRemaining(name, value) {
      value = Number(value);
      const s = this._findActiveStatus(name);
      if (!s || Number.isNaN(value)) return;
      if (value === 0) return this._deactivateStatus(s, true);
      if (value < 0) s.duration = s.remaining = -1;
      else {
        s.remaining = value;
        if (s.duration < 0 || value > s.duration) s.duration = value;
      }
    }

    clearAllStatuses() {
      for (const key of this._activeOrder.slice()) this._deactivateStatus(this._statuses.get(key), false);
    }

    // Each turn is its own step, so a status applied during turn 1 advances from turn 2
    advanceStatusTurns(count = 1) {
      if (!this._enabled) return this._ignored("'Advance status turns'", "the behavior is disabled");
      count = Math.floor(Number(count));
      if (!(count >= 1)) return this._ignored(`'Advance status turns' ${count}`, "turns must be at least 1");
      for (let i = 0; i < count && !this._isDead && this._activeOrder.length > 0; i++) this._stepStatuses(UNIT_TURNS, 1);
    }

    // maxStacks: -1 = unlimited, 0 counts as 1. reapplyMode: 0/"refresh", 1/"extend", 2/"keep".
    setStatusStacking(name, maxStacks, reapplyMode, stacksLostPerTick) {
      const s = this._getStatus(name);
      const max = Math.floor(Number(maxStacks));
      s.maxStacks = Number.isNaN(max) || max < 0 ? -1 : Math.max(1, max);
      s.reapplyMode = this._comboIndex(reapplyMode, STATUS_REAPPLY_MODES);
      s.stacksLostPerTick = Math.max(0, Math.floor(Number(stacksLostPerTick)) || 0);
      if (s.stacks > 0) s.stacks = this._capStacks(s, s.stacks);
    }

    // periodicType: 0/"none", 1/"damage", 2/"heal". amount is per stack; interval 0 = no ticks.
    setStatusTick(name, periodicType, amountPerStack, interval) {
      const s = this._getStatus(name);
      s.periodicType = this._comboIndex(periodicType, STATUS_PERIODIC_TYPES);
      s.amountPerStack = Math.max(0, Number(amountPerStack) || 0);
      s.interval = Math.max(0, Number(interval) || 0);
    }

    // modifier: 0/"pool_absorption". Applies only while active and multiplies with the rest.
    setStatusModifier(name, modifier, value) {
      const s = this._getStatus(name);
      if (STATUS_MODIFIERS[this._comboIndex(modifier, STATUS_MODIFIERS)] === "pool_absorption") {
        s.poolAbsorptionMultiplier = Math.max(0, Number(value) || 0);
      }
    }

    // Trigger filters for On status / On any status
    isLastStatus(name) { return this._statusKey(name) === this._statusKey(this._lastStatus); }
    isLastStatusEvent(event) { return this._lastStatusEvent === event; }

    getStatusRemaining(name) {
      const s = this._findActiveStatus(name);
      if (!s) return 0;
      return s.duration < 0 ? -1 : Math.max(0, s.remaining);
    }

    getStatusByIndex(index) {
      const key = this._activeOrder[Math.floor(Number(index))];
      return key === undefined ? "" : this._statuses.get(key).name;
    }

    hasStatus(name) { return this._findActiveStatus(name) !== null; }
    hasAnyStatus() { return this._activeOrder.length > 0; }
    getStatusStacks(name) { return this._findActiveStatus(name)?.stacks ?? 0; }
    getStatusDuration(name) { return this._findActiveStatus(name)?.duration ?? 0; }
    getStatusCount() { return this._activeOrder.length; }
    getStatusPoolAbsorptionMultiplier(name) { return this._statuses.get(this._statusKey(name))?.poolAbsorptionMultiplier ?? 1; }
    getLastStatus() { return this._lastStatus; }
    getLastTickAmount() { return this._lastTickAmount; }
    getLastDamageStatus() { return this._lastDamageStatus; }
    getLastHealStatus() { return this._lastHealStatus; }
  };
}
