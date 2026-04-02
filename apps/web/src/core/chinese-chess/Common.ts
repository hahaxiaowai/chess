// 二维数组查询
export function includes(array: number[][], target: [number, number]) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][0] === target[0] && array[i][1] === target[1]) {
      return true;
    }
  }
  return false;
}
export function indexOf(array: number[][], target: [number, number]) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][0] === target[0] && array[i][1] === target[1]) {
      return i;
    }
  }
  return -1;
}
