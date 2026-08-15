// !! DISCLAIMER !!
// This script is created with the help of AI, since I don't understand about react stuff.
// My knowledge is only restricted in interacting with UserAPI and DOM only.

/**
 * Gets the react fiber.
 *
 * @param {Element} el
 * @returns {Object|null}
 */
function getFiber(el) {
  if (!el) return null;
  const key = Object.keys(el).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactProps$'),
  );
  return key ? el[key] : null;
}

/**
 * Walks up the fiber tree from a starting node, calling `predicate(props)`
 * at each level. Returns the first non-undefined result, or null if the
 * walk exhausts without a match.
 *
 * Bounded by `maxHops` as a safety net (not a tuned assumption about tree
 * depth) so a shape change in Discord's component tree fails fast instead
 * of looping indefinitely.
 *
 * @param {Object|null} fiber - starting fiber node (from getFiber)
 * @param {(props: Object) => any} predicate - return non-undefined to stop and return that value
 * @param {number} [maxHops=50]
 * @returns {any}
 */
function walkFiber(fiber, predicate, maxHops = 50) {
  let node = fiber;
  let hops = 0;

  while (node && hops < maxHops) {
    const props = node.memoizedProps;
    if (props) {
      const result = predicate(props);
      if (result !== undefined) return result;
    }
    node = node.return;
    hops++;
  }

  return undefined;
}

/**
 * Find the nearest `message` object on a fiber tree starting
 * from a DOM element.
 *
 * @param {Element} el
 * @returns {Object|null}
 */
function getMessageFromFiber(el) {
  const fiber = getFiber(el);
  if (!fiber) return null;

  const message = walkFiber(fiber, (props) => {
    if (props?.message?.id) return props.message;
    return undefined;
  });

  return message ?? null;
}

module.exports = { getFiber, walkFiber, getMessageFromFiber };