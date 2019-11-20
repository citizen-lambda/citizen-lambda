export const composeAsync = <R>(...fns: Array<(a: R) => R>) => (arg: R) =>
  fns.reduce((prevFn, nextFn) => prevFn.then(nextFn), Promise.resolve(arg));
