export const sorted = (property: string) => {
  if (!property) {
    return undefined;
  }
  let sortOrder = 1;

  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }

  return (a: { [property: string]: any }, b: { [property: string]: any }) => {
    return sortOrder === -1
      ? b[property].localeCompare(a[property])
      : a[property].localeCompare(b[property]);
  };
};
