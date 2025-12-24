export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    Release() {}

    OnCreate() {}

    OnPlacedInLayout() {}

    OnPropertyChanged(id, value) {
      // Handle property changes in the editor
      if (id === "maxHealth") {
        // Max health property exposed and editable in the editor
        this._maxHealth = value;
        // Optionally, you might want to reset current health to max health when max health changes
        this._currentHealth = value; 
      }

      if (id === "invulnerable") {
        // Invulnerable property is exposed; the editor can reflect this value in previews.
        // No runtime change needed here; the value is read by the runtime from init properties.
        this._invulnerable = value;
      }
      if (id === "destroyOnDeath") {
        // Destroy on Death property is exposed; the editor can reflect this value in previews.
        // No runtime change needed here; the value is read by the runtime from init properties.
        
        this._destroyOnDeath = value;
      }
    }
  };
}
