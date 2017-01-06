// errors
class EmptyStack extends Error { }
class UndefinedWord extends Error { }
// class UnbalancedComment extends Error { }
// class UnbalancedDefinition extends Error { }
// class VarInUse extends Error { }

class Jort {
    constructor () {
        this._data = []
        this._dict = []
        this._cdict = []
        this._compileMode = false // false = interpret, true = compile
        this._here = null
        this._ret = []
        this._tib = []
        // load stdlib
        core(this).map(([name, fn]) => this.defJS(name, fn))
        compileTime(this).map(([name, fn]) => this.cdefJS(name, fn))
        // this.runProg(ext)
    }
    // data stack
    push (val)      { this._data.push(val) }
    pushStk (stk)   { if (stk) { this._data.push(...stk) } }
    testPop ()      { if(!this._data.length) { throw new EmptyStack() } }
    pop ()          { this.testPop(); return this._data.pop()  }
    popN (n)        { return this._data.splice(0 - n) }
    * data ()       { while (this._data.length) { yield this.pop() } }

    // dictionary
    lookup (id)     { return this._dict.findIndex((def) => def[0] === id) }
    addDef (def)    { this._dict.push(def) }
    call (idx)      { this.push(idx); this._dict[idx][1]() }
    fnarg (fn)      { return fn.length ?
                        () => { this.pop(); this.pushStk(fn(...this.popN(fn.length))) } :
                        () => { this.pop(); this.pushStk(fn()) } }
    defJS (id, fn)  { this.addDef([id, this.fnarg(fn)]) }

    // compile-time dictionary
    clookup (id)    { return this._cdict.findIndex((def) => def[0] === id) }
    ccall (index)   { this._cdict[index][1]() }
    compile ()      { this._compileMode = true }
    interpret ()    { this._compileMode = false }
    cdefJS (id, f)  { this._cdict.push([id, f]) }

    // return stack & pointer
    rpush (val)     { this._ret.push(val) }
    rpop ()         { return this._ret.pop() }
    rinc ()         { this._here = { dict: this._here.dict, def: this._here.def + 1 } }
    next ()         { if (this._here) { this.rinc(); return true } }
    doit (word)     { if (isfn(word)) { word() } else this.push(word) }
    current ()      { this.doit(this._dict[this._here.dict][this._here.def]) }
    run ()          { while (this.next()) { this.current() } }
    rcall ()        { if (this._here) { this.rpush(this._here) } }
    fload ()        { this._here = { dict: this.pop(), def: 1 } }
    enter ()        { this.rcall(); this.fload(); this.run() }
    exit ()         { this._here = this.rpop() }
    exec (stk)      { stk.forEach((s) => this.doit(s)) }

    // text input buffer
    read (text)     { this._tib = text.trim().split(/\s+/g) }
    word ()         { return this._tib.shift() }
    * words ()      { while (this._tib.length) { yield this.word() } }

    // parser
    pspace (w)      { return !w }
    pstr (w)        { if (w[0] === `"`) { this.push(w.substr(1, w.length - 2)); return true } }
    pnum (w)        { const n = Number(w); if (Number.isFinite(n)) { this.push(n); return true }}
    pcomp (w)       { const i = this.clookup(w); if (i > -1) { this.ccall(i); return true } }
    pword (w, f)    { const i = this.lookup(w); if (i > -1) { f(i); return true } }
    parse (w) {
        if (this._compileMode && (this.pcomp(w) ||
            this.pword(w, (i) => { this.push(() => this.call(i))}))) { return }
        if (this.pword(w, (i) => { this.call(i) })) { return }
        if (this.pspace(w) || this.pstr(w) || this.pnum(w)) { return }
        throw new UndefinedWord(`"${w}"`)
    }
    runProg (str)   { this.read(str); for (const w of this.words()) { this.parse(w) } }

    // debugging
    dump ()        { console.log(this._data, this._ret, this._here, this._dict, this._cdict) }
}

const compileTime = (env) => [
    ["interpret", () => { env.interpret() }],
    ["word", () => [env.word()]],
]

