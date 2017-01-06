module.exports = function Jort () {
    const stack = []        // data stack
    function pu (x)         { stack.push(x) }
    function pop ()         { if (stack.length) { return stack.pop() } throw new EmptyStack() }

    const mem = []          // program memory
    let _fn = null          // holder for function (for TCO)

    const ret = []          // return stack
    let ptr = { i: 0, mem, name: "root" } // instruction pointer
    function incp ()        { ptr = { i: ptr.i + 1, mem: ptr.mem, name: ptr.name } }
    function getp ()        { return ptr.mem[ptr.i] }

    function enter (i,m,n)  { ret.push(ptr); ptr = { i, mem: m, name: n }; next() }
    function _enter (i,m,n) { return () => enter(i, m, n) }
    function exit ()        { const r = ret.pop(); if (r) { ptr = r; next() }  }
    function rdrop ()       { ret.pop() /* let r; do { r = ret.pop() } while (r.mem !== mem) */ }

    function next ()        { incp(); _fn = wrap(getp()) }
    function stackdo (s)    { enter(-1, s.concat(exit), "<substack>") }

    function literal (x)    { return () => { pu(x); next() } }
    function wrap (x)       { return maybeFunc(x) || literal(x) }

    // dictionary
    const base = {}         // non-hidable word dictionary
    const dict = {}         // runtime word dictionary
    function lookup (n)     { return dict[n] || base[n] }
    function define (f, n)  { dict[n] = _enter(mem.length, mem, n); mem.push(n, ...f, exit) }
    function hide (n)       { dict[n] = undefined }

    // parser
    function read (str) {
        // TODO: remove comments, match & escape quoted strings
        return str.trim().split(/\s+/g)
    }
    function word (str) {
        const f = lookup(str); if (f) { return f }
        if (isQuoted(str)) { return unquote(str) }
        const n = Number(str); if (isNumber(n)) { return n }
        throw new UndefinedWord(str)
    }

    // compiler
    const cstack = []
    function comp ()        { cstack.push([]) }
    function ctop ()        { return cstack[cstack.length - 1] }
    function cpush (x)      { ctop().push(x) }
    function decomp ()      { (cstack.length > 1 ? cpush : pu)(cstack.pop()) }
    function compileMode () { return cstack.length }

    // interpreter
    const imm = {}          // immediate word dictionary
    function runimm (str)   { if(compileMode() && imm[str]) { imm[str](); return true } }
    function run (f)        { _fn = f; do { _fn() } while (ret.length) }
    function interpret (str) {
        const tokens = read(str)

        for (let i = 0; i < tokens.length; i++) {
            const str = tokens[i]
            if (runimm(str)) { continue }
            if (compileMode()) { cpush(word(str)); continue }
            run(wrap(word(str)))
        }
    }

    // debugging
    function dump ()        { return { stack, ret, mem, dict } }

    Object.assign(imm,{
        "[": () =>      { comp(); next() },
        "]": () =>      { decomp(); next() },
    })

    Object.assign(base, {
        rdrop: () =>    { rdrop(); next() },
        exit: () =>     { ret.pop(); exit() },
        ";": () =>      { define(pop(), pop()); next() },
        hide: () =>     { hide(pop()); next() },
        lookup: () =>   { pu(lookup(pop())); next() },
        // substacks
        "[": () =>      { comp(); next() },
        push: () =>     { const x = pop(); pu(pop().push(x)); next() },
        pop: () =>      { pu(pop().pop()); next() },
        rest: () =>     { const s = pop(); pu(s.slice(0, s.length - 1)); next() },
        concat: () =>   { const x = pop(); pu(pop().concat(x)); next()  },
        // TODO: does this allow nesting?
        do: () =>       { stackdo(pop()) },
        // stack manipulation
        dup: () =>      { const x = pop(); pu(x); pu(x); next() },
        drop: () =>     { pop(); next() },
        swap: () =>     { const b = pop(), a = pop(); pu(b); pu(a); next() },
        rot: () =>      { const c = pop(), b = pop(), a = pop(); pu(b); pu(c); pu(a); next()},
        // math
        "+": () =>      { pu(pop() + pop()); next() },
        "*": () =>      { pu(pop() * pop()); next() },
        "-": () =>      { const a = pop(); pu(pop() - a); next() },
        "/": () =>      { const a = pop(); pu(pop() / a); next() },
        rem: () =>      { const a = pop(); pu(pop() % a); next() },
        // logic
        "===": () =>    { pu(pop() === pop()); next() },
        "<": () =>      { const a = pop(); pu(pop() < a); next() },
        and: () =>      { const a = pop(); pu(pop() && a); next() },
        or: () =>       { const a = pop(); pu(pop() || a); next() },
        not: () =>      { pu(!pop()); next() },
        "?": () =>      { const _else = pop(), _then = pop(); pu(pop() ? _then : _else); next() },
        // logging/debugging
        log: () =>      { console.log(pop()); next() },
        ".s": () =>     { console.log(stack); next() },
        ".r": () =>     {
            console.log(ret.map((r) => r.name ))
            next()
        },
        dump: () =>     { console.log(dump()); next() },
        // TODO: define lower level primitives
        ins: () => {
            const f = pop(), s = pop(), d = []
            s.forEach((x) => d.push(x, f, base.do))
            pu(d); next()
        },
        range: () => {
            const x = pop(), n = pop(), d = []
            for (var i = n; i <= x; i++) { d.push(i) }
            pu(d); next()
        }
    })

    // TODO: value equality for stacks
    interpret(`
    "-rot"  [ rot rot ] ;
    "over"  [ swap dup rot rot ] ;
    "nip"   [ swap drop ] ;
    "tuck"  [ dup rot rot ] ;
    "2dup"  [ over over ] ;
    "[]"    [ [ ] ] ;
    "cond"  [ ? do ] ;
    "if"    [ [] ? do ] ;
    "="     [ === ] ;
    "!="    [ = not ] ;
    "mod"   [ tuck tuck rem swap + swap rem ] ;
    "<="    [ 2dup < -rot = or ] ;
    ">"     [ <= not ] ;
    ">="    [ < not ] ;
    `)

    return { stack, interpret, dump }
}

function maybeFunc (f)  { return typeof f === "function" && f  }
function isQuoted (str) { return str[0] === `"` && str[str.length - 1] === `"` }
function unquote (str)  { return str.substr(1, str.length - 2) }
function isNumber (n)   { return Number.isFinite(n) }

class EmptyStack extends Error {
    constructor () {
        super()
        this.message = "Empty stack"
    }
}
class UndefinedWord extends Error {
    constructor (w) {
        super()
        this.message = `Undefined Word: "${w}"`
    }
}
