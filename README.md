# jort
👖 A Joy / Forth hybrid implemented in JS

# core

```
/* inline comments */
\ comments
"string literals"
-123.45
```

## definitions

```
"double"    [ 2 * ] ;
"quadruple" [ double double ] ;
```

## conditionals

```
2 % 0 = [ "even" ] [ "odd" ] cond log
```

## local variables

```
"foo"       [ ( a b c ) a b + c b + c a ]       
```


## pattern matching

```
[   [ 15 divby  =>  "FizzBuzz" log ] match
    [ 5 divby   =>  "Buzz" log ] match
    [ 3 divby   =>  "Fizz" log ] match
    log ]
```


## stack manipulation
word | effect
---  | ---
drop | a -- ()
swap | a b -- b a
dup  | a -- a a
rot  | a b c -- b c a
-rot | a b c -- c a b
over | a b -- a b a
nip  | a b -- b
tuck | a b -- b a b

## math

### binary operators
( a b -- a <> b )
+ - * / mod rem div min max

### unary operators
( a -- a' )
0- +1 -1 floor ceil round abs

### others
clamp ( a min max -- a' )

## logic

### comparison
( a b -- bool )
< <= >= >
= !=    ( strict value equality )
=== !== ( js reference equality )
loose= loose!= ( js loose equality )

### ranges
( a min max -- bool )
<range< <=range< <range<= <=range<=

### others
true false
and ( a b -- a && b )
or  ( a b -- a || b )
not ( a -- !a )
if  ( bool [ifTrue] -- ...ifTrue | () )
cond ( bool [ifTrue] [ifFalse] -- ...ifTrue | ...ifFalse )

## strings
( str -- str' )
-trim- -trim trim-
upcase downcase

( str pad size -- str' )
+pad pad+

replace ( str match replace -- str' )
matches ( str match -- [matches]  ( returns [] for no match ) )
match?  ( str match -- bool )

## regex
r[] ( string -- regex ) ( match one char in set )
r[^] ( string -- regex ) ( match one char _not_ in set )
r- ( start end -- regex ) ( regex matching one char in range )
\w \d \b \s \W \D \B \S r.
r$ r^ r+ r* r? r|
r~ ( invert selection: \w r~ => \W ; "abc" r[] => "abc" r[^] )
( capture groups are in regular brackets )

re  ( [matchers] -- regex)

example: match email

`[ \S r+ "@" \S r+ "." \S r+ ] re` ~> `/\S+@\S+\.\S/`
`[ "foo" "bar" r| ":" [ \w r+ ] ] re` ~> `/(foo|bar):(\w+)`

## conversions
num>str ( num -- str )
str>num ( str -- num )
num>fixed ( num precision -- str )

## local variables
$0 $1 $2 ... copy that item on the stack ( aliases for `<n> pick` )

## stacks
delimiters: [ ]
[] ( empty stack )
push    ( stk a -- stk' )
concat  ( stk1 stk2 -- stk' )
top     ( stk -- a)
rest    ( stk -- 'stk )
split   ( stk -- rest top )
in      ( stk joiner -- stk' ) `[ 1 2 3 ] [ 1 + ] in` => `[ 1 1 + 2 1 + 3 1 + ]`
flatten ( stk -- stk' ) `[ 1 2 + ] flatten` => `[ 3 ]`  `0 [ 1 + ] flatten` => error
fold    ( stk head joiner -- ... ) `[ 1 2 3 ] [ 0 ] [ + ]` => `6`
map     ( stk joiner -- stk' ) `[ 1 2 3 ] [ 1 + ] map` => `[ 2 3 4 ]`

0 var: #flatten
: any?      ( a stk -- a stk ok? ) over #flatten != ;
: done      ( a stk -- stk ) swap drop ;
: flatten   #flatten swap exec [] begin any? while cons repeat done ;  
