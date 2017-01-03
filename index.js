// errors
class EmptyStack extends Error { }
class UndefinedWord extends Error { }
class UnbalancedComment extends Error { }
class UnbalancedDefinition extends Error { }
class VarInUse extends Error { }

// data stack
const data =            []
function push (val)     { data.push(val) }
function pop ()         { if(!data.length) { throw new EmptyStack() } return data.pop() }
function popN (n)       { return data.splice(0 - n) }
function * datagen ()   { while (data.length) { yield pop() } }

// dictionary           [id, ...fns]
const dict =            []
function lookup (id)    { return dict.findIndex((def) => def[0] === id) }
function addDef (def)   { dict.push(def) }

// return stack         { dict: <index in dict>, def: <index of fn in definition> }
let here =              null
const ret =             []
function rpush (val)    { ret.push(val) }
function rpop ()        { return ret.pop() }
function incr ()        { here = { dict: here.dict, def: here.def + 1 } }

// execution of words
function next ()        { if (here) { incr(); return true } }
function isfn (word)    { return typeof word === "function" }
function doit (word)    { if (isfn(word)) { word() } else push(word) }
function current ()     { doit(dict[here.dict][here.def]) }
function run ()         { while (next()) { current() } }
function rcall ()       { if (here) { rpush(here) } }
function fload ()       { here = { dict: pop(), def: 1 } }
function enter ()       { rcall(); fload(); run() }
function exit ()        { here = rpop() }
function exec (stk)     { stk.forEach(doit) }
function call (idx)     { push(idx); dict[idx][1]() }

function fnarg (fn)     { return fn.length ?
                            () => { pop(); fn(...popN(fn.length)) } :
                            () => { pop(); fn() } }
function defJS (id, fn) { addDef([id, fnarg(fn)]) }

// text input buffer
// TODO: parse strings
let tib =               []
function read (text)    { tib = text.trim().split(/\s+/g) }
function word ()        { return tib.shift() }
function * words ()     { while (tib.length) { yield word() } }

// compile-time dictionary
let cdict =             []
let compileMode =       false // (false = interpret, true = compile)
function clookup (id)   { return cdict.findIndex((def) => def[0] === id) }
function ccall (index)  { cdict[index][1]() }
function compile ()     { compileMode = true }
function interpret ()   { compileMode = false }
function cdefJS (id, f) { cdict.push([id, f]) }

function pspace (w)     { return !w }
function pstr (w)       { if (w[0] === `"`) { push(w.substr(1, w.length - 2)); return true } }
function pnum (w)       { const n = Number(w); if (Number.isFinite(n)) { push(n); return true }}
function pcomp (w)      { const i = clookup(w); if (i > -1) { ccall(i); return true } }
function pword (w, f)   { const i = lookup(w); if (i > -1) { f(i); return true } }
function parse (w) {
    if (compileMode && (pcomp(w) || pword(w, (i) => { push(() => call(i))}))) { return }
    if (pword(w, (i) => { call(i) })) { return }
    if (pspace(w) || pstr(w) || pnum(w)) { return }
    throw new UndefinedWord(`"${w}"`)
}
function runProg (str)  { read(str); for (const w of words()) { parse(w) } }

// debugging
function dump ()        { console.log({ data, ret, here, dict, cdict, compileMode }) }

// definitions
function defDone (def)  { addDef(def.reverse()); interpret(); exit() }
defJS(":",() =>         { push(defDone); push(word()); push(enter); compile() })
cdefJS(";",() => {
    const def = [exit]
    for (const val of datagen()) { if (val === defDone) { val(def); return } def.push(val) }
    throw new UnbalancedDefinition()
})
// comments
defJS("(",() => {
    for (const w of words()) { if (w === ")") { return } }
    throw new UnbalancedComment()
})

cdefJS("(",() => {
    for (const w of words()) { if (w === ")") { return } }
    throw new UnbalancedComment()
})


// stack effects
defJS("drop",() =>          { pop() })
defJS("swap", (a, b) =>     { push(b); push(a) })
defJS("dup", (a) =>         { push(a); push(a) })
defJS("rot", (a, b, c) =>   { push(b); push(c); push(a) })
runProg(`
: -rot ( a b c -- c a b )   rot rot ;
: over ( a b -- a b a )     swap dup -rot ;
: nip ( a b -- b )          swap drop ;
: tuck ( a b -- b a b )     dup -rot ;
`)

// metaprogramming
defJS("exec", (ref) =>      { exec(ref) })
defJS("exit", () =>         { exit() })
defJS(">r", (a) =>          { rpush(a) })
defJS("r>", () =>           { push(rpop()) })
defJS("r@", () =>           { const r = rpop(); rpush(r); push(r) })
defJS("here",() =>          { push(here) })
runProg(`
: rdrop                     r> r> drop >r ;
`)

