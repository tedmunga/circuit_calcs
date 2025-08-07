function setCookie(cname, cvalue, exdays) {

    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    //console.log(document.cookie);
    
}

function getCookie(cname) {

    console.log(document.cookie);
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function loadCookies(){

    if (document.cookie != ""){

        document.getElementById('lmax').value = getCookie('earthLen');
        document.getElementById('SphP').value = getCookie('SphInPar');
        document.getElementById('Sph').value = getCookie('phaseSize');
        document.getElementById('Spe').value = getCookie('earthSize');
        document.getElementById('CBsize').value = getCookie('cbSize');
        document.getElementById('CBtype').value = getCookie('cbType');
        document.getElementById('rhoPh').value = getCookie('rhoPh');
        document.getElementById('rhoPe').value = getCookie('rhoPe');
        document.getElementById('faultCurrent').value = getCookie('faultCurrent');
        document.getElementById('disCon').value = getCookie('disconnectTime');
        document.getElementById('kConst').value = getCookie('K');

    }

}

function setCookies(earthLen, SphInPar, phaseSize, earthSize, cbSize, cbType, rhoPh, rhoPe, faultCurrent, disconnectTime, K){

    setCookie('earthLen', earthLen, 365);
    setCookie('SphInPar', SphInPar, 365);
    setCookie('phaseSize', phaseSize, 365);
    setCookie('earthSize', earthSize, 365);
    setCookie('cbSize', cbSize, 365);
    setCookie('cbType', cbType, 365);
    setCookie('rhoPh', rhoPh, 365);
    setCookie('rhoPe', rhoPe, 365);
    setCookie('faultCurrent', faultCurrent, 365);
    setCookie('disconnectTime', disconnectTime, 365);
    setCookie('K', K, 365);

}