import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

// Status effect combo keys (ACE combos arrive as 0-based indices; script callers may pass the key string)
const STATUS_UNITS = ["seconds", "turns"];
const STATUS_PERIODIC_TYPES = ["none", "damage", "heal"];
const STATUS_REAPPLY_MODES = ["refresh", "extend", "keep"];
const STATUS_UNIT_SECONDS = 0;
const STATUS_UNIT_TURNS = 1;
const STATUS_EPS = 1e-6;
const STATUS_MAX_TICKS_PER_STEP = 8; // caps runaway cost from tiny intervals or huge dt

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      
      const properties = this._getInitProperties();
      this._maxHealth = properties[0];
      this._invulnerable = properties[1];
      this._destroyOnDeath = properties[2];
      
      this._currentHealth = this._maxHealth;
      this._isDead = false;
      this._lastDamage = 0;
      this._lastHeal = 0;
      this._healthAbsorptionRate = 1.0; // damage multiplier applied to real health (0.5 = damage resistance, 2.0 = vulnerability)
      
      // Temporary health pools — named, siloed, processed in ascending priority order
      this._tempHealthPools = new Map(); // type → { amount, decayRate, absorptionRate, lastAbsorbed, priority }
      this._lastTriggerTempType = "";    // pool type that fired the most recent temp health trigger
      this._lastTempDamageAbsorbed = 0;  // damage intercepted by the last triggered pool

      // Status effects — named, per-instance; records persist (inactive) after expiry so config is kept
      this._clearStatusesOnDeath = properties[3] ?? true;
      this._statuses = new Map();   // lowercased name → status record
      this._activeOrder = [];       // keys of active statuses, in activation order
      this._statusStepId = 0;       // increments once per frame step / turn step
      this._lastStatus = "";        // status that fired the most recent status trigger
      this._lastTickAmount = 0;     // amount the most recent tick tried to apply
      this._lastDamageStatus = "";  // status that caused _lastDamage ("" = direct)
      this._lastHealStatus = "";    // status that caused _lastHeal ("" = direct)

      this._setTicking(true); // enable _tick() for health pool decay and status effects
    }

    _getDebuggerProperties(){
      return[{
        title: "$" + this.behaviorType.name,
        properties: [
          {name: "$destroyOnDeath", value: this._destroyOnDeath, onedit: v => this._destroyOnDeath = v },
          {name: "$maxHealth" , value: this._maxHealth, onedit: v => this._maxHealth = v},
          {name: "$CurrentHealth" , value: this._currentHealth, onedit: v => this._currentHealth = v},
          {name: "$Invulnerable", value: this._invulnerable, onedit: v => this._invulnerable = v },
          {name: "$isDead", value: this._isDead, onedit: v => this._isDead = v},
          {name: "$lastDamage", value: this._lastDamage, onedit: v => this._lastDamage = v},
          {name: "$lastHeal", value: this._lastHeal, onedit: v => this._lastHeal = v},
          {name: "$healthAbsorptionRate", value: this._healthAbsorptionRate, onedit: v => this._healthAbsorptionRate = Math.max(0, v)},
          {name: "$lastPoolName", value: this._lastTriggerTempType},
          ...[...this._tempHealthPools.entries()].flatMap(([t, p]) => [
            {name: `$pool[${t}].amount`,         value: p.amount,         onedit: v => { p.amount         = Math.max(0, v); }},
            {name: `$pool[${t}].decayRate`,      value: p.decayRate,      onedit: v => { p.decayRate      = Math.max(0, v); }},
            {name: `$pool[${t}].absorptionRate`, value: p.absorptionRate, onedit: v => { p.absorptionRate = Math.max(0, v); }},
            {name: `$pool[${t}].priority`,       value: p.priority,       onedit: v => { p.priority       = v; }}
          ])
        ]
      }, {
        title: "$" + this.behaviorType.name + " - Statuses",
        properties: [
          {name: "$clearStatusesOnDeath", value: this._clearStatusesOnDeath, onedit: v => this._clearStatusesOnDeath = !!v},
          {name: "$lastStatus", value: this._lastStatus},
          {name: "$lastDamageStatus", value: this._lastDamageStatus},
          ...this._activeOrder.flatMap(key => {
            const s = this._statuses.get(key);
            return [
              {name: `$${s.name}.stacks`,    value: s.stacks, onedit: v => this._setStatusStacks(s, v)},
              {name: `$${s.name}.remaining`, value: s.duration < 0 ? "permanent" : `${Math.max(0, s.remaining).toFixed(2)} ${STATUS_UNITS[s.unit]}`}
            ];
          })
        ]
      }];
    }
    _release() {
      super._release();
    }
    
    // Helper to trigger conditions
    _trigger(method) {
      super._trigger(self.C3.Behaviors[id].Cnds[method]);
    }
    
    _saveToJson() {
      return {
        "mh": this._maxHealth,
        "ch": this._currentHealth,
        "inv": this._invulnerable,
        "dod": this._destroyOnDeath,
        "dead": this._isDead,
        "ld": this._lastDamage,
        "lh": this._lastHeal,
        "har": this._healthAbsorptionRate,
        "thp": [...this._tempHealthPools.entries()].map(([k, p]) => ({
          k, a: p.amount, dr: p.decayRate, ar: p.absorptionRate, la: p.lastAbsorbed, pr: p.priority
        })),
        "lttt": this._lastTriggerTempType,
        "ltda": this._lastTempDamageAbsorbed,
        "st": [...this._statuses.values()].map(s => ({
          k: s.key, n: s.name, s: s.stacks, u: s.unit, d: s.duration, r: s.remaining, i: s.interval,
          tp: s.tickProgress, pt: s.periodicType, pa: s.amountPerStack, ms: s.maxStacks, rm: s.reapplyMode, sl: s.stacksLostPerTick
        })),
        "so": [...this._activeOrder],
        "ls": this._lastStatus,
        "lta": this._lastTickAmount,
        "lds": this._lastDamageStatus,
        "lhs": this._lastHealStatus,
        "csd": this._clearStatusesOnDeath,
        "sv": 2
      };
    }
    
    _loadFromJson(o) {
      this._maxHealth = o["mh"] ?? this._maxHealth;
      this._currentHealth = o["ch"] ?? this._currentHealth;
      this._invulnerable = o["inv"] ?? this._invulnerable;
      this._destroyOnDeath = o["dod"] ?? this._destroyOnDeath;
      this._isDead = o["dead"] ?? false;
      this._lastDamage = o["ld"] ?? 0;
      this._lastHeal = o["lh"] ?? 0;
      this._healthAbsorptionRate = o["har"] ?? 1.0;
      this._tempHealthPools.clear();
      for (const e of (o["thp"] || [])) {
        this._tempHealthPools.set(e.k, { amount: e.a ?? 0, decayRate: e.dr ?? 0, absorptionRate: e.ar ?? 1.0, lastAbsorbed: e.la ?? 0, priority: e.pr ?? 0 });
      }
      this._lastTriggerTempType = o["lttt"] ?? "";
      this._lastTempDamageAbsorbed = o["ltda"] ?? 0;

      // Status effects (absent in pre-1.3 saves → no statuses)
      this._statuses.clear();
      for (const e of (o["st"] || [])) {
        const s = this._createStatusRecord(e.k, e.n ?? e.k);
        s.stacks = e.s ?? 0;
        s.unit = e.u ?? STATUS_UNIT_SECONDS;
        s.duration = e.d ?? 0;
        s.remaining = e.r ?? 0;
        s.interval = e.i ?? 1;
        s.tickProgress = e.tp ?? 0;
        s.periodicType = e.pt ?? 0;
        s.amountPerStack = e.pa ?? 0;
        s.maxStacks = e.ms ?? -1;
        s.reapplyMode = e.rm ?? 0;
        s.stacksLostPerTick = e.sl ?? 0;
        this._statuses.set(s.key, s);
      }
      // Keep the activation order in sync with the records' stacks
      this._activeOrder = (o["so"] || []).filter(k => (this._statuses.get(k)?.stacks ?? 0) > 0);
      for (const s of this._statuses.values()) {
        if (s.stacks > 0 && !this._activeOrder.includes(s.key)) this._activeOrder.push(s.key);
      }
      this._lastStatus = o["ls"] ?? "";
      this._lastTickAmount = o["lta"] ?? 0;
      this._lastDamageStatus = o["lds"] ?? "";
      this._lastHealStatus = o["lhs"] ?? "";
      this._clearStatusesOnDeath = o["csd"] ?? this._clearStatusesOnDeath;
    }

    // Per-frame tick: health pool decay, then real-time status effects
    _tick() {
      if (this._tempHealthPools.size > 0) this._tickHealthPoolDecay();
      if (this._activeOrder.length > 0) {
        // Per-instance dt respects object time scale; fall back to global dt if unavailable
        this._stepStatuses(STATUS_UNIT_SECONDS, this.instance.dt ?? this.runtime.dt);
      }
    }

    // Time-based temp health decay across all pools
    _tickHealthPoolDecay() {
      const depleted = [];
      const sorted = [...this._tempHealthPools.entries()].sort((a, b) => a[1].priority - b[1].priority);
      for (const [type, pool] of sorted) {
        if (pool.amount > 0 && pool.decayRate > 0) {
          pool.amount = Math.max(0, pool.amount - pool.decayRate * this.runtime.dt);
          if (pool.amount <= 0) depleted.push(type);
        }
      }
      for (const type of depleted) {
        this._lastTriggerTempType = type;
        this._trigger("OnTempHealthDepleted");
      }
    }
    
    // Internal: get or create a named pool
    _getPool(type) {
      if (!this._tempHealthPools.has(type)) {
        this._tempHealthPools.set(type, { amount: 0, decayRate: 0, absorptionRate: 1.0, lastAbsorbed: 0, priority: 0 });
      }
      return this._tempHealthPools.get(type);
    }
    
    // Public methods for ACEs
    // sourceStatus: name of the status dealing this damage ("" = direct hit)
    takeDamage(amount, sourceStatus = "") {
      if (amount <= 0 || this._invulnerable || this._isDead) return;
      
      let remainingDamage = amount;
      
      // Pools are consumed in ascending priority order (lower number = first consumed)
      const sortedPools = [...this._tempHealthPools.entries()].sort((a, b) => a[1].priority - b[1].priority);
      for (const [type, pool] of sortedPools) {
        if (pool.amount <= 0 || remainingDamage <= 0) continue;
        
        // absorptionRate=0 = invincible (never depletes from damage)
        const maxAbsorbable = pool.absorptionRate > 0
          ? pool.amount / pool.absorptionRate
          : Number.MAX_VALUE;
        
        const damageAbsorbed = Math.min(remainingDamage, maxAbsorbable);
        pool.amount = Math.max(0, pool.amount - damageAbsorbed * pool.absorptionRate);
        pool.lastAbsorbed = damageAbsorbed;
        remainingDamage -= damageAbsorbed;
        
        this._lastTriggerTempType = type;
        this._lastTempDamageAbsorbed = damageAbsorbed;
        this._trigger("OnTempHealthAbsorbed");
        
        if (pool.amount <= 0) {
          this._trigger("OnTempHealthDepleted");
        }
      }
      
      if (remainingDamage <= 0) return;
      
      const realDamage = remainingDamage * this._healthAbsorptionRate;
      this._lastDamage = realDamage;
      this._lastDamageStatus = sourceStatus;
      this._currentHealth -= realDamage;

      if (this._currentHealth <= 0) {
        this._currentHealth = 0;
        this._isDead = true;
        this._trigger("OnDeath");
        this._clearStatusesAfterDeath();
        this._trigger("OnHealthChanged");
        
        if (this._destroyOnDeath) {
          this.instance.destroy();
        }
      } else {
        this._trigger("OnDamaged");
        this._trigger("OnHealthChanged");
      }
    }
    
    // sourceStatus: name of the status doing this heal ("" = direct heal)
    heal(amount, sourceStatus = "") {
      if (this._isDead) return;

      this._lastHeal = amount;
      this._lastHealStatus = sourceStatus;
      this._currentHealth = Math.min(this._currentHealth + amount, this._maxHealth);
      this._trigger("OnHealed");
      this._trigger("OnHealthChanged");
    }
    
    setHealth(amount) {
      if (this._isDead) return;
      
      const oldHealth = this._currentHealth;
      const wasAlive = this._currentHealth > 0;
      this._currentHealth = Math.max(0, Math.min(amount, this._maxHealth));
      
      if (this._currentHealth === oldHealth) return;
      
      if (wasAlive && this._currentHealth <= 0) {
        this._isDead = true;
        this._lastDamage = oldHealth - this._currentHealth;
        this._lastDamageStatus = "";
        this._trigger("OnDeath");
        this._clearStatusesAfterDeath();
        this._trigger("OnHealthChanged");
        
        if (this._destroyOnDeath) {
          this.instance.destroy();
        }
      } else if (this._currentHealth < oldHealth) {
        this._lastDamage = oldHealth - this._currentHealth;
        this._lastDamageStatus = "";
        this._trigger("OnDamaged");
        this._trigger("OnHealthChanged");
      } else {
        this._lastHeal = this._currentHealth - oldHealth;
        this._lastHealStatus = "";
        this._trigger("OnHealed");
        this._trigger("OnHealthChanged");
      }
    }
    
    setMaxHealth(amount) {
      this._maxHealth = Math.max(1, amount);
      if (this._currentHealth > this._maxHealth) {
        this._currentHealth = this._maxHealth;
        this._trigger("OnHealthChanged");
      }
    }
    
    setInvulnerable(state) {
      this._invulnerable = state;
    }
    
    setHealthAbsorptionRate(rate) {
      this._healthAbsorptionRate = Math.max(0, rate);
      this._invulnerable = this._healthAbsorptionRate === 0;
    }
    
    getHealthAbsorptionRate() {
      return this._healthAbsorptionRate;
    }
    
    revive(amount = -1) {
      this._isDead = false;
      this._currentHealth = (amount > 0) ? Math.min(amount, this._maxHealth) : this._maxHealth;
      this._trigger("OnRevived");
      this._trigger("OnHealthChanged");
    }
    
    addTempHealth(type, amount) {
      if (amount <= 0) return;
      this._getPool(type).amount += amount;
      this._lastTriggerTempType = type;
      this._trigger("OnTempHealthAdded");
    }
    
    setTempHealth(type, amount) {
      const pool = this._getPool(type);
      const newAmount = Math.max(0, amount);
      const added = newAmount > pool.amount;
      pool.amount = newAmount;
      if (added) {
        this._lastTriggerTempType = type;
        this._trigger("OnTempHealthAdded");
      }
    }
    
    clearTempHealth(type) {
      const pool = this._tempHealthPools.get(type);
      if (pool) pool.amount = 0;
    }
    
    clearAllTempHealth() {
      for (const pool of this._tempHealthPools.values()) pool.amount = 0;
    }
    
    setTempHealthDecayRate(type, rate) {
      this._getPool(type).decayRate = Math.max(0, rate);
    }
    
    setTempHealthAbsorptionRate(type, rate) {
      this._getPool(type).absorptionRate = Math.max(0, rate);
    }
    
    setTempHealthRates(type, decayRate, absorptionRate) {
      const pool = this._getPool(type);
      pool.decayRate = Math.max(0, decayRate);
      pool.absorptionRate = Math.max(0, absorptionRate);
    }
    
    setupTempHealthPool(type, amount, decayRate, absorptionRate, priority = 0) {
      const pool = this._getPool(type);
      pool.amount = Math.max(0, amount);
      pool.decayRate = Math.max(0, decayRate);
      pool.absorptionRate = Math.max(0, absorptionRate);
      pool.priority = priority;
    }

    setTempHealthPriority(type, priority) {
      this._getPool(type).priority = priority;
    }

    getTempHealthPriority(type) {
      const pool = this._tempHealthPools.get(type);
      return pool ? pool.priority : 0;
    }
    
    hasTempHealth(type) {
      const pool = this._tempHealthPools.get(type);
      return pool ? pool.amount > 0 : false;
    }
    
    hasAnyTempHealth() {
      for (const pool of this._tempHealthPools.values()) {
        if (pool.amount > 0) return true;
      }
      return false;
    }
    
    getTempHealth(type) {
      const pool = this._tempHealthPools.get(type);
      return pool ? pool.amount : 0;
    }
    
    getTempHealthDecayRate(type) {
      const pool = this._tempHealthPools.get(type);
      return pool ? pool.decayRate : 0;
    }
    
    getTempHealthAbsorptionRate(type) {
      const pool = this._tempHealthPools.get(type);
      return pool ? pool.absorptionRate : 1.0;
    }
    
    getLastTempDamageAbsorbed() {
      return this._lastTempDamageAbsorbed;
    }
    
    getLastTriggerTempType() {
      return this._lastTriggerTempType;
    }
    
    isTempHealthType(type) {
      return this._lastTriggerTempType === type;
    }
    
    isDead() {
      return this._isDead;
    }
    
    isAlive() {
      return !this._isDead;
    }
    
    isInvulnerable() {
      return this._invulnerable;
    }
    
    getCurrentHealth() {
      return this._currentHealth;
    }
    
    getMaxHealth() {
      return this._maxHealth;
    }
    
    getHealthPercent() {
      return (this._currentHealth / this._maxHealth) * 100;
    }
    
    getLastDamage() {
      return this._lastDamage;
    }
    
    getLastHeal() {
      return this._lastHeal;
    }

    // ─── Status effects: internals ───────────────────────────────────────────

    _statusKey(name) {
      return String(name).toLowerCase();
    }

    // Accepts a combo index (from ACEs) or a key string (from script)
    _statusComboIndex(value, keys) {
      if (typeof value === "string") {
        const i = keys.indexOf(value.toLowerCase());
        return i === -1 ? 0 : i;
      }
      const i = Math.floor(Number(value));
      return i >= 0 && i < keys.length ? i : 0;
    }

    _createStatusRecord(key, name) {
      return {
        key, name,
        stacks: 0,              // 0 = inactive
        unit: STATUS_UNIT_SECONDS,
        duration: 0,            // duration most recently applied; -1 = permanent
        remaining: 0,           // units left; -1 when permanent
        interval: 1,            // tick every N units; 0 = no ticks
        tickProgress: 0,        // units accumulated toward the next tick (kept on reapply)
        periodicType: 0,        // index into STATUS_PERIODIC_TYPES
        amountPerStack: 0,
        maxStacks: -1,          // -1 = unlimited
        reapplyMode: 0,         // index into STATUS_REAPPLY_MODES
        stacksLostPerTick: 0,
        appliedStep: -1         // step id of the last activation (never advances in that same step)
      };
    }

    // Internal: get or create a (possibly inactive) status record
    _getStatus(name) {
      const key = this._statusKey(name);
      let s = this._statuses.get(key);
      if (!s) {
        s = this._createStatusRecord(key, String(name));
        this._statuses.set(key, s);
      }
      return s;
    }

    _findActiveStatus(name) {
      const s = this._statuses.get(this._statusKey(name));
      return s && s.stacks > 0 ? s : null;
    }

    _capStacks(s, stacks) {
      return s.maxStacks < 0 ? stacks : Math.min(stacks, s.maxStacks);
    }

    _fireStatusTrigger(s, method, anyMethod = "") {
      this._lastStatus = s.name;
      this._trigger(method);
      if (anyMethod) {
        this._lastStatus = s.name; // a nested trigger may have overwritten it
        this._trigger(anyMethod);
      }
    }

    // Deactivate an active status. expired = ran out naturally (fires On status expired first)
    _deactivateStatus(s, expired) {
      const index = this._activeOrder.indexOf(s.key);
      if (index === -1) return;
      this._activeOrder.splice(index, 1);
      s.stacks = 0;
      s.remaining = 0;
      s.tickProgress = 0;
      if (expired) this._fireStatusTrigger(s, "OnStatusExpired");
      this._fireStatusTrigger(s, "OnStatusRemoved", "OnAnyStatusRemoved");
    }

    _clearStatusesAfterDeath() {
      if (this._clearStatusesOnDeath) this.clearAllStatuses();
    }

    // Used by the debugger: set stacks directly, removing the status at 0
    _setStatusStacks(s, value) {
      const stacks = Math.floor(Number(value));
      if (!(stacks > 0)) this._deactivateStatus(s, false);
      else if (s.stacks > 0) s.stacks = this._capStacks(s, stacks);
    }

    // One step for every active status of the given unit. Real time: once per frame with dt.
    // Turns: once per advanced turn with dt = 1.
    _stepStatuses(unit, dt) {
      if (this._isDead || this._activeOrder.length === 0) return;
      const stepId = ++this._statusStepId;
      // Iterate a copy: triggers may apply/remove statuses mid-step
      for (const key of this._activeOrder.slice()) {
        if (this._isDead) return; // whole step stops, not just this status
        const s = this._statuses.get(key);
        if (!s || s.stacks <= 0 || s.unit !== unit || s.appliedStep === stepId) continue;

        // Still the same activation? (removed, or removed and re-applied, by a trigger)
        const isCurrent = () => s.stacks > 0 && s.appliedStep !== stepId;
        const interval = unit === STATUS_UNIT_TURNS ? Math.ceil(s.interval) : s.interval;

        s.tickProgress += dt;
        if (s.duration >= 0) s.remaining -= dt;

        let ticks = 0;
        while (interval > 0 && s.tickProgress >= interval - STATUS_EPS && ticks < STATUS_MAX_TICKS_PER_STEP) {
          s.tickProgress -= interval;
          ticks++;

          const amount = s.amountPerStack * s.stacks;
          this._lastStatus = s.name;
          this._lastTickAmount = s.periodicType === 0 ? 0 : amount;
          if (amount > 0) {
            if (s.periodicType === 1) {
              this.takeDamage(amount, s.name);
            } else if (s.periodicType === 2 && this._currentHealth < this._maxHealth) {
              this.heal(Math.min(amount, this._maxHealth - this._currentHealth), s.name);
            }
          }
          if (this._isDead) return;
          if (!isCurrent()) break;

          this._fireStatusTrigger(s, "OnStatusTicked");
          if (this._isDead) return;
          if (!isCurrent()) break;

          if (s.stacksLostPerTick > 0) {
            s.stacks -= s.stacksLostPerTick;
            if (s.stacks <= 0) {
              this._deactivateStatus(s, true);
              break;
            }
          }
        }
        // Drop any backlog beyond the per-step cap (keeps the tick phase)
        if (ticks >= STATUS_MAX_TICKS_PER_STEP && interval > 0 && s.tickProgress >= interval) {
          s.tickProgress %= interval;
        }

        if (this._isDead) return;
        if (isCurrent() && s.duration >= 0 && s.remaining <= STATUS_EPS) {
          this._deactivateStatus(s, true);
        }
      }
    }

    // ─── Status effects: public API ──────────────────────────────────────────

    // unit: 0/"seconds" or 1/"turns". duration < 0 = permanent.
    applyStatus(name, duration, unit = STATUS_UNIT_SECONDS, stacks = 1) {
      if (this._isDead) return;
      duration = Number(duration);
      if (Number.isNaN(duration) || duration === 0) return;
      if (duration < 0) duration = -1;
      stacks = Math.floor(Number(stacks));
      if (!(stacks >= 1)) return;
      unit = this._statusComboIndex(unit, STATUS_UNITS);

      const s = this._getStatus(name);
      if (s.stacks <= 0) {
        // Inactive → active
        s.stacks = this._capStacks(s, stacks);
        s.unit = unit;
        s.duration = duration;
        s.remaining = duration;
        s.tickProgress = 0;
        s.appliedStep = this._statusStepId;
        this._activeOrder.push(s.key);
        this._fireStatusTrigger(s, "OnStatusApplied", "OnAnyStatusApplied");
        return;
      }

      // Already active: add stacks, update duration by reapply mode
      s.stacks = this._capStacks(s, s.stacks + stacks);
      if (unit !== s.unit) {
        s.unit = unit;
        s.duration = duration;
        s.remaining = duration;
        s.tickProgress = 0;
      } else {
        const mode = STATUS_REAPPLY_MODES[s.reapplyMode];
        if (mode === "refresh") {
          s.duration = duration;
          s.remaining = duration;
        } else if (mode === "extend") {
          if (duration < 0 || s.duration < 0) {
            s.duration = -1;
            s.remaining = -1;
          } else {
            s.remaining += duration;
            s.duration = Math.max(s.duration, s.remaining);
          }
        }
        // "keep": duration unchanged. Tick progress is kept in every mode.
      }
      this._fireStatusTrigger(s, "OnStatusReapplied");
    }

    removeStatus(name) {
      const s = this._findActiveStatus(name);
      if (s) this._deactivateStatus(s, false);
    }

    removeStatusStacks(name, count) {
      count = Math.floor(Number(count));
      if (!(count >= 1)) return;
      const s = this._findActiveStatus(name);
      if (!s) return;
      if (s.stacks - count <= 0) this._deactivateStatus(s, false);
      else s.stacks -= count;
    }

    setStatusRemaining(name, value) {
      value = Number(value);
      if (Number.isNaN(value)) return;
      const s = this._findActiveStatus(name);
      if (!s) return;
      if (value < 0) {
        s.duration = -1;
        s.remaining = -1;
      } else if (value === 0) {
        this._deactivateStatus(s, true);
      } else {
        s.remaining = value;
        if (s.duration < 0 || value > s.duration) s.duration = value;
      }
    }

    clearAllStatuses() {
      for (const key of this._activeOrder.slice()) {
        const s = this._statuses.get(key);
        if (s) this._deactivateStatus(s, false);
      }
    }

    advanceStatusTurns(count = 1) {
      count = Math.floor(Number(count));
      if (!(count >= 1)) return;
      for (let i = 0; i < count; i++) {
        if (this._isDead || this._activeOrder.length === 0) return;
        this._stepStatuses(STATUS_UNIT_TURNS, 1);
      }
    }

    // reapplyMode: 0/"refresh", 1/"extend", 2/"keep"
    setStatusStacking(name, maxStacks, reapplyMode, stacksLostPerTick) {
      const s = this._getStatus(name);
      maxStacks = Math.floor(Number(maxStacks));
      if (Number.isNaN(maxStacks) || maxStacks < 0) maxStacks = -1;
      else if (maxStacks === 0) maxStacks = 1;
      s.maxStacks = maxStacks;
      s.reapplyMode = this._statusComboIndex(reapplyMode, STATUS_REAPPLY_MODES);
      s.stacksLostPerTick = Math.max(0, Math.floor(Number(stacksLostPerTick)) || 0);
      if (s.stacks > 0) s.stacks = this._capStacks(s, s.stacks);
    }

    // periodicType: 0/"none", 1/"damage", 2/"heal"
    setStatusPeriodic(name, periodicType, amountPerStack, interval) {
      const s = this._getStatus(name);
      s.periodicType = this._statusComboIndex(periodicType, STATUS_PERIODIC_TYPES);
      s.amountPerStack = Math.max(0, Number(amountPerStack) || 0);
      s.interval = Math.max(0, Number(interval) || 0);
    }

    hasStatus(name) {
      return this._findActiveStatus(name) !== null;
    }

    hasAnyStatus() {
      return this._activeOrder.length > 0;
    }

    // Trigger filter: does the status that fired the last trigger match this name?
    isLastStatus(name) {
      return this._statusKey(name) === this._statusKey(this._lastStatus);
    }

    getStatusStacks(name) {
      const s = this._findActiveStatus(name);
      return s ? s.stacks : 0;
    }

    getStatusRemaining(name) {
      const s = this._findActiveStatus(name);
      if (!s) return 0;
      return s.duration < 0 ? -1 : Math.max(0, s.remaining);
    }

    getStatusDuration(name) {
      const s = this._findActiveStatus(name);
      return s ? s.duration : 0;
    }

    getStatusCount() {
      return this._activeOrder.length;
    }

    getStatusByIndex(index) {
      const key = this._activeOrder[Math.floor(Number(index))];
      return key !== undefined ? this._statuses.get(key).name : "";
    }

    getLastStatus() {
      return this._lastStatus;
    }

    getLastTickAmount() {
      return this._lastTickAmount;
    }

    getLastDamageStatus() {
      return this._lastDamageStatus;
    }

    getLastHealStatus() {
      return this._lastHealStatus;
    }
  };
}