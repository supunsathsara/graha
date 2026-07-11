/**
 * pnpmfile — hooks into the installation process.
 * Used to patch swisseph's node-gyp dependency for Python 3.12+ compatibility.
 */
function readPackage(pkg, context) {
  // Override swisseph's bundled node-gyp with v10+
  if (pkg.name === "swisseph") {
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["node-gyp"] = "^13.0.1";
    context.log("patched swisseph: node-gyp ^13.0.1");
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
