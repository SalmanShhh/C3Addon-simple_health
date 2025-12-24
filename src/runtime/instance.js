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
      
      this._currentHealth = this._maxHealth
      this._isDead = false;
      this._lastDamage = 0;
      this._lastHeal = 0;
    }

    _getDebuggerProperties(){
      const prefix = "Health";
      return[{
        title: prefix,
        properties: [
          {name: "$destroyOnDeath", value: this._destroyOnDeath, onedit: v => this._destroyOnDeath = v },
          {name: "$maxHealth" , value: this._maxHealth, onedit: v => this._maxHealth = v},
          {name: "$CurrentHealth" , value: this._currentHealth, onedit: v => this._currentHealth = v},
          {name: "$Invulnerable", value: this._invulnerable, onedit: v => this._invulnerable = v },
          {name: "$isDead", value: this._isDead, onedit: v => this._isDead = v},
          {name: "$lastDamage", value: this._lastDamage, onedit: v => this._lastDamage = v},
          {name: "lastHeal", value: this._lastHeal, onedit: v => this._lastHeal = v}
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
        "lh": this._lastHeal
      };
    }
    
    _loadFromJson(o) {
      this._maxHealth = o["mh"];
      this._currentHealth = o["ch"];
      this._invulnerable = o["inv"];
      this._destroyOnDeath = o["dod"];
      this._isDead = o["dead"];
      this._lastDamage = o["ld"];
      this._lastHeal = o["lh"];
    }
    
    // Public methods for ACEs
    takeDamage(amount) {
      if (this._invulnerable || this._isDead) return;
      
      this._lastDamage = amount;
      this._currentHealth -= amount;
      
      // Check for death
      if (this._currentHealth <= 0) {
        // set health to zero and trigger death.
        this.setHealth(0);
        this._isDead = true;
        this._trigger("OnDeath");
        
        if (this._destroyOnDeath) {
          this._inst.Destroy();
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
          this._inst.Destroy();
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
    
    revive() {
      this._isDead = false;
      this._currentHealth = this._maxHealth;
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