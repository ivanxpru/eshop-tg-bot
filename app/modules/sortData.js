const sortData = (data, key) => {
  const sortItems = (a, b) => {
    if (a[key] < b[key]) {
      return -1;
    }
    if (b[key] < a[key]) {
      return 1;
    }
    return 0;
  };
  const result = data.sort(sortItems);
  return result;
};

module.exports = sortData;
