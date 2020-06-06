export const composeFnsAsync = <R>(...fns: ((a: R) => R)[]) => (arg: R): Promise<R> =>
  fns.reduce((prevFn, nextFn) => prevFn.then(nextFn), Promise.resolve(arg));
