name=`echo "$*" | sed 's/ /-/g'`
echo $* | espeak -p 70 -w "$name.wav"
lame "$name.wav"
oggenc "$name.wav"
rm "$name.wav"
