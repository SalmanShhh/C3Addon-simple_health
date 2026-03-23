import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

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
      
      this._setTicking(true); // enable _tick() for time-based temp health decay
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
          {name: "$lastTriggerTempType", value: this._lastTriggerTempType},
          ...[...this._tempHealthPools.entries()].flatMap(([t, p]) => [
            {name: `$temp[${t}].amount`,         value: p.amount,         onedit: v => { p.amount         = Math.max(0, v); }},
            {name: `$temp[${t}].decayRate`,      value: p.decayRate,      onedit: v => { p.decayRate      = Math.max(0, v); }},
            {name: `$temp[${t}].absorptionRate`, value: p.absorptionRate, onedit: v => { p.absorptionRate = Math.max(0, v); }},
            {name: `$temp[${t}].priority`,       value: p.priority,       onedit: v => { p.priority       = v; }}
          ])
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
        "ltda": this._lastTempDamageAbsorbed
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
    }
    
    // Per-frame tick: handle time-based temp health decay across all pools
    _tick() {
      const depleted = [];
      const sorted = [...this._tempHealthPools.entries()].sort((a, b) => a[1].priority - b[1].priority);
      for (const [type, pool] of sorted) {
        if (pool.amount > 0 && pool.decayRate > 0) {
          pool.amount = Math.max(0, pool.amount - pool.decayRate * this._runtime.dt);
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
    takeDamage(amount) {
      if (this._invulnerable || this._isDead) return;
      
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
      this._currentHealth -= realDamage;
      
      if (this._currentHealth <= 0) {
        this._currentHealth = 0;
        this._isDead = true;
        this._trigger("OnDeath");
        
        if (this._destroyOnDeath) {
          this.instance.destroy();
        }
      } else {
        this._trigger("OnDamaged");
      }
    }
    
    heal(amount) {
      if (this._isDead) return;
      
      this._lastHeal = amount;
      this._currentHealth = Math.min(this._currentHealth + amount, this._maxHealth);
      this._trigger("OnHealed");
    }
    
    setHealth(amount) {
      if (this._isDead) return;
      
      const wasAlive = this._currentHealth > 0;
      this._currentHealth = Math.max(0, Math.min(amount, this._maxHealth));
      
      if (wasAlive && this._currentHealth <= 0) {
        this._isDead = true;
        this._trigger("OnDeath");
        
        if (this._destroyOnDeath) {
          this.instance.destroy();
        }
      }
    }
    
    setMaxHealth(amount) {
      this._maxHealth = Math.max(1, amount);
      if (this._currentHealth > this._maxHealth) {
        this._currentHealth = this._maxHealth;
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
    
    revive() {
      this._isDead = false;
      this._currentHealth = this._maxHealth;
    }
    
    addTempHealth(type, amount) {
      this._getPool(type).amount += Math.max(0, amount);
    }
    
    setTempHealth(type, amount) {
      this._getPool(type).amount = Math.max(0, amount);
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
  };
}