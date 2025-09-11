declare module 'edmonds-blossom' {
  // The package exports a function that returns a matching array.
  // It expects a weight function over pairs (i, j) or a dense cost matrix,
  // depending on version. We’ll treat it as: blossom(costs: number[][], invert?: boolean): number[]
  // and adapt in our wrapper to avoid leaking any specifics.
  const blossom: (costs: number[][], invert?: boolean) => number[];
  export default blossom;
}
