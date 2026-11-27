// Editor-side instance. Simple Health has no editor preview: Construct saves the property values
// and the runtime reads them, so these hooks are intentionally empty.
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    Release() {}
    OnCreate() {}
    OnPlacedInLayout() {}
    OnPropertyChanged(id, value) {}
  };
}
