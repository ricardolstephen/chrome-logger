class BrowserLoggerTargetTagger {
  constructor() {
    this.targetTagMap = new WeakMap();
    this.nextTargetTag = 1;
  }
  // Lookup the target's tag. If it didnt have one before, now it does.
  lookup(target) {
    if (!this.targetTagMap.has(target)) {
      const targetTag = this.nextTargetTag;
      this.nextTargetTag += 1;
      this.targetTagMap.set(target, targetTag);
      return targetTag;
    }
    return this.targetTagMap.get(target);
  }
}

module.exports = BrowserLoggerTargetTagger;
