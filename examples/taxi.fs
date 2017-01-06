( util )
: update!           dup >r @ swap exec r> ! ;
: +!                [ + ] swap update! ;

( location )
0 var: x
0 var: y
: location          x @ y @ ;
: center!           0 x ! 0 y ! ;
: move!             ( dx dy ) y +! x +! ;
: total             location abs swap abs + ;

( direction )
: north             0 ;
: turn              + 4 mod ;
: left              -1 ;
: right             1 ;
: neg               0 swap - ;
: vec               ( direction distance ) >r [
                    ( north ) [ 0 r> ]
                    ( east )  [ r> 0 ]
                    ( south ) [ 0 r> neg ]
                    ( west )  [ r> neg 0 ]
                    ] swap . exec ;

( parsing )
: turn              [ "l" ] re match? [ left ] [ right ] cond turn ;
: >num              [ _d r+ ] re matches top Number ;
: pdistance         ( dir tok ) >num vec move! ;
: parse!            ( tok dir ) over turn dup rot pdistance ( dir ) ;

: process!          center! tokens north [ parse! ] ins exec total ;

"R3, L5, R1, R2, L5, R2, R3, L2, L5, R5, L4, L3, R5, L1, R3, R4, R1, L3, R3, L2, L5, L2, R4, R5, R5, L4, L3, L3, R4, R4, R5, L5, L3, R2, R2, L3, L4, L5, R1, R3, L3, R2, L3, R5, L194, L2, L5, R2, R1, R1, L1, L5, L4, R4, R2, R2, L4, L1, R2, R53, R3, L5, R72, R2, L5, R3, L4, R187, L4, L5, L2, R1, R3, R5, L4, L4, R2, R5, L5, L4, L3, R5, L2, R1, R1, R4, L1, R2, L3, R5, L4, R2, L3, R1, L4, R4, L1, L2, R3, L1, L1, R4, R3, L4, R2, R5, L2, L3, L3, L1, R3, R5, R2, R3, R1, R2, L1, L4, L5, L2, R4, R5, L2, R4, R4, L3, R2, R1, L4, R3, L3, L4, L3, L1, R3, L2, R2, L4, L4, L5, R3, R5, R3, L2, R5, L2, L1, L5, L1, R2, R4, L5, R2, L4, L5, L4, L5, L2, L5, L4, R5, R3, R2, R2, L3, R3, L2, L5" process!
