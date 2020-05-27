import type { CallbackFunctionVariadicAnyReturn } from '@core/models';

export const groupBy = (
  arr: any[],
  criteria: string | CallbackFunctionVariadicAnyReturn
): { [key: string]: any } => {
  return arr.reduce((obj, item) => {
    const key = typeof criteria === 'function' ? criteria(item) : item[criteria];
    if (!(key in obj)) {
      obj[key] = [];
    }
    obj[key].push(item);
    return obj;
  }, {});
};