// JS interop
defJS("{}",() =>            { push({}) })
defJS(".", (obj, key) =>    { push(obj[key]) }) // { "foo" 2 } "foo" .  => 2
defJS("call", (arg, fn) =>  { push(fn(arg)) })
defJS("call2", (a, b, f) => { push(f(a, b)) })
defJS("callN", (n, fn) =>   { fn(...popN(n)) })
defJS("apply", (stk, fn) => { fn(...stk) })
runProg(`
    : .(1)                  . call ;
    : .(2)                  . call2 ;
`)

// math
defJS("+", (a, b) =>    { push(a + b) })
defJS("-", (a, b) =>    { push(a - b) })
defJS("*", (a, b) =>    { push(a * b) })
defJS("/", (a, b) =>    { push(a / b) })
defJS("mod", (a, b) =>  { push(a % b) })
defJS("Math", () =>     { push(Math) })
runProg(`
    : **                Math "pow" .(2) ;
    : min               Math "min" .(2) ;
    : max               Math "max" .(2) ;
    : abs               Math "abs" .(1) ;
    : floor             Math "floor" .(1) ;
    : ceil              Math "ceil" .(1) ;
    : round             Math "round" .(1) ;
`)

// logic
defJS(">", (a, b) =>    { push(a > b) })
defJS(">=", (a, b) =>   { push(a >= b) })
// TODO: value equality for arrays / objects
defJS("=", (a, b) =>    { push(a === b) })
defJS("!=", (a,b) =>    { push(a !== b) })
defJS("<=", (a, b) =>   { push(a <= b) })
defJS("<", (a, b) =>    { push(a < b) })
defJS("and", (a,b) =>   { push(a && b) })
defJS("or", (a,b) =>    { push(a || b)})
defJS("not", (a) =>     { push(!a) })
runProg(`
: cond                  >r and r> or  exec ;
`)

// output
defJS("log", (a) =>         { console.log(a) })
defJS("cr",() =>            { console.log("") })
defJS("dump", () =>         { dump() })
defJS(".s", () =>           { console.log(data)})
defJS(".r", () =>           { console.log(ret)})
runProg(`: cr               " " log ;`)

// arrays
defJS("[]", () =>           { push([]) })
defJS("push", (arr, val) => { push(arr.concat([val])) })
defJS("top", (arr) =>       { push(arr[arr.length - 1]) })
defJS("rest", (arr) =>      { push(arr.slice(0, arr.length - 1)) })
defJS("concat", (a, b) =>   { push(a.concat(b)) })

function doneIntr (def) { interpret(); push(def.reverse()) }
defJS("[", () =>        { push(doneIntr); compile() })
function doneComp (def) { push(def.reverse()) }
cdefJS("[", () =>       { push(doneComp) })
cdefJS("]", () => {
    const arr = []
    for (const val of datagen()) {
        if (val === doneComp || val === doneIntr) { val(arr); return }
        arr.push(val)
    }
})
runProg(`
: cons              swap push ;
: split             dup rest swap top ;`)
defJS("ins", (dst, src) => {
    push(dst.reduce((coll, item) => coll.concat([item], src), []))
})

// loops
runProg(`
: pair      ( l r ) swap [] cons cons ;
: l         rest top ;
: r         top ;
: unpair    dup l swap r ;
: range++   unpair swap 1 + swap pair ;
: range?    unpair < ;
: ipair     r> r> r@ -rot >r >r ;
: i         ipair l ;
: i++       r> r> rdrop r> range++ r> tuck >r >r >r >r >r ;
: do        r@ swap >r >r ;
: done      r> r> r> rdrop rdrop >r >r >r ;
: loop      ipair range?  [ i++ ] [ done ] cond ;
`)

// state
const state =   {}
function setv (x, id)       { state[id] = x }
function idfree (id)        { if (id in state) { throw new VarInUse() } }
function initv (n, id)      { idfree(id); defJS(n, () => { push(id)}) }
defJS("var:", (x) =>        { const n = word(); const id = Symbol(n); initv(n, id); setv(x, id) })
defJS("@", (id) =>          { push(state[id]) })    // state @ "foo" . "bar" .
defJS("!", setv)

// io
const rl =  require("readline")
const io =  rl.createInterface({ input: process.stdin, output: process.stdout, terminal: true })

try {
    console.log("Welcome to jForth! Control-C to exit.")
    io.on("line", (line) => { runProg(line); console.log("ok", data) })
} catch (e) {
    console.error("crash!", e.message)
    dump()
}
