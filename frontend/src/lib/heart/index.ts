export interface HeartSystem {
  hearts: number;
  maxHearts: number;
  activeHearts: number;
}

/**
 * Create a new heart system
 * @param maxHearts Maximum number of hearts (default: 3)
 * @returns HeartSystem object
 */
export function createHeartSystem(maxHearts: number = 3): HeartSystem {
  return {
    hearts: maxHearts,
    maxHearts,
    activeHearts: maxHearts,
  };
}

/**
 * Add hearts to the system
 * @param system Current heart system
 * @param amount Number of hearts to add
 * @returns Updated HeartSystem
 */
export function addHearts(system: HeartSystem, amount: number): HeartSystem {
  return {
    ...system,
    activeHearts: Math.min(system.maxHearts, system.activeHearts + amount),
  };
}

/**
 * Remove hearts from the system
 * @param system Current heart system
 * @param amount Number of hearts to remove
 * @returns Updated HeartSystem
 */
export function removeHearts(system: HeartSystem, amount: number): HeartSystem {
  return {
    ...system,
    activeHearts: Math.max(0, system.activeHearts - amount),
  };
}

/**
 * Reset hearts to maximum
 * @param system Current heart system
 * @returns Updated HeartSystem
 */
export function resetHearts(system: HeartSystem): HeartSystem {
  return {
    ...system,
    activeHearts: system.maxHearts,
  };
}