const core = (env) => [
    // stack effects
    ["drop",(_) => []],
    ["swap",(a, b) => [b, a]],
    ["dup", (a) => [a,a]],
    ["rot", (a,b,c) => [b,c,a]],
    // return stack & calls
    [">r",(a) => { env.rpush(a) }],
    ["r>",() => [env.rpop()]],
    ["exec", (ref) => { if (Array.isArray(ref)) {env.exec(ref) } else {env.call(ref)} }],
    ["enter", () => { env.enter() }],
    ["exit", () => { env.exit() }],
    ["here", () => [env.here()]],
    ["word", () => [env.word()]],
    ["lookup", (word) => [env.lookup(word)]],
    ["symbol", (word) => [Symbol(word)]],
    ["compile", () => { env.compile() }],
    ["define", (stk) => env.addDef(stk)],
    ["eval", (str) => { env.parse(str)}],
    // substacks
    ["[]",() => [[]]],
    ["push",(arr,x) => [arr.concat([x])]],
    ["concat", (l,r) => [l.concat(r)]],
    ["top",(arr) => [arr[arr.length - 1]]],
    ["rest",(arr) => [arr.slice(0, arr.length - 1)]],
    ["reverse", (arr) => [arr.slice(0).reverse()]],
    // js interop
    ["JS!", (str) => [(new Function(`return ${str}`))()]],
    ["applyJS", (stk, self, fn) => [fn(self, stk)]],
    // output
    ["log",(a) => {console.log(a)}],
    ["dump",() => {ext.dump()}],
    [".s",() => {console.log(...ext.data())}],
    [".r",() => {console.log(...ext._ret)}],
    // logic
    [">", (a,b) => [a>b]],
    [">=",(a,b) => [a>=b]],
    ["===",(a,b) => [a===b]],
    ["!==",(a,b) => [a!==b]],
    ["<", (a,b) => [a<b]],
    ["<=",(a,b) => [a<=b]],
    ["and",(a,b) => [a && b]],
    ["or",(a,b) => [a || b]],
    ["not",(a) => [!a]],
    // math
    ["+",(a,b) => [a + b]],
    ["-",(a,b) => [a - b]],
    ["*",(a,b) => [a * b]],
    ["/",(a,b) => [a / b]],
    ["rem",(a,b) => [a % b]],
    ["**",(a,b) => [Math.pow(a, b)]],
    ["floor", (a) => [Math.floor(a)]],
    ["ceil",(a) => [Math.ceil(a)]],
    ["round",(a) => [Math.round(a)]],
]

// [] word 'enter push compile enter interpret push  [] compile enter interpret push push compile exit interpret push define

// [] word 'exit push  compile enter interpret push  [] compile exit interpret push push compile exit interpret push define

// [] word foo push 'enter concat 1 push 2 push 3 push 'exit concat define

//  [] word defstk push 'enter concat compile
//      [] swap push 'enter concat swap concat 'exit concat
//  interpret
//      >r >r >r >r >r >r >r >r push r> push r> push r> push r> push r> push r> push r> push r> push
//  define


// ( : ) defstk ( stk name )
//      [] swap push ( stk [name] )
//      'enter concat ( stk [name,enter()] )
//      swap concat ( [name, enter(), ...stk] )
//      'exit concat ( [name, enter(), ...stk, exit()] )
//      define
// ( ; )
// \ usage: [] 1 push 2 push word foo defstk define



// ( alias compile => { )
// [] word { push compile enter compile exit interpret >r >r push r> push r> push define
// ( alias interpret => } )
// [] word } push { enter interpret push word interpret

// [] word alias: push compile
//      enter compile exit
// interpret >r >r push r> push r> push


// word [ symbol
// [] word [ compile word [ symbol word exit lookup push define


// defining definitions?
// [] word : push  compile compile interpret push   define
// [] word ; push  word interpret lookup push



