"use strict";
const taskDecomposer = require("./task-decomposer.js");
const parallelExecutor = require("./parallel-executor.js");

module.exports = {
  ...taskDecomposer,
  ...parallelExecutor,
};
