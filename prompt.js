module.exports = function prompt (question, callback) {
  process.stdin.resume();
  process.stdout.write(question);

  process.stdin.once('data', function (data) {
    callback(data.toString().trim());
  });
};
