/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
}

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova est prêt !');

    // On attend 3 secondes pour simuler un chargement pro
    setTimeout(function() {
        hideSplashScreen();
    }, 3000);
}

function hideSplashScreen() {
    var splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(function() {
            splash.style.display = 'none';
        }, 500); // Temps de la transition CSS
    }
}

function handleVerify() {
    var code = document.getElementById('otp-input').value;
    
    if (code.length === 6) {
        // 1. Vibration : 100ms (un petit coup sec, très pro)
        navigator.vibrate(100);

        // 2. Notification locale
        cordova.plugins.notification.local.schedule({
            title: 'Max-it OTP ✅',
            text: 'Code ' + code + ' validé avec succès.',
            foreground: true,
            priority: 1
        });

        alert("Code validé !");
    } else {
        // Vibration d'erreur : deux petits coups (vibre, pause, vibre)
        navigator.vibrate([100, 50, 100]);
        
        alert("Erreur : Le code doit contenir 6 chiffres.");
    }
}


function sendNotification() {
    cordova.plugins.notification.local.schedule({
        title: 'Max-it OTP',
        text: 'Votre code de vérification est : 448 210',
        foreground: true,
        priority: 1,
        // Tu peux même ajouter une icône spécifique ici
        smallIcon: 'res://icon', 
    });
}
