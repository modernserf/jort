const rl =  require("readline")

module.exports = function repl (Jort) {
    let env = new Jort()
    const io =  rl.createInterface({ input: process.stdin, output: process.stdout })

    console.log("Welcome to jForth! Control-C to exit.")
    io.on("line", (line) => {
        try {
            env.interpret(line)
            console.log("ok", env.stack)
        } catch (e) {
            console.error(e.stack)
            env.dump()
            env = new Jort()
        }
    })
}
