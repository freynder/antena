
// https://tc39.github.io/ecma262/#sec-properties-of-promise-instances

module.exports = () => {
  let reject, resolve;
  const promise = new Promise((closure1, closure2) => {
    reject = closure1;
    resolve = closure2;
  });
  promise._pending = true;
  promise._reject = reject;
  promise._resolve = resolve;
  return promise;
};
