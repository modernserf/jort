"divby"     [ mod 0 = ] ;
"matches?"  [ 2dup divby [ ] [ drop rdrop rdrop rdrop ] cond ] ;
"done"      [ swap [ log drop rdrop rdrop rdrop rdrop ] [ drop ] cond ] ;
"fizzbuzz?" [ 15 matches? "FizzBuzz" done ] ;
"fizz?"     [ 3 matches?  "Fizz" done ] ;
"buzz?"     [ 5 matches?  "Buzz" done ] ;
"otherwise" [ log ] ;
"run"       [ 1 20 range [ fizzbuzz? fizz? buzz? otherwise ] ins do ] ;
"" log "" log run