const ext = `
\ stack effects
: -rot ( a b c -- c a b )   rot rot ;
: over ( a b -- a b a )     swap dup -rot ;
: nip ( a b -- b )          swap drop ;
: tuck ( a b -- b a b )     dup -rot ;
: r@                        r> dup >r ;
: rdrop                     r> r> drop >r ;
: dup2 ( a b -- a b a b )   over over ;

\ metaprogramming
: symbol:       word symbol ;

\ substacks
: cons          swap push ;
: split         dup rest swap top ;
: pair          swap [] cons cons ;
: left          rest top ;
: unpair        dup l swap r ;
: quote         word lookup ;

\ do-loops
: range++       unpair swap 1 + swap pair ;
: range?        unpair < ;
: ipair         r> r> r@ -rot >r >r ;
: i             ipair l ;
: i++           r> r> rdrop r> range++ r> tuck >r >r >r >r >r ;
: do            r@ swap >r >r ;
: done          r> r> r> rdrop rdrop >r >r >r ;
: loop          ipair range?  quote i++ quote done cond ;

symbol: [
: bottom?       [ === ;
: [             [ compile ;
: done          reverse swap quote interpret if ;
: test          over bottom? quote rdrop if ;
: build         [] 0 100 pair do test cons loop ;
: ]             interpret build reverse ; immediate

\ logic & equality
: cond          >r and r> or  exec ;
: if            [] cond ;
\ TODO: value equality for arrays / objects

\ math
: +1            1 + ;
: -1            1 - ;
: mod           dup dup >r >r rem r> + r> rem ;
: min           dup2 > [ nip ] [ drop ] cond ;
: max           dup2 > [ drop ] [ nip ] cond ;
: neg           0 swap - ;
: abs           dup 0 > [ ] [ neg ] cond ;

`

//
// function doneIntr (def) { interpret(); push(def.reverse()) }
// defJS("[", () =>        { push(doneIntr); compile() })
// function doneComp (def) { push(def.reverse()) }
// cdefJS("[", () =>       { push(doneComp) })
// cdefJS("]", () => {
//     const arr = []
//     for (const val of datagen()) {
//         if (val === doneComp || val === doneIntr) { val(arr); return }
//         arr.push(val)
//     }
// })
//
//
// defJS("ins", (dst, src) => {
//     push(dst.reduce((coll, item) => coll.concat([item], src), []))
// })
//
// // loops
// runProg(`
//
// `)
//
// // state
// const state =   {}
// function setv (x, id)       { state[id] = x }
// function idfree (id)        { if (id in state) { throw new VarInUse() } }
// function initv (n, id)      { idfree(id); defJS(n, () => { push(id)}) }
// defJS("var:", (x) =>        { const n = word(); const id = Symbol(n); initv(n, id); setv(x, id) })
// defJS("@", (id) =>          { push(state[id]) })    // state @ "foo" . "bar" .
// defJS("!", setv)

module.exports = Jort


// io
const rl =  require("readline")
const io =  rl.createInterface({ input: process.stdin, output: process.stdout, terminal: true })

function run () {
    let env = new Jort()

    console.log("Welcome to jForth! Control-C to exit.")
    io.on("line", (line) => {
        try {
            env.runProg(line)
            console.log("ok", env._data)
        } catch (e) {
            console.error("crash!", e.message)
            env.dump()
            env = new Jort()
        }
    })
}

run()


// util
function isfn (word)    { return typeof word === "function" }




// // definitions
// function defDone (def)  { addDef(def.reverse()); interpret(); exit() }
// defJS(":",() =>         { push(defDone); push(word()); push(enter); compile() })
// cdefJS(";",() => {
//     const def = [exit]
//     for (const val of datagen()) { if (val === defDone) { val(def); return } def.push(val) }
//     throw new UnbalancedDefinition()
// })
// // comments
// defJS("(",() => {
//     for (const w of words()) { if (w === ")") { return } }
//     throw new UnbalancedComment()
// })
//
// cdefJS("(",() => {
//     for (const w of words()) { if (w === ")") { return } }
//     throw new UnbalancedComment()
// })
