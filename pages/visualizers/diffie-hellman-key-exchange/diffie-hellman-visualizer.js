const startBtn =
document.getElementById("startBtn");


const mitmBtn =
document.getElementById("mitmBtn");



const p = 23;
const g = 5;



function modPow(base,power,modulus){

let result=1;


while(power>0){

if(power%2===1){

result=(result*base)%modulus;

}


base=(base*base)%modulus;


power=Math.floor(power/2);

}


return result;

}





function startExchange(){


let alicePrivate =
Math.floor(Math.random()*10)+1;


let bobPrivate =
Math.floor(Math.random()*10)+1;



let alicePublic =
modPow(g,alicePrivate,p);


let bobPublic =
modPow(g,bobPrivate,p);



let aliceSecret =
modPow(
bobPublic,
alicePrivate,
p
);



let bobSecret =
modPow(
alicePublic,
bobPrivate,
p
);





document.querySelector(".alice-private").innerHTML=
alicePrivate;


document.querySelector(".alice-public").innerHTML=
alicePublic;



document.querySelector(".bob-private").innerHTML=
bobPrivate;


document.querySelector(".bob-public").innerHTML=
bobPublic;



document.querySelector(".shared-secret").innerHTML=
"🔑 "+aliceSecret;



// Message flow


document.getElementById("aliceMessage").innerHTML=
"Sending A = "+alicePublic;


document.getElementById("channelMessage").innerHTML=
"A = "+alicePublic+
"<br>B = "+bobPublic;


document.getElementById("bobMessage").innerHTML=
"Receiving B = "+bobPublic;



// Animation


let packet =
document.getElementById("packet");


packet.classList.remove("move");


void packet.offsetWidth;


packet.classList.add("move");





document.getElementById("steps").innerHTML=


`
Alice:

Bᵃ mod p

${bobPublic}^${alicePrivate}
mod ${p}

<br><br>

Bob:

Aᵇ mod p

${alicePublic}^${bobPrivate}
mod ${p}

<br><br>


Shared Secret =
${aliceSecret}

`;



}





function mitmAttack(){


document.getElementById("mitmMessage").innerHTML=


`
⚠️ Attack Started

<br><br>

Alice → Eve → Bob

<br>

Eve intercepted public keys.

<br><br>

Fake exchange created.

`;



}




startBtn.addEventListener(
"click",
startExchange
);



mitmBtn.addEventListener(
"click",
mitmAttack
);