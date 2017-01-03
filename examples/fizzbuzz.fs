: divby?    mod 0 = ;
: match     -rot >r dup r> divby? [ drop rdrop ] [ nip ] cond ;
: fizz?     3  "Fizz" match ;
: buzz?     5  "Buzz" match ;
: fb?       15 "FizzBuzz" match ;
: run       [ 1 20 ] do i fb? buzz? fizz? log loop ;
cr cr run
