: pair      ( l r ) swap [] swap <] swap <] ;
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

: divby?    mod 0 = ;
: match     -rot >r dup r> divby? [ drop rdrop ] [ nip ] cond ;
: fizz?     3  "Fizz" match ;
: buzz?     5  "Buzz" match ;
: fb?       15 "FizzBuzz" match ;
: run       [ 1 20 ] do i fb? buzz? fizz? log loop ;
cr cr run
