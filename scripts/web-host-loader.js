module.exports = function webHostLoader(source) {
  return source.replace(
    /^[ \t]*const HOST\s*=\s*["'][^"']*["'];?/m,
    "const HOST = '';"
  );
};
