"divby"     [ mod 0 = ] ;
"fizzbuzz"  [   [ 15 divby  =>  "FizzBuzz" log ] match
                [ 3 divby   =>  "Fizz" log ] match
                [ 5 divby   =>  "Buzz" log ] match
                log ] ;

"run"       [ 1 100 range [ fizzbuzz ] in do ] ;

run
