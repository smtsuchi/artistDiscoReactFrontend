export const getHashParams = (): Record<string, string> => {
  const hashParams: Record<string, string> = {};
  const r = /([^&;=]+)=?([^&;]*)/g;
  const q = window.location.hash.substring(1);
  let e: RegExpExecArray | null;

  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }

  return hashParams;
};
