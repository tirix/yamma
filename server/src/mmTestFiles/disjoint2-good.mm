$c formula |- ( ) $.

$v x y z w $.
xf $f formula x $.
yf $f formula y $.
zf $f formula z $.
wf $f formula w $.
combo $a formula ( x y ) $.
${
  $d x y $.
  ax-1 $a |- ( x y ) $.
$}

${
  $d x y z w $.
  good $p |- ( ( x y ) ( z w ) ) $=
    xf yf combo zf wf combo ax-1 $.
$}

${
  $d x z $. $d x w $. $d y z $. $d y w $.
  stillgood $p |- ( ( x y ) ( z w ) ) $=
    xf yf combo zf wf combo ax-1 $.
$}
