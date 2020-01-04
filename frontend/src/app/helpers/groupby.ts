export const groupBy = (arr: any[], criteria: Function | string): {[key: string]: any} => {
  return arr.reduce((obj, item) => {
    const key = typeof criteria === 'function' ? criteria(item) : item[criteria];
    if (!obj.hasOwnProperty(key)) {
      obj[key] = [];
    }
    obj[key].push(item);
    return obj;
  }, {});
};
